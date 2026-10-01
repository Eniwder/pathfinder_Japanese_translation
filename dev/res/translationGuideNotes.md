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

- 2026-09-25: round124のchunkで`[Say nothing]`が「[黙っている]」（Woljif系3件）と「[何も言わない]」
  （Arueshalae系1件）に割れていたため、選択肢表記統一ルールの例に`[Say nothing]`→`[黙っている]`を追記。

- 2026-09-25: スル族長のsh訛りがround0113・0114（老人口調のみ）と0115（全面的に「でしゅ」崩し）で
  割れていたため、v2CharacterNotesのスル項目を「老人口調を基本に維持し、原文のsh表記の頻度に
  合わせて時々だけ崩す」方針に更新。0113〜0115の該当台詞もこの方針で見直した。
- 2026-09-21: round96のchunkで"What are you going to do after we win?"がGalfrey（単数のyou）と
  IrabethAnevia（複数のyou）で「あなた」「あなたたち」に訳し分けられていた（機械検出の表記ゆれ
  候補）のを確認。地の台詞の訳し分けは既存ルール通り問題なしと判断し、ルール追記はなし。
- 2026-09-20: round84のchunkで"I have to go."/"I have no more questions."が複数の会話ファイルに
  またがって同一訳（句読点のみ微差）で使い回されていた（機械検出の表記ゆれ候補）のを見て、
  汎用的な離脱・質問終了の定型選択肢は句読点も含めて既存の訳し方に揃えるルールを
  translationGuide.mdに追記。
- 2026-09-20: round77のchunkで"What is this place?"/"What are you doing here?"が
  話者違いで訳し分けられていた（機械検出の表記ゆれ候補）のを見て、既存の統一ルールが
  地の台詞には及ばない旨をtranslationGuide.mdに明記。
- 2026-09-20: round76のchunk（"Where should I look for it?"の訳が全角？と半角?で表記ゆれ
  していた）を見て、疑問符・感嘆符を全角に統一するルールをtranslationGuide.mdに追記。
- 2026-09-18: round50のchunk（観客が"Me-phit Sla-yer!"と音節を区切って叫ぶ場面）で
  掛け声のハイフン区切りをどう訳すか迷ったため、中黒で音節区切りを保持するルールを
  translationGuide.mdに追記。
- 2026-09-18: round47のchunk（Morvegがゴルムに祈る場面）で`Rroumgr bar! Todan khtar! Gorum lakh!`
  という架空言語の詠唱句をどう訳すか迷ったため、意味を持たない発明言語のフレーズは
  カタカナ音写でそのまま移すルールをtranslationGuide.mdに追記。
- 2026-09-17: round44のchunkで`Upper Planes`/`Lower Planes`/`Plane of Earth`の訳が
  「上位位界」「下位位界」「地の位界」で揃っていたため、`Plane`＝「位界」統一ルールを
  translationGuide.mdに追記。
- 2026-09-14: round39のchunk（Aivuが赤ちゃんドラゴンのセリフ`YES ME DRAGON YES`を引用する箇所）
  を訳す際、正しい文法に直すべきか迷ったため、片言はそのまま片言で訳すルールを
  translationGuide.mdに追記（既存の泥酔口調ルールと同様の考え方）。
- 2026-09-13: round36のchunk内で`the Wound`（Worldwoundの略称）が「世界傷痕」「ワウンド」と
  訳がブレていた（既存glossaryの`Worldwound`＝「ワールドウーンド」と不一致）のを発見し、
  略称でも同じ訳語に統一するルールをtranslationGuide.mdに追記。glossaryにも別名エントリを追加。
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
- 2026-09-04: round11 chunk_0000〜0003（LegendRankUp/LichRankUp/LocustRankUp/
  TricksterRankUp系）の訳し戻しレビューで、`[Choice effects]` タグの訳し方が
  チャンクによって「[選択の効果]」/英語のまま、と割れていたのを発見しtranslationGuide.md
  にルール化（統一表記へは未着手、次回以降の訳出から適用）。v2CharacterNotes.mdに
  Deskari/FoolKing/KTC_SocothbenothDisguised/Shyka/MythicLich_KTC_Elyanka/
  MythicLich_KTC_Septimusを追記、glossary.jsonにTar-Baphon/Xanthir Vang/Brevoy/Gebを追記。
