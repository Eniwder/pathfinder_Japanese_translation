#!/usr/bin/env node
// ④（characterNotesのブロック単位スコープ化）だけを検証するための軽量版チャンク生成。
// ⑤（glossary DSL化）は既に toBatchData.js 本体に採用済みなので、ここでは
// characterNotes の持たせ方だけを変える。
//
// チャンク直下の characterNotes（そのチャンクに登場する全話者ぶんをフラットに
// 並べたリスト）をやめ、ブロック（同一dialog単位）ごとに「そのブロックに実際
// 登場する話者」のノートだけを block.characterNotes として持たせる。
//
// 使い方（dev/ で実行）:
//   node experiments/buildLeanChunksV2.mjs lang/experiments/goldset_multiblock
import fs from 'node:fs';
import path from 'node:path';

function normalizeId(value) {
  return String(value ?? '').replace(/[^a-z0-9]/gi, '').toLowerCase();
}

function noteIds(note) {
  const header = note.split('\n')[0];
  const match = header.match(/^\*\*(.+?)\((.+?)\)\*\*/);
  if (!match) return [];
  return [match[1], match[2]].map(normalizeId).filter(Boolean);
}

function idsOverlap(noteIdList, speakerIdSet) {
  return noteIdList.some(id => {
    for (const speakerId of speakerIdSet) {
      if (id === speakerId || id.includes(speakerId) || speakerId.includes(id)) return true;
    }
    return false;
  });
}

function buildLean(chunk) {
  const notesWithIds = (chunk.characterNotes ?? []).map(text => ({ text, ids: noteIds(text) }));

  const blocks = chunk.blocks.map(block => {
    const speakerIds = new Set(block.entries.map(e => normalizeId(e.speaker)).filter(Boolean));
    const relevant = notesWithIds.filter(n => idsOverlap(n.ids, speakerIds)).map(n => n.text);
    return relevant.length ? { ...block, characterNotes: relevant } : block;
  });

  const out = { ...chunk, blocks };
  delete out.characterNotes; // チャンク直下からは削除、必要なブロックへ移動済み
  return out;
}

const root = path.resolve(process.argv[2] ?? './lang/experiments/goldset_multiblock');
const srcDir = path.join(root, 'source');
const destDir = path.join(root, 'source_lean');
fs.mkdirSync(destDir, { recursive: true });
let total = 0;
for (const file of fs.readdirSync(srcDir).filter(f => /^chunk_\d+\.json$/.test(f))) {
  const chunk = JSON.parse(fs.readFileSync(path.join(srcDir, file), 'utf8'));
  fs.writeFileSync(path.join(destDir, file), JSON.stringify(buildLean(chunk), null, 2) + '\n');
  total++;
}
console.log(`生成完了: ${total} chunk(s) → ${destDir}`);
