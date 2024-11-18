const fs = require('fs');
const jaOrg = fs.readFileSync('./public/zhCN.json');

const jp = xor2(jaOrg, Buffer.from(process.env.DEC_KEY, 'hex'));

fs.writeFileSync('./pathfinder_jp/zhCN.json', jp);

function xor2(hex1, hex2) {
  const buf1 = Buffer.from(hex1, 'hex');
  const buf2 = Buffer.from(hex2, 'hex');
  const bufResult = buf1.map((b, i) => b ^ buf2[i % buf2.length]);
  return bufResult;
}