- 2026-09-04: round12 chunk_0000〜0003（TricksterRankUp_4/5、第1章冒頭のAnevia/Seelah/
  Lann/Wenduag/Camellia初登場シーン）の訳し戻しレビューで、FoolKingの泥酔した支離滅裂な
  台詞（"Pulidinsh shud pee eh shampshuns."）をひらがな音写で崩して訳していた事例から
  translationGuide.mdにルール化。v2CharacterNotes.mdにAnevia Tirabade/Camelliaを追記
  （glossary.jsonには両名とも既存だったため変更なし）。
- 2026-09-05: round14 chunk_0000〜0003（第1章ケナブレス冒頭、Wenduag/Chief Sull/
  Storyteller/Dretch Stitch/Irabeth・Anevia Defender's Heart登場シーン）の訳し戻し
  レビューで、`AfterAttackIrabeth_Dialogue`等の一部entryだけ台詞が日本語の鉤括弧「」
  ではなく英語の `"..."` のまま残っていたのを発見しtranslationGuide.mdにルール化
  （個別の訳し直しは対象外・次回以降の訳出から適用）。v2CharacterNotes.mdに
  Dretch_Stitch/Storyteller/Hurlun_SilentCaster/IrabethTirabade_DH/
  AneviaTirabade_DHを追記（後2者は既存のIrabeth Tirabade/Anevia Tirabadeと同一人物だが
  blueprint側のspeaker idが異なりextractの自動抽出が拾えないため別出しで追記）。
  glossary.jsonに複数の訳し分けがあったAreelu（アリールー/アレールー/アリーロ）を
  正式追記して統一表記を明示。
- 2026-09-05: round15 chunk_0000〜0003（Defender's Heart酒場のQueenGalfrey来訪/Jernaugh/
  Joran/Staunton Vhane/LiLura(Indarah)/Woljif初登場シーン）の訳し戻しレビューで、
  `Joran`（鍛冶師・スタントンの弟）が既存glossary の`Jorun Vane`と同一人物ながら別スペルで
  登場し訳文も「ジョラン」と不統一になっていたのを発見、translationGuide.mdに
  同一人物の表記ゆれをglossaryで確認・統一するルールを追加。v2CharacterNotes.mdに
  Daeran（DH文脈の別speaker id）/LiLura_Kenabres(Indarah)を追記。glossary.jsonに
  Indarah/Jistka/Absalom/Osirion/Minagho/Condemned/Heaven's Edge/Blackwing/Gemylを
  追加し、Joranは`Jorun Vane`と同一人物として要統一の注記付きで追記。
- 2026-09-06: round19 chunk_0000〜0003（EmberKnight/モングレル・Daeran初対面パーティー/
  Ramien/Aranka/劇団/ティーフリング系）の訳し戻しレビューで、既存glossaryが
  `Chief Sull`→`スル族長`で確定しているにもかかわらず、同chunk内で`Sull`単体を
  「サル」（猿と同音）と誤訳している箇所を発見。translationGuide.mdに固有名詞の音写が
  既存の日本語単語と紛らわしくないか確認するルールを追加。v2CharacterNotes.mdに
  DLC1_Woljif_Companion（既存Woljif_Companionと同一人物のDLC専用speaker id）を追記。
