// v2翻訳ラウンドのプロンプト生成・訳文マージなど、ローカルの自動ランナー（runRoundLoop.mjs）と
// クラウド作業用リポジトリ側のCLI（cloud.mjs）で共有する処理。
// cloudSync.mjs がこのファイルを cloud.mjs ごと作業用リポジトリへコピーするので、
// dev/ 配下の他ファイルには依存させないこと（node標準モジュールのみ）。
//
// 相対パス（./res/... 等）は呼び出し側の cwd が dev/ であることを前提にしている。

import fs from 'node:fs';
import path from 'node:path';

// 新形式（blocks[].entries[]）・旧形式（entries[]、後方互換）の両方を平坦化する。
// toBatchData.js の flattenEntries と同じロジック（このスクリプトはCLIしか呼ばないため
// import できず、小さいので複製している）。
export function chunkEntriesAt(filePath) {
  const c = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  return Array.isArray(c.entries) ? c.entries : (c.blocks ?? []).flatMap((b) => b.entries ?? []);
}

// chunkファイル名(chunk_0000.json)に対応する「訳文だけの中間ファイル」名。
export function translationsFileName(fileName) {
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
export function buildChunkPrompt(chunksDirRel, fileName) {
  const transFile = translationsFileName(fileName);
  return `${chunksDirRel}/${fileName} の翻訳作業だけをお願いします。

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
   新規ファイル ${chunksDirRel}/${transFile} に、
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
export function mergeTranslations(chunksDir, fileName) {
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
          arr.push({ dialog: b.dialog ?? null, file: f, key: e.key, text: e.text, translation: e.translation });
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
  'i', 'you', 'he', 'she', 'we', 'they', 'it', 'the', 'a', 'an', 'this', 'that', 'these', 'those',
  'my', 'your', 'his', 'her', 'its', 'our', 'their', 'but', 'and', 'or', 'if', 'when', 'while',
  'after', 'before', 'because', 'so', 'yes', 'no', 'well', 'oh', 'ah', 'hey', 'look', 'wait', 'now',
  'then', 'perhaps', 'maybe', 'please', 'sir', 'madam', 'lord', 'lady', 'yeah', 'okay', 'ok', 'hmm',
  'good', 'right', 'sure', 'thank', 'thanks', 'sorry', 'alright', 'indeed', 'actually', 'still',
  'here', 'there', 'what', 'who', 'whom', 'whose', 'which', 'how', 'why', 'not', 'never', 'always',
  'come', 'go', 'let', 'all', 'some', 'one', 'two', 'three', 'first', 'second', 'last', 'many', 'much',
  'very', 'just', 'even', 'only', 'also', 'again', 'once', 'more', 'most', 'less', 'least', 'both',
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
          if (rec.samples.length < 2) rec.samples.push({ dialog: b.dialog ?? null, file: f, key: e.key, text: e.text });
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

// 話者・glossaryと同じ発想で、②の「今後も使える新しい翻訳ルール」候補にも機械抽出を
// 試験導入する（③実験）。②はこれまでNode側の候補抽出が無く、Claudeが「気づいたことが
// あれば」という抽象的な指示だけを頼りに、chunk_review内を自分で読みに行く動機になって
// いた（round44/45のトランスクリプトで確認済み）。
// ここでは最も機械的に判定しやすいシグナルとして「同一原文なのに訳し方が割れている
// entry（表記ゆれ）」だけを対象にする。これ自体は「ルール化すべきか」の判断ではなく、
// あくまで気づきのきっかけを渡すだけ（採用するかはこれまで通りClaude任せ）。
function collectInconsistentTranslations(reviewDirAbs, chunkFiles) {
  const byText = new Map();
  for (const f of chunkFiles) {
    const filePath = path.join(reviewDirAbs, f);
    if (!fs.existsSync(filePath)) continue;
    const c = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    for (const b of c.blocks ?? []) {
      for (const e of b.entries ?? []) {
        if (!e.text || !e.translation) continue;
        if (!byText.has(e.text)) byText.set(e.text, []);
        byText.get(e.text).push({ dialog: b.dialog ?? null, file: f, key: e.key, translation: e.translation });
      }
    }
  }
  const inconsistent = [];
  for (const [text, occurrences] of byText) {
    const distinctTranslations = new Set(occurrences.map((o) => o.translation));
    if (distinctTranslations.size > 1) {
      inconsistent.push({ text, occurrences });
    }
  }
  return inconsistent;
}

// notesステップの許可ツールにBashは無いが、実測でclaudeが「ファイル末尾を見たい」ために
// `tail -c N` を試みて拒否される（turnを1つ無駄にするだけで何も得られない）ケースが
// round44・round45の生トランスクリプトで確認された。原因は「末尾を見る手段が無い」ことでは
// なく、Read（行offset指定）で代替できることをClaudeが把握していなかったこと。
// ここで各対象ファイルの現在の行数を機械的に数えてpromptへ埋め込み、「offsetはこの値から
// 引き算すればよい」と明示することで、Bashを試す動機自体を無くす。
function countFileLines(relPath) {
  try {
    return fs.readFileSync(path.resolve(relPath), 'utf8').split('\n').length;
  } catch {
    return null;
  }
}

export function buildNotesPrompt(reviewDir, reviewDirAbs, chunkFiles, roundNo, glossaryEntries) {
  const missing = collectMissingSpeakerSamples(reviewDirAbs, chunkFiles);
  const missingBlock = missing.size
    ? [...missing.entries()]
      .map(
        ([speaker, samples]) =>
          `- speaker_id: ${speaker}\n` +
          samples
            .map((s) => `  - [${s.file}#${s.key}] (${s.dialog ?? '?'}) 原文: ${s.text}\n    訳文: ${s.translation}`)
            .join('\n')
      )
      .join('\n')
    : '（未登録の話者は検出されませんでした）';

  const glossaryCandidates = extractGlossaryCandidates(reviewDirAbs, chunkFiles, glossaryEntries);
  const glossaryBlock = glossaryCandidates.length
    ? glossaryCandidates
      .map(
        (c) =>
          `- "${c.phrase}"（${c.count}回）\n` +
          c.samples.map((s) => `  - [${s.file}#${s.key}] (${s.dialog ?? '?'}) ${s.text}`).join('\n')
      )
      .join('\n')
    : '（既存glossaryに無い固有名詞は検出されませんでした）';
  const glossaryFormatExamples = glossaryEntries
    .slice(0, 2)
    .map((e) => JSON.stringify(e))
    .join('\n  ');

  const inconsistentTranslations = collectInconsistentTranslations(reviewDirAbs, chunkFiles);
  const inconsistencyBlock = inconsistentTranslations.length
    ? inconsistentTranslations
      .map(
        (i) =>
          `- 原文: ${i.text}\n` +
          i.occurrences.map((o) => `  - [${o.file}#${o.key}] (${o.dialog ?? '?'}) 訳文: ${o.translation}`).join('\n')
      )
      .join('\n')
    : '（同一原文で訳し方が割れているentryは検出されませんでした）';

  const lineCountBlock = [
    ['dev/res/v2CharacterNotes.md', './res/v2CharacterNotes.md'],
    ['dev/res/translationGuide.md', './res/translationGuide.md'],
    ['dev/res/translationGuideNotes.md', './res/translationGuideNotes.md'],
    ['dev/res/glossary.json', './res/glossary.json'],
  ]
    .map(([label, relPath]) => `- ${label}: ${countFileLines(relPath) ?? '?'}行`)
    .join('\n');

  return `直前に${reviewDir}へ退避されたchunkファイルについて、以下の3点を確認してください。
chunkファイル本体・dev/res/glossary.jsonはReadしなくて構いません（判断に必要な情報は
下に埋め込み済みです）。

各候補行の \`[chunk_000N.json#<uuid>]\` は、その候補が実際に出現したentryの所在地（ファイル名と
entryのkey）です。追加の文脈がどうしても必要な場合は、この情報を使って
Grep（該当ファイル内で該当keyを検索）すれば1回で該当箇所に到達できます。ファイル全体を
Readしたり、フレーズ名で全文検索し直したりする必要はありません（keyが分かっているので）。

【やること（該当があれば、なければ何もしない）】
1. 下記は dev/res/v2CharacterNotes.md にまだ載っていない話者(speaker_id)と、その原文/訳文サンプルです。
${missingBlock}
   このうち実在キャラとして口調メモを残す価値があるものだけ、「## 定着した話者」節に既存項目と
   同じ形式（\`**表示名(speaker_id)**\` 見出し＋1〜2行の口調メモ）で追記する。この見出し形式は
   toBatchData.js の extract が自動抽出する際の目印になっているため、必ず厳密に守ること
   （崩すと以後そのキャラのメモがchunkへ埋め込まれなくなる）。ナレーション枠・その他の
   非キャラクター的なspeaker_idは無視してよい。
2. 下記は同一原文なのに訳し方が割れているentryです（機械的に検出したものなので、
   単に文脈違いで訳し分けが正しいケースも混ざっています）:
${inconsistencyBlock}
   これや、このroundを訳す中で気づいたその他の点も含めて、今後も使える新しい翻訳ルールが
   あれば dev/res/translationGuide.md の該当セクションに一言だけ、既存の簡潔さを保って
   追記する（長い説明・経緯は書かない）。追記した経緯・きっかけのメモは
   dev/res/translationGuideNotes.md の「更新履歴」に1行追記する
   （translationGuide.md本体には経緯を書かない。読み込みコストを増やさないため）。
   - 上記の表記ゆれ候補は「ルール化する価値があるか」の判断材料であって、機械的に
     全部直す・全部ルール化する必要はない（無ければ何もしない）。
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
git操作やコマンド実行は不要です（あなたにその権限はありません）。Bashは許可ツールに
含まれていないため、tail等のコマンドを試みても失敗してturnを無駄にするだけです
（Bash・スクリプト実行・その他の回避策は一切試みないこと）。
ファイル末尾（配列の閉じ括弧の位置など）を確認したい場合は、Readツールのoffsetパラメータで
直接末尾付近を指定してください。各ファイルの現在の行数は以下の通りです
（offsetにはこの値から10〜15引いた行番号を指定すれば十分です）:
${lineCountBlock}

【効率化のお願い】
- 各対象ファイルはEditの前に1回読めば十分です。書いた内容を確認するための再読み込みは
  不要（Edit/Writeが失敗すればツール自体がエラーを返します）。
- 追記箇所を探すための試行錯誤や再確認を繰り返さず、目安10ターン以内で完了させてください。

作業が終わったら、何を追記したか（なければ「追記なし」)を1行で報告して終了してください。`;
}

export function collectDialogs(chunksDir, chunkFiles) {
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

// import --dry-run が invalid（<ctrl_N/>の欠落・過剰など）を出したとき、1回だけ自動修復を
// 依頼するためのファイル名。chunk_NNNN.json のパターンに一致しない名前にしておく
// （runExtract の再開判定などで chunk と誤認されないように）。
export const REPAIR_FILE_NAME = '_repair.json';

// toBatchData.js import --dry-run の標準出力から invalid entry の一覧を拾い、chunk本体から
// 原文・現訳文・タグ値を添えて返す。"unknown key"（UUID書き写し誤り）はタグ修正では
// 直せないので対象外。import は先頭20件しか列挙しないため、21件目以降は拾えない
// （修復後の再検証で残っていれば従来通り止まる）。
export function collectInvalidEntries(chunksDir, importOutput) {
  const items = [];
  const re = /^\s+([0-9a-f-]{36}) \((chunk_\d+\.json)\): (.+)$/gm;
  for (const m of importOutput.matchAll(re)) {
    const [, key, file, problems] = m;
    if (problems.includes('unknown key')) continue;
    const e = chunkEntriesAt(path.join(chunksDir, file)).find((x) => x.key === key);
    if (!e || e.translation == null) continue;
    items.push({ key, file, problems, text: e.text, translation: e.translation, tags: e.tags ?? e.controlTags ?? [] });
  }
  return items;
}

// 対象entryの原文・現訳文をプロンプトに直接埋め込むので、Claudeは数百KBのchunkを
// Readする必要がない（Writeを1回するだけで済む）。
export function buildRepairPrompt(chunksDirRel, items) {
  const list = items
    .map((it) => JSON.stringify({ key: it.key, problems: it.problems, text: it.text, tags: it.tags, translation: it.translation }, null, 1))
    .join('\n');
  return `翻訳済みchunkのうち、制御タグ（<ctrl_N/>）の整合チェックに失敗したentryの修正だけをお願いします。

【対象entry】（text=英語原文、tags=各<ctrl_N/>の中身。<ctrl_0/>がtags[0]に対応。translation=現在の訳文、problems=検出された問題）
${list}

【やること】
1. 各entryについて、text に含まれる <ctrl_N/> がすべて translation にちょうど1回ずつ現れるよう
   translation を直す。多くの場合、原文でタグに囲まれた語（tagsの {g|Encyclopedia:...} が示す用語）の
   訳語を、対応する <ctrl_N/>〜<ctrl_N+1/> で囲めばよい（例: "<ctrl_2/>DC<ctrl_3/>"）。
   - 訳文の言い回しは変えず、タグの挿入・削除・位置修正だけの最小限の変更にとどめること。
   - 原文にないタグ（text に存在しない <ctrl_N/>）が translation にあれば取り除く。
   - <ctrl_N/> トークン自体は一字一句変えない。
2. 結果を新規ファイル ${chunksDirRel}/${REPAIR_FILE_NAME} に
   { "<key>": "<修正後の訳文>", ... } というフラットなJSONとして、Writeツールで1回だけ書き込む。
   上記の全entryを含めること。
3. それ以外のファイル（chunk本体を含む）は一切読まない・編集しないこと。質問・確認もしないこと
   （非対話の自動実行環境なので誰も返答できない）。Bash等の実行は不可能なので試みないこと。

終わったら「何件直したか」を1行で報告して終了してください。`;
}

// buildRepairPromptがWriteした修正訳を、対象entryにだけ上書きで反映する（mergeTranslationsと
// 違い、既に埋まっているtranslationを置き換えるのが目的）。反映後、中間ファイルは削除する。
export function applyRepairs(chunksDir, items) {
  const repairPath = path.join(chunksDir, REPAIR_FILE_NAME);
  if (!fs.existsSync(repairPath)) return { applied: 0, hasFile: false };
  const repairs = JSON.parse(fs.readFileSync(repairPath, 'utf8'));
  let applied = 0;
  for (const file of [...new Set(items.map((it) => it.file))]) {
    const keys = new Set(items.filter((it) => it.file === file).map((it) => it.key));
    const chunkPath = path.join(chunksDir, file);
    const chunkObj = JSON.parse(fs.readFileSync(chunkPath, 'utf8'));
    const entries = Array.isArray(chunkObj.entries) ? chunkObj.entries : (chunkObj.blocks ?? []).flatMap((b) => b.entries ?? []);
    for (const e of entries) {
      const t = repairs[e.key];
      if (keys.has(e.key) && typeof t === 'string' && t.trim() !== '') {
        e.translation = t;
        applied++;
      }
    }
    fs.writeFileSync(chunkPath, JSON.stringify(chunkObj, null, 2) + '\n');
  }
  fs.rmSync(repairPath);
  return { applied, hasFile: true };
}
