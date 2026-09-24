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
//   node runRoundLoop.mjs --max-retries=30 --retry-wait-minutes=20  # 利用上限時の再試行調整
//   node runRoundLoop.mjs --min-remaining-percent=25  # chunk/notes呼び出し直前にセッション残り
//                                                       # 使用率(`/usage`)を確認し、この%未満なら
//                                                       # 呼び出さずreset待ち（デフォルト25）
//   node runRoundLoop.mjs --skip-usage-check           # 上記の事前チェックを無効化
//   node runRoundLoop.mjs --chunk-model=claude-haiku-4-5-20251001    # chunk翻訳に使うモデルを変更
//   node runRoundLoop.mjs --notes-model=claude-sonnet-5              # notes反省ステップに使うモデルを変更
//                                                                     # （--chunk-model / --notes-model 省略時はアカウントのデフォルトモデル）
//
// トークン消費量の実測について:
//   各 claude -p 呼び出しは --output-format=json で実行し、返ってきた usage（入力/出力/
//   キャッシュトークン数）を res/roundLogs/usage.jsonl に1行1レコードで追記する。
//   「1roundの消費が重い」と感じたら、まずここを集計して重い呼び出し（chunk別/notes別/
//   モデル別）を特定してから対策すること（勘に頼らない）。
//
// ⚠️ 実行場所について（重要）:
//   このスクリプトは Claude Code の対話セッション（このスクリプトを書いた会話など）の
//   Bashツール経由で"監視しながら"実行しないこと。利用上限に達すると数十分〜数時間
//   待ってから自動再試行する設計になっており、対話セッション側でその待ちを逐一
//   確認・ポーリングすると、外部プロセスに切り出した意味がなくなり、その対話セッション
//   自体のコンテキストがどんどん膨らんでしまう（このスクリプトを設計した理由そのものが
//   損なわれる）。**素のターミナル（Claude Codeの外）で実行し、放置すること。**
//
// 前提:
//   - `claude` コマンドがPATHに通っていること（ログイン済みであること）
//   - dev/res/v2Progress.json が存在し、nextStart が正しいこと
//
// 再開について:
//   - claude -p の呼び出しが利用上限などで失敗した場合、エラーメッセージから
//     再開時刻（"resets H:MMam/pm" 等）を検出できればそこまで、できなければ
//     --retry-wait-minutes（デフォルト20分）待ってから自動的に再試行する
//     （--max-retries回まで、デフォルト30回）。
//   - 同じroundを再実行した場合、既にtranslationが埋まっているchunkはスキップし、
//     未処理のchunkだけを続きから翻訳する（extractも、既存のchunks/がこのroundの
//     途中状態だと判断できれば再利用し、やり直さない）。

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  chunkEntriesAt,
  translationsFileName,
  buildChunkPrompt as buildChunkPromptIn,
  mergeTranslations as mergeTranslationsIn,
  buildNotesPrompt,
  collectDialogs as collectDialogsIn,
} from './helper/roundPrompts.mjs';

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
// 2026-09、「訳文だけ出力」方式への変更後に実測: chunk-size=200（limit=300で概ね2chunkに
// なる）でも64,000トークン/レスポンス上限には抵触しなかった（200件・200/200完了・
// タグ整合性も問題なし）。旧方式（ファイル全体を1レスポンスで書き戻す）ではこの上限が
// 実質chunk-sizeの天井だったが、新方式は複数turnに分けて出力できるため、この上限は
// もう実質的なボトルネックではない。ただしcost/thinkingはchunk-sizeよりentryの内容
// （長台詞・地の文混在の多さ等）の方が支配的にブレる（実測でsize200の1件が同entry数の
// 旧chunk2つ分よりthinkingが多かった例あり）。複数roundの実測平均で効果を確認すること。
const chunkSize = Number(args['chunk-size'] ?? 200);
const dryRun = !!args['dry-run'];
const skipNotes = !!args['skip-notes'];
const chunkModel = typeof args['chunk-model'] === 'string' ? args['chunk-model'] : null;
const notesModel = typeof args['notes-model'] === 'string' ? args['notes-model'] : null;
const usageLogPath = path.resolve('./res/roundLogs/usage.jsonl');

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

