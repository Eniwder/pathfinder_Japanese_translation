import fs from 'fs';
import path from 'path';

const Model = process.env.BATCH_MODEL ?? 'claude-3-5-haiku-20241022';
const SystemPrompt = `You are a professional game text translator. You translate according to the worldview of the given game tag and adhere to the conditions.   # Game tags: TRPG, D&D, mythology, demons, crusades, medieval times,   # Conditions:  ## Translate English into natural Japanese.  ## Translate non-conversational text as system messages.  ## Use katakana for proper nouns.  ## Do not translate anything enclosed in {}.  ## Do not translate  following: \t, \n.`;

const options = parseOptions(process.argv.slice(2));
const strings = JSON.parse(fs.readFileSync(options.input, 'utf8')).strings;
const graphPath = options.graph;
const profilesPath = options.profiles;
const profileData = fs.existsSync(profilesPath)
  ? JSON.parse(fs.readFileSync(profilesPath, 'utf8'))
  : {};
const speakerProfiles = { ...profileData, ...(profileData.characters ?? {}) };
const dialogueContext = new Map();
if (fs.existsSync(graphPath)) {
  const graph = JSON.parse(fs.readFileSync(graphPath, 'utf8'));
  for (const node of graph.nodes ?? []) {
    if (node.textKey && !dialogueContext.has(node.textKey)) dialogueContext.set(node.textKey, node);
  }
  if (options.audit) writeSpeakerAudit(graph, speakerProfiles, options.audit);
}
// {
//   "$id": "1",
//   "strings": {
//     "1a7cf3bf-cb34-488b-9469-7f92176211e5": "Attract critters from the whole area.",
//      ...
//    }
// }

// 1req ≦ 400 tokens?
// max token by batch = 2,000,000
// 2,000,000 / 400 = 5000

const SplitNum = 5000;
const keys = Object.keys(strings).slice(0, options.limit);
let lines = [];
let fileIdx = 0;
fs.mkdirSync(options.outputDir, { recursive: true });

for (let i = 0; i < keys.length; i++) {
  const text = strings[keys[i]];
  const context = dialogueContext.get(keys[i]);
  const profileKey = getProfileKey(context);
  const speakerProfile = context
    ? speakerProfiles[profileKey] ?? speakerProfiles._default ?? null
    : null;
  const userContent = context
    ? JSON.stringify({
      task: 'Translate text only. Do not output JSON or commentary.',
      dialog: context.dialog,
      nodeType: context.type,
      speaker: context.speaker,
      speakerType: context.speakerType,
      speakerProfile,
      previous: context.previous,
      text,
      next: context.next,
    })
    : text;
  const prompt = {
    custom_id: -1,
    params: {
      model: Model,
      max_tokens: 1024,
      system: SystemPrompt,
      messages: [
        { role: 'user', content: userContent }
      ]
    }
  };
  prompt.custom_id = keys[i];
  lines.push(prompt);
  if (((i + 1) % SplitNum) === 0) {
    writeBatchFile(fileIdx, lines);
    fileIdx++;
    lines = [];
  }
}

if (lines.length > 0) writeBatchFile(fileIdx, lines);

function writeBatchFile(index, batchLines) {
  const fileName = `batch_${index}.jsonl`;
  fs.writeFileSync(`${options.outputDir}/${fileName}`, batchLines.map(line => JSON.stringify(line)).join('\n') + '\n');
}

function parseOptions(args) {
  const result = {
    input: './lang/enGB_ordered.json',
    graph: './dialogueGraph.json',
    profiles: './speakerProfiles.json',
    outputDir: './splitLang',
    audit: './speakerAudit.json',
    limit: Infinity,
  };
  for (const arg of args) {
    if (arg.startsWith('--input=')) result.input = arg.slice(8);
    else if (arg.startsWith('--graph=')) result.graph = arg.slice(8);
    else if (arg.startsWith('--profiles=')) result.profiles = arg.slice(11);
    else if (arg.startsWith('--output-dir=')) result.outputDir = arg.slice(13);
    else if (arg.startsWith('--audit=')) result.audit = arg.slice(8);
    else if (arg.startsWith('--limit=')) result.limit = Number(arg.slice(8));
    else if (arg === '--no-audit') result.audit = null;
    else if (arg === '--help' || arg === '-h') {
      console.log('Usage: node toBatchData.js [--input=PATH] [--graph=PATH] [--profiles=PATH] [--output-dir=PATH] [--audit=PATH] [--limit=N]');
      process.exit(0);
    } else throw new Error(`Unknown option: ${arg}`);
  }
  return result;
}

function writeSpeakerAudit(graph, profiles, output) {
  const counts = new Map();
  for (const node of graph.nodes ?? []) {
    const key = node.speaker ?? `_${node.speakerType ?? 'unknown'}`;
    const entry = counts.get(key) ?? { speaker: node.speaker, speakerType: node.speakerType, count: 0, examples: [] };
    entry.count++;
    if (entry.examples.length < 5 && node.msg) entry.examples.push({ textKey: node.textKey, msg: node.msg });
    counts.set(key, entry);
  }
  const speakers = [...counts.values()].sort((left, right) => right.count - left.count);
  fs.mkdirSync(path.dirname(path.resolve(output)), { recursive: true });
  fs.writeFileSync(output, JSON.stringify({
    missingProfiles: speakers.filter(entry => !profiles[getProfileKey(entry)]),
    speakers,
  }, null, 2) + '\n');
}

function getProfileKey(context) {
  if (context?.speaker) return context.speaker;
  if (context?.speakerType === 'player') return 'Player';
  return `_${context?.speakerType ?? 'unknown'}`;
}



