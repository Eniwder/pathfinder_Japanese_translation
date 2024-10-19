import dotenv from 'dotenv';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: dotenv.config().parsed.key
});

async function translate(params) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system", content: `You are a professional game text translator. You translate according to the worldview of the given game tag and adhere to the conditions. 
  # Game tags: TRPG, D&D, mythology, demons, crusades, medieval times, 
  # Conditions:
  ## Translate English into natural Japanese.
  ## Translate non-conversational text as system messages.
  ## Use katakana for proper nouns.
  ## Do not translate anything enclosed in {}.
  ## Do not translate  following: \t, \n.` },
      {
        role: "user",
        content: "A druid can channel stored {g|Encyclopedia:Spell}spell{/g} energy into summoning spells that she hasn't prepared ahead of time. She can \"lose\" a prepared spell in order to cast any summon nature's ally spell of the same level or lower.",
      },
    ],
  });

  console.log(completion.choices[0].message);
}

await translate();