function formatJST(d = new Date()) {
  const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const yyyy = jst.getUTCFullYear();
  const mm = String(jst.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(jst.getUTCDate()).padStart(2, '0');
  const hh = String(jst.getUTCHours()).padStart(2, '0');
  const mi = String(jst.getUTCMinutes()).padStart(2, '0');
  return `${yyyy}/${mm}/${dd} ${hh}:${mi}`;
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
  const manifestPath = path.join(chunksDir, 'manifest.json');
  if (fs.existsSync(chunksDir) && fs.readdirSync(chunksDir).length) {
    // 前回このroundの途中で（利用上限などで）落ちて、chunks/ にそのroundのファイルが
    // 残っている可能性がある。manifest.json の start が一致すれば再利用（再開）、
    // 一致しない/存在しなければ別roundの残骸なので人間の確認を求めて止める。
    if (fs.existsSync(manifestPath)) {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      if (manifest.start === start) {
        const files = fs
          .readdirSync(chunksDir)
          .filter((f) => /^chunk_\d+\.json$/.test(f))
          .sort();
        console.log(`./lang/chunks/ に同じround(start=${start})の途中状態を検出。再開します。`);
        return files;
      }
    }
    throw new Error(
      `./lang/chunks/ に別roundらしき残骸があります（start=${start}と一致しません）。` +
      ' 手動で確認・退避してから再実行してください。'
    );
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

// 新形式（blocks[].entries[]）・旧形式（entries[]）の平坦化などの共有処理は helper/roundPrompts.mjs。
function chunkEntries(fileName) {
  return chunkEntriesAt(path.join(chunksDir, fileName));
}

// thinking_tokensの外れ値調査用（2026-09実測）: chunkごとのthinking量は
// 「entryの内容の難しさ」よりも「chunk内の原文総文字数」とほぼ線形に相関していた
// （r=0.989、8chunkサンプル）。ここでは分割方式を変えず、原因の再現性を今後の
// round実行で機械的に確認できるよう、chunk呼び出し時点の原文統計をusage.jsonlに
// 追記するだけに留める。
function chunkStats(fileName) {
  const entries = chunkEntries(fileName);
  let totalChars = 0;
  for (const e of entries) totalChars += (e.text ?? '').length;
  return { entries: entries.length, totalChars };
}

function chunkFullyTranslated(fileName) {
  return chunkEntries(fileName).every((e) => e.translation != null);
}

function buildChunkPrompt(fileName) {
  return buildChunkPromptIn('dev/lang/chunks', fileName);
}

function mergeTranslations(fileName) {
  return mergeTranslationsIn(chunksDir, fileName);
}

function appendUsageLog(record) {
  try {
    fs.mkdirSync(path.dirname(usageLogPath), { recursive: true });
    fs.appendFileSync(usageLogPath, JSON.stringify(record) + '\n');
  } catch (e) {
    console.warn(`⚠ usage.jsonl への記録に失敗（無視して続行）: ${e.message}`);
  }
}

// 実測（2026-09時点、claude-sonnet-5）: chunk翻訳はturnはほぼ常に4だが、cost/durationは
// 内容量やextended thinkingの深さでばらつく（中央値$0.66・384秒、p90 $0.89・540秒）。
// notesはturn13〜33（round26以降の改修後は7〜9まで低下）、cost中央値$0.57・109秒。
//
// round20_chunk_0001（48turn）はturn数の外れ値だったが、round30_chunk_0001は逆にturn数は
// 通常通り4のまま、thinking_tokens=92,149・output_tokens=183,164まで膨らみ、1回の呼び出しで
// $2.48・27分（同roundの他chunkの3〜8倍）を消費していた。turn数だけを見張る従来のチェックは
// これを素通りさせていたため、cost/durationのしきい値も追加した。
// しきい値はいずれの指標も実測分布のp90より十分上、かつ既知の外れ値2件（round20_chunk_0001の
// 48turn、round30_chunk_0001の$2.48/1603秒）は確実に検出できる値にしている。
const anomalyLogPath = path.resolve('./res/roundLogs/anomalies.log');
const ANOMALY_THRESHOLDS = {
  chunk: { turns: 12, costUsd: 1.5, durationMs: 900_000 }, // 900_000ms = 15分
  notes: { turns: 40, costUsd: 2.0, durationMs: 600_000 }, // 600_000ms = 10分
};

// 2026-09、64k max_tokens 衝突のリカバリ方式を調査した結果: --output-format json の
// 最上位レスポンスには stop_reason（最終ターンのもの）も session_id も含まれるが、
// 「途中のどこかのターンで max_tokens に衝突したか」はそこからは分からない
// （最終的に正常完了すれば is_error:false のまま埋もれる）。これを機械的に検知するには
// セッションのフルトランスクリプト（~/.claude/projects/<sanitized-cwd>/<session_id>.jsonl、
// claude Code CLIが自動保存している）を読み、各assistantターンの stop_reason を見るしかない。
// ここでは「衝突したら別経路に切り替える」対策は行わず、観測のみ行う
// （対策側は検知手段が無いと成立しないため、まずはこれで発生率・コストの実測を蓄積する）。
function sanitizeCwdForProjectDir(cwd) {
  return cwd.replace(/[^a-zA-Z0-9]/g, '-');
}

function detectMaxTokensHit(sessionId, cwd) {
  if (!sessionId) return null;
  try {
    const projectDir = path.join(os.homedir(), '.claude', 'projects', sanitizeCwdForProjectDir(cwd));
    const transcriptPath = path.join(projectDir, `${sessionId}.jsonl`);
    if (!fs.existsSync(transcriptPath)) return null;
    const lines = fs.readFileSync(transcriptPath, 'utf8').trim().split('\n');
    const seenMsgIds = new Set();
    let hitCount = 0;
    let maxSingleTurnOutputTokens = 0;
    for (const line of lines) {
      let l;
      try { l = JSON.parse(line); } catch { continue; }
      if (l.type !== 'assistant') continue;
      const key = l.message?.id ?? l.uuid;
      if (seenMsgIds.has(key)) continue; // 同一ターンが複数行に分かれて出力されるケースの重複除去
      seenMsgIds.add(key);
      const out = l.message?.usage?.output_tokens ?? 0;
      if (out > maxSingleTurnOutputTokens) maxSingleTurnOutputTokens = out;
      if (l.message?.stop_reason === 'max_tokens') hitCount++;
    }
    return { maxTokensHit: hitCount > 0, maxTokensHitCount: hitCount, maxSingleTurnOutputTokens };
  } catch (e) {
    console.warn(`⚠ max_tokens衝突の検知に失敗（無視して続行）: ${e.message}`);
    return null;
  }
}

function checkTurnAnomaly(logName, promptLength, parsed, extraUsageFields) {
  const kind = logName.endsWith('_notes') ? 'notes' : 'chunk';
  const threshold = ANOMALY_THRESHOLDS[kind];
  const turns = parsed.num_turns;
  const cost = parsed.total_cost_usd ?? 0;
  const duration = parsed.duration_ms ?? 0;

  const reasons = [];
  if (typeof turns === 'number' && turns > threshold.turns) reasons.push(`turns ${turns}>${threshold.turns}`);
  if (cost > threshold.costUsd) reasons.push(`cost $${cost.toFixed(3)}>$${threshold.costUsd}`);
  if (duration > threshold.durationMs) reasons.push(`duration ${(duration / 1000).toFixed(0)}s>${threshold.durationMs / 1000}s`);
  // cost/duration/turnsのしきい値を超えていなくても、max_tokens衝突自体は独立して記録価値がある
  // シグナルなので、検知できていれば無条件でreasonsに加える（＝無条件でanomalies.logに残る）。
  if (extraUsageFields?.maxTokensHit) reasons.push(`max_tokens衝突 x${extraUsageFields.maxTokensHitCount}`);
  if (!reasons.length) return;

  const msg =
    `⚠ 異常に重い呼び出しを検出: ${logName}（${reasons.join(' / ')}、` +
    `cache_read=${parsed.usage?.cache_read_input_tokens ?? '?'}, output_tokens=${parsed.usage?.output_tokens ?? '?'}）。` +
    ` res/roundLogs/anomalies.log に詳細を記録しました。`;
  console.warn(msg);
  try {
    fs.appendFileSync(
      anomalyLogPath,
      JSON.stringify({
        ts: new Date().toISOString(),
        logName,
        kind,
        reasons,
        num_turns: turns,
        total_cost_usd: parsed.total_cost_usd ?? null,
        duration_ms: parsed.duration_ms ?? null,
        cache_read_input_tokens: parsed.usage?.cache_read_input_tokens ?? null,
        output_tokens: parsed.usage?.output_tokens ?? null,
        thinking_tokens: parsed.usage?.output_tokens_details?.thinking_tokens ?? null,
        promptLength,
        ...(extraUsageFields ?? {}),
      }) + '\n'
    );
  } catch (e) {
    console.warn(`⚠ anomalies.log への記録に失敗（無視して続行）: ${e.message}`);
  }
}

function callClaudeOnce(prompt, logName, model, extraUsageFields) {
  ensureLogDir();
  const logPath = path.join(logDir, `${logName}_${Date.now()}.log`);
  // プロンプトは引数ではなく stdin 経由で渡す。理由: プロンプトに <ctrl_N/> のような
  // 山括弧が含まれると、Windows で shell:true 経由（.cmdシムの実行に必須）のとき
  // cmd.exe がそれをリダイレクト演算子と誤解釈し、プロンプトが壊れて Edit が
  // 一切実行されない（「権限がない」という的外れな応答になる）という事故があった。
  // input経由ならシェルのコマンドライン解析を通らないため安全。
  const cliArgs = [
    '-p',
    '--allowedTools', CLAUDE_TOOLS,
    '--permission-mode', 'dontAsk',
    '--permission-prompts', 'none',
    '--output-format', 'json', // usage（トークン数）を集計するため。resultフィールドに従来通りのテキストが入る。
  ];
  if (model) cliArgs.push('--model', model);
  console.log(`$ claude -p (via stdin, ${prompt.length} chars)${model ? ` --model ${model}` : ''} --allowedTools ${CLAUDE_TOOLS} ...`);
  const raw = execFileSync('claude', cliArgs, {
    cwd: process.cwd(),
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 64,
    shell: process.platform === 'win32',
    input: prompt,
  });

  let result = raw;
  try {
    const parsed = JSON.parse(raw);
    result = typeof parsed.result === 'string' ? parsed.result : raw;
    const maxTokensInfo = detectMaxTokensHit(parsed.session_id, process.cwd());
    const mergedExtraFields = { ...(extraUsageFields ?? {}), ...(maxTokensInfo ?? {}) };
    appendUsageLog({
      ts: new Date().toISOString(),
      logName,
      model: model ?? '(default)',
      usage: parsed.usage ?? null,
      total_cost_usd: parsed.total_cost_usd ?? null,
      duration_ms: parsed.duration_ms ?? null,
      num_turns: parsed.num_turns ?? null,
      is_error: parsed.is_error ?? null,
      session_id: parsed.session_id ?? null,
      ...mergedExtraFields,
    });
    checkTurnAnomaly(logName, prompt.length, parsed, mergedExtraFields);
  } catch (e) {
    // --output-format json が使えないCLIバージョン等で生テキストが返ってきた場合のフォールバック。
    // 従来通りテキストとして扱う（usageは記録できないが処理自体は継続する）。
    console.warn(`⚠ claude -p の出力をJSONとして解釈できませんでした（usage未記録で続行）: ${e.message}`);
  }

  fs.writeFileSync(logPath, result);
  console.log(result);
  return result;
}

// Node に同期sleepは標準では無いが、Atomics.wait はメインスレッドをブロックできる
// （ワーカースレッド不要）。放置実行が前提のスクリプトなので同期待機で十分。
function sleepSync(ms) {
  const sab = new SharedArrayBuffer(4);
  const view = new Int32Array(sab);
  Atomics.wait(view, 0, 0, ms);
}

function isRateLimitLike(text) {
  return /session limit|usage limit|rate limit|weekly limit|resets? (at |in )?\d/i.test(text);
}

// 2026-09、長時間の中断（利用上限に達して待機→再開、または端末を閉じて放置後の再起動）を
// 挟むと、既に翻訳済みだったはずのchunkが丸ごと再翻訳され、$1〜2規模の無駄な課金が発生する
// ケースを実測で確認した（round19: 4chunk中2chunkがほぼ全量再翻訳、$2.68→$2.26の二重払い。
// round44でも同様、48時間ギャップで再現）。原因はコードからは断定できなかったが（おそらく
// mergeTranslationsの反映がプロセス中断で失われるケースがある）、対策として「chunk呼び出しの
// 前にセッション残り使用率を確認し、閾値を切っていたら呼び出さずにreset待ちする」ことで、
// 「中断されて失われる可能性がある呼び出し」自体を未然に防ぐ。
//
// `/usage` は `claude -p` の引数として渡すと（スラッシュコマンドとして解釈されず）ただの
// プロンプトとして扱われてしまい、実測で$0.2程度課金される。一方、素の`claude`にstdin経由で
// `/usage\n`を渡すとビルトインコマンドとして処理され、モデルを一切呼ばずに即座に結果が返る
// （実測: costフィールドすら出力されない＝無料）。そのため素の`claude`をstdin経由で呼ぶ。
function parseUsageOutput(text) {
  const m = text.match(
    /Current session:\s*(\d+)%\s*used\s*(?:·|\.)?\s*resets\s+([A-Za-z]{3})\s+(\d{1,2}),?\s*(\d{1,2}):(\d{2})\s*(am|pm)/i
  );
  if (!m) return null;
  const usedPercent = Number(m[1]);
  const [, , monStr, dayStr, hourStr, minStr, ap] = m;
  const now = new Date();
  let resetAt = new Date(`${monStr} ${dayStr} ${now.getFullYear()} ${hourStr}:${minStr} ${ap}`);
  if (!isNaN(resetAt.getTime()) && resetAt.getTime() < now.getTime() - 60 * 60 * 1000) {
    // 年またぎ（12月→1月）想定。
    resetAt = new Date(`${monStr} ${dayStr} ${now.getFullYear() + 1} ${hourStr}:${minStr} ${ap}`);
  }
  return { usedPercent, resetAt: isNaN(resetAt.getTime()) ? null : resetAt };
}

function getSessionUsage() {
  try {
    const out = execFileSync('claude', [], {
      cwd: process.cwd(),
      encoding: 'utf8',
      maxBuffer: 1024 * 1024,
      shell: process.platform === 'win32',
      input: '/usage\n',
      timeout: 30000,
    });
    const info = parseUsageOutput(out);
    if (!info) console.warn(`⚠ /usage の出力形式を解析できませんでした（無視して続行）:\n${out}`);
    return info;
  } catch (e) {
    console.warn(`⚠ /usage の取得に失敗（無視して続行）: ${e.message}`);
    return null;
  }
}

const usageCheckEnabled = !args['skip-usage-check'];
const minRemainingPercent = Number(args['min-remaining-percent'] ?? 25);

// chunk/notes呼び出し直前に呼ぶ。セッション残りが閾値未満なら、そのまま呼び出さずreset時刻まで
// 待ってから返る（＝プロセスは終了しない。呼び出し側からは「少し待ってから普段通り進む」だけに
// 見える）。/usage自体の取得に失敗した場合は素通りする（fail-open。このアカウントは追加利用
// (overage)がOFFであることを確認済みなので、素通りしても最悪ケースは既存のisRateLimitLikeの
// retry-waitに委ねられるだけで、無限に暴走課金する経路にはならない）。
function ensureSessionBudget(label) {
  if (!usageCheckEnabled) return;
  for (; ;) {
    const info = getSessionUsage();
    if (!info) return;
    const remaining = 100 - info.usedPercent;
    if (remaining >= minRemainingPercent) return;
    const waitMs = info.resetAt
      ? Math.max(info.resetAt.getTime() - Date.now() + 2 * 60 * 1000, 60 * 1000)
      : 20 * 60 * 1000;
    console.warn(
      `⏳ [${label}] セッション残り${remaining}%（閾値${minRemainingPercent}%未満）のため呼び出し前に待機します。` +
      (info.resetAt
        ? ` resetまで約${Math.ceil(waitMs / 60000)}分。`
        : ' reset時刻を解析できなかったため20分待機します。')
    );
    sleepSync(waitMs);
  }
}

// "resets 2:50pm (Asia/Tokyo)" のような文言から次回再試行までの待機時間(ms)を推定する。
// 解析できなければ null（呼び出し側がデフォルト待機時間にフォールバックする）。
function parseResetWaitMs(text) {
  const m = text.match(/resets\s+(\d{1,2}):(\d{2})\s*(am|pm)/i);
  if (!m) return null;
  let hour = Number(m[1]);
  const minute = Number(m[2]);
  const ap = m[3].toLowerCase();
  if (ap === 'pm' && hour !== 12) hour += 12;
  if (ap === 'am' && hour === 12) hour = 0;
  const now = new Date();
  const reset = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0, 0);
  if (reset.getTime() <= now.getTime()) reset.setDate(reset.getDate() + 1);
  return reset.getTime() - now.getTime() + 2 * 60 * 1000; // 念のため2分のバッファ
}

function callClaude(prompt, logName, model, extraUsageFields) {
  const maxRetries = Number(args['max-retries'] ?? 30);
  const fallbackWaitMs = Number(args['retry-wait-minutes'] ?? 20) * 60 * 1000;

  for (let attempt = 0; ; attempt++) {
    try {
      return callClaudeOnce(prompt, logName, model, extraUsageFields);
    } catch (err) {
      const text = `${err.stdout || ''}\n${err.stderr || ''}\n${err.message || ''}`;
      if (attempt >= maxRetries || !isRateLimitLike(text)) throw err;
      const waitMs = parseResetWaitMs(text) ?? fallbackWaitMs;
      const waitMin = Math.ceil(waitMs / 60000);
      console.warn(
        `\n⏳ 利用上限らしきエラーを検出（試行${attempt + 1}/${maxRetries}）。${waitMin}分待って自動再試行します。\n` +
        `   検出内容: ${text.trim().split('\n')[0].slice(0, 200)}`
      );
      sleepSync(waitMs);
    }
  }
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
  return collectDialogsIn(chunksDir, chunkFiles);
}

function moveToReview(chunkFiles, roundNo) {
  const reviewDirRel = `lang/chunks_review/${todayStr()}_round${roundNo}`;
  const reviewDirAbs = path.resolve('.', reviewDirRel);
  fs.mkdirSync(reviewDirAbs, { recursive: true });
  for (const f of [...chunkFiles, 'manifest.json']) {
    const src = path.join(chunksDir, f);
    if (fs.existsSync(src)) fs.renameSync(src, path.join(reviewDirAbs, f));
  }
  // 通常は各chunk呼び出し直後にmergeTranslationsが消しているはずだが、念のため
  // 中間ファイルの残骸が残っていたら退避せず削除する（reviewには不要な情報なので）。
  for (const f of chunkFiles) {
    const leftover = path.join(chunksDir, translationsFileName(f));
    if (fs.existsSync(leftover)) fs.rmSync(leftover);
  }
  return { reviewDir: `dev/${reviewDirRel}/`, reviewDirAbs };
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
    // 前回このroundが利用上限等で落ちた際、chunk本体は書き換えず訳文だけ書いた
    // *.translations.json が残っている可能性がある。呼び出し前に必ずマージを試みる。
    mergeTranslations(f);
    if (chunkFullyTranslated(f)) {
      console.log(`\n--- ${f} は既に翻訳済み（前回の再開分）、スキップ ---`);
      continue;
    }
    console.log(`\n--- ${f} を翻訳依頼 ---`);
    ensureSessionBudget(`round${roundNo}_${f.replace('.json', '')}`);
    const stats = chunkStats(f);
    const result = callClaude(
      buildChunkPrompt(f),
      `round${roundNo}_${f.replace('.json', '')}`,
      chunkModel,
      { chunkEntries: stats.entries, chunkSourceChars: stats.totalChars }
    );
    const { merged, hasFile } = mergeTranslations(f);
    if (!hasFile) {
      console.warn(
        `⚠ ${f}: *.translations.json が生成されませんでした（Claudeがchunk本体を直接編集した` +
        ' か、失敗した可能性）。chunk本体側の状態をそのまま使用します。'
      );
    } else {
      console.log(`${f}: ${merged}件を translations.json からマージしました。`);
    }
    console.log(`--- ${f} 翻訳完了: ${formatJST()} ---`);
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
  const { reviewDir, reviewDirAbs } = moveToReview(chunkFiles, roundNo);
  console.log(`退避先: ${reviewDir}`);

  if (!skipNotes) {
    console.log('\n--- 話者メモ/翻訳ルール/glossaryの反省ステップ ---');
    const glossaryPath = path.resolve('./res/glossary.json');
    const glossaryBackup = fs.readFileSync(glossaryPath, 'utf8');
    const glossaryEntries = JSON.parse(glossaryBackup).glossary ?? [];
    ensureSessionBudget(`round${roundNo}_notes`);
    callClaude(
      buildNotesPrompt(reviewDir, reviewDirAbs, chunkFiles, roundNo, glossaryEntries),
      `round${roundNo}_notes`,
      notesModel
    );
    // glossary.json はJSON構文が壊れるとextractのmatchingGlossary()が以降全滅するので、
    // Claudeの編集後にNode側で機械的に検証する。壊れていたら即座に元へ戻す。
    try {
      JSON.parse(fs.readFileSync(glossaryPath, 'utf8'));
    } catch (e) {
      fs.writeFileSync(glossaryPath, glossaryBackup);
      console.warn(
        `⚠ glossary.jsonの編集がJSONとして壊れていたため、この反省ステップの変更を破棄し元に戻しました（${e.message}）。`
      );
    }
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
