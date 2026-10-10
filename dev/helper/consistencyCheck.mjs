// chunks_review（v2訳文）の整合性チェック。集計して結果だけを表示・保存する（訳文は書き換えない）。
//
//   node --max-old-space-size=8192 helper/consistencyCheck.mjs <command> [args]
//
//   terms              glossary訳語と1〜3文字違いのカタカナ語のうち、原文に該当用語があるものを列挙
//                      （v2CharacterNotes.md / speakerProfiles.json 内の固有名も照合）
//   speakers           チャンクの話者名とdialogueGraph上の実blueprintの食い違い、speakerAliasesの参照先
//   barks [regex]      バーク（Barkobanters・Sound/Barks）の話者をblueprintから特定し、話者ごとに
//                      本編会話とバークの一人称・二人称・文体を比較（regex で話者を絞り込み）
//   english            訳文に残った4文字以上の英単語
//   verify             chunks_reviewから一時訳文を組んでverify.jsにかける（同一キーの重複も検出）
//   names              glossaryに無い固有名の表記ゆれ候補（同じ英語名に近い綴りのカタカナが2通り）
//   kana               長音・中黒・ヴ／バ・小書きだけが違うカタカナ表記ゆれ
//   quotes             台詞の「」と原文の引用符の対応（付け忘れ・付けすぎ・引用部分の訳抜け候補）
//   gloss              glossaryの固有名が訳でまとまって別表記になっているもの、glossary内の訳語の食い違い
//   tone               話者の多数派と逆の口調（丁寧語／常体）でほぼ統一されている会話（会話をまたいだ口調のずれ）
//   address            speakerProfilesの指揮官への二人称と、選択肢直後の返答で実際に使われている二人称の食い違い
//   dup                同じ原文（40字以上）なのに訳が違うもの（地の文は統一候補、台詞は参考）
//   nameref            名前entry（呪文・ユニット・人名など）の訳が本文で別表記になっているもの
//
// 出力は test/consistency/ に保存する。dev/ をカレントにして実行すること。
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const REVIEW = './lang/chunks_review';
const OUT = './test/consistency';
const BLUEPRINTS = '../blueprints';
const KATAKANA = /[ァ-ヺー][ァ-ヺー・＝]*[ァ-ヺー]/g;

// ---- 共通 ----

// import と同じ順（round名・ファイル名の昇順）でチャンクを列挙する。新旧どちらの形式も平坦化。
function* chunkEntries() {
  for (const round of fs.readdirSync(REVIEW).sort()) {
    const dir = path.join(REVIEW, round);
    if (!fs.statSync(dir).isDirectory()) continue;
    for (const file of fs.readdirSync(dir).sort()) {
      if (!/^chunk_.*\.json$/.test(file)) continue;
      const chunk = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
      const blocks = Array.isArray(chunk.entries) ? chunk.entries.map(entry => ({ dialog: entry.dialog, entries: [entry] })) : chunk.blocks ?? [];
      for (const block of blocks) for (const entry of block.entries) yield { round, file, dialog: block.dialog ?? null, entry };
    }
  }
}

function readJson(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function glossaryEntries() { const data = readJson('./res/glossary.json'); return data.glossary ?? data; }
function save(name, data) { const file = path.join(OUT, name); fs.writeFileSync(file, JSON.stringify(data, null, 1) + '\n'); console.log(`-> ${file}`); }
function countBy(items, key) { const counts = {}; for (const item of items) counts[key(item)] = (counts[key(item)] ?? 0) + 1; return counts; }

function levenshtein(a, b) {
  let previous = [...Array(b.length + 1).keys()];
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    previous = current;
  }
  return previous[b.length];
}

// 訳語→その訳語を持つglossary英語のマップ（中黒・＝で区切った部分語も含める）
function glossaryTargets() {
  const sources = new Map();
  for (const entry of glossaryEntries()) {
    if (typeof entry.target !== 'string') continue;
    for (const word of entry.target.match(KATAKANA) ?? []) for (const part of [word, ...word.split(/[・＝]/)]) {
      if (part.length < 2) continue;
      if (!sources.has(part)) sources.set(part, new Set());
      sources.get(part).add(entry.source);
    }
  }
  return sources;
}

