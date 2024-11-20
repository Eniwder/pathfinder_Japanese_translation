import fs from 'fs';
import dotenv from 'dotenv';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: dotenv.config().parsed.key
});

async function translate(v) {
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
## Do not translate anything enclosed in {}. (e.g. This +5 leather armor grants its wearer a +15 competence {g|Encyclopedia:Bonus}bonus{/g} on {g|Encyclopedia:Trickery}Trickery{/g} {g|Encyclopedia:Skills}skill checks{/g}. -> この+5のレーザーアーマーは、着用者の{g|Encyclopedia:Trickery}策略{/g}{g|Encyclopedia:Skills}スキルチェック{/g}に対して+15の能力値{g|Encyclopedia:Bonus}ボーナス{/g}を与えます。)
## Do not translate  following: \t, \n.` },
      {
        role: "user",
        content: v,
      },
    ],
  });
  return completion.choices[0].message.content;
}

const en = JSON.parse(fs.readFileSync('./lang/enGB.json', 'utf-8')).strings;
const ja = JSON.parse(fs.readFileSync('./lang/zhCN.json', 'utf-8')).strings;
// const jaBk = JSON.parse(fs.readFileSync('./lang/reps.json', 'utf-8'));
const jaOld = JSON.parse(fs.readFileSync('./lang/zhCN_another.json', 'utf-8')).strings;
const wordGrp = {};
const reps = [];
const katakanas = {};
const katakanasDots = {};

let counter = 0;

