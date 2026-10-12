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
| c5の会話順通読 | 進行中 | 1,681 / 7,597件。累計210件修正。次はHilorDangerousPrison_dialogue、offset=1681 |

## 2026-10-11：c5の1363〜1681件目

女神との会話 `Goddesses_Summit_dialogue` 319件を通読し45件修正。累計 **1,681 / 7,597件、210件修正**。
アレールとアルエシャラエの丁寧語、アイオーメディの常体を整理。「影の貴婦人」「継承者」、ウォルジフの「ボス」を統一。
ウルブリグの次の敵の主語逆転、干しプラム、使者のcompanion、30年後の時系列、悼むという不自然な表現を修正。
apply：ok 45 / bad 0、訳文以外の変更0。verify：Errors 26 / warnings 3、タグ不整合0。全369ラウンドimport invalid 0、失敗0。
監査・バックアップは `dev/test/readthrough-work/c5-summit/`。次の未検証境界はoffset=1681、HilorDangerousPrison_dialogue。
その先1813件目まで予備通読済み。Hilorの賭け金を既存の借金とする表現、Orengoftaの拷問の責任主体、カルト信者、アルエシャラエの口調を次回修正する。

## 2026-10-11：c5の1682〜1942件目

261件を追加通読し、37件修正。累計 **1,942 / 7,597件、247件修正**。
HilorDangerousPrison（16件）、Orengofta（70件）、StorytellerDangerousDrezen（27件）、
VendorDangerousTavern（40件）、Anemora（78件）、AreeluIntro_c5_Iz（30件）を完了。

- ハイラーの賭け金を既存の借金とする表現、捕虜の拷問の責任主体、アルエシャラエの丁寧語を修正。
- 指揮官へのヤーカーの「お前」や短い常体を修正。酒場の主人との言い合いは常体を保持。
- アネモラの台詞の「狡知」、cult cellsの「細胞」、カルト信者の用語を修正。
- アイヴの「私たち」が自分一人になっていた箇所、地の文の二人称「お前」を修正。
- イズで話者欄が空のアレールは指揮官への既定の丁寧語。独り言の1868b8e7は保持。
- apply試行・適用：liberation ok 12 / bad 0、iz-intro ok 25 / bad 0。訳文以外の変更0。
- 両適用後のverify：Errors 26 / warnings 3。全369ラウンドimport：invalid 0、失敗0。
- 監査・バックアップ：`dev/test/readthrough-work/c5-liberation/`、`c5-iz-intro/`。

次の修正・検証境界：**offset=1942**、`Banner_Iz_Dizlogue`、キー `56e3cdf7-161a-44b0-ab21-e02e0eb29ace`。
Banner56件は原文・訳文とも予備通読済み。未適用候補：901de57aのスタントン「俺たち」→「私たち」、
00a1c9adのシーア末尾を丁寧語、Claim_Crusaderの「俺たち」（既存口調メモ確認）、ニストラの常体混入（同じく確認）。
DeskariFightもoffset=1998から5件予備通読済み。再開時はBannerの判断・適用後、offset=2003から読む。
女神との会話のカメリアには常体混入が残っているため補足確認する（既定は丁寧語）。

| 作業 | 状態 | 記録 |
|---|---|---|
| c5会話順通読 | 進行中 | 1,942 / 7,597件、247件修正。次はBanner_Iz_Dizlogue |
| c4残り・c6・仲間・共通NPC・エピローグ・DLC | 未完了 | 全て終わるまで継続するユーザー指示あり。各区切りの確認は不要 |

## 2026-10-11：c5の1943〜2309件目

367件を追加通読し42件修正。累計 **2,309 / 7,597件、289件修正**。
Banner（56件）、DeskariFight（67件）、GalfreyAfter（41件）、GalfreyOnTheEgde（58件）、
IrabethDies（22件）、IrabethSurvives（28件）、Patrol_Chun（29件）、Iz_Patrol_Hulrun（30件）、Storyteller_Iz（36件）を完了。

- スタントンとClaim_Crusaderの一人称複数を「私たち」に。シーアの短い敬語欠落を修正。
- トレヴァーがソシエルに呼びかけるbrotherを「弟よ」に。悪のアルエシャラエは通常版と区別し女性的な常体を保持。
- シーラの過度な女言葉、敵対する相手へのウェンデュアグの女言葉を修正。
- ガルフリーの同じ会話内の分岐による口調混在を丁寧語へ。軍令・神への祈りの文体は文脈に合わせる。
- 希望が今も残る発言を「希望が消えぬうちに」とする誤訳、同盟者を同盟とする誤訳、兵士を民とする訳を修正。
- 石碑文書院の表記ゆれ、助けに来ている状況を「すぐに助けが来ます」とする訳を修正。
- イラベスの通常発言は丁寧語。自分への言葉と誓いの引用は常体を許容。
- Prelateは「司教」、呼びかけ「司教殿」。ハルランの審問官という職掌とは訳し分ける。
- ティラバードのorderを「騎士団」に修正。
- apply：banner-deskari 11件、queen-iz 17件、irabeth-survives 7件、iz-patrol 7件、すべてbad 0。
- 各バックアップとの比較：計画した訳文変更のみ、他フィールド変更0。verifyは各適用後Errors 26 / warnings 3。
- 全369ラウンドimport試行でinvalid 0、失敗0。監査・バックアップは上記名の各作業フォルダに保存。

次は **offset=2309**、`KTC_WintersunHelp_dialogue`、キー `f8453f53-77ba-46a1-a9cc-2f820bc404d4`。
先頭9件は原文・訳文の予備通読済み（offset=2318から続きを読める）。
女神との会話のカメリアの常体混入の補足確認はまだ残る。
Nystraの話者プロファイルは具体的な本人の描写と整合しない可能性があるため、今回男性口調へ機械的に変更していない。

| 作業 | 状態 | 記録 |
|---|---|---|
| c5会話順通読 | 進行中 | 2,309 / 7,597件、289件修正。次はKTC_WintersunHelp_dialogue |

### 2026-10-11 c5：ウィンターサンから牢獄の門まで

438件を追加通読し65件修正。累計 **2,747 / 7,597件、354件修正**。
KTC_WintersunHelp（35件）、Alderpash（207件）、Aponavicius_PrisonBoss（20件）、
Aponavicius_Welcome（33件）、AzataDestroy（4件）、Cessily（64件）、
DeadHeartOfHerald（9件）、GroaningGate（66件）を完了。

