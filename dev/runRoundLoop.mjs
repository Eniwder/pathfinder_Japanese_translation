#!/usr/bin/env node
// v2翻訳リライトの自動ランナー（責務分離版）。
//
// 設計方針:
//   進捗管理(v2Progress.json)・extract・import --dry-run検証・ファイル移動・
//   git commit は全部このNodeスクリプトが決定的に行う。Claudeには
//   「このchunkファイルのtranslationフィールドを埋めてください」という
//   翻訳作業だけを、chunkファイル単位で個別に依頼する。
//
//   なぜこうするか:
//   - v2Progress.json はJSON構造が壊れると次回以降の自動実行が総崩れになる。
//     ここをClaudeの自由記述に任せず、Nodeが JSON.stringify で確実に書く。
//   - extract/import/mv/git は全部決定的な処理で、Claudeの「判断」は不要。
//     Node側でやったほうが速く、壊れない。
//   - Claudeの役割を1chunkの翻訳だけに絞ることで、プロンプトも短くなり
//     token消費がさらに減る。roundをまたいだ会話の積み上げも起きない
//     （呼び出しごとに新規プロセス＝新規コンテキスト）。
//
//   Claude呼び出しは `--allowedTools` で Read/Write/Edit/Grep/Glob だけに絞り、
//   `--permission-prompts none` で未許可のツール呼び出しは自動拒否（ハングしない）に
//   している。これにより Claude は物理的に Bash も git も実行できない
//   ——「プロンプトで頼むだけ」より確実な塞ぎ方。`--dangerously-skip-permissions` は
//   使わない。
//
// 使い方（dev/ ディレクトリで実行）:
//   node runRoundLoop.mjs                  # 残り全roundを最後まで自動で回す
//   node runRoundLoop.mjs --rounds=1       # 1roundだけ試す（まずはこれで動作確認推奨）
//   node runRoundLoop.mjs --limit=100      # 1roundのキー数を変える（デフォルト300）
//   node runRoundLoop.mjs --dry-run        # 何も実行せず、やる予定の手順だけ表示
//   node runRoundLoop.mjs --skip-notes     # 話者メモ/翻訳ルールの反省ステップを省く
//
// 前提:
//   - `claude` コマンドがPATHに通っていること（ログイン済みであること）
//   - dev/res/v2Progress.json が存在し、nextStart が正しいこと
//   - dev/lang/chunks/ が空であること（前roundの後始末が済んでいること）

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    return m ? [m[1], m[2] ?? true] : [a, true];
  })
);

const progressPath = path.resolve('./res/v2Progress.json');
const chunksDir = path.resolve('./lang/chunks');
const logDir = path.resolve('./res/roundLogs');

const maxRounds = args.rounds ? Number(args.rounds) : Infinity;
const limit = Number(args.limit ?? 300);
const chunkSize = Number(args['chunk-size'] ?? 100);
const dryRun = !!args['dry-run'];
const skipNotes = !!args['skip-notes'];

// dev/lang/enGB.json の strings 件数目安。CLAUDE.md の現状表と一致させておくこと。
// ループの終了条件としてだけ使う（extractは実データを見て自分で判断するのでずれても実害はない）。
const TOTAL_KEYS = 110401;

const CLAUDE_TOOLS = 'Read Write Edit Grep Glob';

function readProgress() {
  return JSON.parse(fs.readFileSync(progressPath, 'utf8'));
}

