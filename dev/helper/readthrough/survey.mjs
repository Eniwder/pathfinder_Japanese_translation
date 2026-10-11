import fs from 'fs'; import path from 'path';
const root='./lang/chunks_review'; const latest=new Map();
for (const r of fs.readdirSync(root).sort()) { const d=path.join(root,r); if(!fs.statSync(d).isDirectory()) continue;
  for (const f of fs.readdirSync(d).filter(f=>/^chunk_\d+(\.done)?\.json$/.test(f)).sort()) {
    const j=JSON.parse(fs.readFileSync(path.join(d,f),'utf8'));
    for (const b of j.blocks||[]) for (const e of b.entries) latest.set(e.key,{...e,dialog:b.dialog,loc:`${r}/${f}`}); } }
const types={}, dialogs={};
for (const e of latest.values()) { types[e.type||'-']=(types[e.type||'-']||0)+1; }
console.log(latest.size, types);
const nod=[...latest.values()].filter(e=>e.type!=='Cue'&&e.type!=='Answer');
const dc={}; for(const e of nod){const k=(e.dialog||'').replace(/\d+/g,'#');dc[k]=(dc[k]||0)+1}
console.log(Object.entries(dc).sort((a,b)=>b[1]-a[1]).slice(0,40));
fs.writeFileSync(process.argv[2], JSON.stringify([...latest.values()]));