- 盲目のゲスメルハが噂を確かめる台詞の「この目で」を修正。動物のelk／mooseの対応を修正。
- アルダーパッシュの一人称表記、後継者の代数、呪文の系統、側近を絞め殺す描写を修正。
- バフォメットを牢へ投げ込む目的が、既に朽ち果てた結果になっていた訳を修正。
- 「誰にも迷惑をかけず」を「誰にも邪魔されず」とした反転と、扉を開ける台詞の重複を修正。
- ウェンデュアグ、シーラ、通常のアルエシャラエの口調を場面に合わせて修正。
- 看守長、暁の花、暁の花の口づけ、ディメンジョナル・ロックの表記を整合。
  暁の花の関連表記は全体検索し、今回修正対象はセシリー会話に集中していることを確認。
- 門を破壊する12撃／24撃、ソシエルの「同様に命を失った人々」の数量表現、鞄の震動を修正。
- apply：wintersun-alder 46件、prison-gate 19件、試行・書き込みともbad 0。
- 各バックアップとの比較：計画した訳文変更のみ、他フィールド変更0。
- 各適用後verifyはErrors 26 / warnings 3。全369ラウンドimport試行はinvalid 0、失敗0。
- 監査・バックアップ：dev/test/readthrough-work/c5-wintersun-alder/、c5-prison-gate/。

次は **offset=2747**、Herald_IvoryLabyrinth_dialog、キー 9464ca7e-fa1e-44fd-b7cb-72f90f279c29。
先頭4件は予備通読済み。女神との会話のカメリアの常体混入の補足確認はまだ残る。

| 作業 | 状態 | 記録 |
|---|---|---|
| c5会話順通読 | 進行中 | 2,747 / 7,597件、354件修正。次はHerald_IvoryLabyrinth_dialog |
| 外部TODOドキュメント | 転記待ち | 本記録の追加通読・修正件数とキャラクターメモを転記 |

### 2026-10-11 c5：継承者の手とバフォメットの会話

241件を追加通読し23件修正。既読の女神会話でカメリア8件を補足修正。
累計 **2,988 / 7,597件、385件修正**（今回計31件）。
Herald_IvoryLabyrinth（53件）、Prison_Baph（123件）、Prison_HepzamirahGhost（21件）、Prison_Vrock（44件）を完了。

- 継承者の手の「指揮官を苛烈に扱った私を赦す」の主客反転を修正。
- シーラの「私たちに勝ち目がない」を、敵への「私たちには勝てない」という挑発へ修正。
- 心臓の返却、奇跡を試みる発言の断定、亡命の罪悪感、最後の和音の訳を修正。
- 通常のアルエシャラエの丁寧語、ウェンデュアグの敵への口調、ヘプザミラの一人称、ネニオの二人称を整合。
- カメリアのGoddesses_Summit_dialogueの8件を確認・修正。以前からの補足確認事項は完了。
- apply：herald-baph 23件、camellia-summit 8件、試行・書き込みともbad 0。
- 各バックアップとの比較：計画した訳文変更のみ、他フィールド変更0。
- 各適用後verifyはErrors 26 / warnings 3。全369ラウンドimport試行はinvalid 0、失敗0。
- 監査・バックアップ：dev/test/readthrough-work/c5-herald-baph/、c5-camellia-summit/。

次は **offset=2988**、Svendack_PrisonBoss_dialogue、キー 167f63c6-22f6-4308-bccf-2c8c7353efa7。

| 作業 | 状態 | 記録 |
|---|---|---|
| c5会話順通読 | 進行中 | 2,988 / 7,597件、385件修正。次はSvendack_PrisonBoss_dialogue |
| 女神会話のカメリア口調補足 | 完了 | 8件を丁寧語へ |
| 外部TODOドキュメント | 転記待ち | 本記録の追加通読・修正件数と口調メモを転記 |

### 2026-10-11 c5：スヴェンダックからデビルの裁判まで

386件を追加通読し65件修正。累計 **3,374 / 7,597件、450件修正**。
Svendack_PrisonBoss（25件）、Svendack_Welcome（30件）、Foreman（94件）、LiLura_Bye（12件）、
LiLura_Shrine（44件）、Seilkind_Cave（27件）、DrezenBribe（12件）、DrezenDouble（14件）、
DrezenLiar／Looter／Oath／Thief（各12件）、DevilsJudgement（80件）を完了。

- 雌馬／種馬、住民全体への呼びかけ、災いを嘆く文を呪いにした訳を修正。
- スヴェンダックの看守長、フォアマンと聖堂名、モーテンの表記を用語集へ整合。
- ウェンデュアグ、アルエシャラエ、ウルブリグの口調・一人称を整合。
- インダラーの鎧で防げない武器、アビスの領国、モンクを僧とした訳を修正。
- 裁判の後半だけ常体へ切り替わるメフィストフェレスを丁寧語へ。正式な陳述の主人公も丁寧語。
- apply：svendack-mine 30件、devil-trial 35件、試行・書き込みともbad 0。
- バックアップ比較：計画した訳文変更のみ、他フィールド変更0。
- 各適用後verifyはErrors 26 / warnings 3。全369ラウンドimport試行はinvalid 0、失敗0。
- 監査・バックアップ：dev/test/readthrough-work/c5-svendack-mine/、c5-devil-trial/。

次は **offset=3374**、DevilSnatch_bookevent。DevilsOffer_dialogueまでの23件は予備通読済み。

| 作業 | 状態 | 記録 |
|---|---|---|
| c5会話順通読 | 進行中 | 3,374 / 7,597件、450件修正。次はDevilSnatch_bookevent |
| 外部TODOドキュメント | 転記待ち | 本記録の通読・修正件数と口調メモを転記 |

### 2026-10-11 c5：アイオンの仲間、テレンデレヴ、天使への昇格

262件を追加通読し56件修正。累計 **3,636 / 7,597件、506件修正**。
DevilSnatch、DevilsOffer、InevitableCompanion、Inevitable_KTC、KenabresFlashback／Marevo、
MirrorAgain／Reveal、StauntonAtIz、TerendelevCompanion／Past／Present、
Angel_FarewellToMythic、IomedaeSecondVisit_MythAngelを完了。

