# 会話順通読の進捗

## 2026-10-11：c4開始・未決事項の反映

c0〜c3はClaude Codeで完了済み。c4は5,657件中、先頭262件を対訳で通読した。
`AirAdventures_BookEvent`（170件）、`AlushPortals_dialogue`（21件）、
`ArenaHealer_dialogue`（71件）まで完了。c4全体の通読は進行中。

次は **offset=262（263件目）** の `Atselm_dialogue` から再開する。
先頭キーは `ab41f166-6b95-4cd6-bd00-ef4dc61aecd1`。
当初の順序はc4の続き → c5 → c6 → Companions。下記の追加依頼でc5を先に開始した。

### 今回の変更

- 最新レビュー訳386件を修正（c4内44件、範囲外342件。以下の件数は重複を含む）。
- `Angel` →「天使」：209件。神話の道・副種別も含む。用語集のAngel / Angel Subtype、
  チャンク9ファイルの埋め込み用語集も更新。エンジェルキン、エンジェルブルーム、
  登録済みの固有名・呪文名は保持。それらを除く「エンジェル」の残存は0件。
- ウェンデュアグの候補153件を対訳で確認、138件を個別修正。
  通常の説明・威嚇・命令は簡潔な常体、ご主人様への従順な返答は丁寧語にする。
  ロマンス・親密な誘い・本音の弱さが出る場面の自然な柔らかい語尾は保持。
  例：daed5744、3b3c2edc、b3cd82c3、3bbb8057、80bf6ea0、1c255612。
  嘲る相手の台詞の引用（2d3fcb8f）、言いよどみ（8a517396）、別話者の女衛兵
  （5479aa54）は対象外。口調の判断はv2CharacterNotes.mdにも記録。
- c4の個別修正28件：遠征終了の意味の反転、石筍／鍾乳石、催眠状態／恍惚、
  持ち場／命綱、グレイヴドラッガー、金額の算用数字化、ソシエルの不自然な構文など。
- 「闇の貴婦人」→「影の貴婦人」を全体で10件統一。通読した範囲のdemon lord表記も
  既定の「デーモン・ロード」に揃えた。

### 検証

- 変更前後とも **Errors 26 / warnings 3**。制御タグ不整合0、キー欠落0、空文字0、
  訳が異なる重複0（consistency verify）。
- 全369ラウンドのimport `--dry-run`：全てinvalid 0、実行失敗0。
- バックアップ108ファイルとの差分検査：386件の訳文変更が計画と一致。
  entryの原文・話者・制御タグなど、訳文以外のフィールド変更0。
- `git diff --check`：問題なし。

### 作業データと再開方法

ローカルの `dev/test/readthrough-work/` にall.json、dialogfolder.json、各fixes、
適用前後のaudit.json、原状復帰用backup/、import-validation.jsonを保存。
同ディレクトリの.gitignoreで全てgit対象外。タグを日本語語順に並べ替えてある7件は
既存apply.mjsの順序制限に該当するため、訳文のタグ順序を保持して個別に適用・検査した。

`dev/`で実行：

```powershell
node --max-old-space-size=8192 helper/readthrough/survey.mjs test/readthrough-work/all.json
node --max-old-space-size=8192 helper/readthrough/folders.mjs test/readthrough-work
node helper/readthrough/chapdump.mjs test/readthrough-work c4 test/readthrough-work/c4-next.txt 1500 262
```

データが失われても最新チャンクから再生成できる。範囲外の用語・口調修正はその章全体の
通読完了を意味しない。既存zhCN.jsonへのマージ、ゲーム配布、pushは実施していない。

### 外部TODOへの転記待ち

引き継ぎメモにある外部TODOドキュメント `DZVLE1aYFmbjGL69BpLbkK`
（表 `mse1hqv9b9d.7471`）を操作するツールがこのセッションにはなく、未更新。

| 作業 | 状態 | 記録 |
|---|---|---|
| 天使／エンジェルの統一 | 完了 | 209件、用語集・埋め込み用語集も更新。固有の派生語は保持 |
| ウェンデュアグの不自然な女言葉 | 完了 | 候補153件確認、138件修正。親密な文脈・引用・言いよどみは保持 |
| c4の会話順通読 | 進行中 | 262 / 5,657件。次はAtselm_dialogue、offset=262 |

## 2026-10-11：追加依頼によりc5開始

c5は7,597件中、先頭208件（次の4会話）を通読し、28件を修正した。
c4の再開位置は上記のoffset=262のまま。

- AreeluCell_AreeluLabAgain_c5_dialog：50件
- Opon_AreeluLabAgain_c5_dialog：70件
- Witchunter_AreeluLabAgain_c5_dialog：25件
- AreshkaConfrontation_dialogue：63件

次は **c5 offset=208（209件目）** の `CrossingTheRift1_dialogue`。
先頭キーは `3fb4e020-a625-4889-ac08-caad4ce3749c`。
先頭12件は予備確認したが、進捗は会話単位で208件までとする。

### 修正・口調の判断

