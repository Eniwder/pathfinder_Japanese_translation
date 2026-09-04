# 翻訳ルール 開発メモ・更新履歴（正本ではない・翻訳作業では読まない）

[translationGuide.md](translationGuide.md) から分離した、翻訳作業のたびに読む必要はないが
残しておきたい情報（経緯・verifyの仕組み・機械修復の手順）。runRoundLoop.mjs の
buildChunkPrompt はこのファイルを読ませない（トークン節約のため）。更新履歴・経緯メモは
必ずここに書き、translationGuide.md本体には書かない。

## 参照データの形式

`dev/res/glossary.json` は `{ glossary: [{ source, target, note }] }`。
`dev/res/speakerProfiles.json` は
`{ globalRules: [...], characters: { <名前>: { gender, personality, speechStyle, notes,
firstPerson, toneAndVoice, speechExamples } }, speakerAliases: {...} }`。

制御タグ判定に使う正規表現は [verify.js:72](../verify.js#L72) と
[toBatchData.js](../toBatchData.js) の `CONTROL_TAG_RE` が正本（同じもの）：

```js
/\{(?:g|d)\|[^}]*\}|\{\/(?:g|d)\}|\{n\}|\{\/n\}|\{br\}|\{name\}/g
```

この正規表現にマッチする形（`{mf|...}` は**含まれない**——理由は下記）：

| 形 | 例 | 意味 |
|---|---|---|
| `{g\|...}...{/g}` | `{g\|Encyclopedia:DC}DC{/g}` | 百科事典リンク |
| `{d\|...}...{/d}` | | 同上系 |
| `{n}...{/n}` / `{br}` | | 改行・段落 |
| `{name}` | | プレイヤー名の差し込み |

翻訳時は [toBatchData.js](../toBatchData.js) の `protectControlTags()` で、上記にマッチした
**タグそのものだけ**（`{g|...}` や `{/g}` など、開始・終了タグ別々に）を `<ctrl_0/>` 形式の
プレースホルダに退避し、`import` 時に `restoreControlTags()` で復元する方式を取っている。
タグに挟まれた中身のテキスト（例の `DC`）はプレースホルダ化されず、chunkの `text` 中に
普通の翻訳対象テキストとしてそのまま残る。
v2チャンクの `tags` 配列は「値だけの配列（位置がそのまま `<ctrl_N/>` に対応）」という
コンパクト表記（旧形式の `controlTags: [{token, value}]` は import 側が後方互換で読める）。

`{mf|男性形|女性形}` は `CONTROL_TAG_RE` に含まれていないため `<ctrl_N/>`化されず、
chunkの `text` に生のまま残る。日本語訳での扱い（男性形が先・丸ごと省略可）に
翻訳者の判断が要るタグなので、意図的に保護対象から外し常に見える形にしてある。
translationGuide.md側の説明はこの前提で書いているので、`CONTROL_TAG_RE` の対象を
広げる変更をする場合はそちらの記述も合わせて見直すこと。

## 更新履歴（要点のみ）

- 2026-09-02: 読点の多用を避けるルールを追加（ユーザーフィードバック）。
- 2026-09-02: `Daeran` の glossary target を `デエラン` → `デラン` に修正（不自然だったため）。
- 2026-09-02: `verify.js` の `compareMfTags()` を修正。`{mf|...}` タグを丸ごと省略する
  （このガイドが認めている自然な訳出）ケースを誤って error 扱いしていたのを解消し、
  「部分的に欠けている」「壊れた形式」の場合だけを検出するようにした。
  修正前は mfIssues 759 件中 567 件（75%）が意図的な省略による偽陽性だった。
- 2026-09-02: `zhCN.json` の control-tag 不整合（旧 GPT-4o-mini 訳の機械的な取りこぼし）を
  自己検証つきスクリプトで一括修正。詳細は下記「機械的に直せる不整合パターン」を参照。
  4562 件 → 1080 件（約76%減）。
- 2026-09-02: 読点ルールを再強化（ユーザーから2回目の指摘）。v2 の未マージ chunk
  （`lang/chunks_review/2026-09-02_round4/`、`lang/chunks/`）で「、」が多すぎる箇所を
  実測（1文中の「、」の数）で洗い出し、96件を手動で書き直した。平均コンマ数は
  ファイルごとに 2.8〜3.5 → 2.2〜2.6 まで低下。上記ルールに「軽い前置きの直後は基本不要」
  「1文平均2個未満が目安」を追記。
- 2026-09-02: 代名詞・主語を省略するルールを追加（ユーザーフィードバック）。
  `He must have thought you were suspicious of him.` を「あなたに勘づかれていると彼は
  思っていたに違いない」と逐語訳していたのを、直前の地の文で主語が明らかなため
  「あなたに勘づかれていると思っていたに違いない」に修正した事例が発端。
- 2026-09-02: 上記ルールを「代名詞・指示語の訳しすぎ」全般に拡張（同日3回目の類似指摘）。
  同じ文中で「あなた」が2回出る／`That, that...`型の指示語の繰り返しを律儀に2回訳す、
  といった英語の反復をそのまま持ち込むケースも不自然と指摘され、パターンを追記した。
- 2026-09-04: v2チャンク構造を全面圧縮（トークン削減）。従来はentryごとに
  speakerProfile全文・previous/next全文・glossary抜粋を重複して埋め込んでおり、実測で
  翻訳対象のtextより前後文脈の方が遥かに大きかった（1chunk ~160,000字のうち previous/next
  だけで ~63,000字＝約4割、speakerProfile重複が~21,700字）。chunk単位の speakers辞書
  （1話者1回だけ定義）・previousの重複排除（直前entryと同じ文脈は省略、境界だけ`ctx`に
  残す）・next廃止（品質への影響なしと確認済み）・glossaryのchunk単位プール化・
  v2CharacterNotes.mdからの該当キャラ/シーンだけの抽出埋め込みに変更。
  translationGuide.mdも本ファイルへ更新履歴等を分離し縮小した。詳細は toBatchData.js
  冒頭コメントと本ファイルの各節を参照。
- 2026-09-04: runRoundLoop.mjs の `buildNotesPrompt()` 内でバッククォートが1箇所エスケープ
  漏れしており（構造圧縮の編集時に混入）、JSとしては構文エラーにならず「未定義識別子
  `表示名(speaker_id)` への冪乗演算」として解釈されてしまうため、話者メモ反省ステップの
  呼び出し時（chunkの翻訳・dry-run検証・chunks_reviewへの退避が終わった後）に
  `ReferenceError`で毎回クラッシュする不具合があった。round10がこれで
  progress更新・commit未達のまま止まっていたのを発見して修正（バッククォートを`\\`` に
  エスケープ）。round9・round10で新登場したYozz/Lauliegh/Socothbenoth/Mephisto/Hal/
  Shamira/Zacharius/AngelTargona等がv2CharacterNotes.mdに未記載だったのもこのクラッシュの
  影響。手動でv2CharacterNotes.md・glossary.jsonに追記して埋め合わせた（Halaseliaxの
  「ハラセリアックス」/「ハラセリアクス」表記ゆれもこの時見つけて統一）。
- 2026-09-04: round10 chunk_0000〜0003（DemonRankUp/DragonRankUp/LegendRankUp系）の
  訳し戻しレビューで、デーモン・デビル・ドラゴンが人間種族全体を指す `mortal(s)` を
  「定命の者」で訳す用法が定着していたためtranslationGuide.mdにルール化。glossary.jsonに
  Nurgal/Jezelda/Vellexia/Azlant/Avistan/Garund/Aspis Consortium/Pathfinder Societyを追記
  （いずれも本文中に複数回登場した固有名詞。一度きりのVarut/Chog/Hasi等は対象外とした）。

## 機械的に直せる control-tag 不整合パターン（2026-09-02 調査）

`node toBatchData.js extract --filter=issues` で拾える control-tag 不整合は、実際には
**大半が翻訳し直す必要のない、機械的なタグの復元で直るもの**だった。1件ずつ手で見る前に
必ず以下の自己検証つきスクリプトを通すこと（`missing`/`extra` が完全に0になった場合だけ
`zhCN.json` に書き戻す。1つでも解決しなければそのキーは一切変更せず手動レビューに回す）。

1. **`{n}...{/n}` の全文丸ごと欠落**（最多。4562件中2040件）: 原文が `{n}` で始まり
   `{/n}` で終わる単純な1ペアで、訳文にその2つが1つも無い場合、既存の訳文をそのまま
   `{n}` + 訳文 + `{/n}` で挟むだけで直る。翻訳し直す必要は無い。
2. **`{g|X}`/`{d|X}` の引数違い（1missing+1extra）**: 正しい位置に用語リンクタグは
   あるが `Encyclopedia:Penalty` のような汎用キーを使ってしまっていて、原文が要求する
   より具体的なキー（`Encyclopedia:Armor_Check_Penalty` 等）と食い違っているだけのケース。
   表示テキストはそのまま、タグの引数だけ原文の値に置き換えれば直る。
3. **完全に余分な `{g|X}...{/g}` ペア（0missing+Nextra）**: 原文に存在しないリンクを
   訳文側が誤って付けているケース。タグだけ剥がして中のテキストは残せば直る。
4. **辞書ベースの欠落ペア挿入**: 上記でも直らない「missing のみ」複数ペアの一部は、
   コーパス全体で `(tagType, argKey) -> 定訳の日本語文字列` を多数決で学習し、その語が
   訳文中に一度だけ（かつ既存タグの外側で）出現する場合に限ってタグで囲むと安全に直る。
   スクリプトは `Z:\Temp\...\scratchpad\autofix_*.mjs`（セッション使い捨てだが、次回また
   `dev/` 直下に similar なスクリプトを書けばよい）。

上記を先に流してから `extract --filter=issues` をやり直すと、残るのは本当に文脈判断が
要る（タグをどこに挿入するか、文章のどこが欠落しているか）少数のキーだけになる。
mf issue も直すなら、上の `verify.js` 修正を先に当ててから抽出すること。
