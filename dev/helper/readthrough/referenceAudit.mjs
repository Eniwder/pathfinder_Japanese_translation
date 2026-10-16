// 最新のレビュー訳だけを対象に、リンク境界・語句対応・プレースホルダーを監査する。
// dev/ で実行。候補は自動修正せず test/consistency/reference-audit.json に保存する。
import fs from 'node:fs';
import path from 'node:path';
const latest=new Map();
for(const round of fs.readdirSync('lang/chunks_review').sort()){
 const dir=path.join('lang/chunks_review',round);if(!fs.statSync(dir).isDirectory())continue;
 for(const file of fs.readdirSync(dir).filter(f=>/^chunk_\d+(\.done)?\.json$/.test(f)).sort()){
  const j=JSON.parse(fs.readFileSync(path.join(dir,file),'utf8'));
  for(const block of j.blocks??[{dialog:null,entries:j.entries??[]}])for(const e of block.entries)
   latest.set(e.key,{...e,type:e.type??e.nodeType,dialog:block.dialog??e.dialog,loc:`${round}/${file}`});
 }
}
const strip=s=>String(s??'').replace(/<ctrl_\d+\/>|<[^>]*>/g,'').trim();
const exact=[
 [/^(strength|str)$/i,/筋力|^筋$/], [/^(dexterity|dex)$/i,/敏捷力|^敏$/],
 [/^(constitution|con)$/i,/耐久力|^耐$/], [/^(intelligence|int)$/i,/知力|^知$/],
 [/^(wisdom|wis)$/i,/判断力|^判$/], [/^(charisma|cha)$/i,/魅力|^魅$/],
 [/^temporary (hit points?|hp)$/i,/一時的|一時/],
 [/^fortitude(?: saves?| saving throws?)?$/i,/頑健/],
 [/^reflex(?: saves?| saving throws?)?$/i,/反応/],
 [/^will(?: saves?| saving throws?)?$/i,/意志/],
 [/^(caster level|caster levels)$/i,/術者レベル|術者・レベル/],
 [/^(character level|character levels)$/i,/キャラクター[・]?レベル/],
 [/^(spell resistance)$/i,/呪文抵抗/],
 [/^swift actions?$/i,/即行/], [/^immediate actions?$/i,/割り込み/],
 [/^move actions?$/i,/移動/], [/^standard actions?$/i,/標準/],
 [/^full[- ]round actions?$/i,/全ラウンド/],
 [/^melee(?: attacks?)?$/i,/近接/], [/^ranged(?: attacks?)?$/i,/遠隔/],
];
const structure=[],meaning=[],numbers=[],placeholders=[],spans=[],sourceDifferences=[];
const original=JSON.parse(fs.readFileSync('lang/enGB.json','utf8')).strings;
// 保護原文では全半角の句読点が正規化されている。復元後の互換正規化で照合する。
const normalize=s=>s.normalize('NFKC').replace(/\r\n/g,'\n');
let translated=0,tagged=0;
for(const e of latest.values()){
 if(typeof e.translation!=='string')continue;translated++;
 const tags=e.tags??e.controlTags??[];
 const values=new Map(tags.map((t,i)=>[typeof t==='string'?`<ctrl_${i}/>`:t.token,typeof t==='string'?t:t.value]));
 if(values.size)tagged++;
 function parse(text,side){
  const stack=[],pairs=[];
  for(const m of text.matchAll(/<ctrl_\d+\/>/g)){
   const v=values.get(m[0]);if(!v)continue;
   if(/^\{[gd]\|/.test(v))stack.push({token:m[0],link:v,start:m.index+m[0].length});
   else if(v==='{\/g}'||v==='{\/d}'){
    const open=stack.pop();
    if(!open||open.link[1]!==v[2]){structure.push({key:e.key,loc:e.loc,side,reason:'unbalanced',token:m[0]});continue;}
    pairs.push({open:open.token,close:m[0],link:open.link,inner:text.slice(open.start,m.index)});
   }
  }
  if(stack.length)structure.push({key:e.key,loc:e.loc,side,reason:'unclosed',tokens:stack.map(s=>s.token)});
  return pairs;
 }
 const en=parse(e.text,'source'),ja=parse(e.translation,'translation');
 for(const p of en){
  const q=ja.find(q=>q.open===p.open&&q.close===p.close);
  if(!q){structure.push({key:e.key,loc:e.loc,side:'translation',reason:'different_pair',source:p});continue;}
  const english=strip(p.inner),japanese=strip(q.inner);
  spans.push({key:e.key,loc:e.loc,link:p.link,en:english,ja:japanese,open:p.open,close:p.close});
  if(english&&!japanese)meaning.push({key:e.key,loc:e.loc,link:p.link,en:english,ja:japanese,reason:'empty'});
  else for(const[pattern,expected]of exact)if(pattern.test(english)&&!expected.test(japanese)){
   meaning.push({key:e.key,loc:e.loc,link:p.link,en:english,ja:japanese,reason:'term'});break;
  }
  if(p.link.includes('Dice')){
   const a=english.match(/\d+d\d+/gi)||[],b=japanese.match(/\d+d\d+/gi)||[];
   if(JSON.stringify(a)!==JSON.stringify(b))numbers.push({key:e.key,loc:e.loc,link:p.link,en:english,ja:japanese});
  }
 }
 // 性別分岐とは区別し、実行時プレースホルダーの実体と個数を照合する。
 const restore=s=>s.replace(/<ctrl_\d+\/>/g,t=>values.get(t)??t);
 if(typeof original[e.key]==='string'&&normalize(restore(e.text))!==normalize(original[e.key]))
  sourceDifferences.push({key:e.key,loc:e.loc,restored:restore(e.text),original:original[e.key]});
 const runtime=s=>(restore(s).match(/\{[^{}|]+\}/g)||[]).filter(t=>!/^\{\/?(?:g|d|n|br)\}$/.test(t)).sort();
 if(JSON.stringify(runtime(e.text))!==JSON.stringify(runtime(e.translation)))placeholders.push({key:e.key,loc:e.loc,en:runtime(e.text),ja:runtime(e.translation)});
}
const sourceMissing=Object.keys(original).filter(key=>!latest.has(key));
const report={stats:{keys:latest.size,translated,untranslated:latest.size-translated,sourceMissing:sourceMissing.length,nonemptySourceMissing:sourceMissing.filter(key=>original[key].trim()).length,sourceDifferences:sourceDifferences.length,tagged,linkSpans:spans.length,structure:structure.length,meaningCandidates:meaning.length,diceCandidates:numbers.length,placeholderCandidates:placeholders.length},structure,meaning,numbers,placeholders,sourceMissing,sourceDifferences};
fs.mkdirSync('test/consistency',{recursive:true});
fs.writeFileSync('test/consistency/reference-audit.json',JSON.stringify(report,null,2)+'\n');
fs.writeFileSync('test/consistency/reference-spans.json',JSON.stringify(spans)+'\n');
console.log(JSON.stringify(report.stats,null,2));
