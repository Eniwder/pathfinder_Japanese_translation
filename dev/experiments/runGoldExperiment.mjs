#!/usr/bin/env node
// Sonnet vs Haiku（等）のモデル比較実験ランナー。
//
// dev/lang/experiments/goldset/source/{hard,routine}/chunk_*.json を種に、
// 指定した各モデルへ chunk ごとに個別の claude -p を投げて訳文を埋め、
// dev/lang/experiments/goldset/<modelLabel>/{hard,routine}/ に結果を書き出す。
// 本番の v2Progress.json / lang/chunks / zhCN.json には一切触れない
// （実験専用ディレクトリの外を書き換えない）。
//
// 使い方（dev/ で実行）:
//   node experiments/runGoldExperiment.mjs --models=sonnet:claude-sonnet-5,haiku:claude-haiku-4-5-20251001
//   node experiments/runGoldExperiment.mjs --models=haiku:claude-haiku-4-5-20251001 --categories=hard
//
// 既に <modelLabel>/<category>/chunk_N.json が存在し全entry翻訳済みなら再実行をスキップする
// （利用上限等で途中落ちしても再開できる）。

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    return m ? [m[1], m[2] ?? true] : [a, true];
  })
);

// --gold-root=lang/experiments/goldset_multiblock のように別のゴールドセットを丸ごと
// 切り替えられる（用途別に複数のゴールドセットを併存させるため）。
const goldRoot = path.resolve(typeof args['gold-root'] === 'string' ? args['gold-root'] : './lang/experiments/goldset');
// --source-dir=source_lean のように goldRoot 配下の別ディレクトリを種にできる
// （④/⑤のトークン削減案など、チャンク構造そのものを変えた比較用）。
const sourceRoot = path.join(goldRoot, typeof args['source-dir'] === 'string' ? args['source-dir'] : 'source');
const logDir = path.join(goldRoot, 'logs');
const usageLogPath = path.join(goldRoot, 'usage.jsonl');

const categories = (typeof args.categories === 'string' ? args.categories : 'hard,routine')
  .split(',').map((s) => s.trim()).filter(Boolean);

const maxChunks = args['max-chunks'] ? Number(args['max-chunks']) : Infinity; // 動作確認用に件数を絞る

const modelsArg = typeof args.models === 'string' ? args.models : null;
if (!modelsArg) {
  console.error('--models=label:modelId[,label2:modelId2,...] を指定してください（例: sonnet:claude-sonnet-5,haiku:claude-haiku-4-5-20251001）');
  process.exit(1);
}
const models = modelsArg.split(',').map((pair) => {
  const [label, modelId] = pair.split(':');
  if (!label || !modelId) throw new Error(`--models の形式が不正: ${pair}`);
  return { label, modelId };
});

const CLAUDE_TOOLS = 'Read Write Edit Grep Glob';

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function chunkEntries(filePath) {
  const c = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  return Array.isArray(c.entries) ? c.entries : (c.blocks ?? []).flatMap((b) => b.entries ?? []);
}

function chunkFullyTranslated(filePath) {
  return chunkEntries(filePath).every((e) => e.translation != null);
}

function appendUsageLog(record) {
  ensureDir(path.dirname(usageLogPath));
  fs.appendFileSync(usageLogPath, JSON.stringify(record) + '\n');
}

