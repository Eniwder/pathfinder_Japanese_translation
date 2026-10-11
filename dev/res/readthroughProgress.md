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
