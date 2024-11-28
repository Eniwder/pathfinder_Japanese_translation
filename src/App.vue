<template>
  <v-app>
    <v-app-bar color="grey-darken-4" title="Pathfinder WotR 原文検索" :elevation="0" density="compact">
      <template v-slot:append>
        <v-btn icon="mdi-github" href="https://github.com/Eniwder/pathfinder_Japanese_translation"
          target="_blank"></v-btn>
      </template>
    </v-app-bar>

    <v-main>
      <v-overlay :model-value="overlay" class="align-center justify-center" :persistent="true">
        <v-progress-circular color="primary" size="64" indeterminate></v-progress-circular>
        <p class="overay-text">データ読み込み中…</p>
      </v-overlay>

      <v-container>
        <div class="topRow">
          <v-row class="lang">
            <v-col cols="12">
              <v-textarea label="原文" v-model="textEng" class="lang-en" rows="8" readonly bg-color="#19191c" color="#eee"
                no-resize
                placeholder="下部にある入力欄に原文を探したいテキストを入力してください。&#13;完全一致または部分一致の件数が1になった場合のみ原文が表示されます。&#13;・完全一致の例: シーラ&#13;・部分一致の例: 違法であるべきだ"
                persistent-placeholder></v-textarea>
            </v-col>
          </v-row>
          <v-row class="lang2">
            <v-col cols="12">
              <img src="@/assets/arrow.png" class="arrow">
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="12">
              <v-textarea label="ゲーム内テキスト" v-model="textJp" class="lang-st" rows="8" readonly bg-color="#19191c"
                color="#eee" no-resize persistent-placeholder
                placeholder="補足：&#13;・プレイヤー名はNAMEとして表示されます(例: 右側にはあなた)&#13;・「・」は省略して検索可能です&#13;・制御コードを省略しているので、ゲーム内テキストと完全一致しない場合があります"></v-textarea>
            </v-col>
          </v-row>
        </div>
        <div class="bottomRow">
          <v-row>
            <v-col cols="12">
              <v-text-field v-model="sw" label="原文を探したいテキストを入力" variant="solo" bg-color="white" class="input"
                @update:modelValue="search"></v-text-field>
            </v-col>
          </v-row>
        </div>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import { Buffer } from 'buffer';

window.Buffer = window.Buffer || Buffer;
const textJp = ref("");
const textEng = ref("");
const sw = ref("");
const overlay = ref(true);

const jp = [];
const jpOrg = [];
const eqMap = [];
const eng = [];

onMounted(async () => {
  // create copy button
  nextTick(() => {
    Array.from(document.querySelectorAll('textarea')).forEach(_ => _.insertAdjacentHTML('afterend', '<span class="mycopybtn" onclick="{this.classList.add(\'clicked\');setTimeout(()=>this.classList.remove(\'clicked\'),800)}"></span>'));
    Array.from(document.querySelectorAll('.mycopybtn')).forEach(_ => _.addEventListener('click', e => {
      navigator.clipboard.writeText(e.target.parentNode.querySelector('textarea').value.replace(/^\t|\n\t/g, '\n').replace(/\n\n/g, '\n').trim());
    }));
  }, 100);

  const jpResult = await fetch('./zhCN.json');
  const engResult = await fetch('./enGB.json');
  const _jpBuffers = [];
  for await (const data of jpResult.body) {
    _jpBuffers.push(data);
  }
  const jpBuffers = Buffer.concat(_jpBuffers);
  const decoder = new TextDecoder('utf-8');

  const jpJson = JSON.parse(decoder.decode(xor2(jpBuffers, Buffer.from(import.meta.env.VITE_DEC_KEY, 'hex'))));

  const _engBuffers = [];
  for await (const data of engResult.body) {
    _engBuffers.push(data);
  }
  const engBuffers = Buffer.concat(_engBuffers);
  const engJson = JSON.parse(decoder.decode(xor2(engBuffers, Buffer.from(import.meta.env.VITE_DEC_KEY, 'hex'))));

  Object.entries(jpJson.strings).forEach(([k, v]) => {
    const nv1 = v.replace(/\{mf\|(.+?)\|(.+?)\}/g, '$1').replace(/\{.+?\}/g, '').replace(/・/g, '');
    const nv2 = v.replace(/\{mf\|(.+?)\|(.+?)\}/g, '$2').replace(/\{.+?\}/g, '').replace(/・/g, '');
    jp.push([k, nv1]);
    eqMap[nv1] = k;
    eqMap[nv2] = k;
    if (nv1 !== nv2) {
      jp.push([k, nv2]);
    }
    jpOrg[k] = v.replace(/\{mf\|(.+?)\|(.+?)\}/g, '($1|$2)').replace(/\{[nN]ame}/g, 'NAME').replace(/\{.+?\}/g, '');
  });
  Object.entries(engJson.strings).forEach(([k, v]) => {
    const nv = v.replace(/\{mf\|(.+?)\|(.+?)\}/g, '($1|$2)').replace(/\{[nN]ame}/g, 'NAME').replace(/\{.+?\}/g, '');
    eng[k] = nv;
  });
  overlay.value = false;
});

