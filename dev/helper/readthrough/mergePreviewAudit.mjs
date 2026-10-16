// dev/ で実行。実際のimportを一時コピーに適用し、最新チャンクとの一致を照合する。
// 本番zhCN.jsonおよびレビューチャンクには書き込まない。
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
const output=path.resolve(process.argv[2]??`test/consistency/merge-preview-${Date.now()}`);
if(fs.existsSync(output))throw Error('Output directory already exists; choose a new path.');
const production='lang/zhCN.json',baseRaw=fs.readFileSync(production,'utf8');
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const beforeHash=hash(baseRaw),source=JSON.parse(fs.readFileSync('lang/enGB.json','utf8')).strings;
const base=JSON.parse(baseRaw),latest=new Map(),chunkHashes=new Map(),duplicates=[];
for(const round of fs.readdirSync('lang/chunks_review').sort()){
 const dir=path.join('lang/chunks_review',round);if(!fs.statSync(dir).isDirectory())continue;
 for(const file of fs.readdirSync(dir).filter(f=>/^chunk_\d+(\.done)?\.json$/.test(f)).sort()){
  const p=path.join(dir,file),raw=fs.readFileSync(p,'utf8'),j=JSON.parse(raw);chunkHashes.set(p,hash(raw));
  for(const b of j.blocks??[{entries:j.entries??[]}])for(const e of b.entries){
   if(latest.has(e.key))duplicates.push({key:e.key,previous:latest.get(e.key).file,next:p});
   latest.set(e.key,{...e,file:p});
  }
 }
}
fs.mkdirSync(path.join(output,'chunks'),{recursive:true});
const rows=[...latest.values()];
for(let i=0;i<rows.length;i+=1000)fs.writeFileSync(path.join(output,'chunks',`chunk_${String(i/1000).padStart(4,'0')}.json`),JSON.stringify({blocks:[{entries:rows.slice(i,i+1000)}]}));
const preview=path.join(output,'zhCN.preview.json');fs.writeFileSync(preview,baseRaw,{flag:'wx'});
const imported=spawnSync(process.execPath,['--max-old-space-size=8192','toBatchData.js','import',`--chunks-dir=${path.join(output,'chunks')}`,`--translated=${preview}`,`--backup=${path.join(output,'zhCN.before.json')}`,'--no-mark-done'],{encoding:'utf8',maxBuffer:8*1024*1024});
fs.writeFileSync(path.join(output,'import.log'),imported.stdout+imported.stderr);
if(imported.status!==0||!/0 invalid/.test(imported.stdout))throw Error(imported.stdout+imported.stderr);
const merged=JSON.parse(fs.readFileSync(preview,'utf8')).strings;
const expected=new Map(),untranslated=[],mismatches=[],unexpected=[],restorationIssues=[];
for(const e of rows){
 if(typeof e.translation!=='string'||!e.translation){untranslated.push(e.key);continue;}
 const tags=e.tags??e.controlTags??[];
 const table=new Map(tags.map((t,i)=>[typeof t==='string'?`<ctrl_${i}/>`:t.token,typeof t==='string'?t:t.value]));
 const restored=e.translation.replace(/<ctrl_\d+\/>/g,t=>table.get(t)??t);expected.set(e.key,restored);
 if(merged[e.key]!==restored)mismatches.push(e.key);
 if(/<ctrl_\d+\/>/.test(merged[e.key]))restorationIssues.push(e.key);
}
for(const key of new Set([...Object.keys(base.strings),...Object.keys(merged)]))if(!expected.has(key)&&merged[key]!==base.strings[key])unexpected.push(key);
const productionUnchanged=hash(fs.readFileSync(production,'utf8'))===beforeHash;
const changedChunkFiles=[...chunkHashes].filter(([p,h])=>hash(fs.readFileSync(p,'utf8'))!==h).map(([p])=>p);
const sourceMissing=Object.keys(source).filter(key=>source[key].trim()&&merged[key]===undefined);
const baseDifferences=[...expected].filter(([key,value])=>base.strings[key]!==value).length;
const verifyPath=path.join(output,'verify-report.json');
const verification=spawnSync(process.execPath,['--max-old-space-size=8192','verify.js','--source=lang/enGB.json',`--translation=${preview}`,`--report=${verifyPath}`],{encoding:'utf8',maxBuffer:8*1024*1024});
fs.writeFileSync(path.join(output,'verify.log'),verification.stdout+verification.stderr);
const verified=fs.existsSync(verifyPath)?JSON.parse(fs.readFileSync(verifyPath,'utf8')):null;
const report={preview,stats:{latestKeys:latest.size,translatedKeys:expected.size,untranslated:untranslated.length,mergedKeys:Object.keys(merged).length,changedFromProduction:baseDifferences,duplicateKeys:duplicates.length,mismatches:mismatches.length,unexpectedChanges:unexpected.length,restorationIssues:restorationIssues.length,nonemptySourceMissing:sourceMissing.length,productionUnchanged,changedChunkFiles:changedChunkFiles.length},productionSHA256:beforeHash,previewSHA256:hash(fs.readFileSync(preview,'utf8')),untranslated,mismatches,unexpected,restorationIssues,sourceMissing,duplicates,changedChunkFiles,verify:{exitCode:verification.status,stats:verified?.stats,errors:verified?.errors?.length,warnings:verified?.warnings?.length}};
// 通常importの結果は上書きせず残す。比較用の別成果物で原文集合を正規化する。
// 翻訳保留のEULAは訳さず現行英語をそのまま採用し、未点検の既存訳を混在させない。
const nullKeys=new Set(untranslated),removedKeys=Object.keys(merged).filter(key=>!Object.hasOwn(source,key));
const cleanStrings=Object.fromEntries(Object.entries(source).map(([key,value])=>[key,nullKeys.has(key)?value:merged[key]??value]));
const cleanPath=path.join(output,'zhCN.preview.clean.json');
fs.writeFileSync(cleanPath,JSON.stringify({...base,strings:cleanStrings},null,2)+'\n');
const cleanReportPath=path.join(output,'verify-clean-report.json');
const cleanVerify=spawnSync(process.execPath,['--max-old-space-size=8192','verify.js','--source=lang/enGB.json',`--translation=${cleanPath}`,`--report=${cleanReportPath}`],{encoding:'utf8',maxBuffer:8*1024*1024});
fs.writeFileSync(path.join(output,'verify-clean.log'),cleanVerify.stdout+cleanVerify.stderr);
const cleanResult=JSON.parse(fs.readFileSync(cleanReportPath,'utf8'));
const cleanMismatches=[...expected].filter(([key,value])=>cleanStrings[key]!==value).map(([key])=>key);
report.cleanPreview={path:cleanPath,SHA256:hash(fs.readFileSync(cleanPath,'utf8')),keys:Object.keys(cleanStrings).length,removedKeys,englishFallbackKeys:untranslated,latestTranslationMismatches:cleanMismatches.length,verify:{exitCode:cleanVerify.status,stats:cleanResult.stats,errors:cleanResult.errors.length,warnings:cleanResult.warnings.length}};
fs.writeFileSync(path.join(output,'audit.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
if(!productionUnchanged||changedChunkFiles.length||mismatches.length||unexpected.length||restorationIssues.length||sourceMissing.some(key=>!nullKeys.has(key))||cleanMismatches.length)process.exitCode=1;
