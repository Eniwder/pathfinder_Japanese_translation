import fs from 'node:fs';
import path from 'node:path';

// ---------------------------------------------------------------------------
// toBatchData.js — v2: Claude Code が直接翻訳するためのチャンク生成/書き戻しツール。
//
// 旧方式（Anthropic Batch API 用の jsonl リクエスト生成）は使わなくなったため全面書き換え。
// 代わりに、Claude Code のセッション内で直接読み書きできる小さな JSON チャンクを生成し
// （extract）、埋めた翻訳をまとめて zhCN.json に書き戻す（import）。話者監査（audit）も
// このファイルに残す。翻訳ルールの正本は CLAUDE.md の「翻訳ルール」節。
//
// Usage:
//   node toBatchData.js extract [options]   会話単位のチャンクを ./lang/chunks に書き出す
//   node toBatchData.js import  [options]   チャンクの "translation" を zhCN.json に統合する
//   node toBatchData.js audit   [options]   話者監査レポート（speakerAudit.json）を書き出す
//
// 巨大 JSON（zhCN.json 26MB など）を扱うので、メモリ不足になる場合は
//   node --max-old-space-size=8192 toBatchData.js ...
// を使うこと。
// ---------------------------------------------------------------------------

const HELP = `Usage:
  node toBatchData.js extract [--input=PATH] [--translated=PATH] [--graph=PATH] [--profiles=PATH]
                               [--glossary=PATH] [--output-dir=PATH] [--filter=todo|all|issues]
                               [--issues-report=PATH] [--issue-types=a,b,c] [--include-warnings]
                               [--chunk-size=N] [--start=N] [--limit=N] [--no-clean]

  node toBatchData.js import  [--chunks-dir=PATH] [--translated=PATH] [--backup=PATH]
                               [--no-mark-done] [--dry-run]

  node toBatchData.js audit   [--graph=PATH] [--profiles=PATH] [--glossary=PATH] [--output=PATH]
`;

const CONTROL_TAG_RE = /\{(?:g|d)\|[^}]*\}|\{\/(?:g|d)\}|\{n\}|\{\/n\}|\{br\}|\{name\}/g;

const [subcommand, ...rest] = process.argv.slice(2);

if (!subcommand || subcommand === '--help' || subcommand === '-h') {
  console.log(HELP);
  process.exit(subcommand ? 0 : 1);
} else if (subcommand === 'extract') {
  runExtract(parseExtractOptions(rest));
} else if (subcommand === 'import') {
  runImport(parseImportOptions(rest));
} else if (subcommand === 'audit') {
  runAudit(parseAuditOptions(rest));
} else {
  throw new Error(`Unknown subcommand: ${subcommand}. Use extract | import | audit (--help for usage).`);
}

// ---------------------------------------------------------------------------
// extract: enGB_ordered.json から翻訳対象を選び、会話単位でまとめたチャンクを書き出す
// ---------------------------------------------------------------------------

function runExtract(options) {
  const source = loadStrings(options.input);
  const translated = fs.existsSync(options.translated) ? loadStrings(options.translated) : {};
  const ctx = buildContext(options);

  // 原文が空文字のキーは元から訳す対象が無いので、どのフィルタでも常に除外する。
  const candidateKeys = Object.keys(source).filter(key => source[key] !== '');
  const filtered = applyFilter(candidateKeys, options, source, translated);
  const keys = filtered.slice(options.start, options.start + options.limit);

  if (keys.length === 0) {
    console.log('No keys matched the filter/range. Nothing to extract.');
    return;
  }

  if (options.clean && fs.existsSync(options.outputDir)) fs.rmSync(options.outputDir, { recursive: true, force: true });
  fs.mkdirSync(options.outputDir, { recursive: true });

  const chunks = packBlocks(groupByDialog(keys, ctx.dialogueContext), options.chunkSize);
  chunks.forEach((chunkKeys, index) => {
    const entries = chunkKeys.map(key => buildEntry(key, source[key], translated[key], ctx));
    writeChunk(options.outputDir, index, entries);
  });

  writeManifest(options.outputDir, {
    generatedAt: new Date().toISOString(),
    filter: options.filter,
    matchedTotal: filtered.length,
    extracted: keys.length,
    start: options.start,
    limit: Number.isFinite(options.limit) ? options.limit : 'Infinity',
    chunkSize: options.chunkSize,
    chunkCount: chunks.length,
    chunkFiles: chunks.map((_, index) => chunkFileName(index)),
  });

  console.log(`Extracted ${keys.length} / ${filtered.length} matched key(s) into ${chunks.length} chunk file(s) under ${options.outputDir}.`);
  console.log('Fill each entry\'s "translation" field (keep <ctrl_N/> tokens verbatim), then run: node toBatchData.js import');
}

