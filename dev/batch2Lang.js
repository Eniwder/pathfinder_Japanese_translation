import fs from 'node:fs';
import path from 'node:path';

const options = parseOptions(process.argv.slice(2));
const requests = loadRequests(options.input);
const results = loadResults(options.results);
const base = options.base && fs.existsSync(options.base)
  ? JSON.parse(fs.readFileSync(options.base, 'utf8'))
  : { '$id': '1', strings: {} };

for (const result of results) {
  const key = result.custom_id;
  const text = getResultText(result);
  if (!key || text === null) continue;
  base.strings[key] = restoreControlTags(text, requests.get(key)?.controlTags ?? []);
}

fs.mkdirSync(path.dirname(path.resolve(options.output)), { recursive: true });
fs.writeFileSync(options.output, JSON.stringify(base, null, 2) + '\n');
console.log(`Imported ${results.length} batch results into ${options.output}.`);

function parseOptions(args) {
  const result = {
    input: './splitLang',
    results: './batchout',
    base: './lang/zhCN.json',
    output: './lang/zhCN_batch.json',
  };
  for (const arg of args) {
    if (arg.startsWith('--input=')) result.input = arg.slice(8);
    else if (arg.startsWith('--results=')) result.results = arg.slice(10);
    else if (arg.startsWith('--base=')) result.base = arg.slice(7);
    else if (arg.startsWith('--output=')) result.output = arg.slice(9);
    else if (arg === '--help' || arg === '-h') {
      console.log('Usage: node batch2Lang.js [--input=DIR] [--results=DIR] [--base=PATH] [--output=PATH]');
      process.exit(0);
    } else throw new Error(`Unknown option: ${arg}`);
  }
  return result;
}

function loadRequests(directory) {
  const requests = new Map();
  for (const file of jsonlFiles(directory)) {
    for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/).filter(Boolean)) {
      const request = JSON.parse(line);
      const content = request.params?.messages?.[0]?.content;
      if (!request.custom_id || typeof content !== 'string') continue;
      try {
        const payload = JSON.parse(content);
        requests.set(request.custom_id, payload);
      } catch {
        requests.set(request.custom_id, { text: content, controlTags: [] });
      }
    }
  }
  return requests;
}

function loadResults(directory) {
  const results = [];
  for (const file of jsonlFiles(directory)) {
    for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/).filter(Boolean)) results.push(JSON.parse(line));
  }
  return results;
}

function jsonlFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory)
    .filter(file => file.endsWith('.jsonl'))
    .map(file => path.join(directory, file));
}

function getResultText(result) {
  const oldOpenAiText = result.response?.body?.choices?.[0]?.message?.content;
  if (typeof oldOpenAiText === 'string') return oldOpenAiText;
  const content = result.result?.message?.content;
  if (Array.isArray(content)) return content.find(item => item.type === 'text')?.text ?? null;
  return null;
}

function restoreControlTags(text, tags) {
  return tags.reduce((restored, entry) => restored.replaceAll(entry.token, entry.value), text);
}
