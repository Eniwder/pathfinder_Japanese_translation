import fs from 'node:fs';

const inputPath = process.argv[2] || './speakerAudit.json';
const charPath = process.argv[3] || './speakerProfiles.json';
const outputPath = process.argv[4] || './copiedProfiles.json';
const limit = Number(process.argv[5] || 10);

if (!fs.existsSync(inputPath) || !fs.existsSync(charPath)) {
  console.error('指定された入力ファイルが存在しません。');
  process.exit(1);
}

const audit = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const charData = JSON.parse(fs.readFileSync(charPath, 'utf8'));

const existingProfiles = charData.characters || {};
const existingKeys = Object.keys(existingProfiles);

const missingList = Array.isArray(audit.missingProfiles) ? audit.missingProfiles : [];

const generatedProfiles = {};

for (const entry of missingList) {
  const speaker = entry?.speaker;
  if (!speaker) continue;

  // 既存キーの中から、missingProfiles側のキーに含まれるものを探す (例: "Wenduag" in "DLC6_Wenduag")
  const matchedBaseKey = existingKeys.find((baseKey) => speaker.includes(baseKey));

  if (matchedBaseKey) {
    // ディープコピーして新しいキーに割り当てる
    generatedProfiles[speaker] = JSON.parse(
      JSON.stringify(existingProfiles[matchedBaseKey])
    );
  }
}

fs.writeFileSync(outputPath, JSON.stringify(generatedProfiles, null, 2) + '\n');

console.log(`${Object.keys(generatedProfiles).length} 件のキャラプロファイルを生成し、${outputPath} に保存しました。`);
console.log(JSON.stringify(generatedProfiles, null, 2));
