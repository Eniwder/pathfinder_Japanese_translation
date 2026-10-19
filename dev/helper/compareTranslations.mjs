import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const work=path.join(root,'lang','comparison-siratori-20261019');
const current=path.join(root,'lang','zhCN.json');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');
const digest=s=>crypto.createHash('sha256').update(s).digest('hex');
const command=process.argv[2];
const status=()=>{
 const manifest=read(path.join(work,'manifest.json')),decisions=read(path.join(work,'decisions.json'));
 const counts={};for(const d of Object.values(decisions))counts[d.decision]=(counts[d.decision]??0)+1;
 const done=new Set(Object.keys(decisions));
 const pending=manifest.queue.filter(k=>!done.has(k));
 const result={sourceKeys:manifest.sourceKeys,exactAtStart:manifest.exactAtStart,differentAtStart:manifest.queue.length,decisions:counts,remaining:pending.length,nextKey:pending[0]??null};
 write(path.join(work,'progress.json'),result);return result;
};
if(command==='init'){
 assert(!fs.existsSync(work),'比較作業は初期化済み');fs.mkdirSync(work,{recursive:true});
 const files={en:path.join(root,'lang/enGB.json'),base:current,other:process.argv[3]};
 assert(files.other,'相手のJSONを指定する');
 const inputs={};for(const [name,p]of Object.entries(files)){const raw=fs.readFileSync(p);fs.writeFileSync(path.join(work,name+'.json'),raw);inputs[name]={path:p,sha256:digest(raw)};}
 const en=read(path.join(work,'en.json')).strings,base=read(path.join(work,'base.json')).strings,other=read(path.join(work,'other.json')).strings;
 const keys=Object.keys(en),queue=keys.filter(k=>base[k]!==other[k]);
 const previous=process.argv[4]?read(process.argv[4]):[],decisions={};
 for(const r of previous){if(!(r.key in en)||!(r.key in base)||!(r.key in other))continue;decisions[r.key]={decision:'prior-reviewed',reason:r.reason,previousVerdict:r.verdict,baseSha256:digest(base[r.key]),source:'前回の200件サンプリング。専門用語の判定は必要に応じ再調査。'};}
 write(path.join(work,'manifest.json'),{version:1,created:'2026-10-19',inputs,sourceKeys:keys.length,exactAtStart:keys.length-queue.length,queue,missingBase:keys.filter(k=>!(k in base)),missingOther:keys.filter(k=>!(k in other)),extraOther:Object.keys(other).filter(k=>!(k in en))});
 write(path.join(work,'decisions.json'),decisions);console.log(JSON.stringify(status(),null,2));
}else if(command==='export'){
 const count=Number(process.argv[3]??25),offset=Number(process.argv[4]??0);
 const manifest=read(path.join(work,'manifest.json')),decisions=read(path.join(work,'decisions.json'));
 const en=read(path.join(work,'en.json')).strings,base=read(path.join(work,'base.json')).strings,other=read(path.join(work,'other.json')).strings;
 const keys=manifest.queue.filter(k=>!(k in decisions)).slice(offset,offset+count);
 const graph=read(path.join(root,'res/dialogueGraph.json'));const wanted=new Set(keys),contexts=new Map();
 for(const node of graph.nodes){if(!wanted.has(node.textKey))continue;const arr=contexts.get(node.textKey)??[];arr.push({source:node.source,speaker:node.speakerName,type:node.type,dialog:node.dialog});contexts.set(node.textKey,arr);}
 const entries=keys.map((key,i)=>({n:offset+i+1,key,en:en[key],a:base[key],b:other[key],context:contexts.get(key)??[]}));
 const out=process.argv[5]??path.join(work,'next.json');write(out,entries);
 console.log(entries.map(r=>`${r.n} ${r.key}${r.context.length?' '+JSON.stringify(r.context):''}\nEN ${r.en}\nA ${r.a}\nB ${r.b}`).join('\n\n'));
}else if(command==='record'){
 const manifest=read(path.join(work,'manifest.json')),decisions=read(path.join(work,'decisions.json')),base=read(path.join(work,'base.json')).strings;
 const allowed=new Set(['keep','adopt-part','rewrite','researched-keep','researched-rewrite','hold-mechanics']);
 const entries=read(process.argv[3]);
 for(const e of entries){assert(manifest.queue.includes(e.key),'比較対象外');assert(allowed.has(e.decision),'不正な判定');assert(e.reason?.length>3,'理由が必要');const old=decisions[e.key];assert(!old||old.decision==='prior-reviewed'||process.argv.includes('--revise'),'判定の重複');assert(!old?.applied,'反映済み判定の更新は新しいスナップショットで行う');if(e.decision==='adopt-part'||e.decision.includes('rewrite'))assert(typeof e.translation==='string'&&e.translation!==base[e.key],'変更訳が必要');decisions[e.key]={...e,baseSha256:digest(base[e.key]),...(old?{previousDecision:old}:{})};delete decisions[e.key].key;}
 write(path.join(work,'decisions.json'),decisions);console.log(JSON.stringify(status(),null,2));
}else if(command==='apply'){
 const decisions=read(path.join(work,'decisions.json')),base=read(path.join(work,'base.json')).strings;
 const before=fs.readFileSync(current,'utf8'),json=JSON.parse(before);let after=before;const changes=[];
 const tags=s=>(s.match(/\{[^{}]*\}|<[^<>]*>/g)??[]).sort();
 const nums=s=>(s.replace(/\{[^{}]*\}|<[^<>]*>/g,'').match(/[+−–-]?\d+(?:\.\d+)?(?:d\d+)?/g)??[]).sort();
 for(const [key,d]of Object.entries(decisions)){
  if(typeof d.translation!=='string'||d.applied)continue;
  assert.equal(json.strings[key],base[key],`比較後に編集されたキー ${key}`);assert.equal(d.baseSha256,digest(base[key]));
  assert.deepEqual(tags(base[key]),tags(d.translation),`タグ差 ${key}`);
  if(!d.allowNumericChange)assert.deepEqual(nums(base[key]),nums(d.translation),`数値差 ${key}`);
  const from=JSON.stringify(key)+': '+JSON.stringify(base[key]),to=JSON.stringify(key)+': '+JSON.stringify(d.translation);
  assert.equal(after.split(from).length,2,'行の一意性');after=after.replace(from,to);
  changes.push({key,before:base[key],after:d.translation,reason:d.reason});
 }
 const parsed=JSON.parse(after);assert.deepEqual(Object.keys(parsed.strings),Object.keys(json.strings));
 if(changes.length){
  const stamp=new Date().toISOString().replace(/[:.]/g,'-');fs.writeFileSync(path.join(work,`before-${stamp}.json`),before);
  assert.equal(fs.readFileSync(current,'utf8'),before,'処理中の競合');fs.writeFileSync(current,after);
  for(const c of changes)decisions[c.key].applied=stamp;
  write(path.join(work,`applied-${stamp}.json`),changes);write(path.join(work,'decisions.json'),decisions);
 }
 console.log(JSON.stringify({changed:changes.length,...status()},null,2));
}else if(command==='report'){
 const progress=status(),manifest=read(path.join(work,'manifest.json')),decisions=read(path.join(work,'decisions.json'));
 const en=read(path.join(work,'en.json')).strings,base=read(path.join(work,'base.json')).strings,other=read(path.join(work,'other.json')).strings;
 const currentStrings=read(current).strings;
 const entries=Object.entries(decisions).map(([key,d])=>({key,...d}));
 const fresh=entries.filter(d=>d.decision!=='prior-reviewed'),applied=entries.filter(d=>d.applied);
 const q=x=>'"'+String(x??'').replaceAll('"','""')+'"';
 fs.writeFileSync(path.join(work,'review-ledger.csv'),'\ufeff'+['key,decision,reason,english,base,other,result,evidence',...entries.map(d=>[d.key,d.decision,d.reason,en[d.key],base[d.key],other[d.key],currentStrings[d.key],(d.evidence??[]).join('\n')].map(q).join(','))].join('\r\n'));
 const priority={dialogue:0,narration:0,system:0,shortLabel:0,missingOther:0};
 for(const key of manifest.queue){if(decisions[key])continue;const s=en[key];if(!(key in other))priority.missingOther++;else if(s.includes('{n}'))priority.narration++;else if(s.includes('"'))priority.dialogue++;else if(s.length<80)priority.shortLabel++;else priority.system++;}
 write(path.join(work,'pending-categories.json'),priority);
 let md=`# siratori版との翻訳比較\n\n全体は作業中。自動分類しただけの項目をレビュー済みに数えない。\n\n- 原文：${manifest.sourceKeys.toLocaleString()}件\n- 比較開始時の完全一致：${manifest.exactAtStart.toLocaleString()}件\n- 差分：${manifest.queue.length.toLocaleString()}件\n- 前回サンプリング：${entries.length-fresh.length}件（完全一致19件を含む）\n- 今回の新規目視レビュー：${fresh.length}件\n- 今回の反映：${applied.length}件\n- 差分の未レビュー：${progress.remaining.toLocaleString()}件\n\n## 方針\n\n英語原文と両訳を照合し、改善できる文節だけ採用。既存の人名・話者口調・定訳を維持する。曖昧な用語は用語集・blueprint・関連会話・PRDで調査し、それでも意味が確定しない場合は意味を狭めない自然な表現にする。数値・条件など挙動の不明点は推測で変更しない。\n\n今回の新規レビュー範囲は原文JSON順の実績・背景・基本呪文・状態説明が中心であり、全体の品質比率の推定サンプルではない。前回200件の評価記録と今回の厳密な調査記録は区別する。\n\n## 主な修正\n\n`;
 for(const d of applied){md+=`### ${en[d.key].slice(0,100).replaceAll('\n',' ')}\n\nキー：${d.key}\n\n理由：${d.reason}\n\n変更前：${base[d.key]}\n\n変更後：${d.translation}\n\n`;if(d.evidence)md+=`根拠：${d.evidence.join(' / ')}\n\n`;}
 md+=`## 保存先と再開方法\n\n- dev/lang/comparison-siratori-20261019/manifest.json：入力ファイルのSHA-256と比較順\n- decisions.json：個別判定・根拠・採用訳・反映履歴\n- review-ledger.csv：原文・両訳・最終訳の一覧\n- base.json：今回開始時の日本語JSON。前回取り込んだ19件を含む\n- before-*.json：各反映直前のバックアップ\n- pending-categories.json：未レビューの機械分類（評価ではない）\n\nリポジトリルートで実行：\n\n\`\`\`powershell\nnode --max-old-space-size=8192 dev/helper/compareTranslations.mjs status\nnode --max-old-space-size=8192 dev/helper/compareTranslations.mjs export 25 0 dev/lang/comparison-siratori-20261019/next.json\n# next.jsonを原文・文脈・用語集と照合して判断し、判定JSONを作成\nnode dev/helper/compareTranslations.mjs record <判定JSON>\nnode dev/helper/compareTranslations.mjs apply\nnode dev/helper/compareTranslations.mjs report\n\`\`\`\n\nrecord形式：key, decision, reason, translation（変更時）, evidence（調査時）。許容判定はkeep/adopt-part/rewrite/researched-keep/researched-rewrite/hold-mechanics。反映前に現行値とスナップショットの一致、タグ・数値の保持をチェックし、競合時は中止する。\n`;
 const bp=path.join(work,'verify-before.json'),ap=path.join(work,'verify-after.json');
 if(fs.existsSync(bp)&&fs.existsSync(ap)){
  const b=read(bp),a=read(ap);const equal=JSON.stringify(b)===JSON.stringify(a);
  md+=`\n## 検証\n\n既存verify.jsの変更前後レポートは${equal?'完全一致':'相違あり（確認が必要）'}。変更後の既存エラー${a.errors.length}件、警告${a.warnings.length}件。制御タグ不整合${a.stats.controlTagIssues}件、キー欠落${a.stats.missing}件。今回の反映直後に照合済み。\n`;
 }
 const output=path.join(root,'res','translationComparison20261019.md');fs.writeFileSync(output,md);console.log(JSON.stringify({report:output,ledger:path.join(work,'review-ledger.csv'),pendingCategories:priority,...progress},null,2));
}else if(command==='status')console.log(JSON.stringify(status(),null,2));
else throw Error('init OTHER [PREVIOUS] | export [COUNT] [OFFSET] [OUTPUT] | record DECISIONS [--revise] | apply | report | status');
