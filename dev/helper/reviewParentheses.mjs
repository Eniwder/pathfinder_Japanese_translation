import fs from 'node:fs';
import crypto from 'node:crypto';

const root = 'dev/lang/comparison-siratori-20261019/';
const dir = root + 'parentheses/';
fs.mkdirSync(dir, { recursive: true });
const path = 'dev/lang/zhCN.json';
const raw = fs.readFileSync(path, 'utf8');
const current = JSON.parse(raw);
const english = JSON.parse(fs.readFileSync(root + 'en.json', 'utf8')).strings;
const decisions = JSON.parse(fs.readFileSync(root + 'decisions.json', 'utf8'));
const excluded = Object.keys(english).filter(k => english[k].startsWith('This EULA is an agreement between you,') || english[k].startsWith('End user license agreement for use of software titled'));
const candidates = Object.entries(current.strings).filter(([k, v]) => !excluded.includes(k) && /[()（）]/.test(v.replace(/\{[^}]*\}|<[^>]*>/g, ''))).map(([key, translation]) => ({ key, translation, english: english[key], previouslyChanged: !!decisions[key]?.translation }));
fs.writeFileSync(dir + 'candidates.json', JSON.stringify({ excluded, candidates }, null, 2) + '\n');
const changes = [];
function replace(key, from, to, reason) {
  const before = current.strings[key];
  if (!before.includes(from)) throw new Error('Expected text absent: ' + key);
  const after = before.replace(from, to);
  const tokens = s => (s.match(/\{[^}]*\}|<[^>]*>/g) || []).sort();
  const numbers = s => (s.replace(/\{[^}]*\}|<[^>]*>/g, '').match(/\d+/g) || []).sort();
  if (JSON.stringify(tokens(before)) !== JSON.stringify(tokens(after)) || JSON.stringify(numbers(before)) !== JSON.stringify(numbers(after))) throw new Error('Invariant: ' + key);
  current.strings[key] = after;
  changes.push({ key, before, after, reason });
}
replace('830678b1-ccd4-418d-a351-f17a26399303', 'を行える(両方は不可で、{g|Encyclopedia:Full_Round_Action}全ラウンド・アクション{/g}も行えない)。', 'を行える。両方を行うことはできず、{g|Encyclopedia:Full_Round_Action}全ラウンド・アクション{/g}も行えない。', '行えない行動を独立した文で明示。');
replace('d4a288a5-1bdd-4a5c-9601-3e3eb930f12a', '{g|Encyclopedia:Check}判定{/g}（{g|Encyclopedia:Spell_Resistance}呪文抵抗{/g}を破るためのもの）', '{g|Encyclopedia:Spell_Resistance}呪文抵抗{/g}を破るための{g|Encyclopedia:Check}判定{/g}', '判定の対象を前置修飾にする。');
replace('c88bdd30-e447-42e6-bd5c-5d57afd03242', '{g|Encyclopedia:Saving_Throw}頑健セーヴ{/g}（{g|Encyclopedia:DC}DC{/g} 35）', '{g|Encyclopedia:DC}DC{/g} 35の{g|Encyclopedia:Saving_Throw}頑健セーヴ{/g}', 'DCをセーヴの修飾語にする。能力値の列挙の括弧は維持。');
replace('d38a1014-95a4-492d-a95a-015d21021efe', '量だけ回復する（いずれも{g|Encyclopedia:Character_Level}キャラクター・レベル{/g}ごと）：', '量だけ回復する。{g|Encyclopedia:Character_Level}キャラクター・レベル{/g}ごとの回復量は次のとおり：', '表の共通条件を本文にする。');
replace('31e0d684-9254-4ae7-b336-1b9467786f5b', 'バード、パラディン、ソーサラー（およびその他の魅力に頼る術者）は、', 'バード、パラディン、ソーサラーなど、魅力に頼る術者は、', '列挙を例示として文中に統合。');
replace('d3c5bfa8-09a3-4fd7-928b-35e72957122f', 'が1上昇する（術者レベルを上昇させる他の効果と累積する）。', 'が1上昇する。この上昇は術者レベルを上昇させる他の効果と累積する。', '累積条件を独立した文にする。数値上限の括弧は維持。');
replace('8969a45a-f008-4af5-923d-2a0435028de8', 'を得る（他の発生源から得たものと累積する）。', 'を得る。この一時的HPは他の発生源から得たものと累積する。', '累積条件を独立した文にする。数値上限の括弧は維持。');
for (const key of ['d57ebaca-8180-47b2-b102-417e04ceb022', 'a355f640-b3df-4b86-9708-16f06eb69378', 'd1561935-7917-4bfc-810d-da3e93c0fe88']) {
  const before = current.strings[key];
  const after = before.replace('あなたが倒した', 'この島や他の島であなたが倒した').replace('ごとに（この島でも他の島でも）、', 'ごとに、');
  replace(key, before, after, '倒した場所の条件を本文に統合。');
}
if (process.argv.includes('--apply')) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  fs.writeFileSync(dir + 'before-' + stamp + '.json', raw);
  let output = raw;
  for (const c of changes) {
    const from = JSON.stringify(c.key) + ': ' + JSON.stringify(c.before);
    const to = JSON.stringify(c.key) + ': ' + JSON.stringify(c.after);
    if (output.split(from).length !== 2) throw new Error('Nonunique line: ' + c.key);
    output = output.replace(from, to);
  }
  if (fs.readFileSync(path, 'utf8') !== raw) throw new Error('Concurrent modification');
  fs.writeFileSync(path, output);
  fs.writeFileSync(dir + 'review-' + stamp + '.json', JSON.stringify({ sourceSha256: crypto.createHash('sha256').update(raw).digest('hex'), changes }, null, 2) + '\n');
}
console.log(JSON.stringify({ excludedEula: excluded.length, candidates: candidates.length, reviewed: changes.length, changes }, null, 2));
