// 修正候補ファイル（[{key, before, after, cat, ...}]）を訳文JSONに適用する。
// 現訳が before と一致するものだけ書き換え、ズレているものはスキップして報告する。
//   node helper/applyFixCandidates.mjs <candidates.json> [--target=./lang/zhCN.json] [--skip-cat=a,b] [--dry-run]
import fs from 'fs';

const args = process.argv.slice(2);
const file = args.find(a => !a.startsWith('--'));
const opt = (name, def) => (args.find(a => a.startsWith(`--${name}=`)) || '').split('=').slice(1).join('=') || def;
const target = opt('target', './lang/zhCN.json');
const skipCats = new Set(opt('skip-cat', '').split(',').filter(Boolean));
const dryRun = args.includes('--dry-run');
if (!file) { console.error('Usage: node helper/applyFixCandidates.mjs <candidates.json> [--target=PATH] [--skip-cat=a,b] [--dry-run]'); process.exit(1); }

const candidates = JSON.parse(fs.readFileSync(file, 'utf8'));
const json = JSON.parse(fs.readFileSync(target, 'utf8'));
const strings = json.strings;
let applied = 0, skippedCat = 0;
const mismatched = [];
for (const c of candidates) {
  if (skipCats.has(c.cat)) { skippedCat++; continue; }
  if (strings[c.key] !== c.before) { mismatched.push(c.key); continue; }
  strings[c.key] = c.after;
  applied++;
}
console.log({ target, applied, skippedCat, mismatched: mismatched.length, dryRun });
if (mismatched.length) console.log('before不一致（未適用）:', mismatched.slice(0, 20).join(', '), mismatched.length > 20 ? '...' : '');
if (!dryRun && applied) {
  fs.copyFileSync(target, `${target}.bak`);
  fs.writeFileSync(target, JSON.stringify(json, null, 2));
  console.log(`書き込み完了（バックアップ: ${target}.bak）`);
}
