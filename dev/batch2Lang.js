import fs from 'fs';

const base = `./batchout/`;
const outputs = fs.readdirSync(base);

const outputTemplate = {
  "$id": "1",
  "strings": {
  }
};

const strings = outputs.flatMap(fn => {
  const lines = fs.readFileSync(`${base}${fn}`, 'utf-8').split(/\n/);
  return lines.filter(_ => _.length > 0).map(_ => {
    const line = JSON.parse(_);
    // console.log(line);
    const key = line.custom_id;
    const text = line.response.body.choices[0].message.content;
    return [key, text];
  });
});

outputTemplate.strings = strings.reduce((acc, v) => {
  acc[v[0]] = v[1];
  return acc;
}, {});

// 上書き防止
if (!fs.existsSync('./lang/zhCN.json')) {
  fs.writeFileSync('./lang/zhCN.json', JSON.stringify(outputTemplate, null, 2));
  fs.writeFileSync('./lang/zhCN_bk.json', JSON.stringify(outputTemplate, null, 2));
}

// console.log(outputs);
