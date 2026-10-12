# 会話順通読の引き継ぎ（2026-10-12）

## 最新の再開地点（2026-10-13・以下の旧記録より優先）

ユーザーの継続指示により作業中。停止指示まではDLC5、DLC6、DLCFreeの順で続ける。
DLC4は35件適用済みでcheck再検査も成功。DLC1〜4の既存全369ラウンド検証は失敗0。
DLC5_StoryEndsは2,315 / 2,315件の通読完了。
DLC5の修正はdlc5-batch1〜13（207件）、batch14（4件）、batch15（12件）、batch16（16件）の計239件を適用済み。
すべてbad 0、訳文以外の変更0、consistency verify Errors 26 / warnings 3。
batch1〜16はそれぞれ全369ラウンド検証失敗0。稼働中の検証プロセスなし。
DLC6_ADanceOfMasksは612 / 3,989件を通読済み。次はoffset=612、Dialogue_DLC6_Flags。
DLC6 batch1（4件）、batch2（29件）、batch3（17件）、batch4（4件）、batch5（14件）、batch6（7件）、batch7（6件）の計81件を適用・検証済み。各バッチ全369ラウンド失敗0、bad 0、訳文以外の変更0、Errors 26 / warnings 3。
未適用候補2件をinit-dlc6-batch8.mjsに保存済み。次のバッチはdlc6-batch8。既存バッチのprepareを再実行しない。
all.jsonはDLC6 batch7適用後にsurveyで更新済み。稼働中の検証プロセスなし。
DLC6_ArenaAnnouncerのプロフィールは原文と不一致のため、影の王として我ら／そなたを使う。詳しくはv2CharacterNotes.md冒頭。
細かい判断と記録はreadthroughProgress.mdの冒頭に追記済み。

ユーザーが5 hour window前に区切りを希望したため、ここで作業を終了。再開指示があれば続ける。
プロジェクト概要はルートとdevのCLAUDE.md、作業記録の正本はreadthroughProgress.md。

## 確定した進捗

- c0〜c3：Claude Codeで完了済み。
- c5：7,597件完了、1,489件修正。
- c6：1,016件完了、296件修正。
- Companions：10,584件完了、730件修正。
- c4：**5,657 / 5,657件完了（通読終了）**。修正は未適用なし。
- NPC_Common：2,573 / 2,573件完了（40件修正）。Epilogues／Interchapters／Worldも完了（修正計93件）。DLC1〜6は未完了。
- c4のoffset=262以降の修正は累計889件。初回の全体修正386件は別計上。
- pushしていない。外部TODOへの転記は接続先がなく未実施。

直近の適用バッチ（c4-nocticula-fourth〜seventh、c4-areelu-demonlord）はすべて適用・検証済み。
dry apply bad 0、訳文以外の変更0、全369ラウンドのimport試行でinvalid 0／失敗0。
npm run consistency -- verify は既存の **Errors 26 / warnings 3**。新規増加なし。
稼働中の検証プロセスはない。

## 次の作業

c4・NPC_Common・Epilogues・Interchapters・Worldは完了。次は **DLC1_Megaepic**（`node test/readthrough-work/inspect.mjs DLC1_Megaepic 0 28`）、DLC2〜6、DLCFreeの順。
MechanicTexts／Classes／Testはグループ0件。
fixesの`r`は同一文字列をすべて置換し、制御タグは`<ctrl_N/>`で書く（`t`の場合だけ`‹N›`）。
ノクティキュラは私、高慢な女性常体。デスカリの残響は貴様の尊大口調。ゴールド額は漢数字。デビル（Devil）と悪魔の混用に注意。

## ユーザーが確定した方針

- Angelは「天使」。エンジェルキン等の登録済み固有名は保持。
- ウェンデュアグの女々しい女言葉は修正。ロマンス・親密な場面で自然なら柔らかい口調を許容。
  通常は私／お前の荒い常体、主人公を主として仰ぐ返答は丁寧語。
