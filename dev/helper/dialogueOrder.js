import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, '..');
const options = parseOptions(process.argv.slice(2));

if (options.help) {
  printHelp();
  process.exit(0);
}

const blueprintDir = path.resolve(rootDir, options.blueprints);
const languageFile = path.resolve(rootDir, options.lang);
const graphFile = path.resolve(rootDir, options.output);
const assets = loadBlueprints(blueprintDir);
const language = JSON.parse(fs.readFileSync(languageFile, 'utf8'));
const graph = buildGraph(assets, language.strings ?? {});

fs.writeFileSync(graphFile, JSON.stringify(graph, null, 2) + '\n');

if (options.reorder) {
  reorderLanguageFile(languageFile, options.orderedLanguage, graph);
}

console.log(`Parsed ${assets.size} blueprint assets.`);
console.log(`Found ${graph.dialogs.length} dialogues and ${graph.nodes.length} dialogue nodes.`);
console.log(`Wrote ${path.relative(rootDir, graphFile)}.`);
if (options.reorder) {
  console.log(`Reordered ${path.relative(rootDir, languageFile)}.`);
}

function parseOptions(args) {
  const result = {
    blueprints: '../blueprints',
    lang: '../dev/lang/enGB.json',
    orderedLanguage: '../dev/lang/enGB_ordered.json',
    output: '../dev/dialogueGraph.json',
    reorder: false,
    help: false,
  };

  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === '--reorder') result.reorder = true;
    else if (arg === '--help' || arg === '-h') result.help = true;
    else if (arg.startsWith('--blueprints=')) result.blueprints = arg.slice(13);
    else if (arg.startsWith('--lang=')) result.lang = arg.slice(7);
    else if (arg.startsWith('--ordered-lang=')) result.orderedLanguage = arg.slice(15);
    else if (arg.startsWith('--output=')) result.output = arg.slice(9);
    else throw new Error(`Unknown option: ${arg}`);
  }
  return result;
}

function printHelp() {
  console.log(`Usage: node dev/dialogueOrder.js [options]

Options:
  --reorder                 Write enGB_ordered.json with dialogue keys first.
  --blueprints=PATH         Blueprint directory (default: blueprints).
  --lang=PATH               Language JSON (default: dev/lang/enGB.json).
  --ordered-lang=PATH       Ordered language output (default: dev/lang/enGB_ordered.json).
  --output=PATH             Intermediate graph (default: dev/dialogueGraph.json).
`);
}

function loadBlueprints(directory) {
  const assets = new Map();
  for (const file of walk(directory)) {
    if (path.extname(file).toLowerCase() !== '.jbp') continue;
    let blueprint;
    try {
      blueprint = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch {
      continue;
    }

    const data = blueprint?.Data;
    const id = normalizeId(data?.AssetId ?? blueprint?.AssetId);
    if (!id || !data) continue;
    assets.set(id, { id, data, file: path.relative(rootDir, file).replaceAll(path.sep, '/') });
  }
  return assets;
}

function* walk(directory) {
  if (!fs.existsSync(directory)) return;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) yield* walk(entryPath);
    else yield entryPath;
  }
}

function buildGraph(assets, strings) {
  const dialogueAssets = [...assets.values()].filter(asset => hasType(asset.data, 'BlueprintDialog'));
  const nodes = [];
  const nodeById = new Map();
  const dialogues = [];

  for (const dialogue of dialogueAssets) {
    const firstCues = refs(dialogue.data.FirstCue?.Cues);
    const visited = new Set();
    const sequence = [];
    const edges = [];

    for (const cueId of firstCues) {
      visit(cueId, dialogue, visited, sequence, edges, assets, nodeById, strings);
    }

    const orderedSequence = sequence.map(id => nodeById.get(id));
    orderedSequence.forEach((node, index) => {
      node.dialog = assetName(dialogue);
      node.sequenceIndex = index;
      node.previous = orderedSequence[index - 1]?.msg ?? null;
      node.next = orderedSequence[index + 1]?.msg ?? null;
    });

    dialogues.push({
      id: dialogue.id,
      name: assetName(dialogue),
      dialog: assetName(dialogue),
      source: dialogue.file,
      firstCues,
      sequence: orderedSequence,
      edges,
    });
  }

  for (const node of nodeById.values()) nodes.push(node);
  return { version: 1, generatedFrom: 'blueprints', dialogs: dialogues, nodes };
}

function visit(id, dialogueAsset, visited, sequence, edges, assets, nodeById, strings) {
  if (visited.has(id)) return;
  const asset = assets.get(id);
  if (!asset) return; // アセットが存在しない場合のみ終了

  visited.add(id);

  const kind = nodeKind(asset.data);
  const nextIds = getNextIds(asset.data, assets);

  // 会話テキスト（Text.m_Key）が存在するノード（Cue / Answer 等）のみ会話ノードとして記録
  const hasTextKey = Boolean(asset.data.Text?.m_Key);
  if (hasTextKey) {
    const node = nodeById.get(id) ?? nodeRecord(asset, kind, assets, strings, dialogueAsset);
    node.dialogIds = [...new Set([...(node.dialogIds ?? []), dialogueAsset.id])];
    nodeById.set(id, node);
    sequence.push(id);
  }

  // 制御ノード（Check, Sequence 等）であっても止まらず、先のノードへトラバース（通過）を継続
  for (const nextId of nextIds) {
    edges.push({ from: id, to: nextId });
    visit(nextId, dialogueAsset, visited, sequence, edges, assets, nodeById, strings);
  }
}