- 2026-09-10: round21 chunk_0000〜0003（ドレゼン包囲戦の作戦会議〜城砦最終決戦〜
  ヌーラ戦後会話）のレビューで、`{Name}`（大文字）や`{race}`が`{name}`小文字と違い
  `<ctrl_N/>`化されず生のまま残ることに気づき、translationGuide.mdに一言追記
  （そのまま訳文にコピーすればよいだけで、誤って訳したり削ったりした形跡はなかった）。
  v2CharacterNotes.mdにUlbrig Olesk/Seelah/Camellia/Minagho_DrezenCitadel_Boss/
  StauntonVane_Boss/Nura_DrezenCitadel_Minibossの計6件（いずれも既存キャラの
  シーン専用speaker id）を追記。glossary.jsonにDarrazand（グレイボーの依頼対象、
  本編未登場の言及のみ）を追加。
- 2026-09-12: round32 chunk_0000〜0003（Elyanka/Septimus初登場、Seilkind、
  Next-Door Theater劇団Grandma Gretlen登場エピソード）のレビューで、おどけた敬称
  `your Commandership`/`{mf|his|her} Commandership`が同一chunk内で「指揮官殿」
  「指揮官様」と訳し分けられているのを発見。`Commander`本体とは別語として扱い訳語を
  統一するルールをtranslationGuide.mdに追記。新規話者は検出されずv2CharacterNotes.mdの
  変更なし。glossary.jsonにSeptimus/Whispering Tyrant/Grandma Gretlen/Next-Door Theater/
  Katapesh/Numeriaを追加。
- 2026-09-11: round24 chunk_0000〜0003（HellknightVsGargoyles/Regill初登場エピソード）の
  レビューで、glossary未登録の`Order of the Sunrise Sword`がchunk内で
  `日昇の剣団`/`サンライズ・ソード騎士団`/`サンライズソード騎士団`と3通りに訳し分けられて
  いるのを発見。translationGuide.mdに、組織名がglossary未登録のままchunk内で複数回
  訳出される場合は初出の訳語に揃えるルールを追記。glossary.jsonに
  Order of the Sunrise Sword/Paralictor/Gray Garrisonを追加。
- 2026-09-11: round28 chunk_0000〜0003（AreeLab/TargonaPrison/TargonaWings、
  Arueshalaeの要塞シーン）のレビューで、同一の選択肢`[Attack]`がchunk内で
  `[攻撃]`（3箇所）/`[攻撃する]`（1箇所）と訳し分けられているのを発見。
  組織名ルールと同様、選択肢の角括弧表記も統一する旨をtranslationGuide.mdに追記。
  glossary.jsonにProtectress/Ivory Sanctum/Bell of Mercy/Jaruunicka/Architect
  （アリールーの二つ名）を追加。新規話者は検出されずv2CharacterNotes.mdの変更なし。
- 2026-09-12: round30 chunk_0000〜0003（Herald_Drezen_c3_dialog/GalfreyArrives_Drezen_c3_dialog/
  Irabeth_C3_Intro_Dialogue/Hulrun_Dresen_Dialogue）のレビューで、天使など神話的存在が
  主人公を「Champion」、人間の部下が「Commander」と呼び分けている点を確認。訳語が
  「チャンピオン」「指揮官」で混同されないようtranslationGuide.mdに追記。glossary.jsonに
  Midnight Fane/Red Morning Massacre/Starstone/Outer Planes/Khorramzadeh/Hepzamirah/
  Cheliax/Houndhearts/Gray Road/Championを追加。新規話者は検出されずv2CharacterNotes.mdの
  変更なし。
- 2026-09-12: round34 chunk_0000〜0003（MidnightFaneFinal/Xanthir_before・after/
  Barricade_MidnightFane/DarrazandFight/FreeCrusaders_Azata系）のレビューで、
  Xanthirの台詞中に `"'Transformation.'"` のように `「」` の中にさらに `'...'` で
  二つ名を囲む原文があり、そのまま単引用符を残す/二重に「」を使う訳が混在していたのを
  発見。セリフ内の入れ子引用は `『』` を使うルールをtranslationGuide.mdに追記。
  新規話者は検出されずv2CharacterNotes.mdの変更なし。glossary.jsonにKnight Commander/
  Early Sunset/Kel Five Knives/Skerenthalを追加。