- demon lordは用語集どおり **デーモン・ロード**。以前の一括「デーモン領主」化は別AIが戻した。

キャラの場面別判断はv2CharacterNotes.md参照。
継承者の手・ヤニエル・ラリエル・カタイルは主人公に通常丁寧語。
アーリー・サンセットは正体判明前に私／あなたの丁寧語、市場でデーモンを演じる際と正体判明後は常体。
ソコスベノスは僕／君、明確に怒っている罵倒は荒い常体も自然。
主人公は私の中立的常体、敬意を示す個人的な天使との問答では丁寧語も維持する。
ラミサは私の優雅で残酷な女性常体、アイヴの一人称はアイヴ。

## 実行環境と注意

作業ディレクトリ：`D:\Game\Steam\steamapps\common\Pathfinder Second Adventure\pathfinder_Japanese_translation-main`
Node/npm/helperの実行は **devをworkdirにする**。

- 最新の`dev/lang/chunks_review`内のentry.translationだけを変更する。
- **dev/lang/zhCN.jsonを読まない・編集しない・比較しない。**
- **npm run verifyを使わない**（上記ファイルを読む）。検証は`npm run consistency -- verify`。
- lang/chunks_reviewと作業用testはgitignore対象。force addしない。ローカル変更は既に保存済み。
- 巨大JSONは必要部分だけ表示、Nodeに`--max-old-space-size=8192`。
- PowerShellで日本語スクリプトをパイプすると文字化けする。apply_patchでUTF-8の.mjsを作る。
- PowerShellの`;`は失敗しても次を実行するので、各結果を確認する。

## 続けるコマンド（devで実行）

```powershell
node --max-old-space-size=8192 helper/readthrough/survey.mjs test/readthrough-work/all.json
node test/readthrough-work/inspect.mjs c4 4072 25
node test/readthrough-work/lookups.mjs bounds c4 4072 4400
node test/readthrough-work/lookups.mjs profiles "Nocticula|Areelu"
node test/readthrough-work/lookups.mjs terms "Locust|Lady in Shadow"
```

作業データ・補助スクリプトは`dev/test/readthrough-work/`に残っている。
all.jsonは最後のc4-nocticula-third適用前の状態なので、**まずsurveyで再生成**する。
inspectはall.jsonと会話順情報でEN/JAを表示。lookupsのentriesはEN/JAの検索（キー検索ではない）。
共通スクリプトの説明は`dev/helper/readthrough/README.md`。

新規バッチは`test/readthrough-work/init-c4-nocticula-third.mjs`等を参考に作る。
短縮キー8桁と`{r:[[旧文,新文],...]}`または`{t:'全文'}`を定義。
t内の制御タグは`‹0›`等で表すとprepareが変換する。
prepareのひな型はcompanions-wendu-chief/prepare.mjsで、バッチ名を置換して生成する。

```powershell
node test/readthrough-work/init-<batch>.mjs
node --max-old-space-size=8192 test/readthrough-work/<batch>/prepare.mjs
node --max-old-space-size=8192 helper/readthrough/apply.mjs test/readthrough-work/all.json test/readthrough-work/<batch>/fixes.json
# ok N bad 0を確認後
node --max-old-space-size=8192 helper/readthrough/apply.mjs test/readthrough-work/all.json test/readthrough-work/<batch>/fixes.json write
node --max-old-space-size=8192 test/readthrough-work/<batch>/check.mjs
npm run consistency -- verify
node --max-old-space-size=8192 test/readthrough-work/<batch>/validate.mjs
```

書込み引数は`write`（`--write`では書き込まない）。チェックの名前は`check.mjs`。
validateは全369ラウンドを4並列でdryimportし、import-validation.jsonに結果を保存。
プロセス完了を待ってから次の適用とsurvey更新を行う。待っている間は次の対訳の通読ができる。
一定量ごとに進捗と口調を記録し、文書のみローカルコミットする。pushはしない。
