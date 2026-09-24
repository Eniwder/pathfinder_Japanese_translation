# WotR 日本語化 v2リライト：クラウド作業用リポジトリ

Pathfinder: Wrath of the Righteous 日本語化の翻訳作業を、クラウドセッションで進めるための一時リポジトリ。
中身は本リポジトリ側の `dev/cloudSync.mjs` が自動生成・同期している。**このリポジトリは非公開のまま
使い、公開したり他所へコピーしたりしない。** 最終的な回答は日本語で行うこと。

このファイル自体も `cloudSync.mjs push` のたびに上書きされるので、ここを編集しても残らない。

## 構成

```
dev/lang/rounds/round0106/   未処理の翻訳ラウンド（chunk_000N.json + manifest.json）
dev/res/                     翻訳ルール(translationGuide.md)・話者メモ・glossary
dev/cloud.mjs                作業用CLI（プロンプト生成・マージ・検証）
```

原文全体（enGB.json）や既存の訳文（zhCN.json）はここには無い。翻訳に必要な情報（話者・直前の文脈・
用語）はchunkファイルに埋め込み済みなので、探しに行かないこと。

## 作業手順

**メインのコンテキストではchunkファイルもtranslationGuide.mdも読まない。** 翻訳とメモ更新は、
1回ごとに新しいサブエージェント（Agentツール、general-purpose）に任せる。chunkは1つ100KB前後あり、
メインのコンテキストで読むとラウンドを重ねるごとにコストが膨らむため。

1. `node dev/cloud.mjs status` で次の作業対象のroundと未訳chunkを確認する。
2. 未訳chunkごとに `node dev/cloud.mjs chunk-prompt <round> <chunk>` を実行し、
   **出力されたプロンプトをそのまま（一字も変えずに）**サブエージェントに渡す。
   同じroundのchunkは互いに独立しているので、サブエージェントを並列で起動してよい。
   - サブエージェントはchunkファイルの横に `chunk_000N.translations.json`（キー→訳文だけのJSON）を書く。
   - プロンプト中の「権限がありません」「Bash不可」はローカル実行時の文言。サブエージェントには
     そのとおりBashもgitも使わせない（それで作業は完結する）。
3. 全chunkのサブエージェントが終わったら `node dev/cloud.mjs merge <round>` を実行する。
   - 出力の `invalid` が0件であることを確認する。invalidが出たら、該当entry（chunkファイル内の
     `translation`）に欠けている `<ctrl_N/>` をEditで補い、`node dev/cloud.mjs check <round>` で確認する。
   - 未訳が残ったchunkがあれば、手順2をそのchunkだけやり直す（2回やっても埋まらなければnullのまま進めてよい）。
4. `node dev/cloud.mjs notes-prompt <round>` の出力をそのまま新しいサブエージェントに渡す
   （話者メモ・翻訳ルール・glossaryの追記）。
5. `node dev/cloud.mjs finish <round> --summary="<訳した会話や気づいた点を1行で>"` を実行する。
6. commitしてpushする：`git add -A && git commit -m "<round>" && git push`
   （pushはこのセッションに割り当てられたブランチで構わない。ローカル側で取り込む）。
7. 1に戻り、次のroundへ進む。`status` が「全roundがfinish済み」と出たら作業終了。

## 守ること

- chunkファイルの `key` / `text` / `tags` など、`translation` 以外のフィールドを書き換えない。
- 訳文の品質判断はサブエージェントに任せる。メインから訳文を手直しするのは、invalidの修正だけ。
- 途中で止まっても、手順6までcommit済みのroundは失われない。コンテキストが大きくなってきたら、
  roundの区切り（手順6の後）で作業を終えて報告してよい。
- `dev/cloud.mjs` と `dev/helper/` は編集しない（本リポジトリ側から上書き同期される）。