function nearestTarget(word, targets, minTargetCount = () => true) {
  const threshold = word.length <= 3 ? 1 : word.length <= 6 ? 2 : 3;
  let best = null;
  for (const target of targets) {
    if (Math.abs(target.length - word.length) > threshold || target.includes(word) || word.includes(target) || !minTargetCount(target)) continue;
    const distance = levenshtein(word, target);
    if (distance > 0 && distance <= threshold && (!best || distance < best.distance)) best = { target, distance };
  }
  return best;
}

// ---- terms ----

function terms() {
  const sources = glossaryTargets();
  const frequency = new Map();
  const occurrences = new Map();
  for (const { entry } of chunkEntries()) {
    if (!entry.translation) continue;
    const words = new Set();
    for (const word of entry.translation.match(KATAKANA) ?? []) { words.add(word); for (const part of word.split(/[・＝]/)) if (part.length >= 2) words.add(part); }
    for (const word of words) {
      frequency.set(word, (frequency.get(word) ?? 0) + 1);
      if (!occurrences.has(word)) occurrences.set(word, []);
      occurrences.get(word).push(entry.text.toLowerCase());
    }
  }
  // 変種が出る訳文の原文に、近い訳語のglossary英語（の単語）が半数以上含まれるものだけ残す
  const results = [];
  for (const [word, count] of frequency) {
    if (sources.has(word)) continue;
    const near = nearestTarget(word, sources.keys(), target => (frequency.get(target) ?? 0) >= 3);
    if (!near) continue;
    const texts = occurrences.get(word);
    let best = { hit: 0, english: '' };
    for (const source of sources.get(near.target)) for (const english of source.toLowerCase().split(/[^a-z']+/).filter(w => w.length >= 3 && !['the', 'of', 'and'].includes(w))) {
      const hit = texts.filter(text => new RegExp(`(?<![a-z])${english}`).test(text)).length;
      if (hit > best.hit) best = { hit, english };
    }
    if (best.hit && best.hit / texts.length >= 0.5) results.push({ variant: word, count, target: near.target, targetCount: frequency.get(near.target), english: best.english, hit: best.hit });
  }
  results.sort((a, b) => b.hit - a.hit);
  for (const r of results.slice(0, 60)) console.log(`${r.hit}/${r.count}\t${r.variant} → ${r.target} (${r.targetCount})\t[${r.english}]`);

  // 話者メモ・プロファイル内の固有名
  const notes = [];
  for (const file of ['./res/v2CharacterNotes.md', './res/speakerProfiles.json']) {
    const words = new Set((fs.readFileSync(file, 'utf8').match(KATAKANA) ?? []).flatMap(word => [word, ...word.split(/[・＝]/)]).filter(word => word.length >= 3 && !sources.has(word)));
    for (const word of words) { const near = nearestTarget(word, sources.keys()); if (near) notes.push({ file, word, target: near.target }); }
  }
  console.log(`\nnotes/profiles: ${notes.length} candidates (一般語も混ざるので目視で確認)`);
  save('terms.json', { variants: results, notes });
}

// ---- speakers ----

function loadGraphSpeakers() {
  const graph = readJson('./res/dialogueGraph.json');
  const byKey = new Map();
  for (const node of graph.nodes ?? []) if (node.textKey && node.speaker && !byKey.has(node.textKey)) byKey.set(node.textKey, { speaker: node.speaker, speakerId: node.speakerId, source: node.speakerSource });
  return byKey;
}

function normalizeSpeaker(name) { return String(name).replace(/_(Companion|npc|Player|Q\d+|DrezenCapital|ForDuel)$/i, '').replace(/[^a-z0-9]/gi, '').toLowerCase(); }

function speakers() {
  const graph = loadGraphSpeakers();
  const mismatches = {};
  for (const { entry } of chunkEntries()) {
    const node = graph.get(entry.key);
    if (!node || !entry.speaker) continue;
    const a = normalizeSpeaker(entry.speaker), b = normalizeSpeaker(node.speaker);
    if (a === b || a.includes(b) || b.includes(a)) continue;
    const label = `${entry.speaker} <= ${node.speaker}`;
    mismatches[label] = (mismatches[label] ?? 0) + 1;
  }
  const sorted = Object.entries(mismatches).sort((x, y) => y[1] - x[1]);
  console.log('チャンクの話者名 <= blueprint上の話者（綴り違い・正当な別ユニットも含む）');
  for (const [label, count] of sorted) console.log(`${count}\t${label}`);

  const profiles = readJson('./res/speakerProfiles.json');
  const aliases = profiles.speakerAliases ?? profiles.characters?.speakerAliases ?? {};
  const unitFiles = new Map();
  walk(path.join(BLUEPRINTS, 'Units'), file => { const id = fs.readFileSync(file, 'utf8').match(/"AssetId":\s*"([0-9a-f]+)"/)?.[1]; if (id) unitFiles.set(id, path.basename(file, '.jbp')); });
  console.log('\nspeakerAliases（blueprint ID → profile）');
  for (const [id, profile] of Object.entries(aliases)) console.log(`${profile}\t<= ${unitFiles.get(id) ?? '(not found)'}\t${id}`);
  save('speakers.json', { mismatches: Object.fromEntries(sorted), aliases: Object.fromEntries(Object.entries(aliases).map(([id, profile]) => [id, { profile, unit: unitFiles.get(id) ?? null }])) });
}

function walk(dir, callback) {
  if (!fs.existsSync(dir)) return;
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, item.name);
    if (item.isDirectory()) walk(file, callback); else if (item.name.endsWith('.jbp')) callback(file);
  }
}