- メリエスの勧誘をキャラクターメモ・裁判と同じ慇懃な丁寧語へ。ゴラリアンをゴラリオンへ。
- テレンデレヴの仲間会話を穏やかで威厳ある丁寧語へ。久々の外出を長期間の不在とした誤訳を修正。
- 一般名詞の大渦と位界名のマエルストロムを区別。アダマンティンの坩堝を用語集へ整合。
- コヴェレスの呼びかけを指揮官、ベレンゲルの一人称・呼びかけを俺／お前へ整合。
- アイオーメディの呼びかけをお前へ。救済の天使／報復の天使は混成表記を解消。
- 適用：aeon-return 39件、angel-judgment 17件。試行・書き込みともbad 0。
- バックアップ比較：計画した訳文変更のみ、他フィールド変更0。
- 各適用後verifyはErrors 26 / warnings 3。全369ラウンドimport試行はinvalid 0、失敗0。
- 監査・バックアップ：dev/test/readthrough-work/c5-aeon-return/、c5-angel-judgment/。

次は **offset=3636**、LeapOfFaith_Mythangel_c5_GMBE。

| 作業 | 状態 | 記録 |
|---|---|---|
| c5会話順通読 | 進行中 | 3,636 / 7,597件、506件修正。次はLeapOfFaith |
| 外部TODOドキュメント | 転記待ち | 本記録の通読・修正件数と口調メモを転記 |

### 2026-10-12 c5：ムタサフェン追跡からアルシニラの新支配者まで

664件を追加通読。今回の修正は重複を除いて283件（c5 179件、章外104件）。
累計 **4,300 / 7,597件、c5修正685件**。今回のc5修正には全体検索で見つけた読了範囲外18件を含む。
LeapOfFaith、TargonaFinal／Intro、WardensBefore、AgainstMentor、ArankaExplains、
ElysiumWelcome、FarewellToMythic、IslandTalk、VendorTwins、6人のConsp会話とHailNewLord会話、
KTC_YozzSoDiappointed／ComeWithMe、Nocticula_WeHaveBetrayal／YouAreMyBestServant、
Shamira_BetrayNocticula／IMadeMyDecision／YouAreNext、UltimateWinを完了。

- カタイル、ラリエル、ヤニエル、ゼクレックスの口調をキャラクターメモと前後の会話へ整合。
- アーリー・サンセット／メフィストフェレスは正体を明かした後も慇懃な丁寧語。
- シャミラは高慢で女性的な常体。明示的に丁寧とされる台詞では丁寧語を保つ。
- 原文にない「気取り」「最後の機会」、身体への脅しを家宝とした訳を修正。
- シャミラの「勝利はあなたのおかげ」を「私の手柄」と逆転させた訳を修正。
- イルマンガレスの私／俺混在、血の大釜週間、カンビオン／シャドウ・デーモン表記を整合。
- 全体検索：「陰の貴婦人」19件を「影の貴婦人」へ。守護者の残る表記ゆれも修正。
- 全体検索：原文[Say nothing]の[何も言わない]120件をガイドの[黙っている]へ。奴女の誤字を解消。
- 適用：mutasafen 28件、azata-island 26件、conspirators 44件、new-lord 17件、shamira-finale 173件。
  合計288回の修正、同じキーの再修正5件を除く実変更283件。試行・書き込みともbad 0。
- 各バックアップ比較：計画した訳文変更のみ、他フィールド変更0。
- 各適用後verifyはErrors 26 / warnings 3。全369ラウンドimport試行はinvalid 0、失敗0。
- 最新all.jsonで再検索：陰の貴婦人、Wardensのウォーデン表記、対象[何も言わない]、奴女はいずれも0件。
- 監査・バックアップ：dev/test/readthrough-work/の上記5作業フォルダ。

次は **offset=4300**、AbrogailVisit_dialogue、先頭キー41d73057-dbee-468d-a7c3-74fb18be513f。

| 作業 | 状態 | 記録 |
|---|---|---|
| c5会話順通読 | 進行中 | 4,300 / 7,597件、c5修正685件。次はAbrogailVisit |
| 外部TODOドキュメント | 転記待ち | 本記録の通読・修正件数と口調メモを転記 |

### 2026-10-12 c5：チェリアクスとガルフリーの誘惑、ドラゴンとの再会

612件を追加通読。累計 **4,912 / 7,597件、c5修正888件**。今回の実変更203件はすべてc5。
AbrogailVisit、CheliaxComing、DevilCongratulations、DevilishTemptationの全10会話、
EvilAbrogail／KindAbrogail、MegidiahCompanionとKTC1〜5、DragonsKenabresを完了。

- 女帝の正式称号を女帝陛下へ。外交上のsisterを実の姉とした訳を修正。王者の複数形Weは私／我が国を文脈で訳し分け。
- ガルフリーは指揮官への丁寧語・あなたを整合。信仰を捨てる怒りや軍への命令は原文に沿って維持。
- メフィストフェレスの平常時は丁寧語、猟師への変装中は演技に沿った別口調。
- ラヤの男性的一人称を修正。ゴルゴラドの誤った戦士プロファイルに由来する粗暴な口調を、契約交渉の原文へ整合。
- 十字軍の指揮権の返還先逆転、「裏で手を引く」、存命者の魂を悼む訳、女伯爵、署名描写を修正。
- 奈落の王とデズナの信奉者の用語ゆれを修正。アスモデウスへの神格の敬称は様。
- ハラセリアックスの話者なし台詞を私／あなた／穏やかな丁寧語へ。他のドラゴンは各自の常体を維持。
- 適用：cheliax-visit 24、temptation-aftermath 27、temptation-plan 29、temptation-souls 34、abrogail-negotiation 48、megidiah-policy 24、dragons-kenabres 17件。
- 試行・書き込みともbad 0。各バックアップ比較で訳文以外の変更0。
- 各適用後verify Errors 26 / warnings 3。各全369ラウンドimport試行でinvalid 0、失敗0。
- 監査・バックアップ：dev/test/readthrough-work/の上記7作業フォルダ。

次は **offset=4912**、NidalynnQuest1_dialogue、先頭キー52ecb05b。

| 作業 | 状態 | 記録 |
|---|---|---|
| c5会話順通読 | 進行中 | 4,912 / 7,597件、c5修正888件。次はNidalynnQuest1 |
| 外部TODOドキュメント | 転記待ち | 本記録の通読・修正件数と口調メモを転記 |

### 2026-10-12 c5：ドラゴンの教え、レジェンド、兵士の宴、リッチ化

960件を追加通読。累計 **5,872 / 7,597件、c5修正1,119件**。今回の実変更231件はすべてc5。
NidalynnQuest1からDeadTerendelev_lichまで完了。Galfrey_Zombie35件は先読み済み、修正は未適用。

