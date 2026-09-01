import fs from 'fs';
const b = JSON.parse(fs.readFileSync('./batchInput-sample.json', 'utf8'));
b.dialogues.slice(0, 5).forEach((d, i) => console.log(`${i}: ${d.textKey}`));