- 2026-09-14: round41 chunk_0000〜0001（Council系ダイアログ）のレビューで、人語を話さず
  鳴き声のみのヒッポグリフCobblehoofが登場し、鳴き声を意味のある台詞に訳さず擬音のまま
  音写するルールをtranslationGuide.mdに追記。v2CharacterNotes.mdにChadali/Eritrice/
  Cobblehoofを追加、glossary.jsonにChadali/Eritrice/Cobblehoof/Erebus/Vudraniを追加。
- 2026-09-18: round45 chunk_0000〜0001（キャド初登場のエラスティル神殿シーン、
  デラメアの納骨堂対話、骸骨の行商人エピソード）のレビューで、デラメアの原文がサ行を
  伸ばす特有の話し方（`wasss`等）だが訳文は音写で崩さずなめらかな丁寧語で再現していた
  ため、歯擦音を伸ばす話し方は無理に崩さなくてよい旨をtranslationGuide.mdに追記。
  v2CharacterNotes.mdにKyadoDrezen/Kyado_main_dialogue/KyadoPityPriest/DelamereInTomb/
  SkeletalSalesmanSE_dialogueを追加、glossary.jsonにKyado/Rathimusを追加。

- 2026-09-18: round53 chunk_0000〜0001（Fleshmarketsの奴隷商人Sarzaksys/Ramisa/Kerz、
  ノクティキュラとBaphomet後の対話系）のレビューで、金額の選択肢（`thirty-five thousand
  gold coins`等）が英語の綴り数詞のまま並ぶchunkが複数あったため、算用数字に変換する
  ルールをtranslationGuide.mdに追記。新規話者は検出されずv2CharacterNotes.mdの変更なし。
  glossary.jsonにMaster Sarzaksys/Lady Vorlesh/Ramisa/Sloughed Skin/the Echo/
  The Bloody Bitch/Nameless Ruins/Plagued One/Hellknight/Lower City/Alinythia/
  Ziforian/Xuneki/Migorgを追加。

- 2026-09-19: round66 chunk_0000〜0001（Ten Thousand Delights娼館のChivarro_dialogue/
  Herraxa_dialogue）のレビューで、`brothel` の訳語が「店」「娼館」で割れていたため「娼館」に
  統一するルールをtranslationGuide.mdに追記。新規話者は検出されずv2CharacterNotes.mdの
  変更なし。glossary.jsonにMireya/Rokhorn/Willodus/Rotten Guttery/Den of Sweet Horror/
  Palace of Incest and Degeneracy/Mad Glowworm/Lantern Kingを追加。

- 2026-09-20: round78 chunk_0000〜0001（Sarkorisのthe Mineshaft/Foreman_dialogue、
  Seilkind_Cave_dialogue、DrezenDouble/DrezenLiar/DevilsJudgement_dialogue）のレビュー。
  新規ルール化するほどの表記ゆれ・新規話者は検出されず、translationGuide.md/
  v2CharacterNotes.mdの変更なし。glossary.jsonにForeman/Jarocen/Mineshaft Fourteen/
  Sarkorians/Galfreyzu/Taker of Armies/Grand Duchy of Alkenstar/Zasvel/Morten/Pitax/
  Neroysanを追加。

- 2026-09-21: round88 chunk_0000〜0001（LocustC5系/RaspenRifts_Echo_End_Dialogue/
  TheDarkestRitual_dialogue/Zacharius_FinalBetrayal_dialogue）のレビュー。"Who are you?"
  "What do you want?" 等の定型セリフの訳し分けは話者・文脈違いによるもので既存ルール
  （地の台詞は文脈次第で訳し分けてよい）の範囲内と判断し、新規ルール追記は見送り。
  新規話者は検出されずv2CharacterNotes.mdの変更なし。glossary.jsonにIzyagna/Izを追加。

