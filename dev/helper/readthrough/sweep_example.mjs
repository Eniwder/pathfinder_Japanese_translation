import fs from 'fs';
const SP=process.env.RT_WORK; if(!SP) throw new Error('set RT_WORK to the work dir');
const a=JSON.parse(fs.readFileSync(SP+'/all.json','utf8'));
const c=s=>(s||'').replace(/<ctrl_(\d+)\/>/g,'‹$1›');
const mode=process.argv[2];
const pol=t=>/(です|ます|ません|でしょう|ください)[。！？」…]/.test(t);
const fem=t=>/(わ|わね|わよ|のよ|かしら|なの|だもの)[。！？」…]|わ、|のよ、/.test(t);
const q=t=>(t||'').replace(/<ctrl_\d+\/>[^<]*<ctrl_\d+\/>/g,'');
let out='',n=0,loc=[];
for(const e of a){ if(e.type!=='Cue')continue; const t=e.translation||''; const tq=q(t); if(!/「/.test(tq))continue; let hit=false;
 if(mode==='mentor') hit=(e.speaker==='Azata_Mentor'||(!e.speaker&&/MentorArrives|WiseMentor/.test(e.dialog||'')))&&!pol(tq);
 if(mode==='ilkes') hit=/Ileks/.test(e.speaker||'')&&fem(tq);
 if(mode==='thall') hit=/Tall_DesnaPriest/.test(e.speaker||'')&&fem(tq);
 if(mode==='council') hit=(/^(Eritrice|Alichino|Shyka)$/.test(e.speaker||'')&&/Council_(1|2|Lexicon2)_Dialogue/.test(e.dialog||'')&&!pol(tq));
 if(mode==='socoth') hit=(!e.speaker&&/Council_Socothbenoth_Dialogue/.test(e.dialog||'')&&pol(tq))||(/Council_Socothbenoth_Dialogue/.test(e.dialog||'')&&/私/.test(tq));
 if(!hit)continue; n++; loc.push(e.key.slice(0,8));
 out+=`[${e.key.slice(0,8)}] ${e.speaker||'-'} | ${e.dialog}\n  EN: ${c(e.text)}\n  JA: ${c(t)}\n`;
}
fs.writeFileSync(SP+'/sw_'+mode+'.txt',out); console.log(mode,n);
