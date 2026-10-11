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