- 2026-09-27: round151 chunk_0000〜0001（GrifRemains/GrifNest/UlbrigMourning/
  Ulbrig_GardenGods系/Nexus_UlbrigUpset等のUlbrigロマンス関連dialogue）のレビュー。
  Playerの同情・お悔やみ用途の"I'm sorry."が「気の毒に」「残念だ」に割れていたため
  translationGuide.mdに揃えるルールを追記。新規話者は検出されずv2CharacterNotes.mdの
  変更なし。glossary.jsonにGreat Hareを追加。

- 2026-09-27: round152 chunk_0000〜0001（DLC5_AfterAdventure系/DLC5_Hermit_dialogue/
  DLC5_AndroidJoin_dialogue等）のレビュー。"We have to go."の訳が「もう行かないと」
  「もう行かなければ」に割れていた（機械検出の表記ゆれ候補）が、別会話・別話者での
  地の台詞であり既存ルール通り問題なしと判断、ルール追記はなし。新規話者は検出されず
  v2CharacterNotes.mdの変更なし。glossary.jsonにAethylia/Usurviel/Norte/Ulab/
  Stahlmar/Blazing Squadron/Nine Hellsを追加。

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

## 更新履歴

- 2026-09-28（round158）: 表記ゆれ検出で"Tell me about yourself."の訳が割れていた
  （companion毎に「あなたのことを聞かせてくれ」/「あなた自身のことを聞かせてくれ」）ことから、
  translationGuide.mdの定型選択肢統一ルールに同フレーズを追記。
- 2026-09-28（round160）: 表記ゆれ検出で"I'm not interested."の訳が句読点の有無で割れていた
  （DLC6_ArenaMasterArrival_dialogue/Dialogue_DLC6_Madam_InLoveの両方でPlayerの汎用拒否選択肢）
  ことから、translationGuide.mdの定型選択肢統一ルールに同フレーズを追記。
- 2026-09-28（round161）: Dialogue_DLC6_TheaterFailで"Impossible Kingdoms"/"Possible Kingdoms"の
  ダジャレの掛け合いが登場したことから、translationGuide.mdに語呂合わせ地名は音写より意味優先で
  訳す旨を追記（この2語自体は文脈依存の一発ネタなのでglossaryには載せていない）。
- 2026-09-29（round175）: Dialogue_AneviaMainでAneviaの出身にまつわるNidal/Nisroch/
  Kuthites/Silent Shroud/Shelynitesが未登録だったためglossaryに追記。あわせて神格名+`-ite(s)`
  （信奉者を指す語）は「〜の信奉者」で統一する旨をtranslationGuide.mdに追記。
- 2026-09-30（round191）: ドラコニック血脈のブレス説明で`60-foot line of acid`等が
  「60フィート直線の〜」/「60フィートの直線状の〜」、抵抗表記が「抵抗：電撃20」/「電撃抵抗20」と
  チャンク間で割れたため、効果範囲・抵抗の定型をtranslationGuide.mdに追記。
  あわせてブラッドレイジャーのアーキタイプHag-Riven/Reformed Fiendをglossaryに追記。
- 2026-09-30（round200）: "Ki Power: Wholeness of Body"が「完全なる肉体」/「全身の完全性」と
  チャンク間で割れたため、モンクの気の力（Wholeness of Body/Diamond Body/Diamond Soul/Perfect Self）と
  Defensive Instinct/Cunning Elusionをglossaryに追記（ルール追記はなし）。
- 2026-09-30（round201）: クラス名"Oracle"が「オラクル」/「神託者」と割れたため、クラス名もカタカナ
  音写とする旨をtranslationGuide.mdに追記。Oracleと呪文修正特技Empower Spell/Quicken Spellをglossaryに追記。
- 2026-09-30（round205）: マンティコアの子の棘説明で`bypass DR`が「ダメージ減少〜を貫通」/「DR〜を無視」、
  `primary natural attack`が「主要」/「第一」と割れたため定型をtranslationGuide.mdに追記。
  Bolster Spell/Master Shapeshifterをglossaryに追記。