- ドラゴンの師ハラセリアックスを私／あなた／穏やかな丁寧語へ整合。哲学的なwisdomは能力値の判断力ではなく知恵。Reudgerは用語集に従いロイガー師。
- テレンデレヴはアンデッド化後も私／あなた／丁寧語。原文の怒り・苦痛・憎しみは保持。
- レジェンドの各地の試練でアレールの私／あなた／丁寧語を整合。魂による命の買い戻し、メスフラスコ、予見の意味を修正。
- 主人公の影は性別の出ない常体。アイオーメディへの主人公の返答は丁寧語。カイデンは儀礼を断る場面に合わせ親しみある常体。
- 兵士の宴のブリモラク、ヴェンコ准男爵、アレール・ヴォーレスを用語集へ整合。飲み比べの献杯と慣用句、腕相撲の縛る手、ドワーフ兵の片言を修正。
- リッチの相談役の敵対時の常体は明示的な敵対演出として保持。味方としての報告は丁寧語へ整合。bloodyの罵り、dance to her tuneの慣用句を修正。
- We will destroyの能動を我らは滅びるとした逆訳を修正。アンデッドのウェンデュアグは主人への丁寧語。
- 適用：dragon-lessons 36、hal-companion 48、terendelev-undead 27、legend-freedom 20、legend-allies 17、legend-renunciation 18、soldier-party 11、party-games 11、party-revelation 13、lich-counselors 9、lich-victory 14、terendelev-lich 7件。
- 試行・書き込みともbad 0。各バックアップ比較で訳文以外の変更0。
- 各適用後verify Errors 26 / warnings 3。各全369ラウンドimport試行でinvalid 0、失敗0。
- 監査・バックアップ：dev/test/readthrough-work/の上記12作業フォルダ。

次は **offset=5872**、Galfrey_Zombie_dialogue、先頭キー3965d5d6。

| 作業 | 状態 | 記録 |
|---|---|---|
| c5会話順通読 | 進行中 | 5,872 / 7,597件、c5修正1,119件。次はGalfrey_Zombie |
| 外部TODOドキュメント | 転記待ち | 本記録の通読・修正件数と口調メモを転記 |

### 2026-10-12 c5：アンデッドの女王、最後の儀式、スウォームの再生

545件を追加通読。累計 **6,417 / 7,597件、c5修正1,232件**。今回の実変更113件はすべてc5。
Galfrey_Zombie、HepzamirahGhost、Pharasma関連KTCと使者、NoMoreLich、TalkToWand、
TheDarkestRitual、Zacharius_FinalBetrayal、BookEvent_DreamDeskari、元仲間との対決、
信徒来訪、Anemora、ヴェスカヴォア女王、RaspenRiftsの残響とIzyagna、MythicLocustC5_Rebornを完了。

- アンデッドのガルフリーを私／あなた／丁寧語へ整合。信仰の破棄と冷酷さは維持。poisoned giftの比喩を実際の毒入りの品とした訳を修正。
- ファラズマの女性使者は静かで威厳ある丁寧語。骸の柱のご主人様への報告も丁寧語へ。
- ザカリウスへの主人公の返答を既存の師への丁寧語に整合。杖に閉じ込めた敵対分岐は常体を保持。
- 恋人生贄の選択肢で主人公の女言葉を修正。デランの力・不死と命の喜びの比較で欠けた否定を修復。
- 会話中のアンデス2件はアンデッドへ。呪文名アンデス・トゥ・デス6件は正しい音写なので維持。
- 納魂器は全11件を用語集のフィラクタリーへ整合。
- 敵対後のアルエシャラエも丁寧語。ウェンデュアグの見捨てる台詞を冷淡な常体へ。
- デスカリが主人公を呼ぶ似たる者、残響の一人称我らを整合。地の文のデスカリへの不要な敬意を除去。
- イジャグナは私／あなた／丁寧語。複数の身体が異なる語を同時に発する括弧の演出を維持。
- ヴェスカヴォアを普通のイナゴとした訳、嗅覚で聞き分ける、弟への兄弟呼び、知らず知らずを不本意とした訳を修正。
- 適用：galfrey-undead 16、pharasma-warning 28、darkest-ritual 22、swarm-return 9、anemora 18、swarm-transformation 20件。
- 試行・書き込みともbad 0。各バックアップ比較で訳文以外の変更0。
- 各適用後verify Errors 26 / warnings 3。各全369ラウンドimport試行でinvalid 0、失敗0。
- 監査・バックアップ：dev/test/readthrough-work/の上記6作業フォルダ。

次は **offset=6417**。

| 作業 | 状態 | 記録 |
|---|---|---|
| c5会話順通読 | 進行中 | 6,417 / 7,597件、c5修正1,232件 |
| 外部TODOドキュメント | 転記待ち | 本記録の通読・修正件数と口調メモを転記 |

### 2026-10-12 c5：トリックスター評議会とブラックウォーター

487件を追加通読。累計 **6,904 / 7,597件、c5修正1,372件**。今回の実変更140件はすべてc5。
Trickster Council、ソコスベノスの余波・作戦説明・クローゼット、シューカの提案、ノクティキュラとの面会、地下施設の門・負傷した戦士・族長・訪問者・研究機械・百面相・抵抗する戦士・中央装置を完了。

- ソコスベノスの話者なしCueを僕／君へ。女言葉と姉を妹とした誤訳を修正。
- シューカの個別会話を私／あなた／丁寧語へ。時間が交錯する発言は演出を維持。
- 主人公はシューカ・ノクティキュラに丁寧語、親しいソコスベノスには性別の出ない常体。
- 精髄・エッセンスを同じ会話群の本質へ整合。デーモン・ロードをデーモン領主へ。
- ブラックウォーターの金属製circletを鉢巻から額飾りへ整合。認知環という専門名は維持。
- 訪問者への非敵対の主人公の呼びかけをあなたへ。eldest sonsを長男たちとした訳を修正。
- エンバーの静かな説明を既存の丁寧語へ。救済前の戦士がもう声を聞かずに済むとした時制・意味の誤りを修正。
- 適用：trickster-council 11、socoth-aftermath 22、shyka-offer 41、closet-blackwater 42、blackwater-lab 24件。
- 各試行・書き込みbad 0。バックアップ比較で訳文以外の変更0。
- 各適用後verify Errors 26 / warnings 3。各全369ラウンドimport試行でinvalid 0、失敗0。
- 監査・バックアップ：dev/test/readthrough-work/の上記5作業フォルダ。

次は **offset=6904**。デラメア・ムタサフェン35件とPuluraLeaderSaved先頭24件は読み始めたが、修正未適用のため未完了扱い。

