import dotenv from 'dotenv';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: dotenv.config().parsed.key
});

async function translate(params) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-2024-08-06",
    temperature: 0,
    messages: [
      {
        role: "system", content: `You are a professional game text translator. You translate according to the worldview of the given game tag and adhere to the conditions. 
  # Game tags: TRPG, D&D, mythology, demons, crusades, medieval times, 
  # Conditions:
  ## Translate English into natural Japanese.
  ## This is game text, so there are some cruel words, but you must translate every word.
  ## Be sure to translate any words you don't understand based on the context.
  ## Translate non-conversational text as system messages.
  ## Use katakana for proper nouns.
  ## Do not translate anything enclosed in {}.
  ## Do not translate  following: \t, \n.` },
      {
        role: "user",
        content: "{n}The obsidian snake, the guardian of your heart, awakens and lets out a quiet, threatening hiss. Its bite injects a sweet poison into your veins that spreads through your body and fills your mind with a soothing whisper: \"Why are you rebelling? Give in. Our Lady in Shadow knows what is good for you.\" You feel your words die on your tongue.{/n}",
      },
    ],
  });

  console.log(completion.choices[0].message);
}

await translate();

