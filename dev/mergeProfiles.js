import fs from 'fs';

// Load existing profiles
const profiles = JSON.parse(fs.readFileSync('./speakerProfiles.json', 'utf8'));

// Load new templates
const templates = JSON.parse(fs.readFileSync('./profileTemplates-top6.json', 'utf8'));

// Add new templates to existing profiles
Object.assign(profiles.characters, templates);

// Write updated profiles
fs.writeFileSync('./speakerProfiles.json', JSON.stringify(profiles, null, 2) + '\n');

const keys = Object.keys(profiles.characters);
console.log(`Successfully merged 6 new profiles!`);
console.log(`Total profiles now: ${keys.length}`);
console.log(`Last 6 profiles:`);
keys.slice(-6).forEach(k => console.log(`  - ${k}`));
