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
  reorderLanguageFile(languageFile, graph);
}

console.log(`Parsed ${assets.size} blueprint assets.`);
console.log(`Found ${graph.dialogs.length} dialogues and ${graph.nodes.length} dialogue nodes.`);
console.log(`Wrote ${path.relative(rootDir, graphFile)}.`);
if (options.reorder) {
  console.log(`Reordered ${path.relative(rootDir, languageFile)}.`);
}

function parseOptions(args) {
  const result = {
    blueprints: 'blueprints',
    lang: 'dev/lang/enGB.json',
    output: 'dev/dialogueGraph.json',
    reorder: false,
    help: false,
  };

  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === '--reorder') result.reorder = true;
    else if (arg === '--help' || arg === '-h') result.help = true;
    else if (arg.startsWith('--blueprints=')) result.blueprints = arg.slice(13);
    else if (arg.startsWith('--lang=')) result.lang = arg.slice(7);
    else if (arg.startsWith('--output=')) result.output = arg.slice(9);
    else throw new Error(`Unknown option: ${arg}`);
  }
  return result;
}

function printHelp() {
  console.log(`Usage: node dev/dialogueOrder.js [options]

Options:
  --reorder                 Rewrite enGB.json with dialogue keys first.
  --blueprints=PATH         Blueprint directory (default: blueprints).
  --lang=PATH               Language JSON (default: dev/lang/enGB.json).
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
      visit(cueId, dialogue.id, visited, sequence, edges, assets, nodeById, strings);
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

function visit(id, dialogId, visited, sequence, edges, assets, nodeById, strings) {
  if (visited.has(id)) return;
  const asset = assets.get(id);
  if (!asset || !isDialogueNode(asset.data)) return;
  visited.add(id);

  const kind = nodeKind(asset.data);
  const nextIds = kind === 'Cue'
    ? [...expandAnswerRefs(asset.data.Answers, assets), ...refs(asset.data.Continue?.Cues)]
    : refs(asset.data.NextCue?.Cues);
  const node = nodeById.get(id) ?? nodeRecord(asset, kind, assets, strings);
  node.dialogIds = [...new Set([...(node.dialogIds ?? []), dialogId])];
  nodeById.set(id, node);
  sequence.push(id);

  for (const nextId of nextIds) {
    edges.push({ from: id, to: nextId });
    visit(nextId, dialogId, visited, sequence, edges, assets, nodeById, strings);
  }
}

function nodeRecord(asset, kind, assets, strings) {
  const data = asset.data;
  const speakerId = normalizeId(data.Speaker?.m_Blueprint);
  const speaker = speakerId ? assets.get(speakerId) : undefined;
  return {
    id: asset.id,
    type: kind,
    source: asset.file,
    dialog: null,
    textKey: data.Text?.m_Key ?? null,
    msg: data.Text?.m_Key ? strings[data.Text.m_Key] ?? null : null,
    speaker: speaker ? assetName(speaker) : speakerId ? speakerId : null,
    speakerType: speaker
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

function reorderLanguageFile(file, graph) {
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
  fs.writeFileSync(file, JSON.stringify(language, null, 2) + '\n');
}

function assetName(asset) {
  const data = asset.data;
  const value = data.Name ?? data.m_Name ?? data.AssetName ?? data.m_DisplayName?.m_Key;
  if (typeof value === 'string') return value;
  if (typeof value?.m_Key === 'string') return value.m_Key;
  return path.basename(asset.file, path.extname(asset.file));
}

function nodeKind(data) {
  if (hasType(data, 'BlueprintCue')) return 'Cue';
  if (hasType(data, 'BlueprintAnswer')) return 'Answer';
  return null;
}

function isDialogueNode(data) {
  return nodeKind(data) !== null;
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
  return value.startsWith('!bp_') ? value.slice(4) : value;
}