- 話者欄が空のアレールの投影を既定の丁寧語に揃えた。
- 「約束した」を「約束を果たした」、「幽霊が閉じ込められていた」を主人公の行為とする誤訳を修正。
- 背中を刺すという裏切りの慣用表現、失われた目を指す代名詞、指輪の感触を失ってからの経過時間を修正。
- brazierの「香炉」を該当会話で「火鉢」に、vigilの「夜伽」を「見張り」に修正。
- ウェンデュアグの威嚇「末路ね／燃えなさい」を「末路だ／燃えろ」に修正。
- cultistを「カルト信者」に揃えた。スフィンクスの代弁者になったネニオの丁寧語は既定の例外どおり保持。

### 検証・作業データ

- apply.mjsの試し実行：ok 28 / bad 0。その後、レビュー用チャンク2ファイルに適用。
- consistency verify：Errors 26 / warnings 3。制御タグ不整合・欠落・空文字・訳の異なる重複は0。
- バックアップとの比較：28件の訳文変更が計画と一致、訳文以外のフィールド変更0。
- 全369ラウンドのimport `--dry-run`：全てinvalid 0、実行失敗0。git diff --checkも問題なし。
- データは `dev/test/readthrough-work/c5-start/` のfixes.json、audit.json、backup/に保存。
  前回のc4の監査・バックアップは保持。外部TODOは引き続き転記待ち。

| 作業 | 状態 | 記録 |
|---|---|---|
| c5の会話順通読 | 進行中 | 208 / 7,597件。28件修正。次はCrossingTheRift1_dialogue、offset=208 |

## 2026-10-11：c5の209〜506件目

298件を追加通読し、34件を修正。c5累計は **506 / 7,597件、62件修正**。
CrossingTheRift1〜3、EnygmaEnter、FoxDontLeave、FoxMyself、ShadowOfAreshka、
StatueChallenge、VowingToAreshka、VowToAreshka、DragonHatched、DragonsBeforeBattle、
HokugolAfterBattle、KTC_LatimasCalls、LatimasAfterBattleの15会話を完了。

次は **c5 offset=506（507件目）** の `Chun_Drezen_c5_Dialogue`。
先頭キーは `e0b87edb-8cdd-4447-9a0c-ee6fca8b3478`。
同会話の先頭2件は予備確認したが、読了位置は会話単位で506件までとする。
c4の未読範囲は引き続きoffset=262から。

### 今回の修正

- 自分を取り戻した後のネニオを通常の常体へ戻した。百科事典への熱意が戻る分岐も同様。
- ネニオの女性語、エンバーの丁寧語の抜け、ネニオの二人称「お前たち」を修正。
- ネニオの呼びかけ「坊や／お嬢さん」の抜けを4件復元。性別分岐を保持。
- 転送の力の主に「会うまで」を「手に入れるまで」とした誤訳、「私が答えだ」を条件文にした誤訳を修正。
- エニグマの声の「汝」を「お前」に揃え、同じ問いかけの訳を統一。
- 黒竜ラティマスは正体開示後「我」、守護竜ホクガウルは「私」に一人称を統一。学者の連絡時は「私」を保持。
- 「好古家ラティマス」を全体検索し、用語集どおり「骨董家ラティマス」に修正（該当1件）。
- 名／称号、血の塊／口に溜まった血、途切れた名乗りなどの不自然な表現を修正。

### 検証・保存

- apply.mjsの試し実行：ok 34 / bad 0。レビュー用チャンク2ファイルへ適用。
- consistency verify：Errors 26 / warnings 3（増加なし）。制御タグ不整合・欠落・空文字・訳が異なる重複0。
- バックアップとの比較：34件の訳文変更が計画と一致。訳文以外のフィールド変更0。
- 全369ラウンドのimport `--dry-run`：全てinvalid 0、実行失敗0。git diff --checkも問題なし。
- `dev/test/readthrough-work/c5-next/` にfixes.json、audit.json、backup/を保存。前回の記録は保持。
- 外部TODOは引き続き転記待ち。

## 2026-10-11：c5の1184〜1362件目

179件を追加通読し、35件を修正。c5累計は **1,362 / 7,597件、165件修正**。
KTC_KingdomLost（10件）、Nocticulaの援軍（12件）、TheatreCalls（9件）、Miammir（18件）、Nystra（6件）、
AneviaDrezenPartisans（59件）、AneviaStopYou（22件）、FreeGraveknightStaunton（43件）を完了。
次は `Goddesses_Summit_dialogue`、offset=1362、キー `56e47041-536d-4f0d-b7f8-282808c1d7bc`。
女神との会話は既に先へ読み進めているが、修正・検証完了の境界はここ。

- アネヴィアの引用中のイラベスの一人称と、指揮官が解任されていないという発言を修正。
- スタントンの復讐の主語・目的語を修正し、アンデッド化後の一人称を「私」に統一。
- サキュバスの用語、葬儀と弔いの宴の区別、数年と十年の誤訳、仲間の短い口調の混入を修正。
- apply試行・適用：ok 35 / bad 0。バックアップ比較：訳文35件、他のフィールド変更0。
- consistency verify：Errors 26 / warnings 3、制御タグ不整合・欠落・空文字・異なる重複0。
- 全369ラウンドのimport試行：invalid 0、失敗0。
- 監査・バックアップ：`dev/test/readthrough-work/c5-partisans/`。外部TODOは転記待ち。

