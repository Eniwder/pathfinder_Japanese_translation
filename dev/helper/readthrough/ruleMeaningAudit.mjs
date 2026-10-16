// dev/ で実行。数値・条件の対訳候補を抽出する（自動修正なし）。
import fs from 'node:fs';
import path from 'node:path';
const latest=new Map();
for(const round of fs.readdirSync('lang/chunks_review').sort()){
 const dir=path.join('lang/chunks_review',round);if(!fs.statSync(dir).isDirectory())continue;
 for(const file of fs.readdirSync(dir).filter(f=>/^chunk_\d+(\.done)?\.json$/.test(f)).sort()){
  const j=JSON.parse(fs.readFileSync(path.join(dir,file),'utf8'));
  for(const b of j.blocks??[{entries:j.entries??[]}])for(const e of b.entries)latest.set(e.key,{...e,loc:`${round}/${file}`});
 }
}
const clean=s=>s.normalize('NFKC').replace(/<ctrl_\d+\/>|\{[^{}]*\}|<[^>]*>/g,' ');
const kanji=s=>s.replace(/[一二三四五六七八九十百千万]+(?=(?:回|度|点|ラウンド|ターン|日|時間|分間|秒|レベル|フィート|体|人|段階|倍|つ|個|週間|か月|ヶ月|年|マイル))/g,m=>{
 const digit={'一':1,'二':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9};let n=0,v=0;
 for(const c of m){if(digit[c])v=digit[c];else if(c==='万'){n=(n+v)*10000;v=0;}else{n+=(v||1)*({'十':10,'百':100,'千':1000}[c]);v=0;}}return String(n+v);
});
const nums=s=>(s.replace(/(?<=\d),(?=\d{3}(?:\D|$))/g,'').match(/\d+(?:\.\d+)?/g)??[]).sort((a,b)=>Number(a)-Number(b));
const magnitude=s=>s.replace(/(\d+(?:\.\d+)?)万/g,(_,n)=>String(Number(n)*10000));
const fractions=s=>s.replace(/1[–—-]1\/2/g,'1.5').replace(/1\/2|半分|半減/g,'0.5').replace(/\bhalf\b/gi,'0.5');
const wordNumbers={one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,eleven:11,twelve:12,thirteen:13,fourteen:14,fifteen:15,sixteen:16,seventeen:17,eighteen:18,nineteen:19,twenty:20};
const spelled=s=>s.replace(/\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)\b/gi,m=>String(wordNumbers[m.toLowerCase()]));
const checks=[
 ['at_least',/\bat least\b/i,/以上|最低|少なくとも|(?:^|\D)\d+[^。]*必要/],
 ['more_than',/\b(?:more|greater) than \d/i,/超え|超過|より(?:も)?多|以上|上回/],
 ['less_than',/\b(?:less|fewer) than \d/i,/未満|より(?:も)?少|下回|以下/],
 ['up_to',/\b(?:up to|at most|no more than) \d/i,/最大|上限|まで|以下|超えない|超過しない/],
 ['no_stack',/\b(?:does not|do not|doesn't|don't|cannot|can't) stack\b/i,/累積しない|重複しない|累積せず|重複せず|累積不可|重複不可|累積することはない/],
 ['instead',/\binstead of\b/i,/代わり|かわり|置き換|変更|ではなく|のではなく|するが|なる|増加|上昇/],
 ['once_per',/\bonce per (?:round|turn|day)\b/i,/1回|一回|一度|1度/],
 ['save_negates',/\b(?:successful|succeeds? on|succeeds? at)[^.]{0,100}(?:negates?|no effect|unaffected)\b/i,/無効|受けない|及ぼさない|影響しない|効果がない|防ぐ/],
 ['save_half',/\b(?:successful|succeeds? on|succeeds? at)[^.]{0,100}\bhalf\b/i,/半分|半減|半量|半数|1\/2|2分の1/],
];
const numeric=[],conditions=[],boundaries=[],roundUnits=[],signs=[],sides=[];let scanned=0,numericChecked=0;
for(const e of latest.values()){
 if(typeof e.translation!=='string'||e.type==='Cue'||e.type==='Answer')continue;
 const en=clean(e.text),ja=clean(e.translation);
 if(!/\b(?:damage|bonus|penalty|saving throw|save|round|caster|stack|duration|hit points?|ability score|per day)\b/i.test(en))continue;
 scanned++;
 const a=nums(spelled(fractions(en))),b=nums(fractions(magnitude(kanji(ja))));if(a.length||b.length)numericChecked++;
 // 冠詞aや単数形を1と明記する訳、同値を「各」で集約する訳は個数差を生む。
 // 元の数値（1以外）が訳に存在しない場合を優先して対訳確認する。
 if(a.some(n=>n!=='1'&&!b.includes(n)))numeric.push({key:e.key,loc:e.loc,en:a,ja:b});
 for(const[name,test,expected]of checks)if(test.test(en)&&!expected.test(ja))conditions.push({key:e.key,loc:e.loc,check:name});
 for(const m of en.matchAll(/\b(more than|greater than|less than|fewer than|at least)\s+(\d+)\s*(feet|foot|rounds?|levels?|points?|HD|hit dice|times?)?/gi)){
  const preceding=en.slice(Math.max(0,m.index-20),m.index);
  if(/(?:no|not|cannot|can't)\s*$/i.test(preceding))continue;
  const op=m[1].toLowerCase(),n=m[2],unit=m[3]??'';
  const jpUnit=/feet|foot/i.test(unit)?'フィート':/round/i.test(unit)?'ラウンド':/level/i.test(unit)?'レベル':/point/i.test(unit)?'ポイント':/times/i.test(unit)?'回':'';
  const wrong=op==='at least'?'超え|超過':'以上|以下';
  const re=new RegExp(`${n}${jpUnit}[\\s]*(?:${wrong})`);
  if(re.test(ja.replace(/\s+/g,'')))boundaries.push({key:e.key,loc:e.loc,en:m[0],ja:ja.match(re)?.[0]??'boundary match'});
 }
 if(/\brounds?\b/i.test(en)&&!/\bturns?\b/i.test(en)&&/ターン/.test(ja)&&!/ラウンド/.test(ja))roundUnits.push({key:e.key,loc:e.loc});
 const signed=s=>[...s.replace(/[−–—]/g,'-').matchAll(/([+-])\s*(\d+(?:\.\d+)?)/g)].map(m=>m[1]+m[2]);
 const es=signed(en),js=signed(ja);
 for(const v of new Set(es)){const opposite=(v[0]==='+'?'-':'+')+v.slice(1);if(!es.includes(opposite)&&!js.includes(v)&&js.includes(opposite))signs.push({key:e.key,loc:e.loc,en:v,ja:opposite});}
 if(/\ballies\b/i.test(en)&&!/\benem(?:y|ies)\b/i.test(en)&&/敵/.test(ja)&&!/味方|仲間|同盟/.test(ja))sides.push({key:e.key,loc:e.loc});
}
const report={stats:{keys:latest.size,ruleEntries:scanned,numericChecked,numericCandidates:numeric.length,conditionCandidates:conditions.length,boundaryCandidates:boundaries.length,roundUnitCandidates:roundUnits.length,signCandidates:signs.length,sideCandidates:sides.length},numeric,conditions,boundaries,roundUnits,signs,sides};
fs.mkdirSync('test/consistency',{recursive:true});fs.writeFileSync('test/consistency/rule-meaning-audit.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report.stats,null,2));