function buildEntry(key, text, currentTranslation, ctx) {
  const node = ctx.dialogueContext.get(key);
  const protectedText = protectControlTags(text);
  return {
    key,
    dialog: node?.dialog ?? null,
    nodeType: node?.type ?? null,
    speaker: node?.speaker ?? 'unspecified',
    speakerType: node?.speakerType ?? 'unspecified',
    speakerProfile: ctx.speakerProfileFor(node),
    glossary: ctx.matchingGlossary(protectedText.text),
    previous: toList(node?.previous),
    next: toList(node?.next),
    text: protectedText.text,
    controlTags: protectedText.tags,
    current: currentTranslation ?? null,
    translation: null,
  };
}

function applyFilter(keys, options, source, translated) {
  if (options.filter === 'all') return keys;
  if (options.filter === 'todo') {
    return keys.filter(key => {
      const value = translated[key];
      return value === undefined || value.trim() === '' || value === source[key];
    });
  }
  if (options.filter === 'issues') {
    if (!fs.existsSync(options.issuesReport)) throw new Error(`Verify report not found: ${options.issuesReport} (run "npm run verify" first).`);
    const report = JSON.parse(fs.readFileSync(options.issuesReport, 'utf8'));
    const items = options.includeWarnings ? [...report.errors, ...report.warnings] : report.errors;
    const types = new Set(options.issueTypes);
    const flagged = new Set(items.filter(item => types.has(item.type)).map(item => item.key));
    return keys.filter(key => flagged.has(key));
  }
  throw new Error(`Unknown filter: ${options.filter} (use todo | all | issues).`);
}

// 隣接する同じ dialog のキーを 1 ブロックにまとめる。dialog が無いキー（会話外の UI 文言等）は
// 文脈を共有しないので、常に単独ブロックにする。
function groupByDialog(keys, dialogueContext) {
  const blocks = [];
  let currentDialog;
  for (const key of keys) {
    const dialog = dialogueContext.get(key)?.dialog ?? null;
    if (dialog !== null && dialog === currentDialog) {
      blocks[blocks.length - 1].push(key);
    } else {
      blocks.push([key]);
      currentDialog = dialog;
    }
  }
  return blocks;
}

// ブロックはできる限り分割せずチャンクに詰める。1 ブロックが chunkSize を超える場合はそのブロック
// だけで 1 チャンクにする（会話の途中で分断しない方を優先する）。
function packBlocks(blocks, chunkSize) {
  const chunks = [];
  let current = [];
  for (const block of blocks) {
    if (block.length > chunkSize) {
      if (current.length) { chunks.push(current); current = []; }
      chunks.push(block);
      continue;
    }
    if (current.length + block.length > chunkSize) { chunks.push(current); current = []; }
    current.push(...block);
  }
  if (current.length) chunks.push(current);
  return chunks;
}

function chunkFileName(index) {
  return `chunk_${String(index).padStart(4, '0')}.json`;
}

function writeChunk(dir, index, entries) {
  const payload = {
    chunkIndex: index,
    keys: entries.length,
    instructions: [
      '各 entry の "translation" に自然な日本語訳を入れる（CLAUDE.md の翻訳ルール・speakerProfile に従う）。',
      '<ctrl_N/> は個数・内容を変えずそのままコピーする（削除・翻訳・並べ替え禁止）。',
      '{mf|男性形|女性形} は男性形を先にしたまま2つとも残す（可能なら性別中立な訳にして mf 自体を無くしてよい）。',
      '訳さない/わからない entry は "translation": null のままにしておく（import 時にスキップされる）。',
    ],
    entries,
  };
  fs.writeFileSync(path.join(dir, chunkFileName(index)), JSON.stringify(payload, null, 2) + '\n');
}

function writeManifest(dir, info) {
  fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(info, null, 2) + '\n');
}

