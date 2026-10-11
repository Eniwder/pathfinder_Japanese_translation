import fs from 'fs'; import path from 'path';
const [,, dumpFile, fixFile, mode] = process.argv;
const dump = fs.readFileSync(dumpFile,'utf8');
const loc = {};
if (dumpFile.endsWith('.json')) for (const e of JSON.parse(dump)) loc[e.key.slice(0,8)] = e.loc;  // all.json を直接渡せる
else for (const m of dump.matchAll(/^\[([0-9a-f]{8})\] .*\| (\S+)$/gm)) loc[m[1]] = m[2];
const fixes = JSON.parse(fs.readFileSync(fixFile,'utf8'));
const conv = s => s.replace(/‹(\d+)›/g,'<ctrl_$1/>');
const tags = s => (s.match(/<ctrl_\d+\/>/g)||[]).join(',');
const files = {}; let ok=0, bad=0;
for (const [k, f] of Object.entries(fixes)) {
  const l = loc[k]; if (!l) { console.log('NOLOC', k); bad++; continue; }
  const p = path.join('./lang/chunks_review', l);
  if (!files[p]) { const raw=fs.readFileSync(p,'utf8'); files[p]={raw, j:JSON.parse(raw)}; }
  let e; for (const b of files[p].j.blocks) for (const x of b.entries) if (x.key.startsWith(k)) e = x;
  if (!e) { console.log('NOENTRY', k); bad++; continue; }
  let t = e.translation; const before = t;
  if (f.t) t = conv(f.t);
  for (const [o,n] of f.r||[]) { const oo=conv(o), nn=conv(n); if (!t.includes(oo)) { console.log('NOTFOUND', k, o); bad++; t=null; break; } t = t.split(oo).join(nn); }
  if (t===null) continue;
  if (tags(t)!==tags(e.text) ) { console.log('TAGMISMATCH', k, tags(t), '|', tags(e.text)); bad++; continue; }
  e.translation = t; ok++;
}
console.log('ok',ok,'bad',bad);
if (mode==='write' && bad===0) for (const [p,{raw,j}] of Object.entries(files)) {
  const nl = raw.includes('\r\n') ? '\r\n' : '\n';
  let out = JSON.stringify(j,null,2); if (nl==='\r\n') out=out.replace(/\n/g,'\r\n'); if (raw.endsWith(nl)) out+=nl;
  fs.writeFileSync(p,out); console.log('wrote',p);
}
