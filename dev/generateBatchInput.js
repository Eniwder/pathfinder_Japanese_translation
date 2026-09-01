import fs from 'fs';

// Load resources
const profiles = JSON.parse(fs.readFileSync('./speakerProfiles.json', 'utf8'));
const graph = JSON.parse(fs.readFileSync('./dialogueGraph.json', 'utf8'));

// Sample: take first 20 dialogue nodes with recognized profiles
const batchSize = 20;
const batch = [];

for (const node of graph.nodes) {
  if (batch.length >= batchSize) break;

  const speaker = node.speaker;
  const profileKey = node.profileKey || speaker;
  const profile = profiles.characters[profileKey];

  // Only include nodes with recognized profiles
  if (profile) {
    batch.push({
      textKey: node.textKey,
      speaker: profileKey,
      sourceText: node.msg,
      profile: {
        personality: profile.personalitySummary || '',
        voice: profile.toneAndVoice || '',
        examples: profile.speechExamples || [],
        constraints: profile.constraints || ''
      }
    });
  }
}

// Output batch format for API submission
const batchOutput = {
  profile: profiles,
  globalRules: profiles.globalRules,
  batchMetadata: {
    batchSize: batch.length,
    generatedAt: new Date().toISOString(),
    profilesUsed: new Set(batch.map(x => x.speaker)).size
  },
  dialogues: batch
};

// Save batch file
fs.writeFileSync('./batchInput-sample.json', JSON.stringify(batchOutput, null, 2) + '\n');

console.log(`✓ Batch data generated: ${batch.length} dialogues`);
console.log(`✓ Profiles included: ${batchOutput.batchMetadata.profilesUsed}`);
console.log(`✓ Saved to: batchInput-sample.json`);
console.log('\nSample dialogues:');
batch.slice(0, 3).forEach((d, i) => {
  const text = (d.sourceText || '(no text)').substring(0, 80);
  console.log(`\n${i + 1}. [${d.speaker}] ${text}...`);
});