function parseExtractOptions(args) {
  const result = {
    input: './lang/enGB_ordered.json',
    translated: './lang/zhCN.json',
    graph: './res/dialogueGraph.json',
    profiles: './res/speakerProfiles.json',
    glossary: './res/glossary.json',
    outputDir: './lang/chunks',
    filter: 'todo',
    issuesReport: './test/verify-report.json',
    issueTypes: ['missing', 'empty', 'control-tags', 'mf'],
    includeWarnings: false,
    chunkSize: 50,
    start: 0,
    limit: Infinity,
    clean: true,
  };
  for (const arg of args) {
    if (arg.startsWith('--input=')) result.input = arg.slice(8);
    else if (arg.startsWith('--translated=')) result.translated = arg.slice(13);
    else if (arg.startsWith('--graph=')) result.graph = arg.slice(8);
    else if (arg.startsWith('--profiles=')) result.profiles = arg.slice(11);
    else if (arg.startsWith('--glossary=')) result.glossary = arg.slice(11);
    else if (arg.startsWith('--output-dir=')) result.outputDir = arg.slice(13);
    else if (arg.startsWith('--filter=')) result.filter = arg.slice(9);
    else if (arg.startsWith('--issues-report=')) result.issuesReport = arg.slice(16);
    else if (arg.startsWith('--issue-types=')) result.issueTypes = arg.slice(14).split(',').map(value => value.trim()).filter(Boolean);
    else if (arg === '--include-warnings') result.includeWarnings = true;
    else if (arg.startsWith('--chunk-size=')) result.chunkSize = Number(arg.slice(13));
    else if (arg.startsWith('--start=')) result.start = Number(arg.slice(8));
    else if (arg.startsWith('--limit=')) result.limit = Number(arg.slice(8));
    else if (arg === '--no-clean') result.clean = false;
    else if (arg === '--help' || arg === '-h') { console.log(HELP); process.exit(0); }
    else throw new Error(`Unknown option: ${arg}`);
  }
  return result;
}

// ---------------------------------------------------------------------------
// import: チャンクの "translation" を zhCN.json に統合する
// ---------------------------------------------------------------------------

function runImport(options) {
  if (!fs.existsSync(options.chunksDir)) throw new Error(`Chunks dir not found: ${options.chunksDir}`);
  const chunkFiles = fs.readdirSync(options.chunksDir)
    .filter(file => file.startsWith('chunk_') && file.endsWith('.json'))
    .sort();
  if (chunkFiles.length === 0) { console.log(`No pending chunk files in ${options.chunksDir}.`); return; }

  const base = fs.existsSync(options.translated)
    ? JSON.parse(fs.readFileSync(options.translated, 'utf8'))
    : { $id: '1', strings: {} };

  let merged = 0;
  let skippedEmpty = 0;
  const invalid = [];
  const doneFiles = [];

  for (const file of chunkFiles) {
    const fullPath = path.join(options.chunksDir, file);
    const chunk = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    let allResolved = true;
    for (const entry of chunk.entries ?? []) {
      if (entry.translation === null || entry.translation === undefined || entry.translation === '') {
        skippedEmpty++;
        allResolved = false;
        continue;
      }
      const problems = validateControlTags(entry.translation, entry.controlTags);
      if (problems.length) {
        invalid.push({ key: entry.key, file, problems });
        allResolved = false;
        continue;
      }
      base.strings[entry.key] = restoreControlTags(entry.translation, entry.controlTags);
      merged++;
    }
    if (allResolved) doneFiles.push(fullPath);
  }

  console.log(`Merged ${merged} translation(s). Skipped ${skippedEmpty} untranslated, ${invalid.length} invalid.`);
  if (invalid.length) {
    console.log('Invalid entries (control tag mismatch — fix and re-run import):');
    for (const item of invalid.slice(0, 20)) console.log(`  ${item.key} (${item.file}): ${item.problems.join('; ')}`);
    if (invalid.length > 20) console.log(`  ...and ${invalid.length - 20} more.`);
  }

  if (options.dryRun) { console.log('Dry run: zhCN.json was not modified.'); return; }
  if (merged === 0) { console.log('Nothing to write.'); return; }

  if (fs.existsSync(options.translated)) fs.copyFileSync(options.translated, options.backup);
  fs.mkdirSync(path.dirname(path.resolve(options.translated)), { recursive: true });
  fs.writeFileSync(options.translated, JSON.stringify(base, null, 2) + '\n');
  console.log(`Wrote ${options.translated} (backup saved to ${options.backup}).`);

  if (options.markDone) {
    for (const fullPath of doneFiles) fs.renameSync(fullPath, fullPath.replace(/\.json$/, '.done.json'));
    if (doneFiles.length) console.log(`Marked ${doneFiles.length} fully-resolved chunk file(s) as .done.json.`);
  }
}

