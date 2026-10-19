import fs from 'node:fs';
import crypto from 'node:crypto';

const dir = 'dev/lang/comparison-siratori-20261019/parentheses/';
const target = 'dev/lang/zhCN.json';
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const write = (p, value) => fs.writeFileSync(p, JSON.stringify(value, null, 2) + '\n');
const plain = s => s.replace(/\{[^}]*\}|<[^>]*>/g, '');
const protectedParts = /\{[^}]*\}|<[^>]*>/g;
const statePath = dir + 'audit.json';
fs.mkdirSync(dir, { recursive: true });
const command = process.argv[2];
if (command === 'init') {
  if (fs.existsSync(statePath)) throw new Error('Audit already initialized');
  const raw = fs.readFileSync(target, 'utf8');
  const ja = JSON.parse(raw).strings;
  const en = read('dev/lang/enGB.json').strings;
  const excluded = Object.keys(en).filter(k => en[k].startsWith('This EULA is an agreement between you,') || en[k].startsWith('End user license agreement for use of software titled'));
  const keys = Object.keys(ja).filter(k => !excluded.includes(k) && /[()（）]/.test(plain(ja[k])));
  fs.writeFileSync(dir + 'audit-before.json', raw);
  write(statePath, { excluded, keys, reviews: {}, widthChanges: [], created: new Date().toISOString() });
  console.log({ candidates: keys.length, excluded: excluded.length });
} else if (command === 'export') {
  const state = read(statePath), ja = read(target).strings;
  const keys = state.keys.filter(k => !state.reviews[k]).slice(0, Number(process.argv[3] || 100));
  const en = read('dev/lang/enGB.json').strings;
  write(dir + 'batch.json', keys.map((key, i) => ({ n: i + 1, key, before: ja[key], english: en[key] })));
  for (const [i, key] of keys.entries()) console.log(JSON.stringify({ n: i + 1, ja: plain(ja[key]) }));
} else if (command === 'width') {
  const state = read(statePath), raw = fs.readFileSync(target, 'utf8');
  const doc = JSON.parse(raw), changes = [];
  for (const key of state.keys) {
    const before = doc.strings[key];
    // Protect engine markup before changing display punctuation.
    const after = before.split(/(\{[^}]*\}|<[^>]*>)/g).map((part, i) => i % 2 ? part : part.replace(/\(/g, '（').replace(/\)/g, '）')).join('');
    if (before !== after) changes.push({ key, before, after });
  }
  apply(raw, changes);
  state.widthChanges.push(...changes.map(c => c.key));
  write(statePath, state);
  console.log({ widthChanged: changes.length, semanticReviewed: Object.keys(state.reviews).length, total: state.keys.length });
} else if (command === 'record') {
  const state = read(statePath), batch = read(dir + 'batch.json');
  const reviews = read(process.argv[3]);
  const raw = fs.readFileSync(target, 'utf8'), ja = JSON.parse(raw).strings;
  const changes = [];
  for (const item of reviews) {
    const row = batch.find(r => r.n === item.n);
    if (!row || state.reviews[row.key]) throw new Error('Unknown or reviewed: ' + item.n);
    if (ja[row.key] !== row.before) throw new Error('Stale: ' + row.key);
    const after = item.after ?? row.before;
    if (after !== row.before) changes.push({ key: row.key, before: row.before, after });
    state.reviews[row.key] = { before: row.before, after, reason: item.reason, date: new Date().toISOString() };
  }
  apply(raw, changes);
  write(statePath, state);
  console.log({ reviewed: Object.keys(state.reviews).length, total: state.keys.length, changedThisBatch: changes.length });
} else if (command === 'apply-keyed') {
  const raw = fs.readFileSync(target, 'utf8'), ja = JSON.parse(raw).strings;
  const changes = read(process.argv[3]);
  for (const c of changes) if (ja[c.key] !== c.before) throw new Error('Stale: ' + c.key);
  apply(raw, changes);
  console.log({ changed: changes.length });
} else if (command === 'status') {
  const s = read(statePath);
  console.log(s.stats ? { ...s.stats, reviewed: Object.keys(s.reviews).length, completed: s.completed } : { total: s.keys.length, reviewed: Object.keys(s.reviews).length, widthChanged: s.widthChanges.length, rewritten: Object.values(s.reviews).filter(r => r.before !== r.after).length });
} else throw new Error('Commands: init, width, export [count], record FILE, status');

function apply(raw, changes) {
  const tokens = s => [...s.matchAll(protectedParts)].map(m => m[0]).sort();
  const numbers = s => (plain(s).match(/[+-]?\d+(?:\.\d+)?/g) || []).sort();
  let output = raw;
  for (const c of changes) {
    if (!c.after || JSON.stringify(tokens(c.before)) !== JSON.stringify(tokens(c.after)) || JSON.stringify(numbers(c.before)) !== JSON.stringify(numbers(c.after)) || c.before.split('\n').length !== c.after.split('\n').length) throw new Error('Invariant violation: ' + c.key);
    const from = JSON.stringify(c.key) + ': ' + JSON.stringify(c.before);
    if (output.split(from).length !== 2) throw new Error('Nonunique: ' + c.key);
    output = output.replace(from, JSON.stringify(c.key) + ': ' + JSON.stringify(c.after));
  }
  if (!changes.length) return;
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  fs.writeFileSync(dir + 'before-' + stamp + '.json', raw);
  write(dir + 'changes-' + stamp + '.json', { sha256: crypto.createHash('sha256').update(raw).digest('hex'), changes });
  if (fs.readFileSync(target, 'utf8') !== raw) throw new Error('Concurrent modification');
  JSON.parse(output);
  fs.writeFileSync(target, output);
}