| 作業 | 状態 | 記録 |
|---|---|---|
| c5会話順通読 | 進行中 | 6,904 / 7,597件、c5修正1,372件 |
| 外部TODOドキュメント | 転記待ち | 本記録の通読・修正件数と口調メモを転記 |

### 2026-10-12 c5：プルーラ救出、探検家、婚礼、川のハグ、劇、ドモラ（章完了）

残り693件を通読し、c5の全 **7,597件を完了、c5修正累計1,489件**。今回の実変更117件はすべてc5。
DelamereDefeated、Mutasafen_PuluraFalls、PuluraLeaderSaved、RamienPulura、RenownExplorer、Bride／Groom、BookEvent_Boat、SinisterVillage_Hags、Jernaugh_Dying、KTC_Malessa、MalessaFinal、TheatrePlay、VerbovezzorGMBEを完了。

- デラメアの信徒が悪の巣窟で暮らすとした誤訳を修正。悪の巣窟は避けた都市を指す。全員としたmanyも修正。
- カタイルの指揮官殿への丁寧語を継承。エンバーの静かな説明も丁寧語へ。ムタサフェンの一人称は私。
- アイヴが他人の滝をアイヴの滝とした訳、未来から来たジュビロストの主語を主人公とした訳を修正。時間旅行の年代差は演出として維持。
- カリストリアの異名は用語集の甘美なる毒針。エンネリの我は既存profile指定を保持し、恋人への奴を彼へ。
- 三人のハグの口調を会話内で整合。冬の雪さえ分けないという強欲の比喩を復元。真実を見失うと真実に目を眩まされるの取り違えを修正。
- マルキルはマレッサより数分早く生まれた双子の兄。姉／弟との取り違えを全場面で修正。娘に対して伯父。マレッサの兄への私的会話は自然な常体。
- 婚礼のwreathは花輪へ整合。ハグの本性や児童への契約は原文どおり維持。
- 劇のガノムをノームへ、人名ラムキンを整合。演じている誇張・失敗・即興の台詞は保持。
- ドモラの魔王をデーモン領主へ。群れが街そのものになったという意味と家畜の群れの意味を修正。
- 適用：pulura-rescue 21、explorer 9、wedding 8、river-hags 42、malessa 19、theatre 9、domora 9件。
- 各試行・書き込みbad 0。バックアップ比較で訳文以外の変更0。
- 各verify Errors 26 / warnings 3。各全369ラウンドimport試行でinvalid 0、失敗0。
- 監査・バックアップ：dev/test/readthrough-work/の上記7作業フォルダ。

次は **c6 offset=0（全1,016件）**。先頭AreeluLetsFinalFight_Aeonの35件は通読したが、修正未適用のため未完了扱い。
c4は既存記録の262 / 5,657件から未完了。c6、Companionsの後に残りを回収する。

| 作業 | 状態 | 記録 |
|---|---|---|
| c5会話順通読 | 完了 | 7,597 / 7,597件、c5修正1,489件 |
| c6会話順通読 | 次の対象 | 全1,016件 |
| 外部TODOドキュメント | 転記待ち | 本記録の通読・修正件数と口調メモを転記 |

### 2026-10-12 c6：終盤会話前半（490件）

c6の **490 / 1,016件を通読、修正累計180件**。先頭のイオン分岐、セトレイとオポン、アレールの真相、イメズレン、ノクティキュラ、天使分岐、アレール戦後・戦前、デスカリと残響の会話を完了。

- アレールの話者なしCueを既存の私／あなた／丁寧語へ。怒りや我が子への執着、過去の約束の常体は保持。
- アイオーメディを威厳ある私／お前／常体へ。カタイルとヤニエルの通常会話は丁寧語、ターゴナの歓喜から男性的なのだを除去。
- ノクティキュラのソコスベノスへの兄を弟へ。アレールを相手に手を汚す台詞を、汚れ仕事を手伝うという誤訳から修正。
- デスカリの似たる者とデーモン領主を整合。残響の一人称は我ら。
- 主人公がデスカリから逃げないという逆訳、貸しを取り立てる台詞の借り、他の運命を選ばない意思を選びようがないとした訳を修正。
- 適用：c6-aeon-areelu 22、c6-aeon-finale 2、c6-setrei 6、c6-truth 16、c6-wardens 58、c6-witch 30、c6-finalfight 24、c6-deskari 22件。
- 各試行・書き込みbad 0。バックアップ比較で訳文以外の変更0。
- 各verify Errors 26 / warnings 3。各全369ラウンドimport試行でinvalid 0、失敗0。
- 監査・バックアップ：dev/test/readthrough-work/の上記8作業フォルダ。

次は **c6 offset=490**、GrandFinal_dialog。先頭20件は読み始めたが未修正なので未完了扱い。
c5は7,597件完了、修正1,489件。c4は262 / 5,657件から残りを回収予定。c6の後はCompanions。

| 作業 | 状態 | 記録 |
|---|---|---|
| c6会話順通読 | 進行中 | 490 / 1,016件、修正180件 |
| 外部TODOドキュメント | 転記待ち | 本記録と口調メモを転記 |

### 2026-10-12 c6：終幕・仲間の決戦前会話・昇華（章完了）

残り526件を通読し、c6の全 **1,016件を完了、修正累計296件**。今回の実変更116件はすべてc6。
GrandFinal、InTheWound_Legend、AreeluThresholdWelcome、ComeInside、全仲間のFarewell、Galfrey_Threshold、IrabethAnevia_Threshold、NorthernLights、TESuggest、SummonDemonLords_TE、TE_Finalを完了。

- フィラクタリーを護符とした訳、影とシャドウの表記ゆれ、トリックスターの本質と精髄の揺れを修正。
- アレール・アイオーメディの口調を前半の判断へ整合。召喚の儀式の命令形は維持。
- アレールの子供の共通台詞は男女分岐のどちらでも自然な常体へ。
- 善のアルエシャラエと通常のエンバーを丁寧語へ。悪のアルエシャラエの女性常体、怯えたエンバーの幼い常体は維持。
- ウェンデュアグのロマンスは粗野な常体で一貫しており維持。ウォルジフのボス／あんた、グレイボーのお前を整合。
- アルエシャラエの犠牲者への罪悪感を犠牲者の罪とした訳を修正。最後の実験の地の文に抜けていた観察描写を補完。
- ガルフリーの当然の報いを資格とした訳を修正。first among servantsは最初ではなく筆頭。原文の感情・倫理・分岐差は保持。
- 適用：c6-grandfinal 31、c6-shadow 20、c6-arue 25、c6-farewells 8、c6-ascension 32件。
- 各試行・書き込みbad 0、訳文以外の変更0。各verify Errors 26 / warnings 3。
- 各全369ラウンドimport試行でinvalid 0、失敗0。監査・バックアップは上記5作業フォルダ。