function validateControlTags(translation, tags) {
  const problems = [];
  for (const tag of tags ?? []) {
    if (!translation.includes(tag.token)) problems.push(`missing ${tag.token}`);
  }
  return problems;
}

function restoreControlTags(text, tags) {
  return (tags ?? []).reduce((restored, entry) => restored.replaceAll(entry.token, entry.value), text);
}

function parseImportOptions(args) {
  const result = {
    chunksDir: './lang/chunks',
    translated: './lang/zhCN.json',
    backup: './lang/zhCN.json.bak',
    markDone: true,
    dryRun: false,
  };
  for (const arg of args) {
    if (arg.startsWith('--chunks-dir=')) result.chunksDir = arg.slice(13);
    else if (arg.startsWith('--translated=')) result.translated = arg.slice(13);
    else if (arg.startsWith('--backup=')) result.backup = arg.slice(9);
    else if (arg === '--no-mark-done') result.markDone = false;
    else if (arg === '--dry-run') result.dryRun = true;
    else if (arg === '--help' || arg === '-h') { console.log(HELP); process.exit(0); }
    else throw new Error(`Unknown option: ${arg}`);
  }
  return result;
}

// ---------------------------------------------------------------------------
// audit: 話者監査（旧 --audit-only 相当）
// ---------------------------------------------------------------------------

function runAudit(options) {
  if (!fs.existsSync(options.graph)) throw new Error(`Graph not found: ${options.graph} (run "npm run dialogue-order" first).`);
  const ctx = buildContext(options);
  const counts = new Map();
  for (const node of ctx.graph.nodes ?? []) {
    const key = node.speaker ?? `_${node.speakerType ?? 'unknown'}`;
    const profileKey = ctx.getProfileKey(entryFor(node));
    const entry = counts.get(key) ?? {
      speaker: node.speaker,
      speakerName: node.speakerName,
      speakerSource: node.speakerSource,
      speakerType: node.speakerType,
      profileKey,
      profileFound: Object.hasOwn(ctx.speakerProfiles, profileKey),
      count: 0,
      examples: [],
    };
    entry.count++;
    if (entry.examples.length < 5 && node.msg) entry.examples.push({ textKey: node.textKey, msg: node.msg });
    counts.set(key, entry);
  }
  const speakers = [...counts.values()].sort((left, right) => right.count - left.count);
  fs.mkdirSync(path.dirname(path.resolve(options.output)), { recursive: true });
  fs.writeFileSync(options.output, JSON.stringify({
    missingProfiles: speakers.filter(entry => !entry.profileFound),
    speakers,
  }, null, 2) + '\n');
  console.log(`Speaker audit written: ${options.output} (${speakers.length} distinct speakers, ${speakers.filter(entry => !entry.profileFound).length} missing profiles).`);
}

function entryFor(node) {
  return { speaker: node.speaker, speakerId: node.speakerId, speakerName: node.speakerName, speakerSource: node.speakerSource, speakerType: node.speakerType };
}

function parseAuditOptions(args) {
  const result = {
    graph: './res/dialogueGraph.json',
    profiles: './res/speakerProfiles.json',
    glossary: './res/glossary.json',
    output: './res/speakerAudit.json',
  };
  for (const arg of args) {
    if (arg.startsWith('--graph=')) result.graph = arg.slice(8);
    else if (arg.startsWith('--profiles=')) result.profiles = arg.slice(11);
    else if (arg.startsWith('--glossary=')) result.glossary = arg.slice(11);
    else if (arg.startsWith('--output=')) result.output = arg.slice(9);
    else if (arg === '--help' || arg === '-h') { console.log(HELP); process.exit(0); }
    else throw new Error(`Unknown option: ${arg}`);
  }
  return result;
}

// ---------------------------------------------------------------------------
// 共有ロジック（dialogueGraph / speakerProfiles / glossary の読み込みと文脈解決）
// ---------------------------------------------------------------------------