function writeProgress(progress) {
  fs.writeFileSync(progressPath, JSON.stringify(progress, null, 2) + '\n');
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function ensureLogDir() {
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
}

function sh(cmd, cmdArgs, opts = {}) {
  console.log(`$ ${cmd} ${cmdArgs.join(' ')}`);
  return execFileSync(cmd, cmdArgs, {
    cwd: process.cwd(),
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 64,
    // Windowsではnpmグローバルインストールのコマンド（claude等）が.cmdシムのため、
    // shell経由でないとENOENTになる。node/gitのネイティブexeもshell:trueで問題なく動く。
    shell: process.platform === 'win32',
    ...opts,
  });
}

function runExtract(start) {
  if (fs.existsSync(chunksDir)) {
    const leftover = fs.readdirSync(chunksDir);
    if (leftover.length) {
      throw new Error(
        `./lang/chunks/ が空ではありません（${leftover.length}件残存）。前roundの後始末が` +
          ' 済んでいない可能性があります。手動で確認してください。'
      );
    }
  }
  sh('node', [
    '--max-old-space-size=8192',
    'toBatchData.js',
    'extract',
    '--filter=all',
    `--start=${start}`,
    `--limit=${limit}`,
    `--chunk-size=${chunkSize}`,
  ]);
  const files = fs
    .readdirSync(chunksDir)
    .filter((f) => /^chunk_\d+\.json$/.test(f))
    .sort();
  if (!files.length) throw new Error('extractがchunkファイルを生成しませんでした。');
  return files;
}

function buildChunkPrompt(fileName) {
  return `dev/lang/chunks/${fileName} の翻訳作業だけをお願いします。

【前提（読むだけ、編集しないこと）】
- dev/res/translationGuide.md の翻訳ルールに厳密に従うこと。特に読点は
  「1文につき基本1個まで、例外は3つ以上の列挙・軍隊口調や強調のときの短文のみ」。
  代名詞・指示語（he/she/they、繰り返しの「あなた」「それ」等）は文脈で分かるなら
  訳しすぎない・省略する。
- dev/res/v2CharacterNotes.md で登場人物の口調を確認する。
- dev/res/glossary.json は各entryの glossary フィールドに必要分だけ抜粋済みなので、
  ファイル全体は読まなくてよい。

【やること】
1. ${fileName} を読み、各entryの TEXT フィールド（英語原文）を、speakerProfile・
   previous文脈・v2CharacterNotes.mdの口調を踏まえて自然な日本語に訳す。
2. 各entryの "translation" フィールド（現在 null）に訳文を書き込む。
   - <ctrl_N/> トークンは一字一句変えない。
   - current フィールド（もしあれば）は無視してよい、参照も踏襲もしない。
   - 全entryを埋めること。分からない/判断がつかない場合のみ null のまま残してよい。
3. ${fileName} 以外のファイルは一切編集しないこと。git操作やコマンド実行は不要（あなたには
   その権限がありません）。

作業が終わったら、1〜2行で「何件訳したか」「登場した会話(dialog名)」「気づいた点があれば一言」
を報告して終了してください。長い説明は不要です。`;
}

function buildNotesPrompt(chunkFiles, roundNo) {
  const fileList = chunkFiles.map((f) => `dev/lang/chunks_review/${todayStr()}_round${roundNo}/${f}`).join('\n  ');
  return `直前に翻訳された以下のchunkファイルを軽く確認してください（全文精読は不要、speakerとglossaryフィールドを流し見る程度でよい）:
  ${fileList}

【やること（該当があれば、なければ何もしない）】
1. dev/res/v2CharacterNotes.md に載っていない新しい話者(speaker)が登場していたら、
   短い口調メモを1〜2行で追記する（既存の項目のフォーマットに合わせる）。
2. このroundを訳す中で気づいた、今後も使える新しい翻訳ルール・改善点があれば、
   dev/res/translationGuide.md に一言だけ追記する（更新履歴セクションにも1行）。

編集してよいのは上記2ファイルだけです。他のファイルは触らないこと。
git操作やコマンド実行は不要です（あなたにその権限はありません）。

作業が終わったら、何を追記したか（なければ「追記なし」)を1行で報告して終了してください。`;
}

function callClaude(prompt, logName) {
  ensureLogDir();
  const logPath = path.join(logDir, `${logName}_${Date.now()}.log`);
  // プロンプトは引数ではなく stdin 経由で渡す。理由: プロンプトに <ctrl_N/> のような
  // 山括弧が含まれると、Windows で shell:true 経由（.cmdシムの実行に必須）のとき
  // cmd.exe がそれをリダイレクト演算子と誤解釈し、プロンプトが壊れて Edit が
  // 一切実行されない（「権限がない」という的外れな応答になる）という事故があった。
  // input経由ならシェルのコマンドライン解析を通らないため安全。
  console.log(`$ claude -p (via stdin, ${prompt.length} chars) --allowedTools ${CLAUDE_TOOLS} ...`);
  const result = execFileSync(
    'claude',
    ['-p', '--allowedTools', CLAUDE_TOOLS, '--permission-mode', 'dontAsk', '--permission-prompts', 'none'],
    {
      cwd: process.cwd(),
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 64,
      shell: process.platform === 'win32',
      input: prompt,
    }
  );
  fs.writeFileSync(logPath, result);
  console.log(result);
  return result;
}

function validateChunks() {
  // toBatchData.js import --dry-run の標準出力から "Skipped X untranslated, Y invalid" を拾う。
  const out = sh('node', ['toBatchData.js', 'import', '--dry-run', `--chunks-dir=./lang/chunks`]);
  const m = out.match(/Skipped (\d+) untranslated, (\d+) invalid/);
  const untranslated = m ? Number(m[1]) : NaN;
  const invalid = m ? Number(m[2]) : NaN;
  return { out, untranslated, invalid };
}

function collectDialogs(chunkFiles) {
  const dialogs = [];
  for (const f of chunkFiles) {
    const c = JSON.parse(fs.readFileSync(path.join(chunksDir, f), 'utf8'));
    for (const e of c.entries) {
      if (e.dialog && !dialogs.includes(e.dialog)) dialogs.push(e.dialog);
    }
  }
  return dialogs;
}

function moveToReview(chunkFiles, roundNo) {
  const reviewDirRel = `lang/chunks_review/${todayStr()}_round${roundNo}`;
  const reviewDirAbs = path.resolve('.', reviewDirRel);
  fs.mkdirSync(reviewDirAbs, { recursive: true });
  for (const f of [...chunkFiles, 'manifest.json']) {
    const src = path.join(chunksDir, f);
    if (fs.existsSync(src)) fs.renameSync(src, path.join(reviewDirAbs, f));
  }
  return `dev/${reviewDirRel}/`;
}

function updateProgressAndCommit(start, roundNo, reviewDir, coveredDialogs, summaries) {
  const progress = readProgress();
  progress.history.push({
    start,
    limit,
    merged: false,
    reviewDir,
    coveredDialogs,
    note:
      `v2リライト第${roundNo}弾（runRoundLoop.mjs による自動実行）。` +
      (summaries.length ? ' ' + summaries.join(' / ') : ''),
  });
  progress.nextStart = start + limit;
  progress.updatedAt = new Date().toISOString();
  writeProgress(progress);

  sh('git', ['add', '-A'], { cwd: path.resolve('..') });
  sh('git', ['commit', '-m', `round${roundNo}完了（自動実行）`], { cwd: path.resolve('..') });
}

function nextRoundNumber(progress) {
  return progress.history.length + 1;
}

function runRound(start, roundNo) {
  console.log(`\n=== round #${roundNo} (start=${start}, limit=${limit}) ===`);

  if (dryRun) {
    console.log('[dry-run] extract → chunkごとにclaude翻訳依頼 → 検証 → 退避 → progress更新+commit');
    return;
  }

  const chunkFiles = runExtract(start);
  console.log(`chunk数: ${chunkFiles.length} (${chunkFiles.join(', ')})`);

  const summaries = [];
  for (const f of chunkFiles) {
    console.log(`\n--- ${f} を翻訳依頼 ---`);
    const result = callClaude(buildChunkPrompt(f), `round${roundNo}_${f.replace('.json', '')}`);
    summaries.push(result.trim().slice(0, 200));
  }

  const { out, untranslated, invalid } = validateChunks();
  console.log(out);
  if (invalid > 0) {
    throw new Error(
      `import --dry-run で invalid が${invalid}件あります。dev/lang/chunks/ を確認してから` +
        ' 手動で直すか、このroundをやり直してください（自動化は続行しません）。'
    );
  }
  if (untranslated > 0) {
    console.warn(
      `⚠ ${untranslated}件が翻訳されないまま残っています（Claudeがnullのままにした分）。` +
        ' このまま退避しますが、後で人間の確認が必要です。'
    );
  }

  const coveredDialogs = collectDialogs(chunkFiles);
  const reviewDir = moveToReview(chunkFiles, roundNo);
  console.log(`退避先: ${reviewDir}`);

  if (!skipNotes) {
    console.log('\n--- 話者メモ/翻訳ルールの反省ステップ ---');
    callClaude(buildNotesPrompt(chunkFiles, roundNo), `round${roundNo}_notes`);
  }

  updateProgressAndCommit(start, roundNo, reviewDir, coveredDialogs, summaries);
}

let rounds = 0;
while (rounds < maxRounds) {
  const progress = readProgress();
  const start = progress.nextStart;

  if (start >= TOTAL_KEYS) {
    console.log(`nextStart(${start}) が総キー数目安(${TOTAL_KEYS})に達しました。終了します。`);
    break;
  }

  const roundNo = nextRoundNumber(progress);
  runRound(start, roundNo);

  if (dryRun) break;

  rounds++;
}

console.log(`\n完了。${rounds} round 実行しました。`);
