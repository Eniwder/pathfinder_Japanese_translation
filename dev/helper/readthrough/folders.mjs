import fs from 'fs';
const [,,SP]=process.argv;
const g=JSON.parse(fs.readFileSync('./res/dialogueGraph.json','utf8'));const m={};
for(const d of g.dialogs){const p=(d.source||'').split(String.fromCharCode(92)).join('/');const mm=p.match(/World\/Dialogs\/([^/]+)/);m[d.dialog||d.name]=mm?mm[1]:(p.split('/')[2]||'?')}
fs.writeFileSync(SP+'/dialogfolder.json',JSON.stringify(m));
const a=JSON.parse(fs.readFileSync(SP+'/all.json','utf8'));const st={};
for(const e of a){if(!e.dialog)continue;const f=m[e.dialog]||'?';st[f]=st[f]||{n:0,blank:0};st[f].n++;if(e.type==='Cue'&&!e.speaker&&/^(<ctrl_\d+\/>[^<]*<ctrl_\d+\/>)?\s*「/.test(e.translation||''))st[f].blank++}
console.log(Object.entries(st).sort((a,b)=>b[1].n-a[1].n).map(([k,v])=>k+' '+v.n+' blankQuote '+v.blank).join('\n'));