// 各ノードタイプに応じた「次に遷移し得るノードID」を網羅的に抽出する関数
function getNextIds(data, assets) {
  const next = [];

  // Cue / Answer の標準参照
  if (data.Answers) next.push(...expandAnswerRefs(data.Answers, assets));
  if (data.Continue?.Cues) next.push(...refs(data.Continue.Cues));
  if (data.NextCue?.Cues) next.push(...refs(data.NextCue.Cues));

  // BlueprintCheck (スキルチェック分岐)
  if (data.m_Success) next.push(...refs([data.m_Success]));
  if (data.Success) next.push(...refs([data.Success]));
  if (data.m_Fail) next.push(...refs([data.m_Fail]));
  if (data.Fail) next.push(...refs([data.Fail]));

  // BlueprintCueSequence / BlueprintBookPage / その他汎用参照
  if (data.Cues) next.push(...refs(data.Cues));
  if (data.m_Exit) next.push(...refs([data.m_Exit]));
  if (data.Exit) next.push(...refs([data.Exit]));

  return [...new Set(next)];
}

function nodeKind(data) {
  if (hasType(data, 'BlueprintCue')) return 'Cue';
  if (hasType(data, 'BlueprintAnswer')) return 'Answer';
  if (hasType(data, 'BlueprintCheck')) return 'Check';
  if (hasType(data, 'BlueprintCueSequence')) return 'Sequence';
  if (hasType(data, 'BlueprintBookPage')) return 'BookPage';
  return 'Control';
}

function nodeRecord(asset, kind, assets, strings, dialogueAsset) {
  const data = asset.data;

  // 1. Cue固有の BlueprintUnit を検索
  let speakerId = normalizeId(data.Speaker?.m_Blueprint);

  // 2. Cue固有の Portrait 参照をフォールバック検索
  if (!speakerId) {
    speakerId = normalizeId(data.Speaker?.m_SpeakerPortrait);
  }

  // 3. Dialogueレベルのデフォルト話者をフォールバック検索 (NoSpeakerがfalseの場合)
  if (!speakerId && !data.Speaker?.NoSpeaker && dialogueAsset) {
    const dialogData = dialogueAsset.data;
    speakerId = normalizeId(dialogData.m_DefaultSpeaker?.m_Blueprint)
      ?? normalizeId(dialogData.m_DefaultSpeaker)
      ?? normalizeId(dialogData.Speaker?.m_Blueprint);
  }

  const speaker = speakerId ? assets.get(speakerId) : undefined;
  const speakerName = speaker ? assetName(speaker, strings) : (speakerId ? extractNameFromId(speakerId) : null);

  return {
    id: asset.id,
    type: kind,
    source: asset.file,
    dialog: null,
    textKey: data.Text?.m_Key ?? null,
    msg: data.Text?.m_Key ? strings[data.Text.m_Key] ?? null : null,
    speaker: speakerName || speakerId || null,
    speakerName: speakerName || null,
    speakerSource: speaker?.file ?? null,
    speakerType: speakerName || speakerId
      ? 'character'
      : kind === 'Answer'
        ? 'player'
        : data.Speaker?.NoSpeaker
          ? 'system'
          : 'unspecified',
    speakerId: speakerId ?? null,
    answers: kind === 'Cue' ? refs(data.Answers) : undefined,
    continue: kind === 'Cue' ? refs(data.Continue?.Cues) : undefined,
    nextCue: kind === 'Answer' ? refs(data.NextCue?.Cues) : undefined,
  };
}

function expandAnswerRefs(values, assets, seen = new Set()) {
  const result = [];
  for (const id of refs(values)) {
    if (seen.has(id)) continue;
    seen.add(id);
    const asset = assets.get(id);
    if (asset && hasType(asset.data, 'BlueprintAnswersList')) {
      result.push(...expandAnswerRefs(asset.data.Answers, assets, seen));
    } else {
      result.push(id);
    }
  }
  return result;
}

function reorderLanguageFile(file, output, graph) {
  const language = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!language.strings || typeof language.strings !== 'object') {
    throw new Error(`${file} does not contain a strings object.`);
  }

  const originalKeys = Object.keys(language.strings);
  const textKeys = new Map(graph.nodes.map(node => [node.id, node.textKey]));
  const dialogueKeys = graph.dialogs
    .flatMap(dialogue => dialogue.sequence)
    .map(node => textKeys.get(node.id) ?? node.textKey)
    .filter(Boolean);
  const orderedKeys = [...new Set([...dialogueKeys, ...originalKeys])]
    .filter(key => Object.hasOwn(language.strings, key));

  language.strings = Object.fromEntries(orderedKeys.map(key => [key, language.strings[key]]));
  fs.writeFileSync(output, JSON.stringify(language, null, 2) + '\n');
}

function assetName(asset, strings = {}) {
  const data = asset.data;

  // m_DisplayName の LocalizedString キーから英語表示名を取得（例: "Konomi"）
  const displayKey = data.m_DisplayName?.m_Key;
  if (displayKey && strings[displayKey]) {
    return strings[displayKey];
  }

  const value = data.Name ?? data.m_Name ?? data.AssetName;
  if (typeof value === 'string' && value.trim()) return value;

  return path.basename(asset.file, path.extname(asset.file));
}

function extractNameFromId(id) {
  if (!id) return null;
  // GUIDではなくアセット名文字列で入っている場合の処理
  const clean = id.replace(/_(Companion|npc|Player|Q\d+|Capital|ForDuel)$/i, '');
  return clean;
}

function hasType(data, suffix) {
  return typeof data?.$type === 'string' && data.$type.includes(suffix);
}

function refs(value) {
  if (!Array.isArray(value)) return [];
  return value.map(normalizeId).filter(Boolean);
}

function normalizeId(value) {
  if (typeof value !== 'string') return null;
  const id = value.startsWith('!bp_') ? value.slice(4) : value;
  return id || null;
}