次は **Companions offset=0（全10,584件）**。Dialogue_Arueshalae_Main先頭25件を読み始めたが、章としては未完了。
c4は262 / 5,657件から未完了。Companionsの後に残りを回収する。NPC_Common・Epilogues・DLCも残る。

| 作業 | 状態 | 記録 |
|---|---|---|
| c5会話順通読 | 完了 | 7,597件、修正1,489件 |
| c6会話順通読 | 完了 | 1,016件、修正296件 |
| Companions会話順通読 | 次の対象 | 全10,584件 |
| 外部TODOドキュメント | 転記待ち | 本記録と口調メモを転記 |

### 2026-10-12 Companions：通常会話851件

Companionsの先頭851 / 10,584件を通読し、修正累計83件（範囲外のアルエシャラエの用語修正1件を含む）。
Dialogue_Arueshalae_Main 263件、Dialgoue_CameliaMain 231件、Daeran_Main_dialog 199件、Dialogue_Ember_Main 110件、Finnean_main_dialogue 48件を完了。

- アルエシャラエ16件：通常の丁寧語、制御タグの順序、夢と親密な会話の意味を整合。本人が言い間違えて訂正する蝶／芋虫の箇所は原文の流れを維持。
- カメリア42件：上品な丁寧語に整合。護りの魔法、ソシエルの兄、肉体関係のない交際、手を肩にかけて相手を押す動作を修正。絹影の館の用語修正1件を含む。
- デラン14件：私／君／皮肉のある常体を維持。身代金の支払いと見逃す相手、身体を傷つけない辱め、本人の虚栄心への喜びを修正。司教とデーモン領主を用語集へ整合。
- エンバー6件：壊れた分岐の幼い常体は維持。通常会話の丁寧語とグランドマザー・クロウの呼称を整合。
- フィニアン5件：魂を引き抜く描写、十人委員会の呼称、会話の不自然な直訳を修正。武器だと認識する前後の分岐は維持。
- 全5バッチで試行・書き込みbad 0、訳文以外の変更0。各verifyは既存のErrors 26 / warnings 3。
- 全5バッチの全369ラウンドimport試行でinvalid 0、失敗0。監査とバックアップはtest/readthrough-work/companions-*に保存。

次の適用対象は **Companions offset=851、GrimborMainDialogue 236件**。先頭30件は通読済み、修正未適用。次の未読offset=881。
c4は262 / 5,657件から未完了。Companionsの後に回収。NPC_Common・Epilogues・DLCも残る。
外部TODOドキュメントは転記待ち。

### 2026-10-12 Companions：ランまで1,297件

Companions 1,297 / 10,584件を通読。通常の会話修正は累計107件。別途、全体の「デーモン・ロード」514件を用語集の「デーモン領主」に統一した。

- GrimborMainDialogue 236件完了、14件修正。優しい心、鎧から騎士を引き出す描写、先制の一撃で決着をつける説明、報復の見通しを修正。クロックワーク・カテドラル、レッドマンティス等を用語集へ整合。
- Lann_Main_dialog 210件完了、10件修正。母が主人公のところにも来たという意味、密輸に使う地下道、手玉に取る比喩、復讐の落とし前の意味を修正。第一次十字軍を統一。
- global-demonlord 514件：原文との対応を確認。demonic lordsの1件も同じ概念。固有の別称・魔王など他の表現はこのバッチに含めない。
- 各bad 0、訳文以外の変更0、verify Errors 26 / warnings 3。各全369ラウンドimport試行でinvalid 0、失敗0。

次の適用対象は **Companions offset=1,297、NenioCompanion_dialogue 387件**。1,297〜1,456の160件は通読済み、修正未適用。次の未読offset=1,457。
c4残り、NPC_Common、Epilogues、DLCは引き続き未完了。外部TODOドキュメント転記待ち。

### 2026-10-12 Companions：ソシエルまで2,075件

Companions 2,075 / 10,584件を通読。会話修正は累計148件。全体のデーモン領主514件の統一は別計上。

- ネニオ387件完了、29件修正。学術的な常体、理解できるという意味、呼びかけの坊や／お嬢さん、抜けていた発話括弧を整合。忘却と非倫理的な研究観は維持。
- レギル91件完了、4件修正。通常会話の常体、教義名「尺度と鎖」、誤字を修正。
- シーラ123件完了、3件修正。確実な死と希望のある道の対比、ただの質問という意味、説得の方法を修正。
- ソシエル177件完了、5件修正。耐える対象と見分ける表現の文法、勤めるの表記、ヘルナイトへの比喩「女悪魔」、恋人への呼びかけを修正。私／あなた／穏やかな丁寧語を基準に、激情の常体は維持。
- 各bad 0、訳文以外の変更0。verify Errors 26 / warnings 3。各全369ラウンドimport試行でinvalid 0、失敗0。
- 監査とバックアップはtest/readthrough-work/companions-{nenio,regill,seelah,sosiel}-main。

次の適用対象は **Companions offset=2,075、Wenduag_dialogue_main 250件**。先頭90件は通読済み、未適用。次の未読offset=2,165。
c4残り、NPC_Common、Epilogues、DLCは未完了。外部TODOドキュメント転記待ち。

### 2026-10-12 Companions：通常会話とアルエシャラエの個別会話2,907件

Companions 2,907 / 10,584件を通読。会話修正は累計321件。全体のデーモン領主514件の統一は別計上。

- Wenduag_dialogue_main 250件完了、62件修正。粗野な常体へ整合し、主への敬語を維持。ロマンスの不安や弱さは残した。「心」を「心臓」とした訳、従者の役を願う意味、地の文の文法も修正。
- DialogueWoljif_main 170件完了、8件修正。売り手の値段交渉を値切りとした訳、赤ん坊の毛布、親族の説明、主人公の口調を修正。
- EvilArueshalaeCompanion 50、MeetEvilArusha 21、DreamVisit 43、VisitMyDream 10、ArushaAfterBattle 12、Dimalchio 83と戦闘後20、Q2 Dream Start/End各19、Q2 Letter22、Q3 BackToReality/FinalDream各41、AskAnevia20、AneviaResults11件を完了。
- アルエシャラエ関連4バッチで24 / 33 / 39 / 7件修正。善の通常発話を丁寧語へ整合。悪の女性常体、悪へ戻る選択に続く発話、親密な呼びかけは文脈で維持。ディマルキオへの罪悪感や悪夢の厳しい批判は原文通り。
- ウェンデュアグの範囲外1件はDimalchio内の発話。食卓についている姿をテーブルそのものに座るとした訳、目を上に向ける動作、権限の意味も修正。
- 各bad 0、訳文以外の変更0、verify Errors 26 / warnings 3。全6バッチの全369ラウンドimport試行でinvalid 0、失敗0。
- 監査とバックアップはtest/readthrough-work/の上記6作業フォルダ。

