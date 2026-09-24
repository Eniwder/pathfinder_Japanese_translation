#!/usr/bin/env node
// 既存round（退避済みchunk）を別モデルで訳し直し、元の訳と並べて比較するための実験ランナー。
// 本番の zhCN.json / v2Progress.json / lang/chunks には一切触れない。
//
// 元の訳（例: Opus）が見えないよう、別モデルは「ゲームdir外のサンドボックス」で実行する。
// サンドボックスには 訳文を空にしたchunk + translationGuide.md + CLAUDE.md だけを置く。
// claude -p は cwd 外を読めない（dontAsk）ので、元の訳・リポジトリ本体には到達できない。
//
// 使い方（dev/ で実行）:
//   node experiments/runBlindCompare.mjs --review=2026-09-24_round105 --model=claude-sonnet-5 --label=sonnet
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const args = Object.fromEntries(process.argv.slice(2).map((a) => { const m = a.match(/^--([^=]+)(?:=(.*))?$/); return m ? [m[1], m[2] ?? true] : [a, true]; }));
const review = args.review, model = args.model, label = args.label ?? 'model';
if (!review || !model) { console.error('--review= --model= が必要'); process.exit(1); }

const reviewDir = path.resolve('lang/chunks_review', review);
const expDir = path.resolve('lang/experiments', `compare_${review}`);
const sandbox = path.resolve(typeof args.sandbox === 'string' ? args.sandbox : path.join(os.tmpdir(), `blind_${review}_${label}`));
const chunkFiles = fs.readdirSync(reviewDir).filter((f) => /^chunk_\d+\.json$/.test(f)).sort();

// --- 元の訳（opus等）を expDir/<origLabel>/ に保存、種chunk（訳文null）を expDir/source/ に保存
const origLabel = args.orig ?? 'opus';
for (const d of ['source', origLabel, label]) fs.mkdirSync(path.join(expDir, d), { recursive: true });
const entriesOf = (c) => (c.entries ?? c.blocks.flatMap((b) => b.entries ?? []));
for (const f of chunkFiles) {
  const c = JSON.parse(fs.readFileSync(path.join(reviewDir, f), 'utf8'));
  fs.writeFileSync(path.join(expDir, origLabel, f), JSON.stringify(c, null, 2) + '\n');
  for (const e of entriesOf(c)) e.translation = null;
  fs.writeFileSync(path.join(expDir, 'source', f), JSON.stringify(c, null, 2) + '\n');
}

// --- サンドボックス構築（本番と同じ相対パス構成: dev/lang/chunks, dev/res/translationGuide.md）
fs.rmSync(sandbox, { recursive: true, force: true });
fs.mkdirSync(path.join(sandbox, 'dev/lang/chunks'), { recursive: true });
fs.mkdirSync(path.join(sandbox, 'dev/res'), { recursive: true });
fs.copyFileSync('res/translationGuide.md', path.join(sandbox, 'dev/res/translationGuide.md'));
fs.copyFileSync('CLAUDE.md', path.join(sandbox, 'dev/CLAUDE.md'));
fs.copyFileSync('../CLAUDE.md', path.join(sandbox, 'CLAUDE.md'));
for (const f of chunkFiles) fs.copyFileSync(path.join(expDir, 'source', f), path.join(sandbox, 'dev/lang/chunks', f));

// --- 本番と同一のプロンプトを runRoundLoop.mjs から取り出す
const src = fs.readFileSync('runRoundLoop.mjs', 'utf8');
const fnText = src.match(/function translationsFileName[\s\S]*?\n}\n/)[0] + src.match(/function buildChunkPrompt[\s\S]*?\n}\n/)[0];
const buildChunkPrompt = new Function(`${fnText}; return buildChunkPrompt;`)();

const usageLog = path.join(expDir, 'usage.jsonl');
for (const f of chunkFiles) {
  const t0 = Date.now();
  console.log(`[${label}] ${f} 翻訳開始`);
  const raw = execFileSync('claude', ['-p', '--model', model, '--allowedTools', 'Read Write Edit Grep Glob',
    '--permission-mode', 'dontAsk', '--permission-prompts', 'none', '--output-format', 'json'], {
    cwd: sandbox, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, shell: process.platform === 'win32', input: buildChunkPrompt(f),
  });
  const parsed = JSON.parse(raw);
  fs.appendFileSync(usageLog, JSON.stringify({ label, model, chunk: f, usage: parsed.usage, total_cost_usd: parsed.total_cost_usd, duration_ms: parsed.duration_ms, num_turns: parsed.num_turns, result: parsed.result }) + '\n');
  const transPath = path.join(sandbox, 'dev/lang/chunks', f.replace(/\.json$/, '.translations.json'));
  const tr = JSON.parse(fs.readFileSync(transPath, 'utf8'));
  const c = JSON.parse(fs.readFileSync(path.join(expDir, 'source', f), 'utf8'));
  let n = 0;
  for (const e of entriesOf(c)) { const v = tr[e.key]; if (typeof v === 'string' && v.trim()) { e.translation = v; n++; } }
  fs.writeFileSync(path.join(expDir, label, f), JSON.stringify(c, null, 2) + '\n');
  console.log(`[${label}] ${f} 完了 ${n}/${entriesOf(c).length}件 $${parsed.total_cost_usd?.toFixed(2)} ${Math.round((Date.now() - t0) / 1000)}s`);
}
