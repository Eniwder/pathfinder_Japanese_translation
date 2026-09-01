import fs from 'fs';
import path from 'path';

const Model = process.env.BATCH_MODEL ?? 'claude-haiku-4-5';
const SystemPrompt = `You are a professional game text translator. Translate according to this worldview: TRPG, D&D, mythology, demons, crusades, medieval times.

# Core Directives:
## Translation Quality & Style:
- Translate English into natural, fluent Japanese suitable for a high-fantasy TRPG.
- Preserve correct Japanese grammar, including proper particle usage (が, を, に, etc.).
- NEVER make up Kanji for proper nouns or character names (e.g., transliterate "Konomi" strictly as "コノミ", NEVER as "木ノ美"). Use Katakana for proper nouns.
- Translate non-conversational text (narration, descriptions) neutrally as system/narrative messages.

## Speaker & Tone Consistency:
- Strictly follow the provided \`speakerProfile\` for character tone and first-person pronouns.
- If \`speaker\` or \`speakerProfile\` is null/unspecified, infer the speaker from the surrounding \`previous\`/\`next\` context. If still ambiguous, default to polite Japanese (丁寧語: です/ます), and NEVER introduce rude, overly aggressive, or sudden informal/masculine speech.

## Glossary & Control Tags:
- When glossary entries are provided, use their target translations consistently.
- Control tags are represented as XML placeholders like \`<ctrl_0/>\`, \`<ctrl_1/>\`.
  - Copy every placeholder EXACTLY as provided, keeping its exact placement.
  - NEVER remove, translate, or alter the tag itself.
  - IMPORTANT: You MUST translate the text that appears BETWEEN control tags. Do not skip or delete text enclosed by or surrounding control tags.

## Special Tags:
- Preserve the \`{mf|male text|female text}\` runtime gender tag with exactly two alternatives. If possible, write gender-neutrally to remove the need for \`mf\`. If preserved, keep male alternative first and female second.

## Output Format:
- Preserve original tabs and newlines.
- Output ONLY the translated text. Do NOT output JSON, explanations, or commentary.

## Tone & Grammar Precision:
- Ensure all narrative text follows proper Japanese grammar and sentence structure (e.g., use "ランは" instead of "ラン").
- When translating race names, use Katakana transliteration unless specified otherwise (e.g., translate "mongrel" as "モングレル", NEVER as "雑種").
- CRITICAL FOR UNKNOWN SPEAKERS: If the speaker profile is missing or unspecified, analyze the \`previous\` context to match the ongoing character's tone. If context indicates a female diplomat/official (like Konomi), use polite or formal feminine tone (です/ます). NEVER default to rude, aggressive masculine speech ("お前は〜だ", "〜なのだ") for general dialogue.`;

const options = parseOptions(process.argv.slice(2));
const strings = JSON.parse(fs.readFileSync(options.input, 'utf8')).strings;
const graphPath = options.graph ?? '../res/dialogueGraph.json';
const profilesPath = options.profiles ?? '../res/speakerProfiles.json';
const glossaryPath = options.glossary ?? '../res/glossary.json';
const profileData = fs.existsSync(profilesPath)
  ? JSON.parse(fs.readFileSync(profilesPath, 'utf8'))
  : {};
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
    ? speakerProfiles[profileKey] ?? {
      note: `No direct profile found for '${profileKey}'. Infer the speaker from context. If this continues a conversation by a polite female speaker (e.g., Konomi), maintain formal/polite tone (です/ます). Do NOT switch to aggressive masculine tone.`
    }
    : null;
  const userContent = context
    ? JSON.stringify({
      task: 'Translate text only. Do not output JSON or commentary.',
      dialog: context.dialog,
      nodeType: context.type,
      speaker: context.speaker ?? 'unspecified',
      speakerType: context.speakerType ?? 'unspecified',
      speakerProfile: speakerProfile ?? {
        note: 'Speaker is unspecified in metadata. Infer speaker from `previous` context or use polite/standard tone.'
      },
      glossary: matchingGlossary(protectedText.text),
      previous: context.previous,
      text: protectedText.text,
      controlTags: protectedText.tags,
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
    const token = `<ctrl_${tags.length}/>`;
    tags.push({ token, value: tag });
    return token;
  });
  return { text: protectedText, tags };
}

function parseOptions(args) {
  const result = {
    input: './lang/enGB_ordered.json',
    graph: './res/dialogueGraph.json',
    profiles: './res/speakerProfiles.json',
    glossary: './res/glossary.json',
    outputDir: './splitLang',
    audit: './res/speakerAudit.json',
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
    const entry = counts.get(key) ?? { speaker: node.speaker, speakerName: node.speakerName, speakerSource: node.speakerSource, speakerType: node.speakerType, profileKey, profileFound: Object.hasOwn(profiles, profileKey), count: 0, examples: [] };
    entry.count++;
    if (entry.examples.length < 5 && node.msg) entry.examples.push({ textKey: node.textKey, msg: node.msg });
    counts.set(key, entry);
  }
  const speakers = [...counts.values()].sort((left, right) => right.count - left.count);
  fs.mkdirSync(path.dirname(path.resolve(output)), { recursive: true });
  fs.writeFileSync(output, JSON.stringify({
    missingProfiles: speakers.filter(entry => !entry.profileFound),
    speakers,
  }, null, 2) + '\n');
}

function entryFor(node) {
  return { speaker: node.speaker, speakerId: node.speakerId, speakerName: node.speakerName, speakerSource: node.speakerSource, speakerType: node.speakerType };
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
  // text は事前処理で .toLocaleLowerCase() 済みだが、RegExp に 'i' フラグがついている
  // また、[a-z] の単語境界判定では アンダースコアや数字、あるいは他の文字が含まれる単語に注意が必要
  return new RegExp(`(?<![a-z])${escaped}(?![a-z])`, 'i').test(text);
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