const kv = Object.entries(en);
for (let i = 0; i < kv.length; i++) {
  const [k, v] = kv[i];
  if (!ja[k] && ja[k] !== '') {
    console.log(`missing key: ${k}`);
    const fixData = v.length > 0 ? (await translate(v)) : '';
    reps.push({
      org: v,
      be: ja[k],
      af: fixData
    });
    ja[k] = fixData;
    console.log(fixData);
    continue;
  }
  if (v.split('{').length != v.split('{').length) {
    console.log(`brace missing:  ${k} / [${v}] -> [${ja[k]}]`);
  }
  // if (v.length * 2 < ja[k].length) console.log(`maybe too long:  ${k} / [${v}] -> [${ja[k]}]`);
  // if (ja[k].includes('申し訳ありませんが、その')) console.log(`maybe failed:  ${k} / [${v}] -> [${ja[k]}]`);

  if (v.includes('[') && !ja[k].includes('[')) console.log(`missing []:  ${k} / [${v}] -> [${ja[k]}]`);
  // if (ja[k].includes('\"')) console.log(`maybe failed:  ${k} / [${v}] -> [${ja[k]}]`);
  if (!v.includes('\n\n') && ja[k].includes('\n\n')) console.log(`too br:  ${k} / [${v}] -> [${ja[k]}]`);
  const ctrls = ja[k].match(/\{[gd]\|.+?\}/g);
  const orgCtrls = v.match(/\{[gd]\|.+?\}/g);
  if (ctrls) {
    ctrls.forEach((ctrl, idx) => {
      if (ctrl.match(/[^_a-zA-Z0-9:\-\\\|\{\}\/' ]/)) {
        console.log(`ctrl failed:  ${k} / [${v}] -> [${ja[k]}]`);
        if (orgCtrls) {
          // ja[k] = ja[k].replace(ctrl, orgCtrls[idx]);
        }
        console.log(ctrls);
      }
    });
  }

  if (orgCtrls && ctrls && (orgCtrls.length / 2) > ctrls.length) {
    console.log(`missing ctrls:  ${k} / [${v}] -> [${ja[k]}]`);
    console.log(orgCtrls, ctrls);
    // const fixData = await translate(v);
    // reps.push({
    //   org: v,
    //   be: ja[k],
    //   af: fixData
    // });
    // ja[k] = fixData;
    // console.log(ja[k], fixData);
  }

  if (!orgCtrls && ctrls) {
    // console.log(ctrls);
    // ja[k] = ja[k].replace(/\{g.+?\}/, '').replace(/\{\/g\}/, '');
    console.log(`too amount ctrls:  ${k} / [${v}] -> [${ja[k]}]`);
  }


  const hirakiG = ja[k].match(/\{[gd]\|/g);
  const toziG = ja[k].match(/\/[gd]\}/g);
  if ((hirakiG && !toziG) || (toziG && !hirakiG) || (hirakiG?.length != toziG?.length)) {
    console.log(hirakiG?.length, toziG?.length);
    console.log(`missing { or }:  ${k} / [${v}] -> [${ja[k]}]`);
  }



  const mfsOrg = v.match(/\{mf|.+?\}/g);
  const mfsJa = v.match(/\{mf|.+?\}/g);
  if (mfsOrg && mfsJa && mfsOrg.length < mfsJa.length) {
    console.log(`maybe failed:  ${k} / [${v}] -> [${ja[k]}]`);
  }


  const diceOrg = v.match(/[0-9]+?d[0-9]+?/);
  const diceJa = ja[k].match(/[0-9]+?d[0-9]+?/);
  if (diceOrg && (!diceJa || diceOrg.length > diceJa.length)) {
    console.log(`missing dice:  ${k} / [${v}] -> [${ja[k]}]`);
  }


  // const kaiwaOrg = v.match(/"/g); // 'も会話として使われるが、アポストロフィも検知するので一旦無視
  // const kaiwaJp = ja[k].match(/「|」/g);
  // if (kaiwaOrg && (!kaiwaJp || kaiwaOrg.length != kaiwaJp.length)) {
  //   // console.log(`maybe failed:  ${k} / [${v}] -> [${ja[k]}]`); // これは誤検知が多い。許容
  //   if (kaiwaOrg.length === 2 && (!kaiwaJp || kaiwaJp.length === 0) && v[0] === `"` && v[v.length - 1] === `"`) {
  //     ja[k] = `「${ja[k]}」`;
  //   }
  // }

  const engs = ja[k].match(/[_a-zA-Z:\-\\\|\{\}\/<>' ]+/g);
  if (engs) {
    const noCtrl = engs
      .map(_ => _.replace(/\{.+?\}/, '').trim())
      .filter(_ => _ !== '' && _ !== 'd' && _.match(/^[a-zA-Z]+$/))
      .filter(_ => _.length > 3);
    if ((noCtrl.length > 0) && v.length > 10) {
      // console.log(noCtrl);
      // const fixData = await translate(v);
      // reps.push({
      //   org: v,
      //   be: ja[k],
      //   af: fixData
      // });
      // ja[k] = fixData;
      // console.log(noCtrl, fixData);
      wordGrp[noCtrl] = (wordGrp[noCtrl] || 0) + 1;
      // console.log(`maybe no translated:  ${k} / [${v}] -> [${ja[k]}]`);
    }
    // }


  }
  // if (v.includes('Ciar') && !ja[k].includes('シアー')) {
  //   console.log(`maybe no translated:  ${k} / [${v}] -> [${ja[k]}]`);
  // ja[k] = ja[k].replace(/サル/g, 'スル');
  // }

  // const dupe = ja[k].match(/\{g\|Encyclopedia\:Charisma\}/g);
  // if (dupe && dupe.length > 1) {
  //   console.log(`maybe no translated:  ${k} / [${v}] -> [${ja[k]}]`);
  // }

  // ja[k] = ja[k].replace(/: */g, '：');

  // const katakana = ja[k].match(/([ァ-ヴー])+/g);
  // const katakanaDot = ja[k].match(/([ァ-ヴー]+(・[ァ-ヴー]+)+)/g);
  // if (katakana) katakana.forEach(_ => katakanas[_] ? katakanas[_].push(k) : katakanas[_] = [k]);
  // if (katakanaDot) katakanaDot.forEach(_ => katakanasDots[_] ? katakanasDots[_].push(k) : katakanasDots[_] = [k]);


  // if ((v.includes('evocation') || v.includes('Evocation')) && ja[k].includes('召喚')) {
  //   console.log(`maybe failed:  ${k} / [${v}] -> [${ja[k]}]`);
  // }

  // if (ja[k].includes('{g|Encyclopedia:Strength}')) {
  // const kins = ja[k].match(/\{g\|Encyclopedia:Strength\}.+?\{\/g\}/g);
  // const jjj = ja[k].match(/\{g\|Encyclopedia:(Strength|Constitution|Dexterity|Intelligence|Wisdom|Charisma).+?\/g\}/g);
  // const org = v.match(/\{g\|Encyclopedia:(Strength|Constitution|Dexterity|Intelligence|Wisdom|Charisma).+?\/g\}/g);
  // const bk = jaBk[k].match(/\{g\|Encyclopedia:(Strength|Constitution|Dexterity|Intelligence|Wisdom|Charisma).+?\/g\}/g);
  // if (jjj?.length == org?.length) {
  // console.log(jjj, bk);
  // const getStr = v => {
  //   return v.includes("Strength") ? '{g|Encyclopedia:Strength}筋力{/g}' :
  //     v.includes("Constitution") ? '{g|Encyclopedia:Constitution}耐久力{/g}' :
  //       v.includes("Dexterity") ? '{g|Encyclopedia:Dexterity}敏捷力{/g}' :
  //         v.includes("Intelligence") ? '{g|Encyclopedia:Intelligence}知力{/g}' :
  //           v.includes("Wisdom") ? '{g|Encyclopedia:Wisdom}判断力{/g}' :
  //             v.includes("Charisma") ? '{g|Encyclopedia:Charisma}魅力{/g}' : console.error("aaa");

  // };
  // let n = 0;
  // ja[k] = ja[k].replaceAll('{g|Encyclopedia:Strength}筋力{/g}', (m, p1, p2, p3, off, str) => {
  //   console.log(bk[n]);
  //   return getStr(bk[n++]);
  // });
  // } else {
  // console.log(`maybe failed:  ${k} / [${v}] -> [${ja[k]}]`);
  // }
  // }

  // const kakkoN = ja[k].match(/「/g);
  // if (kakkoN && kakkoN.length > 1) {
  //   let buff = '', hiraki = 0;
  //   for (let j = 0; j < ja[k].length; j++) {
  //     if (ja[k][j] == '「') {
  //       hiraki++;
  //       buff += (hiraki == 2) ? '『' : ja[k][j];
  //     } else if (ja[k][j] == '」') {
  //       hiraki--;
  //       buff += (hiraki == 1) ? '』' : ja[k][j];
  //     } else {
  //       buff += ja[k][j];
  //     }
  //   }
  //   if (ja[k] != buff) console.log(ja[k], buff);
  //   ja[k] = buff;
  // }

  // if (!v.includes('\n\n') && ja[k].includes('\n\n')) {
  //   ja[k] = ja[k].replace(/\n\n/g, '\n');
  // }

  // if (ja[k].includes('\"')) {
  //   ja[k] = ja[k].replace(/"([\s\S]+?)"/g, "「$1」");
  // }

  // ja[k] = ja[k].replace(/\:Strength\}.+?\{/g, ":Strength}筋力{");
  // ja[k] = ja[k].replace(/\:Intelligence\}.+?\{/g, ":Intelligence}知力{");
  // ja[k] = ja[k].replace(/\:Wisdom\}.+?\{/g, ":Wisdom}判断力{");
  // ja[k] = ja[k].replace(/\:Dexterity\}.+?\{/g, ":Dexterity}敏捷力{");
  // ja[k] = ja[k].replace(/\:Constitution\}.+?\{/g, ":Constitution}耐久力{");
  // ja[k] = ja[k].replace(/\:Charisma\}.+?\{/g, ":Charisma}魅力{");

  // if (!ja[k].includes('「')) {
  //   ja[k] = ja[k].replace(/ストレングス/g, "筋力");
  //   ja[k] = ja[k].replace(/知能|インテリジェンス/g, "知力");
  //   ja[k] = ja[k].replace(/知恵|ウィズダム/g, "判断力");
  //   ja[k] = ja[k].replace(/デクスタリティ/g, "敏捷力");
  //   ja[k] = ja[k].replace(/コンステチューション/g, "耐久力");
  //   ja[k] = ja[k].replace(/カリスマ/g, "魅力");
  // }

  //  危険？
  // ja[k] = ja[k].replace(/"\{mf\|[hH]e\|[sS]he\}"/g, "{mf|彼|彼女}");
  // ja[k] = ja[k].replace(/"\{mf\|[hH]is\|[hH]er\}"/g, "{mf|彼の|彼女の}");
  // ja[k] = ja[k].replace(/"\{mf\|[hH]im\|[hH]er\}"/g, "{mf|彼|彼女}");
  // ja[k] = ja[k].replace(/"\{mf\|[hH]imself\|[hH]erself\}"/g, "{mf|彼自身|彼女自身}");

  // if (v.includes('[') && !ja[k].includes('[')) {
  //   if ((v[0] == '[') && (v[v.length - 1] == ']')) {
  //     if (ja[k][0] == '{' && ja[k][ja[k].length - 1] == '}') {
  //       ja[k] = `[${ja[k].slice(1, ja[k].length - 1)}]`;;
  //     } else {
  //       ja[k] = `[${ja[k]}]`;
  //     }
  //   } else if ((ja[k][0] == '【')) {
  //     ja[k] = `${ja[k].replace('【', '[').replace('】', ']')}`;
  //   }
  // }



  // if (v === "\"I have to go.\"") ja[k] = `「もう行かないと。」`;
  // if (v === "\"Tell me about yourself.\"") ja[k] = `「自己紹介をしてください。」`;
  // if (v === "Continue.") ja[k] = `続ける。`;
  // if (v === "Continue") ja[k] = `続ける`;
}

// console.log(Object.entries(wordGrp).sort((a, b) => b[1] - a[1]));


// console.log(katakanas);
// console.log(katakanasDots);

// Object.entries(katakanasDots).forEach(kd => {
//   const noDot = kd[0].replace(/・/g, '');
//   if (katakanas[noDot]) {
//     kd[1].forEach(key => {
//       console.log(kd[0], key);
//       ja[key] = ja[key].replaceAll(kd[0], noDot);
//     });
//   }
// });

// fs.writeFileSync('./lang/reps.json', JSON.stringify(reps, null, 2));




const outputTemplate = {
  "$id": "1",
  "strings": {
  }
};
outputTemplate.strings = ja;

fs.writeFileSync('./lang/zhCN_rep.json', JSON.stringify(outputTemplate, null, 2));

