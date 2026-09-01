import fs from 'fs';

const batchInput = JSON.parse(fs.readFileSync('./batchInput-sample.json', 'utf8'));
const graph = JSON.parse(fs.readFileSync('./dialogueGraph.json', 'utf8'));

console.log('=== Batch Input Sample ===');
console.log(JSON.stringify(batchInput.dialogues[0], null, 2));

console.log('\n=== Graph Node Sample ===');
for (const node of graph.nodes.slice(0, 5)) {
  if (node.profileKey === 'PuluraFall_Eliandra') {
    console.log(JSON.stringify(node, null, 2));
    break;
  }
}
