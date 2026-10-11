import fs from 'fs';
const [,,SP,folder,out,limit,off=0]=process.argv; let skip=+off;
const m=JSON.parse(fs.readFileSync(SP+'/dialogfolder.json','utf8'));
const a=JSON.parse(fs.readFileSync(SP+'/all.json','utf8')); // already in round/file/entry order
const c=s=>(s||'').replace(/<ctrl_(\d+)\/>/g,'‹$1›');
let s='',n=0,last=null; const keys=[];
for(const e of a){ if(!e.dialog||m[e.dialog]!==folder) continue; if(skip>0){skip--;continue;} if(n>=+limit) break;
  if(e.dialog!==last){ s+=`\n=== ${e.dialog}\n`; last=e.dialog; }
  s+=`[${e.key.slice(0,8)}] ${e.type==='Answer'?'>>':(e.speaker||'-')}\n  EN: ${c(e.text)}\n  JA: ${c(e.translation)}\n`; n++; keys.push(e.key+'\t'+e.loc);
}
fs.writeFileSync(out,s); fs.writeFileSync(out+'.loc',keys.join('\n')); console.log(n, s.split('\n').length);
