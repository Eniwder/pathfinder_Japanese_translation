import fs from 'node:fs';

const inputPath = process.argv[2] || 'dev/speakerAudit.json';
const outputPath = process.argv[3] || 'dev/topMissingProfiles.json';
const limit = Number(process.argv[4] || 10);

if (!fs.existsSync(inputPath)) {
  console.error(`Input file not found: ${inputPath}`);
  process.exit(1);
}

const audit = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

if (!Array.isArray(audit.missingProfiles)) {
  console.error('Expected audit.missingProfiles to be an array.');
  process.exit(1);
}

const top = [...audit.missingProfiles]
  .filter((entry) => entry && typeof entry === 'object' && entry.speaker)
  .map((entry) => ({
    speaker: entry.speaker,
    speakerName: entry.speakerName || entry.speaker,
    count: Number(entry.count || 0),
    profileKey: entry.profileKey || entry.speaker,
  }))
  .sort((a, b) => b.count - a.count)
  .slice(0, Number.isFinite(limit) && limit > 0 ? limit : 10);

fs.writeFileSync(outputPath, JSON.stringify(top, null, 2) + '\n');

console.log(`Top ${top.length} missing profiles written to ${outputPath}`);
console.log(JSON.stringify(top, null, 2));
