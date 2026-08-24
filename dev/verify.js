import fs from 'node:fs';
import path from 'node:path';

const options = parseOptions(process.argv.slice(2));
const source = readStrings(options.source);
const translation = readStrings(options.translation);
const report = verify(source, translation);

console.log(JSON.stringify(report.stats, null, 2));
console.log(`Errors: ${report.errors.length}, warnings: ${report.warnings.length}`);
if (options.verbose) for (const item of [...report.errors, ...report.warnings]) console.log(JSON.stringify(item));
if (options.report) {
  fs.mkdirSync(path.dirname(path.resolve(options.report)), { recursive: true });
  fs.writeFileSync(options.report, JSON.stringify(report, null, 2) + '\n');
  console.log(`Report written: ${options.report}`);
}
if (report.errors.length > 0) process.exitCode = 1;

function parseOptions(args) {
  const result = { source: './lang/enGB.json', translation: './lang/zhCN.json', report: null, verbose: false };
  for (const arg of args) {
    if (arg.startsWith('--source=')) result.source = arg.slice(9);
    else if (arg.startsWith('--translation=')) result.translation = arg.slice(14);
    else if (arg.startsWith('--report=')) result.report = arg.slice(9);
    else if (arg === '--verbose' || arg === '-v') result.verbose = true;
    else if (arg === '--help' || arg === '-h') { console.log('Usage: node verify.js [--source=PATH] [--translation=PATH] [--report=PATH] [--verbose]'); process.exit(0); }
    else throw new Error(`Unknown option: ${arg}`);
  }
  return result;
}

function readStrings(file) {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!data.strings || typeof data.strings !== 'object') throw new Error(`${file} has no strings object.`);
  return data.strings;
}

function verify(source, translation) {
  const errors = [];
  const warnings = [];
  const stats = { sourceKeys: Object.keys(source).length, translatedKeys: Object.keys(translation).length, checked: 0, missing: 0, empty: 0, controlTagIssues: 0, mfIssues: 0, whitespaceIssues: 0, placeholderIssues: 0, diceIssues: 0 };
  for (const [key, original] of Object.entries(source)) {
    const translated = translation[key];
    if (translated === undefined) { stats.missing++; errors.push(issue(key, 'missing', original)); continue; }
    stats.checked++;
    if (original && !translated.trim()) { stats.empty++; errors.push(issue(key, 'empty', original, translated)); }
    const controls = compareControlTags(original, translated);
    if (controls) { stats.controlTagIssues++; errors.push(issue(key, 'control-tags', original, translated, controls)); }
    const mf = compareMfTags(original, translated);
    if (mf) { stats.mfIssues++; errors.push(issue(key, 'mf', original, translated, mf)); }
    if (count(original, '\n') !== count(translated, '\n') || count(original, '\t') !== count(translated, '\t')) { stats.whitespaceIssues++; warnings.push(issue(key, 'whitespace', original, translated)); }
    if (count(original, '[') !== count(translated, '[') || count(original, ']') !== count(translated, ']')) { stats.placeholderIssues++; warnings.push(issue(key, 'brackets', original, translated)); }
    if ((original.match(/\b\d+d\d+\b/gi) ?? []).length > (translated.match(/\b\d+d\d+\b/gi) ?? []).length) { stats.diceIssues++; warnings.push(issue(key, 'dice', original, translated)); }
  }
  for (const key of Object.keys(translation)) if (!Object.hasOwn(source, key)) warnings.push(issue(key, 'extra-key', undefined, translation[key]));
  return { stats, errors, warnings };
}

function compareControlTags(original, translated) {
  const missing = difference(controlTags(original), controlTags(translated));
  const extra = difference(controlTags(translated), controlTags(original));
  return missing.length || extra.length ? { missing, extra } : null;
}

function compareMfTags(original, translated) {
  const sourceCount = mfTags(original).length;
  const translatedCount = mfTags(translated).length;
  const malformed = (translated.match(/\{mf\|[^}]*\}/g) ?? []).filter(tag => !/^\{mf\|[^|]*\|[^}]*\}$/.test(tag));
  return sourceCount !== translatedCount || malformed.length ? { sourceCount, translatedCount, malformed } : null;
}

function controlTags(text) { return (text.match(/\{(?:g|d)\|[^}]*\}|\{\/(?:g|d)\}|\{n\}|\{\/n\}|\{br\}|\{name\}/g) ?? []).sort(); }
function mfTags(text) { return text.match(/\{mf\|[^|}]*\|[^}]*\}/g) ?? []; }
function difference(left, right) {
  const remaining = [...right];
  return left.filter(value => { const index = remaining.indexOf(value); if (index < 0) return true; remaining.splice(index, 1); return false; });
}
function count(text, value) { return [...text].filter(character => character === value).length; }
function issue(key, type, source, translation, details) { return { key, type, source, translation, ...(details ? { details } : {}) }; }
