#!/usr/bin/env node
// クラウド作業用リポジトリ（非公開・一時用）側で使うCLI。
// ローカルの cloudSync.mjs push が helper/roundPrompts.mjs と一緒に作業用リポジトリの dev/ へ
// コピーする。本リポジトリ側では直接使わない（ローカルでは runRoundLoop.mjs が同じ処理を担う）。
//
// 作業用リポジトリのレイアウト（本リポジトリの dev/ 配下と同じ相対パスにしてある）:
//   dev/lang/rounds/round0106/chunk_0000.json ... manifest.json   未処理のround
//   dev/lang/rounds/round0106/done.json                           finish済みの印
//   dev/res/translationGuide.md ほか                               翻訳ルール・話者メモ・glossary
//
// 使い方（どこから実行してもよい。cwdは自動で dev/ に移る）:
//   node dev/cloud.mjs status
//   node dev/cloud.mjs chunk-prompt <round> <chunk_000N.json>
//   node dev/cloud.mjs merge <round>
//   node dev/cloud.mjs check <round>
//   node dev/cloud.mjs notes-prompt <round>
//   node dev/cloud.mjs finish <round> [--summary="..."] [--allow-untranslated]

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  chunkEntriesAt,
  translationsFileName,
  buildChunkPrompt,
  mergeTranslations,
  buildNotesPrompt,
} from './helper/roundPrompts.mjs';

process.chdir(path.dirname(fileURLToPath(import.meta.url)));

const ROUNDS_DIR_REL = 'lang/rounds';
const [cmd, ...rest] = process.argv.slice(2);
const positional = rest.filter((a) => !a.startsWith('--'));
const flags = Object.fromEntries(
  rest
    .filter((a) => a.startsWith('--'))
    .map((a) => {
      const m = a.match(/^--([^=]+)(?:=(.*))?$/);
      return [m[1], m[2] ?? true];
    })
);

function listRounds() {
  if (!fs.existsSync(ROUNDS_DIR_REL)) return [];
  return fs
    .readdirSync(ROUNDS_DIR_REL)
    .filter((d) => /^round\d+$/.test(d))
    .sort();
}

function roundDir(round) {
  if (!round || !/^round\d+$/.test(round)) throw new Error(`round名を指定してください（例: round0106）: ${round}`);
  const dir = path.join(ROUNDS_DIR_REL, round);
  if (!fs.existsSync(dir)) throw new Error(`${dir} がありません。`);
  return dir;
}

function chunkFilesOf(dir) {
  return fs
    .readdirSync(dir)
    .filter((f) => /^chunk_\d+\.json$/.test(f))
    .sort();
}

function checkRound(dir) {
  let total = 0;
  let untranslated = 0;
  const invalid = [];
  const perChunk = [];
  for (const f of chunkFilesOf(dir)) {
    const entries = chunkEntriesAt(path.join(dir, f));
    let done = 0;
    for (const e of entries) {
      total++;
      if (e.translation == null || e.translation === '') {
        untranslated++;
        continue;
      }
      done++;
      // toBatchData.js の validateControlTags と同じ判定（<ctrl_N/> の欠落）。
      const tags = e.tags ?? e.controlTags ?? [];
      const missing = tags.map((_, i) => `<ctrl_${i}/>`).filter((t) => !e.translation.includes(t));
      if (missing.length) invalid.push({ file: f, key: e.key, problems: missing.map((t) => `missing ${t}`) });
    }
    const pendingTranslations = fs.existsSync(path.join(dir, translationsFileName(f)));
    perChunk.push({ file: f, entries: entries.length, done, pendingTranslations });
  }
  return { total, untranslated, invalid, perChunk };
}

function printCheck(round, r) {
  console.log(`${round}: ${r.total - r.untranslated}/${r.total} 訳済み, invalid ${r.invalid.length}`);
  for (const c of r.perChunk) {
    console.log(
      `  ${c.file}: ${c.done}/${c.entries}` + (c.pendingTranslations ? '（未mergeの .translations.json あり）' : '')
    );
  }
  for (const i of r.invalid) console.log(`  ✗ ${i.file} ${i.key}: ${i.problems.join('; ')}`);
}