次は **Companions offset=2,907、CamelliaRedHanded_dialogue 67件**。
c4残り、NPC_Common、Epilogues、DLCは未完了。外部TODOドキュメント転記待ち。

### 2026-10-12 Companions：デラン個別会話とエンバー第2クエストまで4,019件

Companions 4,019 / 10,584件を通読。会話修正は累計394件（範囲外の用語修正を含む）。全体のデーモン領主514件の統一は別計上。

- カメリア個別会話452件完了、8件修正。拷問を長引かせる意味、逃亡前の父への警告、発散を手伝う相手、父に気づかれず抜け出す意味、精霊の表記を整合。激情や父への冷淡な常体、意図的な嘘は維持。
- デラン個別会話470件完了。天涯の館の調査から戦闘後まで334件で3件、贈り物・罠・判決など136件で14件修正。レギルの常体、文法、酒の強さへの問い、領地収入を切り崩す意味を修正。審問組織の呼称を異端審問所へ整合し、同じ揺れのエピローグ4件も修正（通読数には含めない）。
- エンバー誘拐報告41件、街頭説教24件は修正なし。救出後65件で25件、アビスの説教60件で23件修正。通常発話を穏やかな丁寧語に整合し、感情・善意・不安・落胆は原文通り維持。
- 全5バッチbad 0、訳文以外の変更0。verify Errors 26 / warnings 3。各全369ラウンドimport試行でinvalid 0、失敗0。
- 監査とバックアップはtest/readthrough-work/の上記5作業フォルダ。

次は **Companions offset=4,019、EmberQ3_Brotherhood_Dialogue 69件**。
c4は262 / 5,657件から未完了。NPC_Common・Epilogues・DLCも残る。外部TODOドキュメントは転記待ち。

### 2026-10-12 Companions：フィニアンとグレイボーの屋敷まで4,690件

Companions 4,690 / 10,584件を通読。会話修正は累計415件。全体のデーモン領主514件の統一は別計上。

- エンバー第3クエスト196件完了、8件修正。通常発話とアルエシャラエの丁寧語、ノクティキュラの慣用句と目を上に向ける動作を修正。壊れた分岐の切迫した常体は維持。
- フィニアン個別会話100件完了、3件修正。君への呼びかけと、作り手が手を加える意味を整合。自己認識の前後、解放・隷属・受容の分岐を保持。
- グレイボー竜狩り関連163件完了、7件修正。ゲームブックの文法と選択肢、肉食植物の表記、本人のお前の呼称を整合。
- BattleWithTheAssasins 30件は修正なし。BE_Manor 120、GreyborNewsAboutVillodus 21、HorzalahFirst 16、Villodus 25件完了、合計3件修正。鏡が打撃を吸収する文法、死体の数の誇張、bloody larvaの罵倒の意味を整合。
- 全4バッチbad 0、訳文以外の変更0。verify Errors 26 / warnings 3。各全369ラウンドimport試行でinvalid 0、失敗0。
- 監査とバックアップはtest/readthrough-work/の上記4作業フォルダ。

次は **Companions offset=4,690、YozzAndGreybor_dialogue 68件**。
c4残り、NPC_Common、Epilogues、DLCは未完了。外部TODOドキュメントは転記待ち。

### 2026-10-12 Companions：グレイボー完了とランの部族再訪まで5,384件

Companions 5,384 / 10,584件を通読。会話修正は累計498件。全体のデーモン領主514件の統一は別計上。

- YozzAndGreybor 68、YozzDying 54、AssassinHunter 28件完了、6件修正。通常のヨズの呼称と、血で刃に焼きを入れる意味を整合。命乞いのあなたは場面差として維持。
- Horzalah_Ambush 75、Horzalah_Mercy 20、InterrogationAfterAssasination 46、KTC_GreyborAlarm 34件完了、28件修正。グレイボーの落ち着いた常体、ホルザラーの女性常体、リンクが囲む動作の対応を整合。裏切りと共闘の分岐は原文通り。
- LannCantDo 51、LannComeNeathholm 18、Mama 46、MamaDrezen 9、MamaMeetsLann 25、SulDrezen 33、SullNeatholmNews 35、SulWaiting 36件完了、20件修正。導火線の冗談、思い出の品、閉じこもる文法、弟の描写、12年の数値、スルの軽い訛り・呼称、ウェンデュアグの通常口調を整合。
- WenduagCave 42、WenduagDefeated 46、WenduagTraitorCompanion 28件完了、29件修正。通常会話を粗野な常体へ整合し、主への敬語と敗北時の弱さを維持。死体のそばという位置、比較の文法、12人の数値も修正。
- 全4バッチbad 0、訳文以外の変更0。verify Errors 26 / warnings 3。各全369ラウンドimport試行でinvalid 0、失敗0。
- 監査とバックアップはtest/readthrough-work/の上記4作業フォルダ。

次の適用対象は **Companions offset=5,384、LannFeelsBad_dialogue 20件**。LannFeelsWorse 13、LannGoBeat_KTC 16を含む49件は通読済み、修正未適用。次の未読offset=5,433。
c4残り、NPC_Common、Epilogues、DLCは未完了。外部TODOドキュメントは転記待ち。

### 2026-10-12 Companions：ラン個別会話とネニオの正体まで5,760件

Companions 5,760 / 10,584件を通読。会話修正は累計535件。全体のデーモン領主514件の統一は別計上。

- LannFeelsBad 20、LannFeelsWorse 13、LannGoBeat 16、MongrelsDefeated 24、SavamelekhAbyss 37、LannDying 21、LannThankYou 39件完了、11件修正。ウェンデュアグの通常口調、触れている感覚、part demonを半分と断定した訳を修正。ランの生還・死亡、祈り、自己犠牲と落胆は原文どおり維持。
- LannTrustMe 12、SavamelekhFinal 12、SullAftermath 16、SullExplains 40、SullWeak 25、WenduagHelloAgain 24、WenduDubious 19件完了、18件修正。スルの固有名の訛りと追放の意味、ウェンデュアグの通常口調を整合。正式に主へ服従した後の敬語は維持。
- FoxReveal 58件完了、8件修正。ネニオの学術的な常体、ウェンデュアグの威嚇を整合。謎かけ・種族の忘却・探究への執着は原文通り。
- 全3バッチbad 0、訳文以外の変更0。verify Errors 26 / warnings 3。各全369ラウンドimport試行でinvalid 0、失敗0。
- 監査とバックアップはtest/readthrough-work/の上記3作業フォルダ。

