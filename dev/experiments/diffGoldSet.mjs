#!/usr/bin/env node
// runGoldExperiment.mjs で作った複数モデルの訳文を、entryごとに突き合わせて
// Markdownのレビュー資料を作る。品質判定そのものはしない（人間が目で見て判断する
// ための一覧を並べるだけ）。機械的にわかる異常（<ctrl_N/>欠落・個数不一致）だけ検出して
// フラグを立てる。
//
// 使い方（dev/ で実行）:
//   node experiments/diffGoldSet.mjs --models=sonnet,haiku [--categories=hard,routine]
//     → dev/lang/experiments/goldset/report.md を書き出す

import fs from 'node:fs';
import path from 'node:path';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    return m ? [m[1], m[2] ?? true] : [a, true];
  })
);

const goldRoot = path.resolve('./lang/experiments/goldset');
const models = (typeof args.models === 'string' ? args.models : 'sonnet,haiku').split(',').map((s) => s.trim());
const categories = (typeof args.categories === 'string' ? args.categories : 'hard,routine').split(',').map((s) => s.trim());

function flatten(filePath) {
  const c = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  return Array.isArray(c.entries) ? c.entries : (c.blocks ?? []).flatMap((b) => (b.entries ?? []).map((e) => ({ ...e, dialog: b.dialog })));
}

function ctrlTags(text) {
  return (text.match(/<ctrl_\d+\/>/g) ?? []);
}

function sameMultiset(a, b) {
  if (a.length !== b.length) return false;
  const sorted = (arr) => [...arr].sort();
  const sa = sorted(a), sb = sorted(b);
  return sa.every((v, i) => v === sb[i]);
}

let md = `# ゴールドセット モデル比較レポート\n\n生成日時: ${new Date().toISOString()}\nモデル: ${models.join(' / ')}\n\n`;
let totalEntries = 0;
let totalFlagged = 0;

for (const category of categories) {
  md += `\n## ${category}\n\n`;
  // モデルごとにキー→entryのマップを作る（chunkファイル名がモデル間でズレていても
  // key基準で突き合わせられるようにする）。
  const perModel = new Map(); // label -> Map(key -> entry)
  for (const label of models) {
    const dir = path.join(goldRoot, label, category);
    const map = new Map();
    if (fs.existsSync(dir)) {
      for (const f of fs.readdirSync(dir).filter((f) => /^chunk_\d+\.json$/.test(f))) {
        for (const e of flatten(path.join(dir, f))) map.set(e.key, e);
      }
    }
    perModel.set(label, map);
  }

  const firstLabel = models[0];
  const keys = [...perModel.get(firstLabel).keys()];

  for (const key of keys) {
    totalEntries++;
    const base = perModel.get(firstLabel).get(key);
    const rows = models.map((label) => {
      const e = perModel.get(label).get(key);
      return { label, translation: e?.translation ?? null };
    });

    // 機械チェック: 原文のtags（<ctrl_N/>に対応する値の配列）個数と各モデル訳文中の
    // <ctrl_N/>個数が一致するか（toBatchData.jsのtagValuesOfと同じ正規化）
    const srcTagCount = (base.tags ?? base.controlTags ?? []).length;
    const flags = [];
    for (const { label, translation } of rows) {
      if (translation == null) { flags.push(`${label}: 未翻訳`); continue; }
      const got = ctrlTags(translation);
      if (got.length !== srcTagCount) flags.push(`${label}: ctrlタグ数不一致(期待${srcTagCount}/実際${got.length})`);
    }
    // モデル間で完全一致なら（レビューする価値が低いので）スキップし、差分がある行だけ載せる
    const allSame = rows.every((r) => r.translation === rows[0].translation);
    if (allSame && flags.length === 0) continue;

    totalFlagged++;
    md += `### ${key} ${base.dialog ? `(${base.dialog})` : ''}\n\n`;
    md += `- text: ${base.text}\n`;
    if (base.speaker) md += `- speaker: ${base.speaker}\n`;
    if (flags.length) md += `- ⚠ ${flags.join(' / ')}\n`;
    for (const { label, translation } of rows) {
      md += `- **${label}**: ${translation ?? '(null)'}\n`;
    }
    md += '\n';
  }
}

md += `\n---\n\n全${totalEntries}entry中、${totalFlagged}件を差分/異常ありとして掲載（完全一致は省略）。\n`;

const outPath = path.join(goldRoot, 'report.md');
fs.writeFileSync(outPath, md);
console.log(`書き出し: ${outPath}`);
console.log(`全${totalEntries}entry中、掲載${totalFlagged}件`);
