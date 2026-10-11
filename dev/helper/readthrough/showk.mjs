import fs from 'fs';
const SP=process.env.RT_WORK; if(!SP) throw new Error('set RT_WORK to the work dir');
const a=JSON.parse(fs.readFileSync(SP+'/all.json','utf8'));
const want=process.argv[2]?process.argv.slice(2):[];
let re=null;if(want[0]==='-re'){re=new RegExp(want[1]);}
for(const e of a){const k=e.key.slice(0,8);const t=e.translation||'';
 if(re?re.test(t):want.includes(k)){
  // read live from file
  const j=JSON.parse(fs.readFileSync('./lang/chunks_review/'+e.loc,'utf8'));let live=t;
  for(const b of j.blocks)for(const x of b.entries)if(x.key===e.key)live=x.translation;
  console.log('['+k+'] '+(e.speaker||'-')+' | '+e.dialog+'\n  EN: '+e.text.replace(/<ctrl_(\d+)\/>/g,'‹$1›')+'\n  JA: '+(live||'').replace(/<ctrl_(\d+)\/>/g,'‹$1›'));}}