function status() {
  const rounds = listRounds();
  if (!rounds.length) {
    console.log('未処理のroundはありません。作業終了です。');
    return;
  }
  let next = null;
  for (const round of rounds) {
    const dir = path.join(ROUNDS_DIR_REL, round);
    if (fs.existsSync(path.join(dir, 'done.json'))) {
      console.log(`${round}: finish済み（ローカルへの取り込み待ち）`);
      continue;
    }
    const r = checkRound(dir);
    printCheck(round, r);
    if (!next) next = { round, r };
  }
  if (!next) {
    console.log('\n全roundがfinish済みです。commit/pushして作業終了してください。');
    return;
  }
  const { round, r } = next;
  const todo = r.perChunk.filter((c) => c.pendingTranslations || c.done < c.entries);
  console.log(`\n次の作業対象: ${round}`);
  if (todo.some((c) => c.pendingTranslations)) {
    console.log(`→ node dev/cloud.mjs merge ${round}`);
  } else if (todo.length) {
    console.log(`→ 未訳chunk: ${todo.map((c) => c.file).join(', ')}（chunk-prompt でプロンプトを取得してサブエージェントへ）`);
  } else if (r.invalid.length) {
    console.log('→ invalid のentryを直してから notes-prompt へ');
  } else {
    console.log(`→ node dev/cloud.mjs notes-prompt ${round}`);
  }
}

function merge(round) {
  const dir = roundDir(round);
  for (const f of chunkFilesOf(dir)) {
    const { merged, hasFile } = mergeTranslations(dir, f);
    if (hasFile) console.log(`${f}: ${merged}件をマージしました。`);
  }
  printCheck(round, checkRound(dir));
}

function notesPrompt(round) {
  const dir = roundDir(round);
  const glossaryEntries = JSON.parse(fs.readFileSync('./res/glossary.json', 'utf8')).glossary ?? [];
  process.stdout.write(
    buildNotesPrompt(`dev/${ROUNDS_DIR_REL}/${round}/`, path.resolve(dir), chunkFilesOf(dir), Number(round.slice(5)), glossaryEntries) +
      '\n'
  );
}

function finish(round) {
  const dir = roundDir(round);
  const leftovers = chunkFilesOf(dir).filter((f) => fs.existsSync(path.join(dir, translationsFileName(f))));
  if (leftovers.length) throw new Error(`未mergeの .translations.json があります（${leftovers.join(', ')}）。先に merge してください。`);
  const r = checkRound(dir);
  printCheck(round, r);
  if (r.invalid.length) throw new Error('invalid のentryがあります。<ctrl_N/> を補ってから再実行してください。');
  if (r.untranslated && !flags['allow-untranslated']) {
    throw new Error(
      `未訳が${r.untranslated}件あります。該当chunkを訳し直すか、やり直しても埋まらない場合だけ --allow-untranslated を付けてください。`
    );
  }
  // glossary.json が壊れると以後のextractが全滅するので、notesステップ後に機械的に検証する。
  try {
    JSON.parse(fs.readFileSync('./res/glossary.json', 'utf8'));
  } catch (e) {
    execFileSync('git', ['checkout', '--', 'res/glossary.json']);
    throw new Error(`glossary.json がJSONとして壊れていたため変更を破棄しました（${e.message}）。notesステップをやり直してください。`);
  }
  const summary = typeof flags.summary === 'string' ? flags.summary : '';
  fs.writeFileSync(
    path.join(dir, 'done.json'),
    JSON.stringify({ finishedAt: new Date().toISOString(), untranslated: r.untranslated, summary }, null, 2) + '\n'
  );
  console.log(`${round} をfinishしました。` + (r.untranslated ? `（未訳${r.untranslated}件はnullのまま）` : ''));
}

const commands = {
  status: () => status(),
  'chunk-prompt': () => {
    const dir = roundDir(positional[0]);
    const file = positional[1];
    if (!file || !fs.existsSync(path.join(dir, file))) throw new Error(`chunkファイルがありません: ${file}`);
    process.stdout.write(buildChunkPrompt(`dev/${ROUNDS_DIR_REL}/${positional[0]}`, file) + '\n');
  },
  merge: () => merge(positional[0]),
  check: () => {
    const r = checkRound(roundDir(positional[0]));
    printCheck(positional[0], r);
    if (r.invalid.length) process.exitCode = 1;
  },
  'notes-prompt': () => notesPrompt(positional[0]),
  finish: () => finish(positional[0]),
};

if (!commands[cmd]) {
  console.log('Usage: node dev/cloud.mjs <status|chunk-prompt|merge|check|notes-prompt|finish> [round] [chunk]');
  process.exit(cmd ? 1 : 0);
}
try {
  commands[cmd]();
} catch (e) {
  console.error(`✗ ${e.message}`);
  process.exit(1);
}