// ---- barks ----

// バーク／掛け合いのキー → 話者ユニット名。m_SpeakerType が Finnean の場合は喋る武器フィニアン本人。
function buildBarkSpeakers() {
  const units = new Map();
  walk(path.join(BLUEPRINTS, 'Units'), file => { const id = fs.readFileSync(file, 'utf8').match(/"AssetId":\s*"([0-9a-f]+)"/)?.[1]; if (id) units.set(id, path.basename(file, '.jbp')); });
  const unitName = (ref, speakerType) => speakerType === 'Finnean' ? 'Finnean_Companion' : (units.get(String(ref ?? '').replace('!bp_', '')) ?? ref);
  const map = {};
  walk(path.join(BLUEPRINTS, 'World/Dialogs/Barkobanters'), file => {
    const data = readJson(file).Data;
    for (const phrase of data.FirstPhrase ?? []) if (phrase?.m_Key) map[phrase.m_Key] = unitName(data.m_Unit, data.m_SpeakerType);
    for (const response of data.Responses ?? []) if (response.Response?.m_Key) map[response.Response.m_Key] = unitName(response.m_Unit, response.m_SpeakerType);
  });
  walk(path.join(BLUEPRINTS, 'Sound/Barks'), file => { for (const match of fs.readFileSync(file, 'utf8').matchAll(/"m_Key":\s*"([0-9a-f-]{36})"/g)) map[match[1]] ??= 'asks:' + path.basename(file, '.jbp'); });
  return map;
}

const PRONOUNS = { 俺: /俺/g, 僕: /僕/g, 私: /私/g, わし: /わし/g, あたし: /あたし/g, おいら: /おいら/g, お前: /お前|おまえ/g, あんた: /あんた/g, 君: /君(?!主|臨)/g, あなた: /あなた/g, 丁寧語: /です|ます/g, 女性語: /わ[。！？」]|のよ(?!う)|かしら/g };

function barks(filter = '.') {
  const barkSpeakers = buildBarkSpeakers();
  const graph = loadGraphSpeakers();
  const pattern = new RegExp(filter, 'i');
  const tally = {};
  const lines = [];
  for (const { round, entry } of chunkEntries()) {
    if (!entry.translation) continue;
    const bark = barkSpeakers[entry.key];
    const speaker = bark ?? graph.get(entry.key)?.speaker;
    if (!speaker || !pattern.test(speaker)) continue;
    const name = normalizeSpeaker(speaker.replace(/^asks:/, ''));
    const kind = bark ? 'bark' : 'dialogue';
    const counts = ((tally[name] ??= { dialogue: { lines: 0 }, bark: { lines: 0 } })[kind]);
    counts.lines++;
    const spoken = entry.translation.replace(/<ctrl_\d+\/>[^<]*<ctrl_\d+\/>/g, '');
    for (const [label, regex] of Object.entries(PRONOUNS)) { const n = (spoken.match(regex) ?? []).length; if (n) counts[label] = (counts[label] ?? 0) + n; }
    if (bark) lines.push({ round, key: entry.key, speaker, text: entry.text, translation: entry.translation });
  }
  for (const [name, counts] of Object.entries(tally)) {
    if (!counts.bark.lines) continue;
    console.log(`${name}\n  dialogue ${JSON.stringify(counts.dialogue)}\n  bark     ${JSON.stringify(counts.bark)}`);
  }
  save('barkSpeakers.json', barkSpeakers);
  save('barks.json', { tally, lines });
}

