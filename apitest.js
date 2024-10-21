import dotenv from 'dotenv';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: dotenv.config().parsed.key
});

async function translate(params) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
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
  ## Do not translate anything enclosed in {}. (e.g. This +5 leather armor grants its wearer a +15 competence {g|Encyclopedia:Bonus}bonus{/g} on {g|Encyclopedia:Trickery}Trickery{/g} {g|Encyclopedia:Skills}skill checks{/g}. -> この+5のレーザーアーマーは、着用者の{g|Encyclopedia:Trickery}策略{/g}{g|Encyclopedia:Skills}スキルチェック{/g}に対して+15の能力値{g|Encyclopedia:Bonus}ボーナス{/g}を与えます。)
  ## Do not translate  following: \t, \n.` },
      {
        role: "user",
        content: `At 11th level, the phantasmal mage can spend 2 points from her arcane reservoir as a {g|Encyclopedia:Free_Action}free action{/g} to make the next arcanist Illusion {g|Encyclopedia:Spell}spell{/g} she casts in 2 {g|Encyclopedia:Combat_Round}rounds{/g} {g|FeaturePersistentSpell}Persistent{/g} or {g|FeatureEmpoweredSpell}Empowered{/g}, as per using the corresponding metamagic {g|Encyclopedia:Feat}feat{/g}.`,
      },
    ],
  });

  console.log(completion.choices[0].message);
}

await translate();

