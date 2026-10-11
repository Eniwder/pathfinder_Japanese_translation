import fs from 'fs';
const a = JSON.parse(fs.readFileSync('./all.json','utf8'));
const manual = JSON.parse(fs.readFileSync('./manual_p5.json','utf8'));
const out = {};
const add = (k8, pairs) => { out[k8] = out[k8] || {r:[]}; for (const p of pairs) if (!out[k8].r.some(x=>x[0]===p[0])) out[k8].r.push(p); };
const byK = k => a.find(e=>e.key.startsWith(k));
const tagsOrd = s => (s.match(/<ctrl_\d+\/>/g)||[]).join(',');
const stat = {};
for (const e of a) {
  const t = e.translation || ''; const k8 = e.key.slice(0,8); const pairs = [];
  if (/cultist/i.test(e.text||'')) for (const w of ['カルト教徒','教団員','邪教徒']) if (t.includes(w)) { pairs.push([w,'カルト信者']); stat[w]=(stat[w]||0)+1; }
  for (const [w,n] of [['陽光の貴婦人','太陽の貴婦人'],['墓場の貴婦人','墓所の貴婦人'],['墓の貴婦人','墓所の貴婦人'],['ミアミール姉妹','シスター・ミアミール'],['ミアミール修道女','シスター・ミアミール'],['プルラの落日','プルラの滝']])
    if (t.includes(w)) { pairs.push([w,n]); stat[w]=(stat[w]||0)+1; }
  if (pairs.length) add(k8, pairs);
}
const herald = '072cdfd5 390d9b5b 10b7f3c4 878fbdd8 3c1ac41d 1ac9f1a0 3612d22d 775ae906 e11d6885 9f0683b2 d3b2d25b b39b64c1 5e87889f e7c9d1a8 b04cda25 a1177977 16ac7081 721cb0ca 660216a7 b01fb9d5 726f1159 473ccd4e 20c0526f 03f80591 90155fd8 f4b256eb bb1716ed 5e01eb98 ad1f2d49 f9d97084'.split(' ');
for (const k of herald) { const t = byK(k).translation; const p=[]; if (t.includes('使徒')) p.push(['使徒','使者']); if (t.includes('ヘラルド')) p.push(['ヘラルド','使者']); add(k,p); }
const socoth = '12d2f359 40766db1 97fc711b ad9e45a2 00b26a18 5c3a39e7 b888b1e6 afb39c2d 0c7d6116 15a7426a ce47c5f0 ef9b01a0 a3f5c1ab d8a0067d f7f56746 14a2bd65 e4c84561 ad9b8a2b 1d8077b0 d372b595 b2e4fc4e'.split(' ');
for (const k of socoth) { const t = byK(k).translation; const p=[]; if (t.includes('私')) p.push(['私','僕']); if (t.includes('お前')) p.push(['お前','君']); let tt=t.split('私').join('僕').split('お前').join('君'); for (const [o,n] of [['せねばならん','しなきゃいけない'],['のだぞ','んだよ'],['ねばならん','なきゃいけない'],['だぞ','だよ'],['ないぞ','ないよ']]) if (tt.includes(o)) { p.push([o,n]); tt=tt.split(o).join(n); } if (p.length) add(k,p); }
for (const k of ['92c5f916','2f1fed75','c4d8e1b5','8c201cdb','a8d06942','e93050e3']) { const t = byK(k).translation; out[k] = {t: t.slice(1,-1)}; }
for (const [k,f] of Object.entries(manual)) {
  if (f.t) { out[k] = {t:f.t}; continue; }
  if (out[k]?.t) { console.log('CONFLICT t+r', k); continue; }
  add(k, f.r);
}
// split reordered-tag entries (apply.mjs rejects them)
const direct = {}, normal = {};
for (const [k,f] of Object.entries(out)) { const e = byK(k); if (f.r && !f.r.length) continue; if (tagsOrd(e.translation)!==tagsOrd(e.text)) direct[k]=f; else normal[k]=f; }
fs.writeFileSync('fixes_p5.json', JSON.stringify(normal,null,1));
fs.writeFileSync('fixes_p5_direct.json', JSON.stringify(direct,null,1));
console.log(stat, 'normal', Object.keys(normal).length, 'direct', Object.keys(direct).length, Object.keys(direct).join(' '));
