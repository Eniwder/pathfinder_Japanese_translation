#!/usr/bin/env node
// v2翻訳ラウンドをクラウドセッション（claude.ai/code）で処理するための同期スクリプト。
//
// 原文入りのchunkを本リポジトリ（公開）の履歴に載せないよう、非公開の作業用リポジトリ
// （デフォルト https://github.com/Eniwder/wotr_trans_tmp ）を別の場所にcloneして、
// そこへchunkと翻訳ルール類を送り、訳し終えたroundを受け取る。
// 作業用リポジトリ側の手順は helper/cloudWorkCLAUDE.md（→ 作業用リポジトリの CLAUDE.md）。
//
// 使い方（dev/ ディレクトリで実行）:
//   node cloudSync.mjs push --rounds=5     # pull を済ませてから、次の5round分をextractして送る
//                                           # （lang/chunks/ に途中のroundがあればそれも引き継ぐ）
//   node cloudSync.mjs pull                # finish済みroundを取り込む（lang/chunks_review/へ退避、
//                                           # res/の更新を反映、v2Progress.json更新、commit）
//   node cloudSync.mjs status              # 作業用リポジトリ側の状況を表示
//
// オプション:
//   --work-dir=<path>    作業用リポジトリのclone先（デフォルト: 本リポジトリの隣の wotr_trans_tmp/）
//   --remote=<url>       作業用リポジトリのURL
//   --branch=<name>      クラウドセッションがpushしたブランチ（省略時はmainより進んでいる
//                        ブランチを自動検出。複数あればエラーで一覧を出す）
//   --limit=300 --chunk-size=200   push時のextract設定（runRoundLoop.mjs と同じデフォルト）
//   --no-push            作業用リポジトリへのgit pushをしない（動作確認用）
//
// 取り込んだroundは runRoundLoop.mjs と同じく merged:false で chunks_review/ に置くだけで、
// zhCN.json へのimportはしない（importはユーザーの指示があってから）。

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { collectDialogs, mergeTranslations } from './helper/roundPrompts.mjs';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    return m ? [m[1], m[2] ?? true] : [a, true];
  })
);
const command = process.argv[2];

const repoRoot = path.resolve('..');
const workDir = path.resolve(typeof args['work-dir'] === 'string' ? args['work-dir'] : path.join(repoRoot, '..', 'wotr_trans_tmp'));
const remote = typeof args.remote === 'string' ? args.remote : 'https://github.com/Eniwder/wotr_trans_tmp.git';
const limit = Number(args.limit ?? 300);
const chunkSize = Number(args['chunk-size'] ?? 200);
const noPush = !!args['no-push'];

const progressPath = path.resolve('./res/v2Progress.json');
const chunksDir = path.resolve('./lang/chunks');
const workRoundsDir = path.join(workDir, 'dev', 'lang', 'rounds');
// runRoundLoop.mjs と同じ終了条件の目安。
const TOTAL_KEYS = 110401;

// 作業用リポジトリと双方向に同期する翻訳ルール類（notesステップがクラウド側で更新する）。
const SHARED_RES = ['translationGuide.md', 'translationGuideNotes.md', 'v2CharacterNotes.md', 'glossary.json'];
// 作業用リポジトリへ一方向に配るツール類（送り元 → 作業用リポジトリ内のパス）。
const TOOL_FILES = [
  ['cloud.mjs', 'dev/cloud.mjs'],
  ['helper/roundPrompts.mjs', 'dev/helper/roundPrompts.mjs'],
  ['helper/cloudWorkCLAUDE.md', 'CLAUDE.md'],
];

// パスに空白を含む（"Pathfinder Second Adventure"）ので shell は使わない。
function run(cmd, cmdArgs, cwd) {
  console.log(`$ ${cmd} ${cmdArgs.join(' ')}`);
  return execFileSync(cmd, cmdArgs, { cwd, encoding: 'utf8', maxBuffer: 1024 * 1024 * 64 });
}

function git(cwd, ...gitArgs) {
  return run('git', gitArgs, cwd);
}