// ---- english ----

function english() {
  const rows = [];
  const counts = {};
  for (const { round, dialog, entry } of chunkEntries()) {
    if (!entry.translation) continue;
    const words = entry.translation.replace(/<ctrl_\d+\/>/g, ' ').replace(/\{[^}]*\}|<[^>]*>/g, ' ').match(/[A-Za-z][A-Za-z'’-]{3,}/g);
    if (!words) continue;
    rows.push({ round, dialog, key: entry.key, words, text: entry.text.slice(0, 120), translation: entry.translation.slice(0, 160) });
    for (const word of words) counts[word] = (counts[word] ?? 0) + 1;
  }
  // クレジット（英単語が多いもの）を除いた候補を表示
  const candidates = rows.filter(row => row.words.length <= 6);
  console.log(`entries with English: ${rows.length}, short candidates: ${candidates.length}`);
  for (const row of candidates.slice(0, 80)) console.log(`${row.round}\t[${row.words.join(',')}]\t${row.translation.replace(/\n/g, '⏎').slice(0, 80)}`);
  save('english.json', { counts, rows });
}

// ---- verify ----

function verify() {
  const english = readJson('./lang/enGB.json').strings;
  const translations = {}, where = {}, duplicates = [];
  for (const { round, file, entry } of chunkEntries()) {
    if (entry.translation == null) continue;
    const tags = (entry.tags ?? entry.controlTags ?? []).map(tag => (typeof tag === 'string' ? tag : tag.value));
    const restored = tags.reduce((text, value, index) => text.replaceAll(`<ctrl_${index}/>`, value), entry.translation);
    if (translations[entry.key] !== undefined && translations[entry.key] !== restored) duplicates.push({ key: entry.key, first: where[entry.key], second: `${round}/${file}` });
    translations[entry.key] = restored;
    where[entry.key] = `${round}/${file}`;
  }
  const source = Object.fromEntries(Object.keys(translations).filter(key => english[key] !== undefined).map(key => [key, english[key]]));
  fs.writeFileSync(path.join(OUT, 'verify-source.json'), JSON.stringify({ strings: source }));
  fs.writeFileSync(path.join(OUT, 'verify-translation.json'), JSON.stringify({ strings: translations }));
  console.log(`keys: ${Object.keys(translations).length}, 同一キーで訳が異なる重複: ${duplicates.length}`);
  for (const [pair, count] of Object.entries(countBy(duplicates, d => `${d.first.split('/')[0]} vs ${d.second.split('/')[0]}`))) console.log(`  ${count}\t${pair}`);
  save('duplicates.json', duplicates);
  spawnSync(process.execPath, ['./verify.js', `--source=${OUT}/verify-source.json`, `--translation=${OUT}/verify-translation.json`, `--report=${OUT}/verify-report.json`], { stdio: 'inherit' });
}

// ---- names ----

// glossaryに無い英語の固有名（大文字語）ごとに、その語を含む訳文で一緒に出るカタカナ語を数え、
// 同じ名前に綴りの近い2通りのカタカナが対応しているもの（＝表記ゆれ候補）を列挙する
const NAME_STOPWORDS = new Set('The A An I You He She It We They This That What Who How Why When Where Yes No Oh Well But And Or So If Then There Here My Your His Her Our Their Not Do Did Is Are Was Were Be Have Has Had Will Would Can Could Should Shall May Might Must Let Lady Lord Sir Commander Queen King Mother Father Brother Sister God Goddess Master Mistress Choice Attack Persuasion Intimidate Bluff Leave Say Ask Tell Give Take Go Come Look See Please Thank Thanks Good Great All Every Some Any One Two Three Now Just Even Still Maybe Perhaps Of In On At To For With From By As Hey Ah Hmm Very Too Also Only First Last Next New Old Fine Right Wait Stop Enough Indeed Really Sure Kill Show Use Agree Wow Hello Goodbye Farewell Mythic Demon Demons Abyss Golarion Crusade Crusaders'.split(' '));

function names() {
  const known = new Set(glossaryEntries().map(entry => String(entry.source).toLowerCase()));
  const byWord = {};
  for (const { entry } of chunkEntries()) {
    if (!entry.translation) continue;
    const words = new Set((entry.text.replace(/<ctrl_\d+\/>/g, ' ').match(/\b[A-Z][a-z]{3,}\b/g) ?? []).filter(word => !NAME_STOPWORDS.has(word) && !known.has(word.toLowerCase())));
    if (!words.size) continue;
    const katakana = new Set(entry.translation.match(KATAKANA) ?? []);
    for (const word of words) {
      const stat = (byWord[word] ??= { count: 0, katakana: {} });
      stat.count++;
      for (const k of katakana) stat.katakana[k] = (stat.katakana[k] ?? 0) + 1;
    }
  }
  const results = [];
  for (const [word, stat] of Object.entries(byWord)) {
    if (stat.count < 4) continue;
    const candidates = Object.entries(stat.katakana).filter(([, n]) => n >= 2 && n / stat.count >= 0.15).sort((a, b) => b[1] - a[1]);
    for (let i = 0; i < candidates.length; i++) for (let j = i + 1; j < candidates.length; j++) {
      const [a, na] = candidates[i], [b, nb] = candidates[j];
      if (a.includes(b) || b.includes(a)) continue;
      const distance = levenshtein(a, b);
      if (distance > 0 && distance <= Math.max(1, Math.floor(Math.min(a.length, b.length) / 3)) && na + nb >= stat.count * 0.6) results.push({ word, count: stat.count, a, na, b, nb });
    }
  }
  results.sort((x, y) => y.count - x.count);
  for (const r of results) console.log(`${r.word}(${r.count})\t${r.a}(${r.na}) / ${r.b}(${r.nb})`);
  save('names.json', results);
}

// ---- kana ----

// カタカナ語を正規化（長音・中黒・促音を除去、ヴ系→バ行、小書き→大書き）し、
// 同じ正規形に2通り以上の表記がある語を列挙する（例：パーティ／パーティー、ソーサラーレベル／ソーサラー・レベル）
function kana() {
  const normalize = word => word.replace(/[ー・ッ]/g, '').replace(/ヴァ/g, 'バ').replace(/ヴィ/g, 'ビ').replace(/ヴェ/g, 'ベ').replace(/ヴォ/g, 'ボ').replace(/ヴ/g, 'ブ')
    .replace(/[ァィゥェォ]/g, c => ({ ァ: 'ア', ィ: 'イ', ゥ: 'ウ', ェ: 'エ', ォ: 'オ' })[c]);
  const frequency = {};
  for (const { entry } of chunkEntries()) for (const word of entry.translation?.match(KATAKANA) ?? []) if (word.length >= 3) frequency[word] = (frequency[word] ?? 0) + 1;
  const groups = {};
  for (const [word, count] of Object.entries(frequency)) (groups[normalize(word)] ??= []).push([word, count]);
  const results = Object.values(groups).filter(list => list.length > 1).map(list => list.sort((a, b) => b[1] - a[1])).filter(list => list[1][1] >= 2).sort((a, b) => b[1][1] - a[1][1]);
  console.log(`groups: ${results.length}（リッチ／リーチのような別語も混ざるので目視で確認）`);
  for (const list of results) console.log(list.map(([word, count]) => `${word}(${count})`).join(' / '));
  save('kana.json', results);
}

// ---- quotes ----

// 台詞の「」が原文の引用符と対応しているか（translationGuide：原文 "..." → 「」、原文に無ければ付けない）
//   missing   原文が全体 "..." なのに訳に「」が無い（『』で代用しているものを含む）
//   extra     原文に引用符が無いのに訳が行全体・[行動] を「」で囲んでいる
//   fewer     原文の "..." の数より訳の「」『』が少ない（引用部分の訳抜け候補）
function quotes() {
  const plain = s => String(s ?? '').replace(/<ctrl_\d+\/>/g, '').replace(/<[^>]+>/g, '').trim();
  const results = { missing: [], extra: [], fewer: [] };
  for (const { round, entry } of chunkEntries()) {
    const en = plain(entry.text), ja = plain(entry.translation);
    if (!en || !ja) continue;
    const quotesEn = (en.match(/["“”]/g) ?? []).length, bracketsJa = (ja.match(/[「」]/g) ?? []).length;
    const item = { round, key: entry.key, en: en.slice(0, 120), ja: ja.slice(0, 100) };
    if (/^(\[[^\]]*\]\s*)?["“][^"“”]*["”]$/.test(en) && bracketsJa === 0 && !/著|より抜粋/.test(ja)) results.missing.push(item);
    if (quotesEn === 0 && !/[『「]/.test(en) && (/「\[[^\]]*\]」/.test(ja) || /^(\[[^\]]*\])?「[^「」]*」$/.test(ja))) results.extra.push(item);
    const segmentsEn = Math.floor(quotesEn / 2), segmentsJa = (ja.match(/[「『]/g) ?? []).length;
    if (segmentsEn >= 2 && segmentsJa < segmentsEn) results.fewer.push(item);
  }
  for (const [kind, list] of Object.entries(results)) {
    console.log(`${kind}: ${list.length}`);
    for (const r of list.slice(0, 10)) console.log(`  ${r.round} ${r.key}\n    EN: ${r.en}\n    JA: ${r.ja}`);
  }
  save('quotes.json', results);
}

// ---- gloss ----

// glossaryの固有名（人名・地名等のcategory、または大文字始まりの複数語）について、原文にその語があるのに
// 訳に訳語が無い割合が高いものを列挙する（訳がまとまって別表記に流れている＝glossaryか訳のどちらかを直す候補）。
// 同じsourceで訳語が食い違う重複項目も出す。
function gloss() {
  const plain = s => String(s ?? '').replace(/<ctrl_\d+\/>/g, '');
  const squash = s => s.replace(/[・＝\s]/g, '');
  const escape = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const PROPER = /^(Location|Person|Character|Deity|Organization|Faction|Place|Creature|Demon|Companion)$/i;
  const list = glossaryEntries();
  const bySource = {};
  for (const g of list) (bySource[g.source.toLowerCase()] ??= new Set()).add(g.target);
  const conflicts = Object.entries(bySource).filter(([, targets]) => targets.size > 1).map(([source, targets]) => ({ source, targets: [...targets] }));
  const terms = list.filter(g => g.source.length >= 4 && (PROPER.test(g.category ?? '') || /^[A-Z][a-z'’-]+(?: (?:of |the |and )?[A-Z][a-z'’-]+)+$/.test(g.source)))
    .map(g => ({ ...g, re: new RegExp(`\\b${escape(g.source)}s?\\b`, g.caseSensitive ? '' : 'i'), targets: String(g.target).split(/[／/、（）]/).map(s => squash(s.trim())).filter(s => s.length >= 2) }));
  const entries = [...chunkEntries()].map(({ entry }) => ({ en: plain(entry.text), ja: squash(plain(entry.translation)) })).filter(x => x.ja);
  const drift = [];
  for (const g of terms) {
    const hits = entries.filter(x => g.re.test(x.en));
    const miss = hits.filter(x => !g.targets.some(t => x.ja.includes(t)));
    if (hits.length >= 5 && miss.length / hits.length >= 0.3) drift.push({ source: g.source, target: g.target, hits: hits.length, miss: miss.length });
  }
  drift.sort((a, b) => b.miss - a.miss);
  console.log(`conflicting glossary entries: ${conflicts.length}`);
  for (const c of conflicts) console.log(`  ${c.source}: ${c.targets.join(' / ')}`);
  console.log(`terms whose translation drifts (miss >= 30%): ${drift.length}（言い換え・代名詞化も含むので目視で確認）`);
  for (const d of drift) console.log(`  ${d.miss}/${d.hits}\t${d.source} → ${d.target}`);
  save('gloss.json', { conflicts, drift });
}

// ---- tone ----

// 話者ごとに「」内の文末を丁寧語／常体に分類し、話者全体の多数派と逆の口調でほぼ統一されている会話を列挙する
// （同じ会話内の揺れではなく、会話をまたいだ口調のずれ。相手や状況による正当な切り替えも混ざるので目視で確認）
function tone() {
  const graph = loadGraphSpeakers();
  const plain = s => String(s ?? '').replace(/<ctrl_\d+\/>/g, '').replace(/\{mf\|([^|}]*)\|[^}]*\}/g, '$1');
  const POLITE = /(です|ます|ません|でした|ましょう|ください|ございます|でしょう)[かねよ！？…—]*$/;
  const CASUAL = /(だ|だろう|だな|だぞ|のだ|じゃない|ないか|るぞ|たぞ|だった|ろう|ぜ|だよ|だね|わ|のよ|かい|ねえ)[！？…—]*$/;
  const bySpeaker = {};
  for (const { dialog, entry } of chunkEntries()) {
    if (entry.type !== 'Cue' && entry.nodeType !== 'Cue') continue;
    const speaker = graph.get(entry.key)?.speaker ?? entry.speaker;
    if (!speaker || !entry.translation) continue;
    for (const [, quote] of plain(entry.translation).matchAll(/「([^「」]*)」/g)) {
      for (const sentence of quote.split(/(?<=[。！？])/).map(s => s.replace(/。$/, '').trim()).filter(s => s.length >= 6)) {
        const kind = POLITE.test(sentence) ? 'polite' : CASUAL.test(sentence) ? 'casual' : null;
        if (!kind) continue;
        const s = (bySpeaker[speaker] ??= { polite: 0, casual: 0, dialogs: {} });
        s[kind]++;
        const d = (s.dialogs[dialog ?? '?'] ??= { polite: 0, casual: 0, example: '' });
        d[kind]++;
        if (!d.example) d.example = sentence.slice(-30);
      }
    }
  }
  const results = [];
  for (const [speaker, s] of Object.entries(bySpeaker)) {
    const total = s.polite + s.casual, ratio = s.polite / total;
    if (total < 60 || Math.min(ratio, 1 - ratio) > 0.35) continue;
    const majority = ratio >= 0.5 ? 'polite' : 'casual';
    for (const [dialog, d] of Object.entries(s.dialogs)) {
      const n = d.polite + d.casual, r = d.polite / n;
      if (n >= 4 && (majority === 'polite' ? r <= 0.25 : r >= 0.75)) results.push({ speaker, overall: `${Math.round(ratio * 100)}%丁寧(${total})`, dialog, polite: d.polite, casual: d.casual, example: d.example });
    }
  }
  results.sort((a, b) => (b.polite + b.casual) - (a.polite + a.casual));
  console.log(`dialogs whose tone is opposite to the speaker's majority: ${results.length}`);
  for (const r of results) console.log(`  ${r.speaker} [${r.overall}] ${r.dialog} 丁寧${r.polite}/常体${r.casual}  …${r.example}`);
  save('tone.json', results);
}

