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

function chunkFullyTranslated(fileName) {
  const c = JSON.parse(fs.readFileSync(path.join(chunksDir, fileName), 'utf8'));
  return c.entries.every((e) => e.translation != null);
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
   その権限がありません）。Bash・スクリプト実行・その他の回避策は一切試みないこと
   （許可されているのは Read/Write/Edit/Grep/Glob のみで、それ以外は物理的に実行できません。
   実行できない場合にスクリプトファイルを作るなどの代替手段を探すのではなく、Write/Editで
   ${fileName} を直接編集する方法だけを使うこと）。

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
3. dev/res/glossary.json を確認し、今回の訳文で使った固有名詞（人名・地名・組織名など）で
   まだ glossary に載っていないもの、または載っている表記と違う訳語を使ってしまったものが
   あれば、既存entryの形式（{"source": 英語, "target": 訳語, "note": 短い説明}、
   必要なら"category"も）に合わせて glossary 配列に追記・修正する。
   - 追記は「今後の一貫性のために記録しておく価値がある固有名詞」だけに絞ること
     （一般語・言い回しは対象外）。
   - 既存entryの target を書き換える場合は、それが誤記/表記ゆれの是正だと確信できるときだけにし、
     迷ったら追記せず何もしない。
   - JSON構文を絶対に壊さないこと（配列の閉じ忘れ・カンマ漏れに注意）。

編集してよいのは上記3ファイルだけです。他のファイルは触らないこと。
git操作やコマンド実行は不要です（あなたにその権限はありません）。Bash・スクリプト実行・
その他の回避策は一切試みないこと。

作業が終わったら、何を追記したか（なければ「追記なし」)を1行で報告して終了してください。`;
}

function callClaudeOnce(prompt, logName) {
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

function callClaude(prompt, logName) {
  const maxRetries = Number(args['max-retries'] ?? 30);
  const fallbackWaitMs = Number(args['retry-wait-minutes'] ?? 20) * 60 * 1000;

  for (let attempt = 0; ; attempt++) {
    try {
      return callClaudeOnce(prompt, logName);
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
    if (chunkFullyTranslated(f)) {
      console.log(`\n--- ${f} は既に翻訳済み（前回の再開分）、スキップ ---`);
      continue;
    }
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
    console.log('\n--- 話者メモ/翻訳ルール/glossaryの反省ステップ ---');
    const glossaryPath = path.resolve('./res/glossary.json');
    const glossaryBackup = fs.readFileSync(glossaryPath, 'utf8');
    callClaude(buildNotesPrompt(chunkFiles, roundNo), `round${roundNo}_notes`);
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