| 作業 | 状態 | 記録 |
|---|---|---|
| c5の会話順通読 | 進行中 | 506 / 7,597件。累計62件修正。次はChun_Drezen_c5_Dialogue、offset=506 |

## 2026-10-11：c5の507〜850件目

344件を追加通読し、30件を修正。c5累計は **850 / 7,597件、92件修正**。
Chun_Drezen_c5_Dialogue（9件）、Ciar_c5_Dialogue（8件）、Coronation_Dialogue（327件）を完了。
チュンとシーアの会話は修正なし。神話の道ごとの演説の違いと敵対分岐の威圧的な口調は保持。

次は **c5 offset=850（851件目）** の `DrezenC5_Ramien_dialogue`。
先頭キーは `0920616d-` で始まる。先頭1件のみ予備確認済みだが、進捗は会話単位で850件まで。
c4の再開位置は引き続きoffset=262。

### 今回の修正

- cultistの「狂信者／信奉者」をこの会話内で「カルト信者」に揃えた。
- アイオーメディの二つ名「インヘリター」を用語集の「継承者」に修正。
- フール王の話者欄が空の台詞を「余」に、デスカリの呼びかけを既定の「同類」に修正。
- 「今この時をおいて」「魂を並べる」「最後の言葉を持つ」など不自然な直訳を修正。
- 「私から逃げる」と「私を追い払う」の意味の違い、舌を引き抜く／切り落とす、
  財宝に色目を使う／取り分を狙う、尻を向ける／むき出しにするを修正。
- 忠誠心を疑われた戦士が仲間に殺される地の文の係り受けを明確にした。
- 主人公の一人称と紛らわしい僕（しもべ）を「諸君」に、伝聞内の「お前」を「私」に修正。
- 一般のchampionは文脈に沿う「勇士」に、give them Hellの慣用句は「地獄を見せる」に修正。
  位界名としてのヘルは保持。シーラが繰り返す目的の文を現在形へ修正。

### 検証・保存

- apply.mjsの試し実行：ok 30 / bad 0。レビュー用チャンク2ファイルに適用。
- consistency verify：Errors 26 / warnings 3（増加なし）。制御タグ不整合・欠落・空文字・訳が異なる重複0。
- バックアップとの比較：30件の訳文変更が計画と一致。訳文以外のフィールド変更0。
- 全369ラウンドのimport `--dry-run`：全てinvalid 0、実行失敗0。git diff --checkも問題なし。
- `dev/test/readthrough-work/c5-coronation/` にfixes.json、audit.json、backup/を保存。
  以前のc4・c5の記録は保持。外部TODOは引き続き転記待ち。

| 作業 | 状態 | 記録 |
|---|---|---|
| c5の会話順通読 | 進行中 | 850 / 7,597件。累計92件修正。次はDrezenC5_Ramien_dialogue、offset=850 |

## 2026-10-11：c5の851〜1183件目

333件を追加通読し、38件を修正。c5累計は **1,183 / 7,597件、130件修正**。
Ramien（12件）、Galfrey（128件）、Hulrun（29件）、Klejm（7件）、KTC_AneviaStart（157件）を完了。
次は **c5 offset=1183** の `KTC_KingdomLost_c5_Dialogue`。
先頭キー `5554063f-c02b-4ef4-84d9-5304e0e1e27d`。その先の12件は予備確認済み。
ユーザーより全て終わるまで続けてよいとの指示あり。c5後、c4残り・c6・仲間・NPC_Common・エピローグ・DLCも継続する。

### 修正と判断

- 女王とのロマンス：他の相手との関係の清算を「他の用事」とした誤訳、想いの向きが曖昧な文を修正。
- ハルランの冒頭の丁寧語を既定の常体へ。主人公の会話も通常の常体へ戻し、Prelateは「司教殿」に。
- ハルランの総督の地位を「元々」ではなく「名目上は今も」と修正。
- アネヴィアの敬語化を修正。イラベスの真似と明示される軍人風の報告976c0cbeは保持。
- 命令する側と従う側が逆の「この群れの言うことを聞くのは、あんただけ」を修正。
- イラベスの決戦後の復讐の宣言、慣用句、襲撃の目的、十数体／十数部隊などを修正。
- イラベスの短い常体の混入を丁寧語に戻した。

### 検証・保存

- apply.mjs試行：ok 38 / bad 0。レビュー用チャンク3ファイルへ適用。
- consistency verify：Errors 26 / warnings 3。制御タグ不整合・欠落・空文字・訳の異なる重複0。
- バックアップとの比較：38件の訳文変更が計画と一致、他のフィールド変更0。
- 監査・バックアップは `dev/test/readthrough-work/c5-drezen/`。過去の記録は保持。
- 全369ラウンドのimport試行はinvalid 0、失敗0。git diff --checkも問題なし。
- 外部TODOは引き続き転記待ち。
