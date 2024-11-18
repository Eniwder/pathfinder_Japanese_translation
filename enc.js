const fs = require('fs');
const engOrg = fs.readFileSync('./public/enGB_org.json');
// console.log(engOrg);

const eng = xor2(engOrg, Buffer.from(process.env.DEC_KEY, 'hex'));

console.log(eng);

fs.writeFileSync('./public/enGB.json', eng);

function xor2(hex1, hex2) {
  const buf1 = Buffer.from(hex1, 'hex');
  const buf2 = Buffer.from(hex2, 'hex');
  const bufResult = buf1.map((b, i) => b ^ buf2[i % buf2.length]);
  return bufResult;
}