function buildChunkPrompt(relPath) {
  return `dev/${relPath} の翻訳作業だけをお願いします（実験用ゴールドセットです）。

【前提】
- dev/res/translationGuide.md の翻訳ルールに厳密に従うこと（先に一度だけ読む）。
- 話者の口調・用語・直前の文脈・登場人物メモは ${relPath} 自身に埋め込み済み
  （glossary / speakers / characterNotes / sceneNotes、各entryの speaker・ctx）。
  dev/res/glossary.json・dev/res/v2CharacterNotes.md・dev/res/speakerProfiles.json は
  読まなくてよい。

【やること】
1. ${relPath} を読み、blocks[].entries[] の各entryの "text"（英語原文）を、同entryの
   speaker・ctx・characterNotes/sceneNotesを踏まえて自然な日本語に訳す。
2. 各entryの "translation" フィールド（現在 null）に訳文を書き込む。
   - <ctrl_N/> トークンは一字一句変えない。
   - 全entryを埋めること。分からない/判断がつかない場合のみ null のまま残してよい。
3. ${relPath} 以外のファイルは一切編集しないこと。git操作やコマンド実行は不要（あなたには
   その権限がありません）。Bash・スクリプト実行・その他の回避策は一切試みないこと。

【書き込み方法（重要）】
- entryごとに小さなEditを何十回も呼ぶのは非効率なので絶対にしないこと。ファイル全体を
  一度読んだら、全entryの翻訳をあなたの応答の中で組み立ててから、最後にWriteツールで
  ファイル全体を1回だけ書き込むこと。
- 確認や許可を求める質問は一切しないこと。これは非対話（自動実行）環境なので、質問しても
  誰も返答できず、作業が完了しないまま終了してしまう。効率化のアイデアがあっても質問せず、
  そのまま最後までentryを埋めてWriteすることを最優先にすること。
- JSON構文を壊さないこと（特に閉じクォート"の書き忘れに注意）。書き込み後、自分で
  書いた内容がJSONとして正しいか目視確認すること。

作業が終わったら、1〜2行で「何件訳したか」を報告して終了してください。長い説明は不要です。`;
}

function callClaudeOnce(prompt, logName, model) {
  ensureDir(logDir);
  const logPath = path.join(logDir, `${logName}_${Date.now()}.log`);
  const cliArgs = [
    '-p',
    '--allowedTools', CLAUDE_TOOLS,
    '--permission-mode', 'dontAsk',
    '--permission-prompts', 'none',
    '--output-format', 'json',
    '--model', model,
  ];
  console.log(`$ claude -p (via stdin, ${prompt.length} chars) --model ${model} ...`);
  // dev/ ではなくリポジトリルートから見た相対パスでプロンプトを書いているため、
  // claude はリポジトリルートで実行する（runRoundLoop.mjs と同じ前提）。
  const raw = execFileSync('claude', cliArgs, {
    cwd: path.resolve('..'),
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 64,
    shell: process.platform === 'win32',
    input: prompt,
  });

  let result = raw;
  try {
    const parsed = JSON.parse(raw);
    result = typeof parsed.result === 'string' ? parsed.result : raw;
    appendUsageLog({
      ts: new Date().toISOString(),
      logName,
      model,
      usage: parsed.usage ?? null,
      total_cost_usd: parsed.total_cost_usd ?? null,
      duration_ms: parsed.duration_ms ?? null,
      num_turns: parsed.num_turns ?? null,
      is_error: parsed.is_error ?? null,
    });
  } catch (e) {
    console.warn(`⚠ claude -p の出力をJSONとして解釈できませんでした（usage未記録で続行）: ${e.message}`);
  }
  fs.writeFileSync(logPath, result);
  console.log(result);
  return result;
}

for (const { label, modelId } of models) {
  for (const category of categories) {
    const srcDir = path.join(sourceRoot, category);
    if (!fs.existsSync(srcDir)) {
      console.warn(`⚠ ソースディレクトリが無い、スキップ: ${srcDir}`);
      continue;
    }
    const destDir = path.join(goldRoot, label, category);
    ensureDir(destDir);
    const files = fs.readdirSync(srcDir).filter((f) => /^chunk_\d+\.json$/.test(f)).sort().slice(0, maxChunks);
    for (const f of files) {
      const destPath = path.join(destDir, f);
      if (!fs.existsSync(destPath)) {
        fs.copyFileSync(path.join(srcDir, f), destPath);
      }
      if (chunkFullyTranslated(destPath)) {
        console.log(`--- [${label}/${category}] ${f} は翻訳済み、スキップ ---`);
        continue;
      }
      console.log(`\n--- [${label}/${category}] ${f} を翻訳依頼 ---`);
      const relPath = path.relative(path.resolve('..'), destPath).split(path.sep).join('/');
      callClaudeOnce(buildChunkPrompt(relPath), `${label}_${category}_${f.replace('.json', '')}`, modelId);
    }
  }
}

console.log('\n完了。dev/lang/experiments/goldset/<label>/<category>/ を確認してください。');