// ---- address ----

// speakerProfiles の addressingPlayer.commander（指揮官への二人称）と、主人公の選択肢の直後の台詞（＝指揮官への返答）で
// 実際に使われている二人称を突き合わせ、指定外の二人称を使っている台詞を列挙する（他の人物への呼びかけも混ざるので目視で確認）
function address() {
  const graph = loadGraphSpeakers();
  const profiles = readJson('./res/speakerProfiles.json');
  const characters = profiles.characters ?? profiles;
  const PRONOUNS = ['あなた', '君', 'お前', 'あんた', '貴様', '貴方', 'そなた', '貴公', '貴殿', 'お主'];
  const pronounRe = new RegExp(`(?<![ぁ-ん])(${PRONOUNS.join('|')})(?![主臨子たち])`, 'g');
  const expected = {};
  for (const [name, p] of Object.entries(characters)) {
    const term = p?.addressingPlayer?.commander;
    if (typeof term !== 'string') continue;
    const allowed = PRONOUNS.filter(x => term.includes(x) || (p.addressingPlayer.rule ?? '').match(new RegExp(`(?:like|or|「)${x}`)));
    if (allowed.length) expected[normalizeSpeaker(name)] = { name, allowed };
  }
  const results = [];
  let previousType = null;
  for (const { dialog, entry } of chunkEntries()) {
    const afterAnswer = previousType === 'Answer';
    previousType = entry.type ?? entry.nodeType;
    if (!afterAnswer || previousType !== 'Cue' || !entry.translation) continue;
    const speaker = graph.get(entry.key)?.speaker ?? entry.speaker;
    const rule = speaker && expected[normalizeSpeaker(speaker)];
    if (!rule) continue;
    const quotes = (String(entry.translation).replace(/<ctrl_\d+\/>/g, '').match(/「[^」]*」/g) ?? []).join('');
    const used = [...new Set([...quotes.matchAll(pronounRe)].map(m => m[1]))].filter(x => !rule.allowed.includes(x));
    if (used.length) results.push({ speaker, profile: rule.name, allowed: rule.allowed.join('/'), used: used.join('/'), dialog, key: entry.key, ja: quotes.slice(0, 80) });
  }
  console.log(`replies to the Commander using a pronoun the profile does not allow: ${results.length}`);
  for (const r of results) console.log(`  ${r.speaker} [${r.allowed}] 使用:${r.used} ${r.dialog} ${r.key}\n    ${r.ja}`);
  save('address.json', results);
}