function gitQuiet(cwd, ...gitArgs) {
  try {
    return execFileSync('git', gitArgs, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return null;
  }
}

function readProgress() {
  return JSON.parse(fs.readFileSync(progressPath, 'utf8'));
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function roundName(roundNo) {
  return `round${String(roundNo).padStart(4, '0')}`;
}

function listWorkRounds() {
  if (!fs.existsSync(workRoundsDir)) return [];
  return fs
    .readdirSync(workRoundsDir)
    .filter((d) => /^round\d+$/.test(d))
    .sort()
    .map((name) => {
      const dir = path.join(workRoundsDir, name);
      return {
        name,
        dir,
        roundNo: Number(name.slice(5)),
        manifest: JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8')),
        done: fs.existsSync(path.join(dir, 'done.json'))
          ? JSON.parse(fs.readFileSync(path.join(dir, 'done.json'), 'utf8'))
          : null,
      };
    });
}

function chunkFilesIn(dir) {
  return fs
    .readdirSync(dir)
    .filter((f) => /^chunk_\d+\.json$/.test(f))
    .sort();
}

function ensureClone() {
  if (!fs.existsSync(workDir)) {
    run('git', ['clone', remote, workDir], repoRoot);
  }
  // 空リポジトリをcloneした直後はコミットが無いので、ブランチ名をmainに揃えておく。
  if (!gitQuiet(workDir, 'rev-parse', '--verify', 'HEAD')) {
    git(workDir, 'symbolic-ref', 'HEAD', 'refs/heads/main');
  }
}

// origin/main と、クラウドセッションがpushしたブランチ（claude/... 等）を取り込む。
function syncWorkRepo() {
  ensureClone();
  git(workDir, 'fetch', 'origin', '--prune');
  if (gitQuiet(workDir, 'rev-parse', '--verify', 'origin/main')) {
    if (gitQuiet(workDir, 'rev-parse', '--verify', 'HEAD')) git(workDir, 'merge', '--ff-only', 'origin/main');
    else git(workDir, 'reset', '--hard', 'origin/main');
  }
  if (!gitQuiet(workDir, 'rev-parse', '--verify', 'HEAD')) return;

  let branches;
  if (typeof args.branch === 'string') {
    branches = [args.branch.startsWith('origin/') ? args.branch : `origin/${args.branch}`];
  } else {
    const refs = (gitQuiet(workDir, 'for-each-ref', '--format=%(refname:short)', 'refs/remotes/origin') ?? '')
      .split('\n')
      .filter((r) => r && r !== 'origin/main' && r !== 'origin/HEAD' && r !== 'origin');
    branches = refs.filter((r) => Number(gitQuiet(workDir, 'rev-list', '--count', `HEAD..${r}`) ?? 0) > 0);
  }
  if (branches.length > 1) {
    throw new Error(
      `mainより進んでいるブランチが複数あります: ${branches.join(', ')}\n` +
        '  取り込むものを --branch=<name> で指定してください（1回に1ブランチずつ）。'
    );
  }
  if (branches.length === 1) git(workDir, 'merge', '--no-edit', branches[0]);
}

function commitAndPushWork(message) {
  git(workDir, 'add', '-A');
  if (gitQuiet(workDir, 'status', '--porcelain')) git(workDir, 'commit', '-m', message);
  // 以前 --no-push で実行した分など、未pushのコミットが残っていればそれも送る。
  const unpushed = gitQuiet(workDir, 'rev-parse', '--verify', 'origin/main')
    ? Number(gitQuiet(workDir, 'rev-list', '--count', 'origin/main..HEAD') ?? 0)
    : Number(gitQuiet(workDir, 'rev-list', '--count', 'HEAD') ?? 0);
  if (!unpushed) {
    console.log('作業用リポジトリに送る変更はありません。');
    return;
  }
  if (noPush) console.log('--no-push のため作業用リポジトリへのpushは省略しました。');
  else git(workDir, 'push', '-u', 'origin', 'main');
}

function validateReviewDir(reviewDirAbs) {
  // unknown key（UUID書き間違い）と <ctrl_N/> 欠落を toBatchData.js 側の検証で確認する。
  const out = run('node', ['toBatchData.js', 'import', '--dry-run', `--chunks-dir=${reviewDirAbs}`], process.cwd());
  const m = out.match(/Skipped (\d+) untranslated, (\d+) invalid/);
  if (!m) throw new Error(`import --dry-run の出力を解釈できませんでした:\n${out}`);
  if (Number(m[2]) > 0) throw new Error(`${reviewDirAbs} に invalid が${m[2]}件あります:\n${out}`);
  return Number(m[1]);
}

function pull() {
  // pullで res/ を作業用リポジトリの内容で上書きするので、ローカルの未コミット編集を消さないよう止める。
  const dirty = gitQuiet(repoRoot, 'status', '--porcelain', '--', ...SHARED_RES.map((f) => `dev/res/${f}`), 'dev/res/v2Progress.json');
  if (dirty) throw new Error(`dev/res/ に未コミットの変更があります。先にcommitしてください:\n${dirty}`);

  syncWorkRepo();
  const doneRounds = [];
  for (const r of listWorkRounds()) {
    if (!r.done) break; // 途中に未finishのroundがあれば、それ以降は順番を守るため取り込まない
    doneRounds.push(r);
  }
  if (!doneRounds.length) {
    console.log('取り込めるfinish済みroundはありません。');
    return 0;
  }

  const glossaryText = fs.readFileSync(path.join(workDir, 'dev', 'res', 'glossary.json'), 'utf8');
  JSON.parse(glossaryText); // 壊れていれば例外で止める（ローカル側へ持ち込まない）

  const progress = readProgress();
  const imported = [];
  for (const r of doneRounds) {
    const expectedRound = progress.history.length + 1;
    if (r.roundNo !== expectedRound || r.manifest.start !== progress.nextStart) {
      throw new Error(
        `${r.name}（start=${r.manifest.start}）は v2Progress.json の次の位置（round${expectedRound}, start=${progress.nextStart}）と一致しません。`
      );
    }
    const reviewDirRel = `lang/chunks_review/${todayStr()}_round${r.roundNo}`;
    const reviewDirAbs = path.resolve(reviewDirRel);
    if (fs.existsSync(reviewDirAbs)) throw new Error(`${reviewDirRel} が既に存在します。`);
    fs.mkdirSync(reviewDirAbs, { recursive: true });
    const files = chunkFilesIn(r.dir);
    for (const f of [...files, 'manifest.json']) fs.copyFileSync(path.join(r.dir, f), path.join(reviewDirAbs, f));
    const untranslated = validateReviewDir(reviewDirAbs);
    if (untranslated) console.warn(`⚠ ${r.name}: ${untranslated}件が未訳のまま残っています（後で人間の確認が必要）。`);

    progress.history.push({
      start: r.manifest.start,
      limit: r.manifest.limit,
      merged: false,
      reviewDir: `dev/${reviewDirRel}/`,
      coveredDialogs: collectDialogs(reviewDirAbs, files),
      note: `v2リライト第${r.roundNo}弾（クラウドセッションで実行、cloudSync.mjs で取り込み）。` + (r.done.summary ? ' ' + r.done.summary : ''),
    });
    progress.nextStart = r.manifest.start + r.manifest.limit;
    imported.push(r);
  }

  for (const f of SHARED_RES) fs.copyFileSync(path.join(workDir, 'dev', 'res', f), path.resolve('./res', f));
  progress.updatedAt = new Date().toISOString();
  fs.writeFileSync(progressPath, JSON.stringify(progress, null, 2) + '\n');

  const label = imported.length === 1 ? `round${imported[0].roundNo}` : `round${imported[0].roundNo}〜${imported.at(-1).roundNo}`;
  git(repoRoot, 'add', '--', 'dev/res');
  git(repoRoot, 'commit', '-m', `${label}完了（クラウド）`);

  for (const r of imported) fs.rmSync(r.dir, { recursive: true });
  commitAndPushWork(`${label}をローカルへ取り込み`);
  console.log(`\n${label} を取り込みました（chunks_review/ に退避、zhCN.json へのimportは未実施）。`);
  return imported.length;
}

function moveChunksToWork(roundNo) {
  const dest = path.join(workRoundsDir, roundName(roundNo));
  if (fs.existsSync(dest)) throw new Error(`${dest} が既に存在します。`);
  fs.mkdirSync(dest, { recursive: true });
  const files = chunkFilesIn(chunksDir);
  // runRoundLoop.mjs が途中で落ちた場合の中間ファイルは、先にchunk本体へマージしておく。
  for (const f of files) mergeTranslations(chunksDir, f);
  for (const f of [...files, 'manifest.json']) fs.renameSync(path.join(chunksDir, f), path.join(dest, f));
  const rest = fs.readdirSync(chunksDir);
  if (rest.length) throw new Error(`lang/chunks/ に想定外のファイルが残っています: ${rest.join(', ')}`);
  console.log(`→ ${roundName(roundNo)}（${files.length} chunk）を作業用リポジトリへ移動しました。`);
}

function push() {
  const rounds = Number(args.rounds ?? 1);
  pull();

  const progress = readProgress();
  const pending = listWorkRounds();
  let roundNo = progress.history.length + 1 + pending.length;
  let start = pending.length ? pending.at(-1).manifest.start + pending.at(-1).manifest.limit : progress.nextStart;
  let added = 0;

  // runRoundLoop.mjs が途中で止まったroundが lang/chunks/ に残っていれば、そのまま引き継ぐ。
  if (fs.existsSync(chunksDir) && fs.readdirSync(chunksDir).length) {
    const manifestPath = path.join(chunksDir, 'manifest.json');
    const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : null;
    if (!manifest || manifest.start !== start) {
      throw new Error(`lang/chunks/ に次の位置（start=${start}）と一致しない残骸があります。手動で確認してください。`);
    }
    console.log(`lang/chunks/ の途中のround（start=${start}）を引き継ぎます。`);
    moveChunksToWork(roundNo);
    start += manifest.limit;
    roundNo++;
    added++;
  }

  while (added < rounds && start < TOTAL_KEYS) {
    run(
      'node',
      ['--max-old-space-size=8192', 'toBatchData.js', 'extract', '--filter=all', `--start=${start}`, `--limit=${limit}`, `--chunk-size=${chunkSize}`],
      process.cwd()
    );
    moveChunksToWork(roundNo);
    start += limit;
    roundNo++;
    added++;
  }

  for (const f of SHARED_RES) {
    fs.mkdirSync(path.join(workDir, 'dev', 'res'), { recursive: true });
    fs.copyFileSync(path.resolve('./res', f), path.join(workDir, 'dev', 'res', f));
  }
  for (const [src, dest] of TOOL_FILES) {
    fs.mkdirSync(path.dirname(path.join(workDir, dest)), { recursive: true });
    fs.copyFileSync(path.resolve(src), path.join(workDir, dest));
  }
  commitAndPushWork(`${added} round追加（〜${roundName(roundNo - 1)}）`);
  console.log(`\n${added} round を送りました。クラウドセッションで「CLAUDE.mdの手順で作業して」と依頼してください。`);
}

function status() {
  syncWorkRepo();
  const progress = readProgress();
  console.log(`ローカル: 次は round${progress.history.length + 1}（start=${progress.nextStart}）`);
  const rounds = listWorkRounds();
  if (!rounds.length) console.log('作業用リポジトリ: 未処理のroundなし');
  for (const r of rounds) {
    let translated = 0;
    let total = 0;
    for (const f of chunkFilesIn(r.dir)) {
      const c = JSON.parse(fs.readFileSync(path.join(r.dir, f), 'utf8'));
      for (const e of (c.blocks ?? []).flatMap((b) => b.entries ?? [])) {
        total++;
        if (e.translation != null && e.translation !== '') translated++;
      }
    }
    console.log(`作業用リポジトリ: ${r.name} start=${r.manifest.start} ${translated}/${total}${r.done ? ' finish済み' : ''}`);
  }
}

const commands = { push, pull, status };
if (!commands[command]) {
  console.log('Usage: node cloudSync.mjs <push|pull|status> [--rounds=N] [--branch=<name>] [--no-push]');
  process.exit(command ? 1 : 0);
}
try {
  commands[command]();
} catch (e) {
  console.error(`\n✗ ${e.message}`);
  process.exit(1);
}