次の適用対象は **Companions offset=5,760、FakeHellknights_RegillQ2_dialog 45件**。Vendor 20、PoorCultist 45、JoinOrLeave 9、RegillReveal 41、SuccubusTea 52を含む212件は通読済み、修正未適用。次の未読offset=5,972。保留修正はinit-companions-regill-test.mjs。
c4残り、NPC_Common、Epilogues、DLCは未完了。外部TODOドキュメントは転記待ち。

### 2026-10-12 Companions：レギル法廷とシーラの結婚式まで6,563件

Companions 6,563 / 10,584件を通読。会話修正は累計560件。全体のデーモン領主514件の統一は別計上。

- レギルの試験・報告・軍事法廷356件完了。範囲外のエピローグ1件を含む14件修正。マジック・サークル・アゲンスト・イーヴル、ゴッドクロウ騎士団、支部の呼称、カルトの下部組織、説明義務の主体、結論の文法とデビルとの関係を整合。
- CartRescue 45、SeelahMeetsFriends 50、KnightCamp 54件完了、6件修正。カメリアの丁寧語、heart of gold、誤字と助詞、友人へのエランの常体、熟練のパラディンの経験と技量の係り受けを修正。
- SeelahQ1Conclusion 13、ArsinoeAtWedding 10、DisasterNewsDrezen 31、ElanGreetsSeelah 20、ElanIsDesperate 41、ElanMonarch 13、GolemVendorDrezen 9、JewelerWarmWelcome 28、SeelahGoShopping 8、KyanaWelcome 16、ProbablyFakeShyka 15、SeelahSpeech 20件完了、5件修正。信頼できる剣、指輪と憑依の関係、エランの一人称、飾り物、目を上に向ける動作を整合。
- TentFirstWorld 27、TentGeb 24、TheBeast 7、WeddingIntro 16件は修正なし。仮装の演技と普段の口調、宝飾品への伏線、結婚式の冗談を維持。
- 全3バッチbad 0、訳文以外の変更0。verify Errors 26 / warnings 3。各全369ラウンドimport試行でinvalid 0、失敗0。
- 監査とバックアップはtest/readthrough-work/の上記3作業フォルダ。

次は **Companions offset=6,563、WeddingUnexpected_SeelahQ2_dialog 22件**。未適用修正なし。
c4残り、NPC_Common、Epilogues、DLCは未完了。外部TODOドキュメントは転記待ち。

### 2026-10-12 Companions：シーラ完了とソシエル・トレヴァーまで7,237件

Companions 7,237 / 10,584件を通読。会話修正は累計574件。全体のデーモン領主514件の統一は別計上。

- シーラ：WeddingUnexpected 22、CurlAftermath 22、ElanKianaAftermath 12、ElanDying 12、HideoutIntro 16、JewelerFinal 51、KianaAloneAftermath 8、DeserterJoins 27、ElanCalls 30、InDoubt 34、SeelahThanks 15件完了、6件修正。対戦相手との勝負に賭ける意味、刑期を服す、二重敬語、自称のまぬけ、寛大な処分、剣に血を吸わせる比喩を整合。生還・死亡・離脱の分岐を保持。
- ソシエル・トレヴァー：FuneralAfterFight 42、FuneralBeforeFight 16、BuriedADead 22、Treason 9、FindsOut 17、ImpostorPrison 77、ImpostorArrives 37、Fugitives 72、Monster 28、Q3KTC 4、MeetTrever 35、OutsideArena 47、TreverCompanion 19件完了、8件修正。誤字、してもらえた可能性の文法、仇を取る文法、エンバーとソシエルの通常丁寧語、葬送の祈り、神話的な力、副葬の装飾品を整合。
- 全2バッチbad 0、訳文以外の変更0。verify Errors 26 / warnings 3。各全369ラウンドimport試行でinvalid 0、失敗0。
- 監査とバックアップはtest/readthrough-work/の上記2作業フォルダ。

次の適用対象は **Companions offset=7,237、KTC_Wenduag_ComeNeathholm 17件**。LannDuel 49件も通読済み、修正候補未適用。次の未読offset=7,303。
c4残り、NPC_Common、Epilogues、DLCは未完了。外部TODOドキュメントは転記待ち。

### 2026-10-12 Companions：ウェンデュアグのクエストとウォルジフQ1まで8,013件

Companions 8,013 / 10,584件を通読。会話修正は累計644件。全体のデーモン領主514件の統一は別計上。

- ウェンデュアグ・ラン・スル：ComeNeathholm 17、Lann_Duel 49、DuelLost 32、MongrelVendorDrezen 11、MongrelVendorWendu 19、SullLannIsNeutralized 31件完了、22件修正（companions-wendu-duel）。Sull_IWantMyMongrels 54、WenduAndSull 55、WenduTrainingIntervention 47件完了、20件修正（companions-wendu-chief）。
- サヴァメレク：AfterBattle 40、ISmellHim 9、NearManshion 9、SavaAndWendu 22、Welcome 33、HeIsClose 12、FinalSava 32、LannDubious 19、SavaIsDeadNow 91、WenduTraitor_DrezensStreet 21件完了、14件修正（companions-wendu-final）。
- ウォルジフQ1：AfterBattle 11、AfterTraitor 31、ShopGolem 36、ShopOwner 37、Traitor 58件完了、14件修正（companions-woljif-q1）。ケリスメイはQ1では荒っぽい盗賊団の頭目として「あたし」（後日談と統一）。DLC5・6の落ち着いた彼女はspeakerProfilesどおり「私」のまま。シーラの「その人」をウォルジフに、ウォルジフの比喩と言い回しを自然に修正。
- 上記3バッチは前のエージェントが適用・検証済みで記録が漏れていた。woljif-q1は準備のみだったのを引き継いで適用。全4バッチbad 0、訳文以外の変更0。verify Errors 26 / warnings 3。各全369ラウンドimport試行でinvalid 0、失敗0。

次は **Companions offset=8,013、Q2WoljifCultCrusader_dialogue 25件**。未適用修正なし。
c4残り、NPC_Common、Epilogues、DLCは未完了。外部TODOドキュメントは転記待ち。