function buildContext(options) {
  const profileData = readJsonOrDefault(options.profiles, {});
  const characterProfiles = { ...(profileData.characters ?? {}) };
  delete characterProfiles.speakerAliases;
  const speakerProfiles = {
    _default: {
      gender: 'unknown',
      personality: 'unknown speaker',
      speechStyle: 'Translate naturally from context without inventing a character voice.',
      notes: 'Do not infer a named speaker when the blueprint does not identify one.',
    },
    Player: {
      gender: 'variable',
      personality: 'player character; adapt to the original text',
      speechStyle: 'Natural Japanese dialogue. Do not invent a fixed character voice.',
      notes: 'Use the protagonist gender switch when present and preserve player agency.',
    },
    _narrator: {
      gender: 'none',
      personality: 'neutral narrator',
      speechStyle: 'Clear, natural Japanese narration; descriptive rather than conversational.',
      notes: 'Use only for clearly narrated or flavor text.',
    },
    _system: {
      gender: 'none',
      personality: 'system message',
      speechStyle: 'Concise, neutral Japanese system text.',
      notes: 'Do not make this sound like a character speaking.',
    },
    _unspecified: {
      gender: 'unknown',
      personality: 'unattributed or mixed dialogue text',
      speechStyle: 'Preserve the distinction between narration and quoted dialogue without inventing a speaker.',
      notes: 'A null blueprint speaker may contain narration or unidentified dialogue.',
    },
    ...profileData,
    ...characterProfiles,
  };
  const speakerAliases = profileData.speakerAliases ?? profileData.characters?.speakerAliases ?? {};

  const glossaryData = readJsonOrDefault(options.glossary, {});
  const glossary = Array.isArray(glossaryData.glossary) ? glossaryData.glossary : (Array.isArray(glossaryData) ? glossaryData : []);

  const dialogueContext = new Map();
  let graph = null;
  if (options.graph && fs.existsSync(options.graph)) {
    graph = JSON.parse(fs.readFileSync(options.graph, 'utf8'));
    for (const node of graph.nodes ?? []) {
      if (node.textKey && !dialogueContext.has(node.textKey)) dialogueContext.set(node.textKey, node);
    }
  }

  function getProfileKey(context) {
    if (context?.speakerId && speakerAliases[context.speakerId]) return speakerAliases[context.speakerId];
    if (context?.speaker) {
      const name = speakerAliases[context.speaker] ?? context.speakerName ?? context.speaker;
      return findProfileName(name);
    }
    if (context?.speakerType === 'player') return 'Player';
    return `_${context?.speakerType ?? 'unknown'}`;
  }

  function findProfileName(name) {
    if (Object.hasOwn(speakerProfiles, name)) return name;
    const simplified = String(name).replace(/_(Companion|npc|Player|Q\d+|DrezenCapital|ForDuel)$/i, '');
    if (Object.hasOwn(speakerProfiles, simplified)) return simplified;
    const normalized = simplified.replace(/[^a-z0-9]/gi, '').toLowerCase();
    return Object.keys(speakerProfiles).find(key => key.replace(/[^a-z0-9]/gi, '').toLowerCase() === normalized) ?? name;
  }

  function speakerProfileFor(node) {
    if (!node) return null;
    const profileKey = getProfileKey(node);
    return speakerProfiles[profileKey] ?? {
      note: `No direct profile found for '${profileKey}'. Infer the speaker from context (previous/next). If unclear, use polite Japanese (です/ます) and avoid rude or aggressive tone.`,
    };
  }

  function matchingGlossary(text) {
    const normalized = text.toLocaleLowerCase();
    return glossary
      .filter(entry => typeof entry.source === 'string' && matchesGlossaryTerm(normalized, entry.source))
      .sort((left, right) => right.source.length - left.source.length)
      .map(entry => ({ source: entry.source, target: entry.target, ...(entry.note ? { note: entry.note } : {}) }));
  }

  return { dialogueContext, graph, speakerProfiles, getProfileKey, speakerProfileFor, matchingGlossary };
}

function matchesGlossaryTerm(text, source) {
  const escaped = source.toLocaleLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // text は事前処理で .toLocaleLowerCase() 済みだが、RegExp に 'i' フラグがついている
  // また、[a-z] の単語境界判定では アンダースコアや数字、あるいは他の文字が含まれる単語に注意が必要
  return new RegExp(`(?<![a-z])${escaped}(?![a-z])`, 'i').test(text);
}

function protectControlTags(text) {
  const tags = [];
  const protectedText = text.replace(CONTROL_TAG_RE, tag => {
    const token = `<ctrl_${tags.length}/>`;
    tags.push({ token, value: tag });
    return token;
  });
  return { text: protectedText, tags };
}

function toList(value) {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function loadStrings(file) {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!data.strings || typeof data.strings !== 'object') throw new Error(`${file} has no strings object.`);
  return data.strings;
}

function readJsonOrDefault(file, fallback) {
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : fallback;
}
