# v2リライト キャラクター口調メモ(セッション横断・随時更新)

`dev/res/speakerProfiles.json` の要約＋実際に訳しながら固まった言い回しの記録。
新しいセッションでv2を再開するときは、まずこれを読めばプロフィール全文を読み直さなくて済む。
新しいキャラが出てきたら追記していく。

## 定着した話者

**コノミ(Lady Konomi)** — ネロシャンの公式使節。丁寧語(です・ます)。
- 直接呼びかけ: 「コノミ様」　地の文・第三者からの言及: 「コノミ」
- 慇懃だが腹に一物ある政治家口調。「〜と思われませんか？」「〜かと存じます」

**ソシエル(SosielVaenic_Companion)** — 一人称「私」。polite/gentle/thoughtful/artistic。
- 常に敬語。穏やかで思慮深い聖職者口調。感情を荒げない。

**デラン(Daeran_Companion)** — 一人称「私」。皮肉屋の伯爵。
- 気障・退廃的・からかい口調。「〜だとも」「〜じゃないか」で締めることが多い。

**ラン(Lann_Companion)** — 一人称「俺」。sarcastic/dry-humored/self-deprecating/pragmatic。
- ぶっきらぼうだが実は情に厚いモングレル。「〜さ」「〜だぜ」「〜だろうよ」。

**ウォルジフ(Woljif_Companion)** — 一人称「おいら」。粗野な詐欺師風ティーフリング。
- 訛った・くだけた口調。「〜だぜ」「〜ってわけだ」「〜な？」で軽妙に。

**ガルフレイ女王(QueenGalfrey_*)** — 一人称「私」。regal/courteous/weary-yet-firm/formal。
- 威厳ある文語調寄り敬語。「〜でしょう」「〜なのです」。時々刺すような皮肉も言う。

## 用語・表記ゆれの統一

- Nerosyan → ネロシャン（既存glossary通り）。ただし本文中で「ネロシアン」表記の残存訳が
  散見された（旧v1）→ v2では常に「ネロシャン」で統一。
- 「王国評議会 / ロイヤルカウンシル」→ v2では「王室評議会」に統一（「ロイヤルカウンシル」
  のような直カタカナは避ける）。
- Isger/Isgeri → 「イスガー」（国名）/「イスゲリ」（住民・軍を指す形容）で使い分け。

**シーラ(Seelah_Companion)** — 一人称「私」。元盗賊のパラディン。
- 実直・誠実・情に厚い。丁寧語基調だが堅苦しすぎない。信仰と仲間への忠誠を重んじる。

**レギル(Regill_Companion)** — 一人称「私」。concise/cold/strictly military/unemotional。
- ヘルナイト式の簡潔・冷徹な軍人口調。敬語だが感情を見せない。「〜だ」「〜である」寄りの
  断定調も混ぜて硬質に。

**ハーマッタン大尉(Captain Harmattan)** — オレアドの参謀評議会議長。指揮官には敬語(です・ます)。
  Leadership_2〜8で継続登場。後にワリー(Wary)一派の黒幕だったと発覚する（Leadership_8）。

**サー・トミス・ロンガー(Sir Thommis Longar)** — 白髭のパラディン、ハーマッタンの元副官。
  一人称は明示なし、老騎士らしい丁重な敬語。Leadership_8で初登場、ハーマッタンの裏切りを
  報告しに来る。

## 進行中のシーン単位のメモ

- `Diplomacy_2`〜`Diplomacy_8`: 外交評議会シーン一式。コノミ・ソシエル・デラン・ラン・
  ウォルジフ + ガルフレイ女王 + 各国大使（アンドラン=ボンヴァール、イスガー=ナラ・コル）
  が繰り返し登場。
- `Diplomacy_Officer_dialogue`: コノミとの個別会話（人物背景・雑談）。
- `KTC_AfterRankUp8_dialogue`: ハーマッタン大尉の反乱未遂の後始末（シーラ・レギル・デラン
  も同席）。
- `Leadership_2`〜`Leadership_8_dialogue`: 参謀評議会シーン一式。シーラ・レギル・デラン
  + ハーマッタン大尉が繰り返し登場。Leadership_8でハーマッタンがワリーの黒幕だったと
  判明し、サー・トミス・ロンガーが新登場する。次のシーンに変わったら、新しい話者が
  出るはず（nextStart=750から再開）。

## 効率化のためのビュー生成ルール(スクリプト側の約束事)

チャンクをテキスト化するとき、以下は省略してよい（quality低下なしと確認済み）:
- speakerProfileの `personality` / `speechExamples` / `translationNotes` /
  `constraints` / `notes` / `race` / `alignment` — 上の「定着した話者」表で足りる
- `next`（未来の会話分岐）— 使わなくても翻訳の質に影響しなかった

残すもの: `firstPerson`, `speechStyle`(簡略), `glossary`(source->targetのみ),
`previous`(直前の1行のみ), `text`, `controlTags`(コンパクト表記), `current`。
さらに同一チャンク内で同じ話者が繰り返す場合、2回目以降はプロフィール行を省略し
`speaker=Lann_Companion(↑)` のように前出参照にしてよい。