// ---- dup ----

// 同じ原文（40字以上）が複数keyにあるのに訳が違うものを列挙する。地の文・説明文は統一候補、
// 台詞（原文が " か [ で始まる）は相手による訳し分けもあるので、読点・空白以外の違いがあるものは参考扱い。
function dup() {
  const plain = s => String(s ?? '').replace(/<ctrl_\d+\/>/g, '');
  const groups = {};
  for (const { round, entry } of chunkEntries()) {
    const en = String(entry.text ?? '').trim();
    if (!entry.translation || plain(en).length < 40) continue;
    (groups[en] ??= []).push({ round, key: entry.key, ja: entry.translation });
  }
  const results = [];
  for (const [en, list] of Object.entries(groups)) {
    const variants = [...new Set(list.map(x => x.ja))];
    if (variants.length < 2) continue;
    const dialog = /^["“\[]/.test(plain(en));
    const punctuationOnly = new Set(variants.map(v => plain(v).replace(/[、，\s]/g, ''))).size === 1;
    results.push({ kind: dialog && !punctuationOnly ? 'dialog' : 'text', en: plain(en).slice(0, 100), variants: variants.map(v => plain(v).slice(0, 100)), keys: list.map(x => x.key) });
  }
  const text = results.filter(r => r.kind === 'text'), dialog = results.filter(r => r.kind === 'dialog');
  console.log(`same source, different translation: ${text.length} 件は統一候補（地の文・説明文・句読点だけの差）, ${dialog.length} 件は台詞（相手による訳し分けの可能性）`);
  for (const r of text) console.log(`  ${r.keys.length}件 ${r.en}\n    ${r.variants.join('\n    ')}`);
  save('dup.json', results);
}

// ---- nameref ----

// 名前 entry（原文がタイトルケースの2〜4語：呪文・特技・ユニット・人名など）の訳が、
// その名前を含む説明文・台詞でも同じ表記で使われているか。半数以上で別表記なら候補として列挙する。
function nameref() {
  const plain = s => String(s ?? '').replace(/<ctrl_\d+\/>/g, '').replace(/<[^>]+>/g, '').trim();
  const squash = s => s.replace(/[・＝\s（）()]/g, '');
  const all = [...chunkEntries()].map(({ entry }) => ({ en: plain(entry.text), ja: plain(entry.translation) })).filter(x => x.en && x.ja);
  const names = {};
  for (const x of all) {
    if (!/^[A-Z][a-z'’-]+(?: (?:of|the|and|from|to|in|on|with|[A-Z][a-z'’-]+|[IVX]+)){1,3}$/.test(x.en) || x.ja.length > 20 || /[。、「」]/.test(x.ja)) continue;
    (names[x.en] ??= {})[x.ja] = (names[x.en][x.ja] ?? 0) + 1;
  }
  const longs = all.filter(x => x.en.length >= 60);
  const results = [];
  for (const [en, variants] of Object.entries(names)) {
    const ja = Object.entries(variants).sort((a, b) => b[1] - a[1])[0][0];
    const re = new RegExp(`\\b${en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
    const hits = longs.filter(x => re.test(x.en));
    const misses = hits.filter(x => !squash(x.ja).includes(squash(ja)));
    if (hits.length >= 3 && misses.length / hits.length >= 0.5) results.push({ en, ja, hits: hits.length, misses: misses.length, examples: misses.slice(0, 2).map(x => x.ja.slice(0, 80)) });
  }
  results.sort((a, b) => b.misses - a.misses);
  console.log(`names whose title translation is not used in text (>=50% of mentions): ${results.length}（人名の省略・言い換え・小文字の一般語も混ざるので目視で確認）`);
  for (const r of results) console.log(`  ${r.misses}/${r.hits}\t${r.en} = ${r.ja}\n    · ${r.examples.join('\n    · ')}`);
  save('nameref.json', results);
}

// ---- main ----

const [command, ...args] = process.argv.slice(2);
const commands = { terms, speakers, barks, english, verify, names, kana, quotes, gloss, tone, address, dup, nameref };
if (!commands[command]) {
  console.log('Usage: node --max-old-space-size=8192 helper/consistencyCheck.mjs <terms|speakers|barks [regex]|english|verify|names|kana|quotes|gloss|tone|address|dup|nameref>');
  process.exit(command ? 1 : 0);
}
fs.mkdirSync(OUT, { recursive: true });
commands[command](...args);