- 2026-09-30（手動）: glossaryに無いシステム用語が「追記を提案」のままログに埋もれ、Reach Spell（4通り）・
  Serpentine Bloodline・Stalwart Defender等がroundごとに割れていた。訳者報告の`用語: X → Y`行を
  notesステップへ渡し、notesの登録対象にシステム用語を追加（roundPrompts.mjs / runRoundLoop.mjs）。
  Ghaele（ガエル、旧「ゲイリー」は誤り）・Fortification（急所防御）・Reach Spell（呪文射程伸長）・
  Stalwart Defender・Serpentine Bloodline・Student of War・Pentamic Faith（五神信仰）をglossaryに追記し、
  chunks_reviewの既存訳47件を置換。
- 2026-09-30（手動・訂正）: 直前の記録で Fortification を「急所防御」としたのは誤り。PRDの
  「フォーティフィケイション（Fortification／急所防御）」は武器と同じくカタカナが名称で括弧内は意味の説明
  （「急所防御」は錬金術師の発見 Protect Vitals の訳とも衝突）。防具特殊能力をPRD表記のカタカナに揃え
  （バランスト・アロー・デフレクション・スペル・ストアリング等）、Student of Stone を「石の学徒」に統一。
  cloud.mjs の notes-prompt もサブエージェント報告（chunk_000N.report.txt）の用語行を受け取るようにした。
- 2026-09-30（round212）: Maximize Spell が「呪文最大化」/「呪文威力最大化」と割れたため、Empower Spell（呪文威力強化）に
  揃えて「呪文威力最大化」でglossary登録。他の報告語（メタマジック熟達・不定形・硬度等）も追記。
- 2026-09-30（round214）: 報告語（ボーガ・肉の館/小屋/要塞・スウォームフォーム・視認困難・封印3種・スラムガミン等）をglossary登録。
- 2026-10-01（round216）: クレジットで `Audio Team` 等が「オーディオ・チーム」/「オーディオチーム」と割れたため中黒なし連結をtranslationGuide.mdに追記。報告のキャラ名（アミリ・ジェータル等）をglossary登録。
- 2026-10-01（round220）: `Adamantine Full Plate +4` で「+4」前の空白有無が割れたため強化値直結をtranslationGuide.mdに追記。防具名・抵抗段階・Owlbeast等をglossary登録。
- 2026-10-01（round217）: チュートリアル系の報告語（キャントリップ・脅威範囲・武器クラス等）とクリーチャー名（ゴーレム各種・ハグ等）をglossary登録。キャラ/ルール追記なし。
- 2026-10-01（round227）: アイテム名（パール・オヴ・パワー等）・アザータ/ナバス・クレメント等をglossary登録。キャラ/ルール追記なし。
- 2026-10-01（round231）: `+2 bonus on all damage rolls you make using X` が「+2の…を得る。対象は…」/「Xによる…すべてに+2の…を得る」と割れたため後者に統一するルールをtranslationGuide.mdに追記。大型バスタード・ソード・ルーンストーン等をglossary登録。キャラ追記なし。
- 2026-10-01（round237）: フロスト系神話能力・デモニック・フォーム各種・悪魔クリーチャー・ヘルの〜/〜の封印・神話特技名等をglossary登録。キャラ/ルール追記なし。
- 2026-10-01（round230）: 武器名・メタマジック特技・シフター/ゼン・アーチャー等をglossary登録。Difficulty Classは本文の訳に合わせ「難易度」で登録（DC表記は別）。キャラ/ルール追記なし。
- 2026-10-01（round235）: エンジェル系の勅令・ウォード・召喚クリーチャー等をglossary登録（Edict of Invulnerabilityは音写を意味訳「不可侵の勅令」に修正）。キャラ/ルール追記なし。
- 2026-10-01（round239）: 神話特技名（群れ系・第二の〜等）・メタマジック名・変な呪文名・ビア・エレメンタル等・種族名をglossary登録。キャラ/ルール追記なし。
- 2026-10-01（round238）: ゴールドドラゴン/リッチ/アンデッド系の神話能力・ブレス・スケルトン各種・アブンダント系特技等をglossary登録。キャラ/ルール追記なし。
