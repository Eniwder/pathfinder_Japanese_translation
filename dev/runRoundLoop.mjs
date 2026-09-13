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

// 新形式（blocks[].entries[]）・旧形式（entries[]、後方互換）の両方を平坦化する。
// toBatchData.js の flattenEntries と同じロジック（このスクリプトはCLIしか呼ばないため
// import できず、小さいので複製している）。
function chunkEntries(fileName) {
  const c = JSON.parse(fs.readFileSync(path.join(chunksDir, fileName), 'utf8'));
  return Array.isArray(c.entries) ? c.entries : (c.blocks ?? []).flatMap((b) => b.entries ?? []);
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

// chunkファイル名(chunk_0000.json)に対応する「訳文だけの中間ファイル」名。
function translationsFileName(fileName) {
  return fileName.replace(/\.json$/, '.translations.json');
}

// Claudeにはchunkファイル全体の書き戻しをさせず、entryの key→訳文 だけの
// フラットなJSONを書かせて、実際のマージ（chunkファイルへの書き込み）はここで
// Node側が決定的に行う。
//
// 経緯（2026-09、gold-set 120件での実測比較）:
//   「ファイル全体をWriteで書き戻す」旧方式は、原文120件中訳文になる文字数は
//   全体の1割強で、残りは原文テキスト・glossary・speakers辞書・key/dialog等の
//   構造情報を毎回まるごとタイプし直しているだけだった（実測 output_tokens
//   57,703のうちthinking 21,739を除いた可視出力だけで35,964）。
//   「訳文だけ出力」に変えたところ、同一chunk・同一effortでcost -26%
//   （$1.13→$0.84）、output_tokens -36%（57,703→37,018）、可視出力は-58%
//   （35,964→14,919）。thinking_tokensはほぼ不変（21,739→22,099）で、
//   「訳す判断」自体のコストは変わらず、無駄な書き写し分だけが削れたことを確認済み。
//   訳文の完全性（120/120件・<ctrl_N/>整合）も損なわれていない。
//   副次効果として、claude-sonnet-5の1レスポンスあたり出力上限
//   （64,000トークン、CLAUDE_CODE_MAX_OUTPUT_TOKENSでも超えられないハード
//   リミット）に対する余裕も増える。旧方式は120件chunkで既に61,909と上限の
//   97%近くまで来ており、これがround20/round30/round32で観測した「異常に
//   重いchunk」（thinking暴走・数十分化）の一因だった可能性が高い
//   （実際、旧方式のまま240件chunkに増やす検証をしたところ64,000超過で
//   エラー・リトライになり、コストも所要時間も悪化した）。
function buildChunkPrompt(fileName) {
  const transFile = translationsFileName(fileName);
  return `dev/lang/chunks/${fileName} の翻訳作業だけをお願いします。

【前提】
- dev/res/translationGuide.md の翻訳ルールに厳密に従うこと（先に一度だけ読む）。
- 話者の口調・用語・直前の文脈・登場人物メモは ${fileName} 自身に埋め込み済み
  （glossary / speakers / characterNotes / sceneNotes、各entryの speaker・ctx）。
  dev/res/glossary.json・dev/res/v2CharacterNotes.md・dev/res/speakerProfiles.json は
  読まなくてよい。

【やること（重要：出力方式が通常のファイル編集と違います）】
1. ${fileName} を読み、blocks[].entries[] の各entryの "text"（英語原文）を、同entryの
   speaker（speakers辞書のキー。無ければ話者不明/ナレーション扱い）・ctx（直前の文脈、
   あれば）・characterNotes/sceneNotesを踏まえて自然な日本語に訳す。
   - <ctrl_N/> トークンは一字一句変えない。
2. **${fileName} 自体は絶対に編集・書き換えしないこと。** 代わりに、翻訳結果だけを
   新規ファイル dev/lang/chunks/${transFile} に、
   { "<entryのkey>": "<翻訳文>", ... } という**キーと訳文だけのフラットなJSONオブジェクト**
   として書き込むこと。原文(text)・話者・glossary・その他のフィールドは一切コピーしない
   こと（訳文だけでよい）。
3. 全entryを対象にすること。分からない/判断がつかない場合のみ、そのentryのkeyを
   省略してよい（未訳のまま残る＝次回以降に再依頼される）。
4. ${fileName} と ${transFile} 以外のファイルは一切編集しないこと（translationGuide.mdの
   閲覧は可）。git操作やコマンド実行は不要（あなたにその権限がありません）。
   Bash・スクリプト実行・その他の回避策は一切試みないこと（許可されているのは
   Read/Write/Edit/Grep/Glob のみで、それ以外は物理的に実行できません）。

【書き込み方法（重要）】
- entryごとに小さなEditを何十回も呼ぶのは非効率なので絶対にしないこと。全entryの訳文を
  あなたの応答の中で組み立ててから、最後にWriteツールで ${transFile} を1回だけ書き込むこと。
- 確認や許可を求める質問は一切しないこと。これは非対話（自動実行）環境なので、質問しても
  誰も返答できず、作業が完了しないまま終了してしまう。効率化のアイデアがあっても質問せず、
  そのまま最後までentryを埋めて ${transFile} をWriteすることを最優先にすること。
- JSON構文を壊さないこと（特に閉じクォート"の書き忘れに注意）。書き込み後、自分で
  書いた内容がJSONとして正しいか目視確認すること。

作業が終わったら、1〜2行で「何件訳したか」「登場した会話(dialog名)」「気づいた点があれば一言」
を報告して終了してください。長い説明は不要です。`;
}

// buildChunkPromptがWriteした dev/lang/chunks/<chunk>.translations.json
// （key→訳文のフラットJSON）を、chunkファイル本体の各entry.translationに
// Node側が機械的にマージする。マージ後、中間ファイルは削除する（再マージによる
// 二重適用や、次回runExtractの残骸検出の誤爆を防ぐため）。
// 既にtranslationが埋まっているentryは上書きしない（Claudeが稀に直接chunk
// ファイルを編集していた場合との併用でも安全なように）。
function mergeTranslations(fileName) {
  const transPath = path.join(chunksDir, translationsFileName(fileName));
  if (!fs.existsSync(transPath)) return { merged: 0, hasFile: false };

  const chunkPath = path.join(chunksDir, fileName);
  const chunkObj = JSON.parse(fs.readFileSync(chunkPath, 'utf8'));
  const entries = Array.isArray(chunkObj.entries) ? chunkObj.entries : (chunkObj.blocks ?? []).flatMap((b) => b.entries ?? []);
  const translations = JSON.parse(fs.readFileSync(transPath, 'utf8'));

  let merged = 0;
  for (const e of entries) {
    if (e.translation != null) continue;
    const t = translations[e.key];
    if (typeof t === 'string' && t.trim() !== '') {
      e.translation = t;
      merged++;
    }
  }
  fs.writeFileSync(chunkPath, JSON.stringify(chunkObj, null, 2) + '\n');
  fs.rmSync(transPath);
  return { merged, hasFile: true };
}

// buildNotesPromptが「chunkファイルを自分で開いて探す」turnを消費しないよう、
// Node側で事前に「v2CharacterNotes.mdに未掲載の話者」だけを抜き出しておく。
// 各chunkファイルはトップレベルに speakers（このchunk内で既知として解決できた話者辞書）を
// 持っており、entryのspeakerがそこに無ければ「未登録の話者」というシグナルになる
// （toBatchData.js の resolveSpeakerTag と同じ判定方法）。
// これにより notes ステップは数十〜百KB規模のchunkファイル本体をReadする必要がなくなり、
// turn数・cache消費（実測で1round 13〜33turn、cache_read最大3.7Mトークンに達していた）を
// 大きく減らせる見込み。
const NOTES_IGNORED_SPEAKERS = new Set(['Player', 'PC', '']);

function collectMissingSpeakerSamples(reviewDirAbs, chunkFiles) {
  const samplesBySpeaker = new Map();
  for (const f of chunkFiles) {
    const filePath = path.join(reviewDirAbs, f);
    if (!fs.existsSync(filePath)) continue;
    const c = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const known = new Set(Object.keys(c.speakers ?? {}));
    for (const b of c.blocks ?? []) {
      for (const e of b.entries ?? []) {
        const speaker = e.speaker;
        if (!speaker || known.has(speaker) || NOTES_IGNORED_SPEAKERS.has(speaker)) continue;
        if (!samplesBySpeaker.has(speaker)) samplesBySpeaker.set(speaker, []);
        const arr = samplesBySpeaker.get(speaker);
        if (arr.length < 3 && e.translation) {
          arr.push({ dialog: b.dialog ?? null, text: e.text, translation: e.translation });
        }
      }
    }
  }
  return samplesBySpeaker;
}

// speakerと同じ発想で、glossary.json(実測56KB/379件、今後も増え続ける)を毎回フルで
// 開かせないよう、「原文に出てきた大文字始まりの語・フレーズのうち、既存glossaryに
// まだ載っていないもの」だけをNode側で事前に絞り込む。toBatchData.jsのmatchesGlossaryTerm
// と同じ単語境界判定を流用し、既存glossaryとの重複は双方向（"Galfrey"⊂"Queen Galfrey"の
// ような部分一致）でチェックする。
//
// 検証方法: round23/round24で実際に追加されたglossary項目（Kiny/Sovyrian/Candlaron/
// Arch of Refuge/Order of the Sunrise Sword/Paralictor/Gray Garrison、計7件）を
// 「そのroundのnotesが動く直前のglossary.json」に対してこの関数を通したところ、
// 7件とも候補一覧に含まれることを確認済み（実際のAPI呼び出しはせず、既存の
// chunks_review/とgit履歴だけを使ったオフライン検証）。候補件数もglossary全件379件に
// 対して30〜60件程度まで絞り込めていた。
const GLOSSARY_CANDIDATE_STOPWORDS = new Set([
  'i','you','he','she','we','they','it','the','a','an','this','that','these','those',
  'my','your','his','her','its','our','their','but','and','or','if','when','while',
  'after','before','because','so','yes','no','well','oh','ah','hey','look','wait','now',
  'then','perhaps','maybe','please','sir','madam','lord','lady','yeah','okay','ok','hmm',
  'good','right','sure','thank','thanks','sorry','alright','indeed','actually','still',
  'here','there','what','who','whom','whose','which','how','why','not','never','always',
  'come','go','let','all','some','one','two','three','first','second','last','many','much',
  'very','just','even','only','also','again','once','more','most','less','least','both',
]);

// "Order of the Sunrise Sword" のように連結語(of/the/and)が連続するケースも1フレーズと
// して拾えるよう、連結語ブロックは1語ずつではなく1回以上の繰り返しを許可する。
const GLOSSARY_PHRASE_RE = /\b[A-Z][a-zA-Z']{1,}(?:(?:\s+(?:of|the|and))+\s+[A-Z][a-zA-Z']{1,}|\s+[A-Z][a-zA-Z']{1,})*\b/g;

function matchesGlossaryTerm(lowerText, source) {
  const escaped = source.toLocaleLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?<![a-z])${escaped}(?![a-z])`, 'i').test(lowerText);
}

// 文頭（＝地の文の大文字化にすぎない可能性が高い位置）に出現しただけの語は候補から除く。
function isSentenceInitial(text, matchIndex) {
  let i = matchIndex - 1;
  while (i >= 0 && /[\s"'“”]/.test(text[i])) i--;
  if (i < 0) return true;
  return /[.!?]/.test(text[i]);
}

function extractGlossaryCandidates(reviewDirAbs, chunkFiles, glossaryEntries, minFreq = 1) {
  const glossarySources = glossaryEntries.map((e) => e.source).filter((s) => typeof s === 'string');
  const counts = new Map();

  for (const f of chunkFiles) {
    const filePath = path.join(reviewDirAbs, f);
    if (!fs.existsSync(filePath)) continue;
    const c = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    for (const b of c.blocks ?? []) {
      for (const e of b.entries ?? []) {
        if (!e.text) continue;
        for (const m of e.text.matchAll(GLOSSARY_PHRASE_RE)) {
          const phrase = m[0].trim();
          if (phrase.includes("'")) continue; // I'm/It's等の短縮形を除外
          const words = phrase.split(/\s+/);
          if (words.length === 1 && GLOSSARY_CANDIDATE_STOPWORDS.has(words[0].toLowerCase())) continue;
          if (isSentenceInitial(e.text, m.index)) continue;
          if (!counts.has(phrase)) counts.set(phrase, { count: 0, samples: [] });
          const rec = counts.get(phrase);
          rec.count++;
          if (rec.samples.length < 2) rec.samples.push({ dialog: b.dialog ?? null, text: e.text });
        }
      }
    }
  }

  let candidates = [];
  for (const [phrase, rec] of counts) {
    if (rec.count < minFreq) continue;
    const lower = phrase.toLowerCase();
    // 既存glossaryとの重複除外は双方向で見る（"Queen Galfrey"収録済みのとき"Galfrey"単独を
    // 毎回未登録候補として出し続けないようにするため）。
    if (glossarySources.some((s) => matchesGlossaryTerm(lower, s) || matchesGlossaryTerm(s.toLowerCase(), lower))) continue;
    candidates.push({ phrase, count: rec.count, samples: rec.samples });
  }
  // 候補同士の重複（"Sunrise Sword" が "Order of the Sunrise Sword" に含まれる、等）も
  // 長い方だけ残す。
  candidates.sort((a, b) => b.phrase.length - a.phrase.length);
  const kept = [];
  for (const c of candidates) {
    if (kept.some((k) => matchesGlossaryTerm(k.phrase.toLowerCase(), c.phrase.toLowerCase()))) continue;
    kept.push(c);
  }
  kept.sort((a, b) => b.count - a.count);
  return kept;
}

function buildNotesPrompt(reviewDir, reviewDirAbs, chunkFiles, roundNo, glossaryEntries) {
  const missing = collectMissingSpeakerSamples(reviewDirAbs, chunkFiles);
  const missingBlock = missing.size
    ? [...missing.entries()]
        .map(
          ([speaker, samples]) =>
            `- speaker_id: ${speaker}\n` +
            samples.map((s) => `  - (${s.dialog ?? '?'}) 原文: ${s.text}\n    訳文: ${s.translation}`).join('\n')
        )
        .join('\n')
    : '（未登録の話者は検出されませんでした）';

  const glossaryCandidates = extractGlossaryCandidates(reviewDirAbs, chunkFiles, glossaryEntries);
  const glossaryBlock = glossaryCandidates.length
    ? glossaryCandidates
        .map(
          (c) =>
            `- "${c.phrase}"（${c.count}回）\n` +
            c.samples.map((s) => `  - (${s.dialog ?? '?'}) ${s.text}`).join('\n')
        )
        .join('\n')
    : '（既存glossaryに無い固有名詞は検出されませんでした）';
  const glossaryFormatExamples = glossaryEntries
    .slice(0, 2)
    .map((e) => JSON.stringify(e))
    .join('\n  ');

  return `直前に${reviewDir}へ退避されたchunkファイルについて、以下の3点を確認してください。
chunkファイル本体・dev/res/glossary.jsonはReadしなくて構いません（判断に必要な情報は
下に埋め込み済みです。判断がつかない場合だけ、該当chunkファイル（${chunkFiles.join(', ')}）や
dev/res/glossary.jsonを開いてください）。

【やること（該当があれば、なければ何もしない）】
1. 下記は dev/res/v2CharacterNotes.md にまだ載っていない話者(speaker_id)と、その原文/訳文サンプルです。
${missingBlock}
   このうち実在キャラとして口調メモを残す価値があるものだけ、「## 定着した話者」節に既存項目と
   同じ形式（\`**表示名(speaker_id)**\` 見出し＋1〜2行の口調メモ）で追記する。この見出し形式は
   toBatchData.js の extract が自動抽出する際の目印になっているため、必ず厳密に守ること
   （崩すと以後そのキャラのメモがchunkへ埋め込まれなくなる）。ナレーション枠・その他の
   非キャラクター的なspeaker_idは無視してよい。
2. このroundを訳す中で気づいた、今後も使える新しい翻訳ルールがあれば
   dev/res/translationGuide.md の該当セクションに一言だけ、既存の簡潔さを保って追記する
   （長い説明・経緯は書かない）。追記した経緯・きっかけのメモは
   dev/res/translationGuideNotes.md の「更新履歴」に1行追記する
   （translationGuide.md本体には経緯を書かない。読み込みコストを増やさないため）。
3. 下記は今回の原文に登場した語のうち、既存の dev/res/glossary.json にまだ無いものの候補です
   （機械的な抽出なので固有名詞ではないノイズも混ざっています。実在の固有名詞だと判断できる
   ものだけを対象にしてください）:
${glossaryBlock}
   既存entryのフォーマット例:
  ${glossaryFormatExamples}
   このうち「今後の一貫性のために記録しておく価値がある固有名詞（人名・地名・組織名など）」
   だけを選び、同じ形式（{"source": 英語, "target": 訳語, "note": 短い説明}、必要なら
   "category"も）で glossary.json の配列に追記する。
   - 一般語・言い回し・候補に挙がっていない語は対象外（無理に探しにいかない）。
   - 既存entryの誤記/表記ゆれ修正が必要だと確信できる場合のみ、glossary.jsonを実際に開いて
     該当entryのtargetを直接書き換える。迷ったら何もしない。
   - JSON構文を絶対に壊さないこと（配列の閉じ忘れ・カンマ漏れに注意）。

編集してよいのは上記4ファイル（v2CharacterNotes.md / translationGuide.md /
translationGuideNotes.md / glossary.json）だけです。他のファイルは触らないこと。
git操作やコマンド実行は不要です（あなたにその権限はありません）。Bash・スクリプト実行・
その他の回避策は一切試みないこと。

【効率化のお願い】
- 各対象ファイルはEditの前に1回読めば十分です。書いた内容を確認するための再読み込みは
  不要（Edit/Writeが失敗すればツール自体がエラーを返します）。
- 追記箇所を探すための試行錯誤や再確認を繰り返さず、目安10ターン以内で完了させてください。

作業が終わったら、何を追記したか（なければ「追記なし」)を1行で報告して終了してください。`;
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
    appendUsageLog({
      ts: new Date().toISOString(),
      logName,
      model: model ?? '(default)',
      usage: parsed.usage ?? null,
      total_cost_usd: parsed.total_cost_usd ?? null,
      duration_ms: parsed.duration_ms ?? null,
      num_turns: parsed.num_turns ?? null,
      is_error: parsed.is_error ?? null,
      ...(extraUsageFields ?? {}),
    });
    checkTurnAnomaly(logName, prompt.length, parsed, extraUsageFields);
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
  const dialogs = [];
  for (const f of chunkFiles) {
    const c = JSON.parse(fs.readFileSync(path.join(chunksDir, f), 'utf8'));
    if (Array.isArray(c.blocks)) {
      for (const b of c.blocks) {
        if (b.dialog && !dialogs.includes(b.dialog)) dialogs.push(b.dialog);
      }
    } else {
      for (const e of c.entries ?? []) {
        if (e.dialog && !dialogs.includes(e.dialog)) dialogs.push(e.dialog);
      }
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
