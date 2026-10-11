# 会話順通読（chunks_review の読み直し）用スクリプト

c0〜c3 の通読（TODO #53・#58・#59）で使った補助スクリプト。いずれも `dev/` で実行する。
`W` は作業ディレクトリ（セッションの scratchpad など、リポジトリ外）。

| スクリプト | 用途 |
|---|---|
| `survey.mjs <W>/all.json` | chunks_review 全ラウンドから各キーの最新 entry を集めて all.json を作る（`--max-old-space-size=8192`） |
| `folders.mjs <W>` | dialogueGraph.json から会話名→章フォルダ（c3, c4…）の対応表 `<W>/dialogfolder.json` を作り、章ごとの件数を出す（all.json が先に必要） |
| `chapdump.mjs <W> <章> <出力> <件数> [開始位置]` | 章の entry を会話順に原文・訳文の対訳ダンプにする。`‹N›` は制御タグ、`>>` は選択肢 |
| `showk.mjs <key8...>` / `showk.mjs -re <正規表現>` | キー（先頭8桁）か訳文の正規表現で entry を表示する（現在のファイルの値を読む。`RT_WORK=<W>` が必要） |
| `apply.mjs <W>/all.json <fixes.json> [write]` | 修正を適用する。`write` を付けなければ dry-run。1件でも失敗すると何も書かない |
| `gen_example.mjs` | 全体一括置換と個別修正を1つの fixes.json にまとめる生成スクリプトの例（#59 の第5回分） |
| `sweep_example.mjs <mode>` | 話者ごとの口調外れ（丁寧語の欠落・女言葉など）を抽出する例（`RT_WORK` が必要） |

fixes.json の形式は `{"<key8>": {"t": "全文"} | {"r": [["旧","新"], ...]}}`。`‹N›` 表記のまま書けば `<ctrl_N/>` に戻る。
`r` は順番に適用されるので、前の置換で消えた語を後ろで指定すると NOTFOUND になる。
制御タグの並び順を原文から入れ替えた entry は apply.mjs が TAGMISMATCH で弾くので、node で直接書き換える。

検証（毎回）:
```bash
for d in lang/chunks_review/*/; do node toBatchData.js import --chunks-dir="$d" --dry-run | grep Merged | grep -v ' 0 invalid'; done
npm run consistency -- verify   # 基準値 Errors 26 / warnings 3
```
