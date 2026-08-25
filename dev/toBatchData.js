import fs from 'fs';
import path from 'path';

const Model = process.env.BATCH_MODEL ?? 'claude-3-5-haiku-20241022';
const SystemPrompt = `You are a professional game text translator. Translate according to this worldview: TRPG, D&D, mythology, demons, crusades, medieval times.
# Conditions:
## Translate English into natural Japanese.
## Translate non-conversational text as system messages.
## Use katakana for proper nouns.
## When glossary entries are provided, use their target translations consistently. The note explains the intended meaning and is context, not text to output.
## Control tags are represented by placeholders such as __CTRL_0__. Copy every placeholder exactly as provided, in the same position and order. Never translate, remove, or reorder placeholders.
## The {mf|male text|female text} tag is special: it is a runtime gender switch for the protagonist. Preserve {mf|...|...} with exactly two alternatives, but translate the text inside both alternatives into natural Japanese. If possible, rewrite the surrounding sentence so it is gender-neutral and does not need an mf tag; do not leave awkward literal Japanese just to preserve an unnecessary gender distinction.
## For protagonist gender-dependent wording, use the masculine alternative first and feminine alternative second, matching the original order.
## Preserve tabs and newlines. Output only the translation, with no JSON or commentary.`;

const options = parseOptions(process.argv.slice(2));
const strings = JSON.parse(fs.readFileSync(options.input, 'utf8')).strings;
const graphPath = options.graph;
const profilesPath = options.profiles;
const glossaryPath = options.glossary;
const profileData = fs.existsSync(profilesPath)
  ? JSON.parse(fs.readFileSync(profilesPath, 'utf8'))
  : {};
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
  ...(profileData.characters ?? {}),
};
const glossaryData = fs.existsSync(glossaryPath)
  ? JSON.parse(fs.readFileSync(glossaryPath, 'utf8'))
  : {};
const glossary = glossaryData.glossary ?? glossaryData;
const dialogueContext = new Map();
if (fs.existsSync(graphPath)) {
  const graph = JSON.parse(fs.readFileSync(graphPath, 'utf8'));
  for (const node of graph.nodes ?? []) {
    if (node.textKey && !dialogueContext.has(node.textKey)) dialogueContext.set(node.textKey, node);
  }
  if (options.audit) writeSpeakerAudit(graph, speakerProfiles, options.audit);
  if (options.auditOnly) process.exit(0);
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
  const protectedText = protectControlTags(text);
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
      glossary: matchingGlossary(protectedText.text),
      previous: context.previous,
      text: protectedText.text,
      controlTags: protectedText.tags,
      glossary: matchingGlossary(protectedText.text),
      next: context.next,
    })
    : JSON.stringify({
      task: 'Translate text only. Do not output JSON or commentary.',
      text: protectedText.text,
      controlTags: protectedText.tags,
    });
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

function protectControlTags(text) {
  const tags = [];
  const protectedText = text.replace(/\{(?:g|d)\|[^}]*\}|\{\/(?:g|d)\}|\{n\}|\{\/n\}|\{br\}|\{name\}/g, tag => {
    const token = `__CTRL_${tags.length}__`;
    tags.push({ token, value: tag });
    return token;
  });
  return { text: protectedText, tags };
}

function parseOptions(args) {
  const result = {
    input: './lang/enGB_ordered.json',
    graph: './dialogueGraph.json',
    profiles: './speakerProfiles.json',
    glossary: './glossary.json',
    outputDir: './splitLang',
    audit: './speakerAudit.json',
    limit: Infinity,
    auditOnly: false,
  };
  for (const arg of args) {
    if (arg.startsWith('--input=')) result.input = arg.slice(8);
    else if (arg.startsWith('--graph=')) result.graph = arg.slice(8);
    else if (arg.startsWith('--profiles=')) result.profiles = arg.slice(11);
    else if (arg.startsWith('--glossary=')) result.glossary = arg.slice(11);
    else if (arg.startsWith('--output-dir=')) result.outputDir = arg.slice(13);
    else if (arg.startsWith('--audit=')) result.audit = arg.slice(8);
    else if (arg.startsWith('--limit=')) result.limit = Number(arg.slice(8));
    else if (arg === '--no-audit') result.audit = null;
    else if (arg === '--audit-only') result.auditOnly = true;
    else if (arg === '--help' || arg === '-h') {
      console.log('Usage: node toBatchData.js [--input=PATH] [--graph=PATH] [--profiles=PATH] [--glossary=PATH] [--output-dir=PATH] [--audit=PATH] [--audit-only] [--limit=N]');
      process.exit(0);
    } else throw new Error(`Unknown option: ${arg}`);
  }
  return result;
}

function writeSpeakerAudit(graph, profiles, output) {
  const counts = new Map();
  for (const node of graph.nodes ?? []) {
    const key = node.speaker ?? `_${node.speakerType ?? 'unknown'}`;
    const profileKey = getProfileKey(entryFor(node));
    const entry = counts.get(key) ?? { speaker: node.speaker, speakerType: node.speakerType, profileKey, profileFound: Boolean(profiles[profileKey]), count: 0, examples: [] };
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

function entryFor(node) {
  return { speaker: node.speaker, speakerType: node.speakerType };
}

function matchingGlossary(text) {
  if (!Array.isArray(glossary)) return [];
  const normalized = text.toLocaleLowerCase();
  return glossary
    .filter(entry => typeof entry.source === 'string' && matchesGlossaryTerm(normalized, entry.source))
    .sort((left, right) => right.source.length - left.source.length)
    .map(entry => ({ source: entry.source, target: entry.target, ...(entry.note ? { note: entry.note } : {}) }));
}

function matchesGlossaryTerm(text, source) {
  const escaped = source.toLocaleLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?<![a-z])${escaped}(?![a-z])`, 'i').test(text);
}

function getProfileKey(context) {
  if (context?.speaker) return context.speaker;
  if (context?.speakerType === 'player') return 'Player';
  return `_${context?.speakerType ?? 'unknown'}`;
}



