#!/usr/bin/env node
// ④+⑤（token削減案）を試すため、既存ゴールドセット chunk（source/）から
// 「軽量版」チャンク（source_lean/）を生成する。翻訳対象のkey・text・順序は
// 一切変えず、コンテキストの持たせ方だけを変える（Sonnetオンリーでの品質比較用）。
//
// ④ characterNotes: チャンク直下に「チャンクに登場する全話者」ぶんの
//    ノートをフラットに並べる今の方式をやめ、ブロック（同一dialog単位）ごとに
//    「そのブロックに実際登場する話者」のノートだけを block.characterNotes として
//    残す。同じdialog内では基本1人しか喋らないことが多いので、無関係な他キャラの
//    ノートを毎回読ませずに済む。
// ⑤ glossary: { source, target, note } のJSON配列をやめ、"source=target" の
//    文字列配列（DSL）に圧縮する（note は捨てる。件数が多いと地味にトークンを食う）。
//
// 使い方（dev/ で実行）: node experiments/buildLeanChunks.mjs
import fs from 'node:fs';
import path from 'node:path';

function normalizeId(value) {
  return String(value ?? '').replace(/[^a-z0-9]/gi, '').toLowerCase();
}

// characterNotes の1エントリは "**表示名(内部id)** — ..." という見出しで始まる
// （toBatchData.js の parseCharacterNotes と同じ形式）。表示名・内部idの両方を
// 突き合わせキーとして使う。
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
  const glossaryLines = (chunk.glossary ?? []).map(g => `${g.source}=${g.target}`);
  const notesWithIds = (chunk.characterNotes ?? []).map(text => ({ text, ids: noteIds(text) }));

  const blocks = chunk.blocks.map(block => {
    const speakerIds = new Set(
      block.entries.map(e => normalizeId(e.speaker)).filter(Boolean)
    );
    const relevant = notesWithIds
      .filter(n => idsOverlap(n.ids, speakerIds))
      .map(n => n.text);
    return relevant.length ? { ...block, characterNotes: relevant } : block;
  });

  const out = { ...chunk, blocks };
  if (glossaryLines.length) out.glossary = glossaryLines;
  else delete out.glossary;
  delete out.characterNotes; // チャンク直下からは削除、必要なブロックへ移動済み
  return out;
}

const root = path.resolve('./lang/experiments/goldset');
let total = 0;
for (const category of ['hard', 'routine']) {
  const srcDir = path.join(root, 'source', category);
  if (!fs.existsSync(srcDir)) continue;
  const destDir = path.join(root, 'source_lean', category);
  fs.mkdirSync(destDir, { recursive: true });
  for (const file of fs.readdirSync(srcDir).filter(f => /^chunk_\d+\.json$/.test(f))) {
    const chunk = JSON.parse(fs.readFileSync(path.join(srcDir, file), 'utf8'));
    const lean = buildLean(chunk);
    fs.writeFileSync(path.join(destDir, file), JSON.stringify(lean, null, 2) + '\n');
    total++;
  }
}
console.log(`生成完了: ${total} chunk(s) → lang/experiments/goldset/source_lean/{hard,routine}/`);
