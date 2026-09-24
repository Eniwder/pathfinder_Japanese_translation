// runBlindCompare.mjs の出力から、原文/訳A/訳B を並べた compare.md を生成する。
// 使い方: node experiments/buildCompareMd.mjs --dir=lang/experiments/compare_2026-09-24_round105 --a=opus --b=sonnet
import fs from 'node:fs';
import path from 'node:path';
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')));
const dir = path.resolve(args.dir), A = args.a, B = args.b;
const files = fs.readdirSync(path.join(dir, 'source')).filter((f) => /^chunk_\d+\.json$/.test(f)).sort();
const load = (d, f) => JSON.parse(fs.readFileSync(path.join(dir, d, f), 'utf8'));
const ents = (c) => c.entries ?? c.blocks.flatMap((b) => b.blocks ? [] : (b.entries ?? []).map((e) => ({ ...e, dialog: b.dialog, speaker: e.speaker ?? b.speaker })));
const commas = (s) => (s.match(/、/g) || []).length;
const stat = { total: 0, same: 0, diff: 0, lenA: 0, lenB: 0, commaA: 0, commaB: 0 };
let out = '', diffOut = '';
for (const f of files) {
  const src = ents(load('source', f)), a = Object.fromEntries(ents(load(A, f)).map((e) => [e.key, e.translation])), b = Object.fromEntries(ents(load(B, f)).map((e) => [e.key, e.translation]));
  diffOut += `\n## ${f}\n`;
  src.forEach((e, i) => {
    const ta = a[e.key] ?? '', tb = b[e.key] ?? '';
    stat.total++; stat.lenA += ta.length; stat.lenB += tb.length; stat.commaA += commas(ta); stat.commaB += commas(tb);
    if (ta === tb) { stat.same++; return; }
    stat.diff++;
    diffOut += `\n### ${f.slice(6, 10)}-${String(i).padStart(3, '0')} ${e.dialog ?? ''} / ${e.speaker ?? '(none)'}\n- EN: ${e.text}\n- ${A}: ${ta}\n- ${B}: ${tb}\n`;
  });
}
out = `# ${A} vs ${B}\n\n- 総件数 ${stat.total} / 完全一致 ${stat.same} / 相違 ${stat.diff}\n- 総文字数 ${A}: ${stat.lenA} / ${B}: ${stat.lenB}\n- 読点(、)総数 ${A}: ${stat.commaA} / ${B}: ${stat.commaB}\n- 相違のあるentryのみ掲載（順序は元の会話順）\n${diffOut}`;
fs.writeFileSync(path.join(dir, 'compare.md'), out);
console.log(JSON.stringify(stat));
