import fs from 'fs';

const Model = 'gpt-4o-mini';
const SystemPrompt = `You are a professional game text translator. You translate according to the worldview of the given game tag and adhere to the conditions.   # Game tags: TRPG, D&D, mythology, demons, crusades, medieval times,   # Conditions:  ## Translate English into natural Japanese.  ## Translate non-conversational text as system messages.  ## Use katakana for proper nouns.  ## Do not translate anything enclosed in {}.  ## Do not translate  following: \t, \n.`;

const strings = JSON.parse(fs.readFileSync('./lang/enGB.json', 'utf8')).strings;
// {
//   "$id": "1",
//   "strings": {
//     "1a7cf3bf-cb34-488b-9469-7f92176211e5": "Attract critters from the whole area.",
//      ...
//    }
// }

// 1req ≦ 400 tokens?
// max token by batch = 2,000,000
// 2,000,000 / 400 = 5000

const SplitNum = 5000;
const keys = Object.keys(strings);
let lines = [];
let fileIdx = 0;

for (let i = 0; i < keys.length; i++) {
  const text = strings[keys[i]];
  const prompt = {
    custom_id: -1,
    method: "POST",
    url: "/v1/chat/completions",
    body: {
      model: Model,
      temperature: 0,
      messages: [
        { "role": "system", "content": SystemPrompt }
      ]
    }
  };
  prompt.custom_id = keys[i];
  prompt.body.messages.push({ "role": "user", "content": text });
  lines.push(prompt);
  if (((i + 1) % SplitNum) === 0) {
    const fileName = `batch_${fileIdx}.jsonl`;
    fs.writeFileSync(`./splitLang/${fileName}`, lines.map(_ => JSON.stringify(_)).join('\n'));
    fileIdx++;
    lines = [];
  }
}

const fileName = `batch_${fileIdx}.jsonl`;
fs.writeFileSync(`./splitLang/${fileName}`, lines.map(_ => JSON.stringify(_)).join('\n'));



