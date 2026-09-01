import fs from 'node:fs';

const auditPath = process.argv[2] ?? './speakerAudit.json';
const outputPath = process.argv[3] ?? './missingSpeakerNames.json';
const audit = JSON.parse(fs.readFileSync(auditPath, 'utf8'));
const names = [...new Set(
  (audit.speakers ?? [])
    .filter(entry => entry.profileFound === false && entry.speakerType === 'character')
    .map(entry => entry.profileKey || entry.speakerName || entry.speaker)
    .filter(Boolean),
)];

fs.writeFileSync(outputPath, JSON.stringify(names, null, 2) + '\n');
console.log(`Wrote ${names.length} missing character profile names to ${outputPath}.`);