function search(word) {
  word = word.trim().replace(/・/g, '');
  if (word === '') {
    textJp.value = '';
    textEng.value = '';
    return;
  }
  const trgInc = jp.filter(([id, text]) => text.includes(word));
  const trgEq = eqMap[word];
  if (trgInc.length === 1 || trgEq ||
    (trgInc.length === 2 && (trgInc[0][0] === trgInc[1][0]))) {
    const trg = (trgEq || trgInc?.[0][0]);
    textJp.value = jpOrg[trg];
    textEng.value = eng[trg];
  } else {
    textJp.value = '';
    textEng.value = '';
  }
}

function xor2(hex1, hex2) {
  const buf1 = Buffer.from(hex1, 'hex');
  const buf2 = Buffer.from(hex2, 'hex');
  const bufResult = buf1.map((b, i) => b ^ buf2[i % buf2.length]);
  return bufResult;
}
</script>

<style>
main {
  background: linear-gradient(215deg, #402c2c 29.9%, #6a2071 80%), linear-gradient(304deg, rgba(63, 91, 78, 0.4) 24.9%, #4d363d 91%), linear-gradient(10deg, #360c4f 19.9%, #4b4141 50%), linear-gradient(145deg, #9c5a7a 15.9%, #59374b 40%);
  flex-grow: 1;
  padding: 2em;
  text-align: center;
  background-blend-mode: hard-light;
  display: flex;
  align-items: center;
  justify-content: center;
  --v-layout-top: 64px !important;
  --v-layout-left: 24px !important;
  --v-layout-right: 24px !important;
}

.overay-text {
  color: white;
}

.v-overlay__content {
  text-align: center;
}

img {
  display: flex;
  width: 12px;
}

.topRow {
  height: calc(100vh - 220px);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.lang {
  max-height: 30vh;
}

.lang2 {
  max-height: 64px;
}

.lang-st,
.lang-en {
  font-family: "Noto Sans JP", sans-serif;
  /* pointer-events: none; */
}

.lang-st textarea,
.lang-en textarea {
  font-size: 20px;
  color: #eee;
  max-height: 24vh;
}

.arrow {
  margin-top: 12px;
  left: 50%;
  position: relative;
  margin-top: -24px;
}

.v-container {
  height: 100%;
}

.v-textarea label {
  color: gray;
}

.mycopybtn {
  pointer-events: all;
  content: '';
  background-image: url('data:image/svg+xml;utf-8, <svg style="color: gray" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-copy"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>');
  display: block;
  width: 24px;
  height: 24px;
  background-color: #333;
  position: absolute;
  top: 0;
  right: 0;
  cursor: pointer;
  user-select: none;
}

.mycopybtn:hover {
  opacity: 0.8;
}

.mycopybtn:hover::before {
  content: 'Copy';
  text-align: center;
  display: block;
  width: 80px;
  height: 24px;
  background-color: #515151;
  bottom: 30px;
  position: relative;
  right: 100%;
  transition: all 1s;
}

.mycopybtn.clicked:hover::before {
  content: 'Copied';
  text-align: center;
  display: block;
  width: 80px;
  height: 24px;
  background-color: #515151;
  bottom: 30px;
  position: relative;
  right: 100%;
  transition: all 1s;
}

.mycopybtn:hover::after {
  content: '';
  width: 0;
  height: 0;
  bottom: 24px;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-top: 10px solid #515151;
  position: relative;
}
</style>
