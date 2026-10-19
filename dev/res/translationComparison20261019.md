# siratori版との翻訳比較

全体は作業中。自動分類しただけの項目をレビュー済みに数えない。

- 原文：110,401件
- 比較開始時の完全一致：9,824件
- 差分：100,577件
- 前回サンプリング：200件（完全一致19件を含む）
- 今回の新規目視レビュー：801件
- 今回の反映：95件
- 差分の未レビュー：99,595件

## 方針

英語原文と両訳を照合し、改善できる文節だけ採用。既存の人名・話者口調・定訳を維持する。曖昧な用語は用語集・blueprint・関連会話・PRDで調査し、それでも意味が確定しない場合は意味を狭めない自然な表現にする。数値・条件など挙動の不明点は推測で変更しない。

今回の新規レビュー範囲は原文JSON順の実績・背景・基本呪文・状態説明が中心であり、全体の品質比率の推定サンプルではない。前回200件の評価記録と今回の厳密な調査記録は区別する。

## 主な修正

### Trollhound Howl

キー：5a18c27d-3cad-41df-ae8f-9de67810e15c

理由：犬のhowlとして自然な「遠吠え」のみ採用。トロール・ハウンドの表記は保持。

変更前：トロール・ハウンドの咆哮

変更後：トロール・ハウンドの遠吠え

### Transformation

キー：05e7bb98-a28c-4a28-85c8-a13c12ce903b

理由：実績名であり呪文Transformationではないことを確認。相手の意味訳を参考に、対になる説明の「神話の変貌」と統一。

変更前：トランスフォーメーション

変更後：変貌

根拠：blueprints/Achievements/17_Transformation.jbp

### Transformation

キー：817ec204-38a4-46dc-b909-084007643b40

理由：実績名であり呪文Transformationではないことを確認。相手の意味訳を参考に、対になる説明の「神話の変貌」と統一。

変更前：トランスフォーメーション

変更後：変貌

根拠：blueprints/Achievements/17_Transformation.jbp

### Spirit of Adventure

キー：7d2068df-ef6b-4aeb-afec-da589aa6d8a1

理由：Spirit of Adventureの自然で簡潔な意味訳を採用。

変更前：冒険の精神

変更後：冒険心

### Spirit of Adventure

キー：ed99cac8-7e8e-4d5a-a124-9883997706ec

理由：Spirit of Adventureの自然で簡潔な意味訳を採用。

変更前：冒険の精神

変更後：冒険心

### Develop all Crusade stats to Rank 5 by the end of Act 3; and to maximum by the end of the game.

キー：fa241e6d-b716-4286-b536-f57e3beb5a07

理由：同じ実績群のChapter 3表記にそろえ、Act 3も第3章とする。

変更前：第3幕の終わりまでに十字軍の全能力値をランク5まで、ゲーム終了までに最大まで伸ばす。

変更後：第3章の終わりまでに十字軍の全能力値をランク5まで、ゲーム終了までに最大まで伸ばす。

### Develop all Crusade stats to Rank 5 by the end of Act 3; and to maximum by the end of the game.

キー：1644365c-a2ad-49a9-be87-560e0fe3ac27

理由：同じ実績群のChapter 3表記にそろえ、Act 3も第3章とする。

変更前：第3幕の終わりまでに十字軍の全能力値をランク5まで、ゲーム終了までに最大まで伸ばす。

変更後：第3章の終わりまでに十字軍の全能力値をランク5まで、ゲーム終了までに最大まで伸ばす。

### Become the champion of the one true queen... the Fulsome Queen.

キー：10c46d2c-bb51-4049-a568-94c471f565a5

理由：championを単なる従者へ狭めず、相手の訳を部分採用。女王の既存表記は維持。

変更前：唯一の真の女王……フルサムの女王の従者となる。

変更後：唯一の真の女王……フルサムの女王のチャンピオンとなる。

根拠：dev/res/translationGuide.md

### Next-Door Play

キー：77acbe2d-aa4f-4ecc-b800-fcf910104f95

理由：直後の実績説明で使われる劇団名「お隣劇場」を保ち、相手の自然な公演名を採用。

変更前：お隣の芝居

変更後：お隣劇場の公演

### Next-Door Play

キー：4c8a6070-d667-4380-8634-4a8a43df8db7

理由：直後の実績説明で使われる劇団名「お隣劇場」を保ち、相手の自然な公演名を採用。

変更前：お隣の芝居

変更後：お隣劇場の公演

### You helped the Storyteller to regain his lost memories — and reunited him with one who was dear to h

キー：9b9c633e-2f1f-4c8d-8d3c-0e2e280564f3

理由：相手の簡潔な再会の表現を採用。ストーリーテラーの既存表記は維持。

変更前：あなたはストーリーテラーが失った記憶を取り戻す手助けをし、彼にとって大切だった者との再会も果たさせた。

変更後：あなたはストーリーテラーが失った記憶を取り戻す手助けをし、彼にとって大切だった者と再会させた。

### You caught all possible tailwinds.

キー：7708fb7f-9a30-42b6-babe-6149c657cba8

理由：all possibleの網羅性を自然に表現。相手の「すべての種類」を採用し、追い風をつかまえる表現を維持。

変更前：考えうるすべての追い風をつかまえた。

変更後：すべての種類の追い風をつかまえた。

### You found and defeated the most elusive monster in the Midnight Isles.

キー：8339e3c1-2d2b-4758-8b23-7b2bd8ee4bb3

理由：発見の困難さを指すelusiveを相手の明確な表現へ。

変更前：ミッドナイト諸島で最も捕らえがたい怪物を見つけ出し、倒した。

変更後：ミッドナイト諸島で最も見つけにくい怪物を見つけ出し、倒した。

### Devoted Servant

キー：c05ebc5c-28d5-4c14-bf99-c62980edecaf

理由：僕を一人称と誤読しない、自然な役割名を採用。

変更前：献身的な僕

変更後：献身的な従者

### You defeated the first guardian of the islands.

キー：d502c4b8-9dbc-43b2-a3a3-8e53e6e0f855

理由：原文islandsの複数を相手の訳から採用。

変更前：島の最初の守護者を倒した。

変更後：島々の最初の守護者を倒した。

### Brave and Foolhardy

キー：2581fbbc-a234-495d-8c4d-1c2472bb7969

理由：並列形容詞を日本語の自然な連語へ。

変更前：勇敢と無謀

変更後：勇敢で無謀

### You triumphed in the final battle without mythic powers and without being a legend.

キー：33fbfd50-3785-4452-b82d-cffdfd94246c

理由：without mythic powersを使用制限だけに狭めない相手の表現を採用。

変更前：神話の力を使わず、レジェンドにもならずに最終決戦に勝利した。

変更後：神話の力を持たず、レジェンドにもならずに最終決戦に勝利した。

根拠：blueprints/Achievements/DLC3_20_Unusual_mortal.jbp

### You and Ulbrig found all that remains of the griffons.

キー：355a8145-495d-4af9-a7bb-44453fead4b1

理由：関連会話に骨・卵の殻と鎮魂の祈りが明示されるため、remainsは生存個体ではなく遺骸。相手の解釈を自然な語に整えて採用。

変更前：ウルブリグとともに、グリフォンの生き残りをすべて見つけた。

変更後：ウルブリグとともに、グリフォンの遺骸をすべて見つけた。

根拠：blueprints/Achievements/DLC4_33_Endangered Species.jbp / enGB:00c0222a-09ec-47b6-8333-2f01d39ae2df / enGB:b30f94f3-df40-47f6-b230-81c51b995869 / blueprints/World/Dialogs/DLC4_Shifter/UlbrigRomance/RomanceBonus_c5/GrifNest/Cue_0008.jbp

### You managed to sneak past all the shadow patrols.

キー：4cfb871f-12d7-4142-9306-3efc06192158

理由：patrolsの主体を明示した相手の表現を採用。

変更前：影の巡回をすべてやり過ごした。

変更後：影の巡回兵をすべてやり過ごした。

### A Shard In a Cave

キー：51af3e93-0054-41af-8231-af9a8f7b7abb

理由：洞窟そのものの破片という誤読を避け、所在を表現。欠片の統一訳は維持。

変更前：洞窟の欠片

変更後：洞窟の中の欠片

### A Shard In a Tower

キー：4f548c25-d35d-496a-b0a7-1c56cbb04964

理由：塔そのものの破片という誤読を避け、所在を表現。

変更前：塔の欠片

変更後：塔の中の欠片

### You defeated Sithhud at the height of his power.

キー：885e2dbf-f1f8-4ed3-9208-8b707778111e

理由：height of his powerを過去の全盛期と誤読しない自然な表現へ。

変更前：全盛期のシスハッドを倒した。

変更後：力が最高潮に達したシスハッドを倒した。

### More Fun Together

キー：6264fc48-6a1f-436f-bac5-5ad8442ae954

理由：moreの比較の意味を保持した相手訳を採用。

変更前：みんなで楽しく

変更後：一緒ならもっと楽しい

### Houndmasters are accompanied by their loyal dogs, who lend their masters an extra pair of eyes, as w

キー：fc4cf220-4ac2-4cd5-9536-69847a77d99b

理由：相手の自然な比喩表現を採用。原文dogsを猟犬へ限定せず、既存のハウンドマスター表記を保持。

変更前：ハウンドマスターは忠実な犬を連れている。犬は主人にもう一組の目を与え、戦場のどんな武器にも劣らない致命的な顎を貸してくれる。

変更後：ハウンドマスターには忠実な犬が付き従う。犬は主人の目を補い、その強靭な顎は戦場のどんな武器にも引けを取らない殺傷力を発揮する。

### A shifter combines druidic shapeshifting magic with martial proficiency to become an animalistic mas

キー：217ee40e-a769-4c29-b493-d6a85aaaf1e8

理由：相手の「獣の力」を取り込み、原文の荒野の達人という説明を保持。

変更前：シフターはドルイドの変身魔法と武術の習熟を組み合わせ、獣のような荒野の達人となる。

変更後：シフターはドルイドの変身魔法と武術の習熟を組み合わせ、獣の力を備えた荒野の達人となる。

### Farmhand adds {g|Encyclopedia:Athletics}Athletics{/g} and {g|Encyclopedia:Lore_Nature}Lore (nature){

キー：281aabdb-d51a-4621-bda5-8d57d0e3da42

理由：Scytheの登録訳「大鎌」に合わせて相手訳を部分採用。

変更前：農夫は{g|Encyclopedia:Athletics}運動{/g}と{g|Encyclopedia:Lore_Nature}伝承〈自然〉{/g}をクラス{g|Encyclopedia:Skills}技能{/g}に加える。また、鎌に習熟し、{g|Encyclopedia:Bonus}ボーナス{/g}として{g|Encyclopedia:Saving_Throw}頑健セーヴィングスロー{/g}に+1を得る。
キャラクター作成時にクラスから、選択した背景と同じクラス技能・{g|Encyclopedia:Weapon_Proficiency}武器習熟{/g}・防具習熟をすでに得ている場合、背景のボーナスは、技能なら+1の技量ボーナス、武器習熟なら+1の強化ボーナス、防具習熟なら{g|Encyclopedia:Armor_Check_Penalty}防具による判定ペナルティ{/g}の1軽減に変わる。

変更後：農夫は{g|Encyclopedia:Athletics}運動{/g}と{g|Encyclopedia:Lore_Nature}伝承〈自然〉{/g}をクラス{g|Encyclopedia:Skills}技能{/g}に加える。また、大鎌に習熟し、{g|Encyclopedia:Bonus}ボーナス{/g}として{g|Encyclopedia:Saving_Throw}頑健セーヴィングスロー{/g}に+1を得る。
キャラクター作成時にクラスから、選択した背景と同じクラス技能・{g|Encyclopedia:Weapon_Proficiency}武器習熟{/g}・防具習熟をすでに得ている場合、背景のボーナスは、技能なら+1の技量ボーナス、武器習熟なら+1の強化ボーナス、防具習熟なら{g|Encyclopedia:Armor_Check_Penalty}防具による判定ペナルティ{/g}の1軽減に変わる。

根拠：dev/res/glossary.json:Scythe / blueprints/Feats/Proficiencies/ScytheProficiency.jbp

### Miner adds {g|Encyclopedia:Athletics}Athletics{/g} to the list of her class {g|Encyclopedia:Skills}s

キー：cb295e97-ed54-431a-8523-088009aa7570

理由：相手訳の武器名の語区切りを採用。

変更前：鉱夫は{g|Encyclopedia:Athletics}運動{/g}をクラス{g|Encyclopedia:Skills}技能{/g}に加える。また、ライトピックとヘヴィピックに習熟し、{g|Encyclopedia:Bonus}ボーナス{/g}として{g|Encyclopedia:Saving_Throw}頑健セーヴィングスロー{/g}に+1を得る。
キャラクター作成時にクラスから、選択した背景と同じクラス技能・{g|Encyclopedia:Weapon_Proficiency}武器習熟{/g}・防具習熟をすでに得ている場合、背景のボーナスは、技能なら+1の技量ボーナス、武器習熟なら+1の強化ボーナス、防具習熟なら{g|Encyclopedia:Armor_Check_Penalty}防具による判定ペナルティ{/g}の1軽減に変わる。

変更後：鉱夫は{g|Encyclopedia:Athletics}運動{/g}をクラス{g|Encyclopedia:Skills}技能{/g}に加える。また、ライト・ピックとヘヴィ・ピックに習熟し、{g|Encyclopedia:Bonus}ボーナス{/g}として{g|Encyclopedia:Saving_Throw}頑健セーヴィングスロー{/g}に+1を得る。
キャラクター作成時にクラスから、選択した背景と同じクラス技能・{g|Encyclopedia:Weapon_Proficiency}武器習熟{/g}・防具習熟をすでに得ている場合、背景のボーナスは、技能なら+1の技量ボーナス、武器習熟なら+1の強化ボーナス、防具習熟なら{g|Encyclopedia:Armor_Check_Penalty}防具による判定ペナルティ{/g}の1軽減に変わる。

根拠：dev/res/translationGuide.md

### Smith adds {g|Encyclopedia:Athletics}Athletics{/g} to the list of her class {g|Encyclopedia:Skills}s

キー：021f2d49-1577-4bb3-8ae0-457bd09ef02a

理由：相手訳の武器名の語区切りを採用。

変更前：鍛冶屋は{g|Encyclopedia:Athletics}運動{/g}をクラス{g|Encyclopedia:Skills}技能{/g}に加える。またライトハンマーとウォーハンマーに習熟し、{g|Encyclopedia:Saving_Throw}頑健セーヴ{/g}に+1の{g|Encyclopedia:Bonus}ボーナス{/g}を得る。
キャラクター作成時に選択した背景が与えるクラス技能・{g|Encyclopedia:Weapon_Proficiency}武器習熟{/g}・鎧習熟を、すでにクラスから得ている場合、背景による対応するボーナスは、技能なら+1の技量ボーナス、武器習熟なら+1の強化ボーナス、鎧習熟なら{g|Encyclopedia:Armor_Check_Penalty}防具による判定ペナルティ{/g}の1軽減に変わる。

変更後：鍛冶屋は{g|Encyclopedia:Athletics}運動{/g}をクラス{g|Encyclopedia:Skills}技能{/g}に加える。またライト・ハンマーとウォーハンマーに習熟し、{g|Encyclopedia:Saving_Throw}頑健セーヴ{/g}に+1の{g|Encyclopedia:Bonus}ボーナス{/g}を得る。
キャラクター作成時に選択した背景が与えるクラス技能・{g|Encyclopedia:Weapon_Proficiency}武器習熟{/g}・鎧習熟を、すでにクラスから得ている場合、背景による対応するボーナスは、技能なら+1の技量ボーナス、武器習熟なら+1の強化ボーナス、鎧習熟なら{g|Encyclopedia:Armor_Check_Penalty}防具による判定ペナルティ{/g}の1軽減に変わる。

根拠：dev/res/translationGuide.md

### Andoren Diplomat adds {g|Encyclopedia:Persuasion}Persuasion{/g} to the list of her class {g|Encyclop

キー：dc4c3de1-3eed-4261-9eb8-830b1d985754

理由：blueprintはクラス技能SkillPersuasionの追加とCheckDiplomacyへの+2を別々に設定。説得判定全般へのボーナスと読める現行を、相手の交渉という区別に修正。

変更前：アンドランの外交官は{g|Encyclopedia:Persuasion}説得{/g}をクラス{g|Encyclopedia:Skills}技能{/g}に加える。また、説得技能の{g|Encyclopedia:Check}判定{/g}に+2の{g|Encyclopedia:Bonus}ボーナス{/g}を得る。
キャラクター作成時に選択した背景が与えるクラス技能・{g|Encyclopedia:Weapon_Proficiency}武器習熟{/g}・鎧習熟を、すでにクラスから得ている場合、背景による対応するボーナスは、技能なら+1の技量ボーナス、武器習熟なら+1の強化ボーナス、鎧習熟なら{g|Encyclopedia:Armor_Check_Penalty}防具による判定ペナルティ{/g}の1軽減に変わる。

変更後：アンドランの外交官は{g|Encyclopedia:Persuasion}説得{/g}をクラス{g|Encyclopedia:Skills}技能{/g}に加える。また、交渉の{g|Encyclopedia:Check}判定{/g}に+2の{g|Encyclopedia:Bonus}ボーナス{/g}を得る。
キャラクター作成時に選択した背景が与えるクラス技能・{g|Encyclopedia:Weapon_Proficiency}武器習熟{/g}・鎧習熟を、すでにクラスから得ている場合、背景による対応するボーナスは、技能なら+1の技量ボーナス、武器習熟なら+1の強化ボーナス、鎧習熟なら{g|Encyclopedia:Armor_Check_Penalty}防具による判定ペナルティ{/g}の1軽減に変わる。

根拠：blueprints/Backgrounds/BackgroundsSelection/Regional/BackgroundAndoranDiplomat.jbp:32 / SkillPersuasion / CheckDiplomacy

### Nexian Scholar adds {g|Encyclopedia:Knowledge_Arcana}Knowledge (arcana){/g} to the list of her class

キー：6a70164a-0cb9-4635-8e62-dd181566c26e

理由：Nexianは地名Nexの形容詞。相手の解釈を採用し、登録地名「ネクス」に統一。

変更前：ネクシアの学者は{g|Encyclopedia:Knowledge_Arcana}知識〈神秘学〉{/g}をクラス{g|Encyclopedia:Skills}技能{/g}に加える。また、知識〈神秘学〉技能の{g|Encyclopedia:Check}判定{/g}に+2の{g|Encyclopedia:Bonus}ボーナス{/g}を得る。
キャラクター作成時に選択した背景が与えるクラス技能・{g|Encyclopedia:Weapon_Proficiency}武器習熟{/g}・鎧習熟を、すでにクラスから得ている場合、背景による対応するボーナスは、技能なら+1の技量ボーナス、武器習熟なら+1の強化ボーナス、鎧習熟なら{g|Encyclopedia:Armor_Check_Penalty}防具による判定ペナルティ{/g}の1軽減に変わる。

変更後：ネクスの学者は{g|Encyclopedia:Knowledge_Arcana}知識〈神秘学〉{/g}をクラス{g|Encyclopedia:Skills}技能{/g}に加える。また、知識〈神秘学〉技能の{g|Encyclopedia:Check}判定{/g}に+2の{g|Encyclopedia:Bonus}ボーナス{/g}を得る。
キャラクター作成時に選択した背景が与えるクラス技能・{g|Encyclopedia:Weapon_Proficiency}武器習熟{/g}・鎧習熟を、すでにクラスから得ている場合、背景による対応するボーナスは、技能なら+1の技量ボーナス、武器習熟なら+1の強化ボーナス、鎧習熟なら{g|Encyclopedia:Armor_Check_Penalty}防具による判定ペナルティ{/g}の1軽減に変わる。

根拠：dev/res/glossary.json:Nex / blueprints/Backgrounds/BackgroundsSelection/Regional/BackgroundNexianScholar.jbp

### Nexian Scholar

キー：1d53717e-3e09-41b6-96f9-f4df5038b948

理由：Nexianは地名Nexの形容詞。相手の解釈を採用し、登録地名「ネクス」に統一。

変更前：ネクシアの学者

変更後：ネクスの学者

根拠：dev/res/glossary.json:Nex / blueprints/Backgrounds/BackgroundsSelection/Regional/BackgroundNexianScholar.jbp

### Ustalavic Peasant adds {g|Encyclopedia:Athletics}Athletics{/g} to the list of her class {g|Encyclope

キー：e7143560-d122-4765-9e6d-9b782b31a047

理由：Scytheの登録訳「大鎌」に合わせて相手訳を部分採用。

変更前：ウスタラヴの農民は{g|Encyclopedia:Athletics}運動{/g}をクラス{g|Encyclopedia:Skills}技能{/g}に加える。また鎌に習熟する。さらに恐怖効果を受けている間、{g|Encyclopedia:Armor_Class}AC{/g}と{g|Encyclopedia:Damage}ダメージ{/g}に+1の{g|Encyclopedia:Bonus}ボーナス{/g}を得る。
キャラクター作成時に選択した背景が与えるクラス技能・{g|Encyclopedia:Weapon_Proficiency}武器習熟{/g}・鎧習熟を、すでにクラスから得ている場合、背景による対応するボーナスは、技能なら+1の技量ボーナス、武器習熟なら+1の強化ボーナス、鎧習熟なら{g|Encyclopedia:Armor_Check_Penalty}防具による判定ペナルティ{/g}の1軽減に変わる。

変更後：ウスタラヴの農民は{g|Encyclopedia:Athletics}運動{/g}をクラス{g|Encyclopedia:Skills}技能{/g}に加える。また大鎌に習熟する。さらに恐怖効果を受けている間、{g|Encyclopedia:Armor_Class}AC{/g}と{g|Encyclopedia:Damage}ダメージ{/g}に+1の{g|Encyclopedia:Bonus}ボーナス{/g}を得る。
キャラクター作成時に選択した背景が与えるクラス技能・{g|Encyclopedia:Weapon_Proficiency}武器習熟{/g}・鎧習熟を、すでにクラスから得ている場合、背景による対応するボーナスは、技能なら+1の技量ボーナス、武器習熟なら+1の強化ボーナス、鎧習熟なら{g|Encyclopedia:Armor_Check_Penalty}防具による判定ペナルティ{/g}の1軽減に変わる。

根拠：dev/res/glossary.json:Scythe / blueprints/Feats/Proficiencies/ScytheProficiency.jbp

### Scholar — Divine

キー：057ba752-6243-41fe-a43a-0ac8c8f3814a

理由：ダメージ種別ではなく秘術と対になる信仰系学者・クレリックの呪文選択。Divineの語義を用途で区別し、相手の信仰を採用。

変更前：学者 — 神聖

変更後：学者 — 信仰

根拠：blueprints/Backgrounds/BackgroundsSelection/Scholar/BackgroundScholarDivine.jbp / blueprints/Backgrounds/BackgroundsSelection/Scholar/BackgroundsClericSpellLikeSelection.jbp

### Select 1 {g|Encyclopedia:Cantrips_Orisons}orison{/g} from cleric list, and get it as a {g|Encycloped

キー：dd2ea953-8fe5-4ae9-b323-d9c18f261e74

理由：相手の回数制限のない能力という明確な表現だけ採用。オリゾン・キャントリップの登録訳は維持。

変更前：クレリックのリストから{g|Encyclopedia:Cantrips_Orisons}オリゾン{/g}を1つ選び、{g|Encyclopedia:Special_Abilities}擬似呪文能力{/g}として好きなだけ使用できる

変更後：クレリックのリストから{g|Encyclopedia:Cantrips_Orisons}オリゾン{/g}を1つ選び、{g|Encyclopedia:Special_Abilities}擬似呪文能力{/g}として回数無制限で使用できる

### Scholar — Divine

キー：7bcead18-543a-4516-aff7-fcacc8a79eca

理由：ダメージ種別ではなく秘術と対になる信仰系学者・クレリックの呪文選択。Divineの語義を用途で区別し、相手の信仰を採用。

変更前：学者 — 神聖

変更後：学者 — 信仰

根拠：blueprints/Backgrounds/BackgroundsSelection/Scholar/BackgroundScholarDivine.jbp / blueprints/Backgrounds/BackgroundsSelection/Scholar/BackgroundsClericSpellLikeSelection.jbp

### Select 1 {g|Encyclopedia:Cantrips_Orisons}cantrip{/g} from wizard list, and get it as a {g|Encyclope

キー：cc54322f-5780-4409-8640-d565c21c73be

理由：相手の回数制限のない能力という明確な表現だけ採用。オリゾン・キャントリップの登録訳は維持。

変更前：ウィザードのリストから{g|Encyclopedia:Cantrips_Orisons}キャントリップ{/g}を1つ選び、{g|Encyclopedia:Special_Abilities}擬似呪文能力{/g}として好きなだけ使用できる

変更後：ウィザードのリストから{g|Encyclopedia:Cantrips_Orisons}キャントリップ{/g}を1つ選び、{g|Encyclopedia:Special_Abilities}擬似呪文能力{/g}として回数無制限で使用できる

### Bounty Hunter adds {g|Encyclopedia:Stealth}Stealth{/g} to the list of her class {g|Encyclopedia:Skil

キー：e350cd80-375d-43c4-8292-6f26a20c240f

理由：相手訳の武器名の語区切りを採用。

変更前：賞金稼ぎは{g|Encyclopedia:Stealth}隠密{/g}をクラス{g|Encyclopedia:Skills}技能{/g}に加える。また軽装鎧、クラブ、ライトメイス、ヘヴィメイスに習熟する。
キャラクター作成時に選択した背景が与えるクラス技能・{g|Encyclopedia:Weapon_Proficiency}武器習熟{/g}・鎧習熟を、すでにクラスから得ている場合、背景による対応する{g|Encyclopedia:Bonus}ボーナス{/g}は、技能なら+1の技量ボーナス、武器習熟なら+1の強化ボーナス、鎧習熟なら{g|Encyclopedia:Armor_Check_Penalty}防具による判定ペナルティ{/g}の1軽減に変わる。

変更後：賞金稼ぎは{g|Encyclopedia:Stealth}隠密{/g}をクラス{g|Encyclopedia:Skills}技能{/g}に加える。また軽装鎧、クラブ、ライト・メイス、ヘヴィ・メイスに習熟する。
キャラクター作成時に選択した背景が与えるクラス技能・{g|Encyclopedia:Weapon_Proficiency}武器習熟{/g}・鎧習熟を、すでにクラスから得ている場合、背景による対応する{g|Encyclopedia:Bonus}ボーナス{/g}は、技能なら+1の技量ボーナス、武器習熟なら+1の強化ボーナス、鎧習熟なら{g|Encyclopedia:Armor_Check_Penalty}防具による判定ペナルティ{/g}の1軽減に変わる。

根拠：dev/res/translationGuide.md

### Guard adds {g|Encyclopedia:Perception}Perception{/g} to the list of her class {g|Encyclopedia:Skills

キー：aeede53f-7faf-41dd-a184-60524da6f254

理由：相手訳の武器名の語区切りを採用。

変更前：衛兵は{g|Encyclopedia:Perception}知覚{/g}をクラス{g|Encyclopedia:Skills}技能{/g}に加える。また軽装鎧、ショートソード、ライトクロスボウに習熟する。
キャラクター作成時に選択した背景が与えるクラス技能・{g|Encyclopedia:Weapon_Proficiency}武器習熟{/g}・鎧習熟を、すでにクラスから得ている場合、背景による対応する{g|Encyclopedia:Bonus}ボーナス{/g}は、技能なら+1の技量ボーナス、武器習熟なら+1の強化ボーナス、鎧習熟なら{g|Encyclopedia:Armor_Check_Penalty}防具による判定ペナルティ{/g}の1軽減に変わる。

変更後：衛兵は{g|Encyclopedia:Perception}知覚{/g}をクラス{g|Encyclopedia:Skills}技能{/g}に加える。また軽装鎧、ショートソード、ライト・クロスボウに習熟する。
キャラクター作成時に選択した背景が与えるクラス技能・{g|Encyclopedia:Weapon_Proficiency}武器習熟{/g}・鎧習熟を、すでにクラスから得ている場合、背景による対応する{g|Encyclopedia:Bonus}ボーナス{/g}は、技能なら+1の技量ボーナス、武器習熟なら+1の強化ボーナス、鎧習熟なら{g|Encyclopedia:Armor_Check_Penalty}防具による判定ペナルティ{/g}の1軽減に変わる。

根拠：dev/res/translationGuide.md

### This {g|Encyclopedia:Spell}spell{/g} clouds the mind of a humanoid creature with 4 or fewer {g|Encyc

キー：c0e86d7a-781f-4a36-bedf-443d46c88a35

理由：相手訳を参考にimmuneのルール上の意味を明示。幻惑状態などの表記は保持。

変更前：この{g|Encyclopedia:Spell}呪文{/g}は{g|Encyclopedia:Hit_Dice}ヒットダイス{/g}4以下の人型生物の精神を曇らせ、{g|Encyclopedia:CA_Types}行動{/g}を取れなくする。HD5以上の人型生物には効果がない。{g|ConditionDaze}幻惑状態{/g}の対象は{g|ConditionStunned}朦朧状態{/g}ではないので、攻撃者は特に有利になることはない。この呪文で幻惑状態になったクリーチャーは、1分間この呪文の効果を受けない。

変更後：この{g|Encyclopedia:Spell}呪文{/g}は{g|Encyclopedia:Hit_Dice}ヒットダイス{/g}4以下の人型生物の精神を曇らせ、{g|Encyclopedia:CA_Types}行動{/g}を取れなくする。HD5以上の人型生物には効果がない。{g|ConditionDaze}幻惑状態{/g}の対象は{g|ConditionStunned}朦朧状態{/g}ではないので、攻撃者は特に有利になることはない。この呪文で幻惑状態になったクリーチャーは、1分間この呪文の効果に対する完全耐性を得る。

### The character is frozen in fear and can take no {g|Encyclopedia:CA_Types}actions{/g}. A cowering cha

キー：8dc5b042-62a5-4e56-93cf-dada0fc2bfd1

理由：相手の自然な条件表現を採用。Coweringの既存訳「戦慄状態」とACの表記は保持。

変更前：キャラクターは恐怖で凍りつき、{g|Encyclopedia:CA_Types}アクション{/g}を行えない。戦慄状態のキャラクターは{g|Encyclopedia:Armor_Class}AC{/g}に-2の{g|Encyclopedia:Penalty}ペナルティ{/g}を受け、(あれば){g|Encyclopedia:Dexterity}敏捷力{/g}{g|Encyclopedia:Bonus}ボーナス{/g}を失う。

変更後：キャラクターは恐怖で凍りつき、{g|Encyclopedia:CA_Types}アクション{/g}を行えない。戦慄状態のキャラクターは{g|Encyclopedia:Armor_Class}AC{/g}に-2の{g|Encyclopedia:Penalty}ペナルティ{/g}を受け、{g|Encyclopedia:Dexterity}敏捷力{/g}{g|Encyclopedia:Bonus}ボーナス{/g}があれば、それも失う。

### The character is numb with fear and can take no {g|Encyclopedia:CA_Types}actions{/g}. A cowering cha

キー：eef5e4de-6131-4bd6-831a-deaa21bfba8b

理由：相手の自然な条件表現を採用。Coweringの既存訳「戦慄状態」とACの表記は保持。

変更前：キャラクターは恐怖で身がすくみ、{g|Encyclopedia:CA_Types}アクション{/g}を行えない。戦慄状態のキャラクターは{g|Encyclopedia:Armor_Class}AC{/g}に-2の{g|Encyclopedia:Penalty}ペナルティ{/g}を受け、(あれば){g|Encyclopedia:Dexterity}敏捷力{/g}{g|Encyclopedia:Bonus}ボーナス{/g}を失う。

変更後：キャラクターは恐怖で身がすくみ、{g|Encyclopedia:CA_Types}アクション{/g}を行えない。戦慄状態のキャラクターは{g|Encyclopedia:Armor_Class}AC{/g}に-2の{g|Encyclopedia:Penalty}ペナルティ{/g}を受け、{g|Encyclopedia:Dexterity}敏捷力{/g}{g|Encyclopedia:Bonus}ボーナス{/g}があれば、それも失う。

### An exhausted character moves at half {g|Encyclopedia:Speed}speed{/g}, cannot charge, and takes a –6 

キー：d29a803d-09fe-4b8b-9168-5008ec2b689f

理由：相手の簡潔な移動速度の表現を採用。過労状態の定訳と全条件は保持。

変更前：過労状態のキャラクターは半分の{g|Encyclopedia:Speed}移動速度{/g}で移動し、突撃できず、{g|Encyclopedia:Strength}筋力{/g}と{g|Encyclopedia:Dexterity}敏捷力{/g}に-6の{g|Encyclopedia:Penalty}ペナルティ{/g}を受ける。完全な{g|Encyclopedia:Rest}休息{/g}を取ると、過労状態は解消される。

変更後：過労状態のキャラクターは{g|Encyclopedia:Speed}移動速度{/g}が半分になり、突撃できず、{g|Encyclopedia:Strength}筋力{/g}と{g|Encyclopedia:Dexterity}敏捷力{/g}に-6の{g|Encyclopedia:Penalty}ペナルティ{/g}を受ける。完全な{g|Encyclopedia:Rest}休息{/g}を取ると、過労状態は解消される。

### The creature stands quietly. Any {g|Encyclopedia:Damage}damage{/g} to the target automatically break

キー：6000efc6-fae2-492d-8d29-fe6b1bb381c3

理由：ダメージが入るという口語を、相手の効果説明として自然な表現へ。

変更前：クリーチャーは静かに立ち尽くす。対象に{g|Encyclopedia:Damage}ダメージ{/g}が入ると、効果は自動的に解除される。

変更後：クリーチャーは静かに立ち尽くす。対象が何らかの{g|Encyclopedia:Damage}ダメージ{/g}を受けると、効果は自動的に解除される。

### Lava Burn

キー：e6d8f977-b1a6-4068-9606-8cfb6562ff1f

理由：原因と結果の関係を明確にする相手訳を採用。

変更前：溶岩の火傷

変更後：溶岩による火傷

### Creatures with the nauseated condition experience stomach distress. Nauseated creatures are unable t

キー：83bff626-f70b-45d2-b39d-f5464a537db4

理由：相手訳の表記が用語集の登録訳と一致することを確認し、ゲームシステム用語を統一。

変更前：吐き気がする状態のクリーチャーは胃のむかつきに苦しむ。吐き気がする状態のクリーチャーは{g|Encyclopedia:Attack}攻撃{/g}、{g|Encyclopedia:Spell}呪文{/g}の発動、呪文への{g|Encyclopedia:Concentration}集中{/g}など、注意を要する行動を一切行えない。このキャラクターが取れる{g|Encyclopedia:CA_Types}アクション{/g}は、1ターンにつき1回の{g|Encyclopedia:Move_Action}移動アクション{/g}だけである。

変更後：吐き気がする状態のクリーチャーは胃のむかつきに苦しむ。吐き気がする状態のクリーチャーは{g|Encyclopedia:Attack}攻撃{/g}、{g|Encyclopedia:Spell}呪文{/g}の発動、呪文への{g|Encyclopedia:Concentration}精神集中{/g}など、注意を要する行動を一切行えない。このキャラクターが取れる{g|Encyclopedia:CA_Types}アクション{/g}は、1ターンにつき1回の{g|Encyclopedia:Move_Action}移動アクション{/g}だけである。

根拠：dev/res/glossary.json:Concentration

### Stormy weather slows down movement by half and reduces visibility, resulting in a –6 {g|Encyclopedia

キー：7fd33c46-0268-47d9-a9d5-4dda33276c29

理由：相手の移動速度を半減する表現を採用し、移動距離・速さの意味を明確化。

変更前：嵐により移動が半分に遅くなり視界も悪化するため、{g|Encyclopedia:Perception}知覚{/g}{g|Encyclopedia:Check}判定{/g}に-6の{g|Encyclopedia:Penalty}ペナルティ{/g}を受け、{g|Encyclopedia:Concealment}視認困難{/g}のためすべての{g|Encyclopedia:RangedAttack}遠隔攻撃{/g}に20%のミス確率が生じる。

変更後：嵐により移動速度が半減し、視界も悪化するため、{g|Encyclopedia:Perception}知覚{/g}{g|Encyclopedia:Check}判定{/g}に-6の{g|Encyclopedia:Penalty}ペナルティ{/g}を受け、{g|Encyclopedia:Concealment}視認困難{/g}のためすべての{g|Encyclopedia:RangedAttack}遠隔攻撃{/g}に20%のミス確率が生じる。

### A staggered creature may take a single {g|Encyclopedia:Move_Action}move action{/g} or {g|Encyclopedi

キー：830678b1-ccd4-418d-a351-f17a26399303

理由：相手訳の表記が用語集の登録訳と一致することを確認し、ゲームシステム用語を統一。

変更前：よろめき状態のクリーチャーは、毎{g|Encyclopedia:Combat_Round}ラウンド{/g}に{g|Encyclopedia:Move_Action}移動アクション{/g}か{g|Encyclopedia:Standard_Actions}標準アクション{/g}のどちらか1回だけを行える(両方は不可で、{g|Encyclopedia:Full_Round_Action}フルラウンドアクション{/g}も行えない)。よろめき状態のクリーチャーも、フリーアクション、即行アクション、割り込み{g|Encyclopedia:CA_Types}アクション{/g}は行える。

変更後：よろめき状態のクリーチャーは、毎{g|Encyclopedia:Combat_Round}ラウンド{/g}に{g|Encyclopedia:Move_Action}移動アクション{/g}か{g|Encyclopedia:Standard_Actions}標準アクション{/g}のどちらか1回だけを行える(両方は不可で、{g|Encyclopedia:Full_Round_Action}全ラウンド・アクション{/g}も行えない)。よろめき状態のクリーチャーも、フリーアクション、即行アクション、割り込み{g|Encyclopedia:CA_Types}アクション{/g}は行える。

根拠：dev/res/glossary.json:Full-Round Action

### Swamp gas damage

キー：d7a43139-631c-473a-9e96-ea91a0ec5e56

理由：相手の一般に分かりやすい沼ガスという表現を採用。

変更前：沼気ダメージ

変更後：沼ガスダメージ

### As a {g|Encyclopedia:Swift_Action}swift action{/g} while in an act of passion with a willing mortal,

キー：7efd81e6-3931-4d9d-bf88-16c80258b4ae

理由：相手の自然な交わりの表現を採用。冒涜ボーナスと不浄なる昇華の既存訳は維持。

変更前：ノクティキュラは同意した定命の者と情熱の行為に及んでいる間、{g|Encyclopedia:Swift_Action}即行アクション{/g}として不浄なる昇華を授けられる。対象の名がノクティキュラの翼にアビスの輝くルーンとして現れ、対象の体のどこかに深紅の刻印が浮かぶ。対象は直ちに、任意の{g|Encyclopedia:Ability_Scores}能力値{/g}1つに+6の冒涜{g|Encyclopedia:Bonus}ボーナス{/g}、別の任意の能力値に+4の冒涜ボーナスを得て、暗視能力も得る。

変更後：ノクティキュラは同意した定命の者と情熱的な交わりを結んでいる間、{g|Encyclopedia:Swift_Action}即行アクション{/g}として不浄なる昇華を授けられる。対象の名がノクティキュラの翼にアビスの輝くルーンとして現れ、対象の体のどこかに深紅の刻印が浮かぶ。対象は直ちに、任意の{g|Encyclopedia:Ability_Scores}能力値{/g}1つに+6の冒涜{g|Encyclopedia:Bonus}ボーナス{/g}、別の任意の能力値に+4の冒涜ボーナスを得て、暗視能力も得る。

### Demonic augmented organs grant the wearer a +2 natural armor enhancement {g|Encyclopedia:Bonus}bonus

キー：d4a288a5-1bdd-4a5c-9601-3e3eb930f12a

理由：相手の攻撃ロールという明確な表現を採用。DC・判定などと並ぶロールへのボーナスと分かるようにする。

変更前：デーモンの強化臓器は装着者に、{g|Encyclopedia:Armor_Class}AC{/g}に+2の外皮強化{g|Encyclopedia:Bonus}ボーナス{/g}を与える。さらに{g|Encyclopedia:Check}判定{/g}（{g|Encyclopedia:Spell_Resistance}呪文抵抗{/g}を破るためのもの）、{g|Encyclopedia:Concentration}精神集中{/g}判定、{g|Encyclopedia:DC}DC{/g}、{g|Encyclopedia:Attack}攻撃{/g}、{g|Encyclopedia:Damage}ダメージロール{/g}、すべての{g|Encyclopedia:Saving_Throw}セーヴ{/g}に+2の天賦ボーナスを与える。ただし、{g|Encyclopedia:HP}HP{/g}が20%を下回るたびに狂乱状態となり、死ぬか戦闘が終わるまで最も近いクリーチャーを攻撃する。

変更後：デーモンの強化臓器は装着者に、{g|Encyclopedia:Armor_Class}AC{/g}に+2の外皮強化{g|Encyclopedia:Bonus}ボーナス{/g}を与える。さらに{g|Encyclopedia:Check}判定{/g}（{g|Encyclopedia:Spell_Resistance}呪文抵抗{/g}を破るためのもの）、{g|Encyclopedia:Concentration}精神集中{/g}判定、{g|Encyclopedia:DC}DC{/g}、{g|Encyclopedia:Attack}攻撃ロール{/g}、{g|Encyclopedia:Damage}ダメージロール{/g}、すべての{g|Encyclopedia:Saving_Throw}セーヴ{/g}に+2の天賦ボーナスを与える。ただし、{g|Encyclopedia:HP}HP{/g}が20%を下回るたびに狂乱状態となり、死ぬか戦闘が終わるまで最も近いクリーチャーを攻撃する。

### The gates are screaming. All creatures in a 50-foot area must pass a {g|Encyclopedia:Saving_Throw}Fo

キー：c88bdd30-e447-42e6-bd5c-5d57afd03242

理由：相手の能力値ダメージという明示を取り込み、通常のHPダメージと区別。数値・各能力値の対象は維持。

変更前：門が悲鳴を上げている。50フィート範囲内のすべてのクリーチャーは{g|Encyclopedia:Saving_Throw}頑健セーヴ{/g}（{g|Encyclopedia:DC}DC{/g} 35）に成功しなければ、170の{g|Encyclopedia:Damage}ダメージ{/g}を{g|Encyclopedia:HP}HP{/g}に受け、さらに{g|Encyclopedia:Dice}1d4{/g}の{g|Encyclopedia:AbilityDamage}全能力値へのダメージ{/g}（{g|Encyclopedia:Strength}筋力{/g}、{g|Encyclopedia:Dexterity}敏捷力{/g}、{g|Encyclopedia:Constitution}耐久力{/g}、{g|Encyclopedia:Intelligence}知力{/g}、{g|Encyclopedia:Wisdom}判断力{/g}、{g|Encyclopedia:Charisma}魅力{/g}）を受ける。セーヴに成功すればダメージは無効。

変更後：門が悲鳴を上げている。50フィート範囲内のすべてのクリーチャーは{g|Encyclopedia:Saving_Throw}頑健セーヴ{/g}（{g|Encyclopedia:DC}DC{/g} 35）に成功しなければ、170の{g|Encyclopedia:Damage}ダメージ{/g}を{g|Encyclopedia:HP}HP{/g}に受け、さらに{g|Encyclopedia:Dice}1d4{/g}の{g|Encyclopedia:AbilityDamage}全能力値への能力値ダメージ{/g}（{g|Encyclopedia:Strength}筋力{/g}、{g|Encyclopedia:Dexterity}敏捷力{/g}、{g|Encyclopedia:Constitution}耐久力{/g}、{g|Encyclopedia:Intelligence}知力{/g}、{g|Encyclopedia:Wisdom}判断力{/g}、{g|Encyclopedia:Charisma}魅力{/g}）を受ける。セーヴに成功すればダメージは無効。

### Lacerated Hand

キー：00965b71-3521-4666-9840-998f4a7c4990

理由：手そのものが裂けたという不自然な表現を、相手の傷病名として自然な表現へ。

変更前：裂けた手

変更後：裂傷を負った手

### Glass Cuts

キー：e68973a2-f36c-4ca5-bf4b-e37fdcfe0c36

理由：切り傷の原因を明確にする相手訳を採用。

変更前：ガラスの切り傷

変更後：ガラスによる切り傷

### The horrid abyssal radiation makes this creature stronger. It gains a +8 {g|Encyclopedia:Bonus}bonus

キー：707eb0b6-6334-46fb-a33a-d1f5b866e244

理由：呪文・能力のDCという適用先を前に置き、相手訳を参考に括弧による後付けを解消。 / 同じリンクを二重に作らず、原文と既存訳のタグ個数を維持。

変更前：おぞましいアビスの放射がこのクリーチャーを強化する。{g|Encyclopedia:Armor_Class}AC{/g}に+8の{g|Encyclopedia:Bonus}ボーナス{/g}、すべての{g|Encyclopedia:Ability_Scores}能力値{/g}に+16のボーナスを得る。{g|Encyclopedia:Saving_Throw}セーヴ{/g}{g|Encyclopedia:DC}DC{/g}が8上昇する（{g|Encyclopedia:Spell}呪文{/g}および能力）。この効果は他のアビスの放射効果と累積する。

変更後：おぞましいアビスの放射がこのクリーチャーを強化する。{g|Encyclopedia:Armor_Class}AC{/g}に+8の{g|Encyclopedia:Bonus}ボーナス{/g}、すべての{g|Encyclopedia:Ability_Scores}能力値{/g}に+16のボーナスを得る。{g|Encyclopedia:Spell}呪文{/g}および能力の{g|Encyclopedia:Saving_Throw}セーヴ{/g}{g|Encyclopedia:DC}DC{/g}が8上昇する。この効果は他のアビスの放射効果と累積する。

### The horrid abyssal radiation makes this creature stronger. It gains a +10 {g|Encyclopedia:Bonus}bonu

キー：5b5f9bda-5bb6-4c28-a581-758d7197053c

理由：呪文・能力のDCという適用先を前に置き、相手訳を参考に括弧による後付けを解消。 / 同じリンクを二重に作らず、原文と既存訳のタグ個数を維持。

変更前：おぞましいアビスの放射がこのクリーチャーを強化する。{g|Encyclopedia:Armor_Class}AC{/g}に+10の{g|Encyclopedia:Bonus}ボーナス{/g}、すべての{g|Encyclopedia:Ability_Scores}能力値{/g}に+20のボーナスを得る。{g|Encyclopedia:Saving_Throw}セーヴ{/g}{g|Encyclopedia:DC}DC{/g}が10上昇する（{g|Encyclopedia:Spell}呪文{/g}および能力）。この効果は他のアビスの放射効果と累積する。

変更後：おぞましいアビスの放射がこのクリーチャーを強化する。{g|Encyclopedia:Armor_Class}AC{/g}に+10の{g|Encyclopedia:Bonus}ボーナス{/g}、すべての{g|Encyclopedia:Ability_Scores}能力値{/g}に+20のボーナスを得る。{g|Encyclopedia:Spell}呪文{/g}および能力の{g|Encyclopedia:Saving_Throw}セーヴ{/g}{g|Encyclopedia:DC}DC{/g}が10上昇する。この効果は他のアビスの放射効果と累積する。

### The horrid abyssal radiation makes this creature stronger. It gains a +2 {g|Encyclopedia:Bonus}bonus

キー：10c9c896-5b75-46f4-9a0f-0be44f1de0c7

理由：呪文・能力のDCという適用先を前に置き、相手訳を参考に括弧による後付けを解消。 / 同じリンクを二重に作らず、原文と既存訳のタグ個数を維持。

変更前：おぞましいアビスの放射がこのクリーチャーを強化する。{g|Encyclopedia:Armor_Class}AC{/g}に+2の{g|Encyclopedia:Bonus}ボーナス{/g}、すべての{g|Encyclopedia:Ability_Scores}能力値{/g}に+4のボーナスを得る。{g|Encyclopedia:Saving_Throw}セーヴ{/g}{g|Encyclopedia:DC}DC{/g}が2上昇する（{g|Encyclopedia:Spell}呪文{/g}および能力）。この効果は他のアビスの放射効果と累積する。

変更後：おぞましいアビスの放射がこのクリーチャーを強化する。{g|Encyclopedia:Armor_Class}AC{/g}に+2の{g|Encyclopedia:Bonus}ボーナス{/g}、すべての{g|Encyclopedia:Ability_Scores}能力値{/g}に+4のボーナスを得る。{g|Encyclopedia:Spell}呪文{/g}および能力の{g|Encyclopedia:Saving_Throw}セーヴ{/g}{g|Encyclopedia:DC}DC{/g}が2上昇する。この効果は他のアビスの放射効果と累積する。

### The horrid abyssal radiation makes this creature stronger. It gains a +4 {g|Encyclopedia:Bonus}bonus

キー：8990336c-a315-4433-9876-422c42b1ad5b

理由：呪文・能力のDCという適用先を前に置き、相手訳を参考に括弧による後付けを解消。 / 同じリンクを二重に作らず、原文と既存訳のタグ個数を維持。

変更前：おぞましいアビスの放射がこのクリーチャーを強化する。{g|Encyclopedia:Armor_Class}AC{/g}に+4の{g|Encyclopedia:Bonus}ボーナス{/g}、すべての{g|Encyclopedia:Ability_Scores}能力値{/g}に+8のボーナスを得る。{g|Encyclopedia:Saving_Throw}セーヴ{/g}{g|Encyclopedia:DC}DC{/g}が4上昇する（{g|Encyclopedia:Spell}呪文{/g}および能力）。この効果は他のアビスの放射効果と累積する。

変更後：おぞましいアビスの放射がこのクリーチャーを強化する。{g|Encyclopedia:Armor_Class}AC{/g}に+4の{g|Encyclopedia:Bonus}ボーナス{/g}、すべての{g|Encyclopedia:Ability_Scores}能力値{/g}に+8のボーナスを得る。{g|Encyclopedia:Spell}呪文{/g}および能力の{g|Encyclopedia:Saving_Throw}セーヴ{/g}{g|Encyclopedia:DC}DC{/g}が4上昇する。この効果は他のアビスの放射効果と累積する。

### The horrid abyssal radiation makes this creature stronger. It gains a +6 {g|Encyclopedia:Bonus}bonus

キー：6b9d125b-f6a9-414b-babc-d460cff7012e

理由：呪文・能力のDCという適用先を前に置き、相手訳を参考に括弧による後付けを解消。 / 同じリンクを二重に作らず、原文と既存訳のタグ個数を維持。

変更前：おぞましいアビスの放射がこのクリーチャーを強化する。{g|Encyclopedia:Armor_Class}AC{/g}に+6の{g|Encyclopedia:Bonus}ボーナス{/g}、すべての{g|Encyclopedia:Ability_Scores}能力値{/g}に+12のボーナスを得る。{g|Encyclopedia:Saving_Throw}セーヴ{/g}{g|Encyclopedia:DC}DC{/g}が6上昇する（{g|Encyclopedia:Spell}呪文{/g}および能力）。この効果は他のアビスの放射効果と累積する。

変更後：おぞましいアビスの放射がこのクリーチャーを強化する。{g|Encyclopedia:Armor_Class}AC{/g}に+6の{g|Encyclopedia:Bonus}ボーナス{/g}、すべての{g|Encyclopedia:Ability_Scores}能力値{/g}に+12のボーナスを得る。{g|Encyclopedia:Spell}呪文{/g}および能力の{g|Encyclopedia:Saving_Throw}セーヴ{/g}{g|Encyclopedia:DC}DC{/g}が6上昇する。この効果は他のアビスの放射効果と累積する。

### The effects of some of the bardic performances stack. This includes: Inspire Courage, Inspire Greatn

キー：3d653ccb-1309-434a-9171-c1fe714a2f67

理由：Bardic Performanceの登録訳を採用。ただし相手のInspire Greatness＝武勇鼓舞への変更はせず偉大鼓舞を保持。

変更前：一部の吟遊詩人の芸の効果は累積する。対象は次の通り：勇気鼓舞、偉大鼓舞、英雄鼓舞。

変更後：一部の呪芸の効果は累積する。対象は次の通り：勇気鼓舞、偉大鼓舞、英雄鼓舞。

根拠：dev/res/glossary.json:Bardic Performance / Inspire Greatness

### Bardic Performances With Stacking Effects

キー：2e213c6b-f9a7-4f68-97be-a8f47a647ed7

理由：名称を説明と同じ登録訳に統一。

変更前：効果が累積する吟遊詩人の芸

変更後：効果が累積する呪芸

根拠：dev/res/glossary.json:Bardic Performance

### Every time a divine caster in your party casts a divine {g|Encyclopedia:Spell}spell{/g} on a party m

キー：8656962c-b200-45d4-9af0-01f24d1ba0a3

理由：sacredはボーナス種別。両訳の聖なる・清浄ではなく、登録済みの神聖へ統一。

変更前：パーティー内の信仰呪文の使い手が仲間に信仰{g|Encyclopedia:Spell}呪文{/g}を発動するたびに、その仲間に追加の祝福を与える。祝福の性質は信仰する神格の{g|Encyclopedia:Alignment}属性{/g}による。
善の神格の信奉者は仲間の{g|Encyclopedia:Armor_Class}AC{/g}に聖なる{g|Encyclopedia:Bonus}ボーナス{/g}を与える。
中立の神格の信奉者は仲間の{g|Encyclopedia:Saving_Throw}セーヴ{/g}に幸運ボーナスを与える。
悪の神格の信奉者は仲間の{g|Encyclopedia:Attack}攻撃ロール{/g}に冒涜ボーナスを与える。

変更後：パーティー内の信仰呪文の使い手が仲間に信仰{g|Encyclopedia:Spell}呪文{/g}を発動するたびに、その仲間に追加の祝福を与える。祝福の性質は信仰する神格の{g|Encyclopedia:Alignment}属性{/g}による。
善の神格の信奉者は仲間の{g|Encyclopedia:Armor_Class}AC{/g}に神聖{g|Encyclopedia:Bonus}ボーナス{/g}を与える。
中立の神格の信奉者は仲間の{g|Encyclopedia:Saving_Throw}セーヴ{/g}に幸運ボーナスを与える。
悪の神格の信奉者は仲間の{g|Encyclopedia:Attack}攻撃ロール{/g}に冒涜ボーナスを与える。

根拠：dev/res/glossary.json:Sacred

### Every time you affect a party member with a divine {g|Encyclopedia:Spell}spell{/g}, you also give th

キー：03b17623-4cc2-40e3-bf39-554e06193eb1

理由：sacredはボーナス種別。両訳の聖なる・清浄ではなく、登録済みの神聖へ統一。

変更前：信仰{g|Encyclopedia:Spell}呪文{/g}でパーティーメンバーに効果を与えるたびに、その呪文レベルに等しい聖なる{g|Encyclopedia:Bonus}ボーナス{/g}を{g|Encyclopedia:Armor_Class}AC{/g}に2{g|Encyclopedia:Combat_Round}ラウンド{/g}の間与える。

変更後：信仰{g|Encyclopedia:Spell}呪文{/g}でパーティーメンバーに効果を与えるたびに、その呪文レベルに等しい神聖{g|Encyclopedia:Bonus}ボーナス{/g}を{g|Encyclopedia:Armor_Class}AC{/g}に2{g|Encyclopedia:Combat_Round}ラウンド{/g}の間与える。

根拠：dev/res/glossary.json:Sacred

### Tailwind of the Bearded

キー：89b580b3-da7f-4df9-9203-35d8ac5bef52

理由：相手の自然な修飾表現だけを採用。

変更前：髭の者の追い風

変更後：髭ある者の追い風

### Howling Tailwind

キー：2b094b6b-52aa-4993-a5fb-211a66ca1f07

理由：風が鳴る意味のhowlingとして自然な相手の表現へ。

変更前：咆哮の追い風

変更後：唸る追い風

### All elves in your party gain a {g|Encyclopedia:Bonus}bonus{/g} on {g|Encyclopedia:Initiative}initiat

キー：7db055bc-7f0f-40da-97d0-9bd503cb8870

理由：相手の表記がガイドのクラス名・レベルの区切りに沿うため採用。

変更前：パーティー内のすべてのエルフは、{g|Encyclopedia:Initiative}イニシアチブ{/g}{g|Encyclopedia:Dice}ロール{/g}に{g|Encyclopedia:Bonus}ボーナス{/g}を得る。その値は{g|Encyclopedia:Character_Level}キャラクターレベル{/g}に等しい。

変更後：パーティー内のすべてのエルフは、{g|Encyclopedia:Initiative}イニシアチブ{/g}{g|Encyclopedia:Dice}ロール{/g}に{g|Encyclopedia:Bonus}ボーナス{/g}を得る。その値は{g|Encyclopedia:Character_Level}キャラクター・レベル{/g}に等しい。

根拠：dev/res/translationGuide.md

### Tailwind of Elven Nimbleness

キー：e1dae608-c0e3-4802-a912-7de5f8eb87aa

理由：相手の自然な名詞化を採用。

変更前：エルフの俊敏の追い風

変更後：エルフの俊敏さの追い風

### You gain {g|Encyclopedia:Spell_Resistance}spell resistance{/g} because you were struck by an ally un

キー：37359114-142e-43f1-a334-d1d16cc7043a

理由：味方の術者・ウィザード系統を指すことを参照先で確認。両訳の独自訳ではなく登録されたクラス名に統一。

変更前：味方の万能術師の攻撃を受けたため、{g|Encyclopedia:Spell_Resistance}呪文抵抗{/g}を得る。

変更後：味方のユニヴァーサリストの攻撃を受けたため、{g|Encyclopedia:Spell_Resistance}呪文抵抗{/g}を得る。

根拠：dev/res/glossary.json:Universalist / blueprints/Buffs/DLC3/DLC3_BUFFS/DLC3_FriendlyAOEResistBuff/DLC3_FriendlyAoEResistanceUniversalistBuff.jbp

### Universalist — Spell Resistance

キー：b1a92560-b3ac-4d20-92da-811fdc3a5eab

理由：味方の術者・ウィザード系統を指すことを参照先で確認。両訳の独自訳ではなく登録されたクラス名に統一。

変更前：万能術師 — 呪文抵抗

変更後：ユニヴァーサリスト — 呪文抵抗

根拠：dev/res/glossary.json:Universalist / blueprints/Buffs/DLC3/DLC3_BUFFS/DLC3_FriendlyAOEResistBuff/DLC3_FriendlyAoEResistanceUniversalistBuff.jbp

### Your party starts with 5,000 gold. In addition, vendor prices are reduced by 10% for every gnome in 

キー：74fe6c16-2227-40e3-a0ee-5cdd7227026d

理由：相手の所持金という明示を部分採用。

変更前：パーティーは5,000ゴールドで開始する。さらに、パーティー内のノーム1人につき商人の価格が10%下がる。

変更後：パーティーは所持金5,000ゴールドで開始する。さらに、パーティー内のノーム1人につき商人の価格が10%下がる。

### Characters of certain archetypes with a special connection to nature gain the ability to {g|Encyclop

キー：d38a1014-95a4-492d-a95a-015d21021efe

理由：回復ダイスが全てキャラクター・レベルに比例する原文の条件を明示。両訳で省略された後半の比例条件を自然に補う。 / 相手のクラス名表記を既存プロジェクトの多数派表記へ合わせて部分採用。

変更前：自然と特別なつながりを持つ特定のアーキタイプのキャラクターは、味方を{g|Encyclopedia:Healing}回復{/g}する能力を得る。この追い風は次のクラスで機能する：プライマル・ドルイドのアーキタイプを持つドルイド、セイクリッド・ハントスマスターのアーキタイプを持つインクイジター、シルヴァン・トリックスターのアーキタイプを持つローグ、ハント・コーラーのアーキタイプを持つスカルド、シルヴァン・ソーサラーのアーキタイプを持つソーサラー、フェラル・チャンピオンのアーキタイプを持つウォープリースト。パーティーが敵を倒すたびに、パーティーメンバー全員が、上記リストのうちパーティーに揃っている異なるアーキタイプの数に応じた量だけ回復する：1つなら{g|Encyclopedia:Dice}1d4{/g}（{g|Encyclopedia:Character_Level}キャラクターレベル{/g}ごと）、2つなら1d6（キャラクターレベルごと）、3つなら1d8、4つなら1d10、5つなら1d12、6つすべてなら2d8。

変更後：自然と特別なつながりを持つ特定のアーキタイプのキャラクターは、味方を{g|Encyclopedia:Healing}回復{/g}する能力を得る。この追い風は次のクラスで機能する：プライマル・ドルイドのアーキタイプを持つドルイド、セイクリッド・ハントスマスターのアーキタイプを持つインクィジター、シルヴァン・トリックスターのアーキタイプを持つローグ、ハント・コーラーのアーキタイプを持つスカルド、シルヴァン・ソーサラーのアーキタイプを持つソーサラー、フェラル・チャンピオンのアーキタイプを持つウォープリースト。パーティーが敵を倒すたびに、パーティーメンバー全員が、上記リストのうちパーティーに揃っている異なるアーキタイプの数に応じた量だけ回復する（いずれも{g|Encyclopedia:Character_Level}キャラクター・レベル{/g}ごと）：1つなら{g|Encyclopedia:Dice}1d4{/g}、2つなら1d6、3つなら1d8、4つなら1d10、5つなら1d12、6つすべてなら2d8。

根拠：dev/res/translationGuide.md

### Tailwind of Good Hunting

キー：4306086b-01f5-444a-8911-78e1c05aac10

理由：goodの肯定的意味を残した相手訳を採用。

変更前：狩猟の追い風

変更後：良き狩りの追い風

### The blasts of all kineticists in your party rebound off enemies, hitting additional targets. For eve

キー：739c5d29-fa04-4ef6-85e2-80550a72a57d

理由：クラス特徴の総称としてのKinetic Blastを登録訳に統一。 / 同じ説明内の能力の呼び方を統一。 / 相手のレベル表記をガイドに合わせて採用。

変更前：パーティー内のすべてのキネティシストのブラストは敵に跳ね返り、追加の対象に命中する。キネティシストレベル2ごとに、各ブラストは対象を1体追加で攻撃する。

変更後：パーティー内のすべてのキネティシストの念動力爆発は敵に跳ね返り、追加の対象に命中する。キネティシスト・レベル2ごとに、各念動力爆発は対象を1体追加で攻撃する。

根拠：dev/res/glossary.json:Kinetic Blast / dev/res/glossary.json:Kinetic Blast / dev/res/translationGuide.md

### Every time any cleric, inquisitor, oracle, or warpriest in your party casts a divine {g|Encyclopedia

キー：133fc98a-07bb-47b0-87a6-af42f49b0054

理由：相手のクラス名表記を既存プロジェクトの多数派表記へ合わせて部分採用。

変更前：パーティー内のクレリック、インクイジター、オラクル、ウォープリーストが信仰{g|Encyclopedia:Spell}呪文{/g}を発動するたびに、{g|FeatureEmpoweredSpell}呪文威力強化{/g}{g|Encyclopedia:Feat}特技{/g}を使用したかのように威力が強化される。

変更後：パーティー内のクレリック、インクィジター、オラクル、ウォープリーストが信仰{g|Encyclopedia:Spell}呪文{/g}を発動するたびに、{g|FeatureEmpoweredSpell}呪文威力強化{/g}{g|Encyclopedia:Feat}特技{/g}を使用したかのように威力が強化される。

根拠：dev/res/translationGuide.md

### The character is affected by an effect akin to the {g|SpellsBullsStrength}bull's strength{/g} spell.

キー：5e9867c7-e462-4aed-bf90-b3b4e4ff946b

理由：相手のロールの明示を採用。筋力増加の適用先を正確に記述。

変更前：このキャラクターは{g|SpellsBullsStrength}ブルズ・ストレングス{/g}に似た効果を受ける。{g|Encyclopedia:Strength}筋力{/g}の{g|Encyclopedia:Ability_Scores}能力値{/g}に+4の探検{g|Encyclopedia:Bonus}ボーナス{/g}を得て、{g|Encyclopedia:MeleeAttack}近接攻撃{/g}と{g|Encyclopedia:Damage}ダメージロール{/g}、その他の筋力修正値を用いる場面に通常の恩恵が加わる。
この効果は港に戻るまで持続する。ほとんどのボーナスと異なり、探検ボーナスは複数が累積する。

変更後：このキャラクターは{g|SpellsBullsStrength}ブルズ・ストレングス{/g}に似た効果を受ける。{g|Encyclopedia:Strength}筋力{/g}の{g|Encyclopedia:Ability_Scores}能力値{/g}に+4の探検{g|Encyclopedia:Bonus}ボーナス{/g}を得て、{g|Encyclopedia:MeleeAttack}近接攻撃{/g}ロールと{g|Encyclopedia:Damage}ダメージロール{/g}、その他の筋力修正値を用いる場面に通常の恩恵が加わる。
この効果は港に戻るまで持続する。ほとんどのボーナスと異なり、探検ボーナスは複数が累積する。

### The character is affected by an effect akin to the {g|SpellsEaglesSplendor}eagle's splendor{/g} spel

キー：31e0d684-9254-4ae7-b336-1b9467786f5b

理由：bonus spellsという原文の分類を保持する相手の表現を採用。

変更前：このキャラクターは{g|SpellsEaglesSplendor}イーグルズ・スプレンダー{/g}に似た効果を受ける。{g|Encyclopedia:Charisma}魅力{/g}の{g|Encyclopedia:Ability_Scores}能力値{/g}に+4の探検{g|Encyclopedia:Bonus}ボーナス{/g}を得て、魅力に基づく{g|Encyclopedia:Skills}技能{/g}{g|Encyclopedia:Check}判定{/g}、その他の魅力修正値を用いる場面に通常の恩恵が加わる。この効果を受けたバード、パラディン、ソーサラー（およびその他の魅力に頼る術者）は、魅力の上昇による追加の呪文は得ないが、効果中に発動する呪文の{g|Encyclopedia:Saving_Throw}セーヴ{/g}{g|Encyclopedia:DC}DC{/g}は上昇する。
この効果は港に戻るまで持続する。ほとんどのボーナスと異なり、探検ボーナスは複数が累積する。

変更後：このキャラクターは{g|SpellsEaglesSplendor}イーグルズ・スプレンダー{/g}に似た効果を受ける。{g|Encyclopedia:Charisma}魅力{/g}の{g|Encyclopedia:Ability_Scores}能力値{/g}に+4の探検{g|Encyclopedia:Bonus}ボーナス{/g}を得て、魅力に基づく{g|Encyclopedia:Skills}技能{/g}{g|Encyclopedia:Check}判定{/g}、その他の魅力修正値を用いる場面に通常の恩恵が加わる。この効果を受けたバード、パラディン、ソーサラー（およびその他の魅力に頼る術者）は、魅力の上昇による追加のボーナス呪文は得ないが、効果中に発動する呪文の{g|Encyclopedia:Saving_Throw}セーヴ{/g}{g|Encyclopedia:DC}DC{/g}は上昇する。
この効果は港に戻るまで持続する。ほとんどのボーナスと異なり、探検ボーナスは複数が累積する。

### The character is affected by an effect akin to the {g|SpellsFoxsCunning}fox's cunning{/g} spell. The

キー：122de952-c639-41af-9103-85893b84657f

理由：原文bonus spellsの意味を明示する相手の表現を部分採用。

変更前：このキャラクターは{g|SpellsFoxsCunning}フォクセス・カニング{/g}に似た効果を受ける。{g|Encyclopedia:Intelligence}知力{/g}の{g|Encyclopedia:Ability_Scores}能力値{/g}に+4の探検{g|Encyclopedia:Bonus}ボーナス{/g}を得て、知力に基づく{g|Encyclopedia:Skills}技能{/g}{g|Encyclopedia:Check}判定{/g}、その他の知力修正値を用いる場面に通常の恩恵が加わる。この効果を受けたウィザードやその他の知力に頼る術者は、知力の上昇による追加の呪文は得ないが、効果中に発動する呪文の{g|Encyclopedia:Saving_Throw}セーヴ{/g}{g|Encyclopedia:DC}DC{/g}は上昇する。技能ランクは追加されない。
この効果は港に戻るまで持続する。ほとんどのボーナスと異なり、探検ボーナスは複数が累積する。

変更後：このキャラクターは{g|SpellsFoxsCunning}フォクセス・カニング{/g}に似た効果を受ける。{g|Encyclopedia:Intelligence}知力{/g}の{g|Encyclopedia:Ability_Scores}能力値{/g}に+4の探検{g|Encyclopedia:Bonus}ボーナス{/g}を得て、知力に基づく{g|Encyclopedia:Skills}技能{/g}{g|Encyclopedia:Check}判定{/g}、その他の知力修正値を用いる場面に通常の恩恵が加わる。この効果を受けたウィザードやその他の知力に頼る術者は、知力の上昇による追加のボーナス呪文は得ないが、効果中に発動する呪文の{g|Encyclopedia:Saving_Throw}セーヴ{/g}{g|Encyclopedia:DC}DC{/g}は上昇する。技能ランクは追加されない。
この効果は港に戻るまで持続する。ほとんどのボーナスと異なり、探検ボーナスは複数が累積する。

### The character is affected by an effect akin to the {g|SpellsMageArmor}mage armor{/g} spell. They gai

キー：da22f77d-4d60-4592-a23a-b8efc3f9be5e

理由：相手の呪文名が用語集の登録表記と一致するため採用。

変更前：このキャラクターは{g|SpellsMageArmor}メイジアーマー{/g}に似た効果を受ける。{g|Encyclopedia:Armor_Class}AC{/g}に+4の探検{g|Encyclopedia:Bonus}ボーナス{/g}を得る。
この効果は港に戻るまで持続する。ほとんどのボーナスと異なり、探検ボーナスは複数が累積する。

変更後：このキャラクターは{g|SpellsMageArmor}メイジ・アーマー{/g}に似た効果を受ける。{g|Encyclopedia:Armor_Class}AC{/g}に+4の探検{g|Encyclopedia:Bonus}ボーナス{/g}を得る。
この効果は港に戻るまで持続する。ほとんどのボーナスと異なり、探検ボーナスは複数が累積する。

根拠：dev/res/glossary.json:Mage Armor

### The character is affected by an effect akin to the {g|SpellsOwlsWisdom}owl's wisdom{/g} spell. They 

キー：3f25f386-16f3-4e0d-8d98-aa078c21abbc

理由：原文bonus spellsの意味を明示する相手の表現を部分採用。

変更前：このキャラクターは{g|SpellsOwlsWisdom}アウルズ・ウィズダム{/g}に似た効果を受ける。{g|Encyclopedia:Wisdom}判断力{/g}の{g|Encyclopedia:Ability_Scores}能力値{/g}に+4の探検{g|Encyclopedia:Bonus}ボーナス{/g}を得て、判断力に関わる{g|Encyclopedia:Skills}技能{/g}に通常の恩恵が加わる。この効果を受けたクレリック、ドルイド、レンジャー、その他の判断力に頼る術者は、判断力の上昇による追加の呪文は得ないが、呪文の{g|Encyclopedia:Saving_Throw}セーヴ{/g}{g|Encyclopedia:DC}DC{/g}は上昇する。
この効果は港に戻るまで持続する。ほとんどのボーナスと異なり、探検ボーナスは複数が累積する。

変更後：このキャラクターは{g|SpellsOwlsWisdom}アウルズ・ウィズダム{/g}に似た効果を受ける。{g|Encyclopedia:Wisdom}判断力{/g}の{g|Encyclopedia:Ability_Scores}能力値{/g}に+4の探検{g|Encyclopedia:Bonus}ボーナス{/g}を得て、判断力に関わる{g|Encyclopedia:Skills}技能{/g}に通常の恩恵が加わる。この効果を受けたクレリック、ドルイド、レンジャー、その他の判断力に頼る術者は、判断力の上昇による追加のボーナス呪文は得ないが、呪文の{g|Encyclopedia:Saving_Throw}セーヴ{/g}{g|Encyclopedia:DC}DC{/g}は上昇する。
この効果は港に戻るまで持続する。ほとんどのボーナスと異なり、探検ボーナスは複数が累積する。

### The character is affected by an effect akin to the {g|SpellsSenseVitals}sense vitals{/g} spell. They

キー：30e668cc-b3d8-4de3-ae12-94c765692717

理由：相手の自然な発生源の表現を採用。

変更前：このキャラクターは{g|SpellsSenseVitals}センス・ヴァイタルズ{/g}に似た効果を受ける。ローグの同名の能力と同様に急所攻撃を行えるようになり、追加で{g|Encyclopedia:Dice}1d6{/g}ポイントの{g|Encyclopedia:Damage}ダメージ{/g}を与える。この追加ダメージは3レベルを超える{g|Encyclopedia:Character_Level}キャラクターレベル{/g}3ごとに1d6増加し、15レベルで最大+5d6となる。この追加ダメージは他の精密ダメージの源と累積する。
この効果は港に戻るまで持続する。

変更後：このキャラクターは{g|SpellsSenseVitals}センス・ヴァイタルズ{/g}に似た効果を受ける。ローグの同名の能力と同様に急所攻撃を行えるようになり、追加で{g|Encyclopedia:Dice}1d6{/g}ポイントの{g|Encyclopedia:Damage}ダメージ{/g}を与える。この追加ダメージは3レベルを超える{g|Encyclopedia:Character_Level}キャラクターレベル{/g}3ごとに1d6増加し、15レベルで最大+5d6となる。この追加ダメージは他の発生源による精密ダメージと累積する。
この効果は港に戻るまで持続する。

### Bounty of the Mustang

キー：0a0e0e68-68da-4ee4-ae93-85f7c5dccc09

理由：野生馬の一般名称として自然な相手の音写を採用。

変更前：ムスタングの恵み

変更後：マスタングの恵み

### The affected creature becomes more poised, articulate, personally forceful and wise. The effect gran

キー：6d51ed43-be1c-468e-83d4-890692d01d0d

理由：stackは加算されることが重要なので、関連説明と同じ累積を使う。

変更前：対象のクリーチャーは落ち着きと弁舌、人を引きつける力、そして賢明さが増す。この効果により、対象は{g|Encyclopedia:Charisma}魅力{/g}と{g|Encyclopedia:Wisdom}判断力{/g}に+4の遠征{g|Encyclopedia:Bonus}ボーナス{/g}を得る。
この効果は港に戻るまで持続する。ほとんどのボーナスと異なり、遠征ボーナスは複数が重複する。

変更後：対象のクリーチャーは落ち着きと弁舌、人を引きつける力、そして賢明さが増す。この効果により、対象は{g|Encyclopedia:Charisma}魅力{/g}と{g|Encyclopedia:Wisdom}判断力{/g}に+4の探検{g|Encyclopedia:Bonus}ボーナス{/g}を得る。
この効果は港に戻るまで持続する。ほとんどのボーナスと異なり、探検ボーナスは複数が累積する。

### The affected creature becomes more poised, articulate, personally forceful and smart. The effect gra

キー：3a192e31-ec63-4f2d-9ee1-e19961d309aa

理由：相手の自然な述語の対応を参考に、落ち着きが速くなるという不自然な係り受けを修正。

変更前：対象のクリーチャーは落ち着きと弁舌、人を引きつける力、そして頭の回転が速くなる。この効果により、対象は{g|Encyclopedia:Charisma}魅力{/g}と{g|Encyclopedia:Intelligence}知力{/g}に+4の探検{g|Encyclopedia:Bonus}ボーナス{/g}を得る。
この効果は港に戻るまで持続する。ほとんどのボーナスと異なり、探検ボーナスは複数が累積する。

変更後：対象のクリーチャーは落ち着きと弁舌、人を引きつける力が増し、頭の回転も速くなる。この効果により、対象は{g|Encyclopedia:Charisma}魅力{/g}と{g|Encyclopedia:Intelligence}知力{/g}に+4の探検{g|Encyclopedia:Bonus}ボーナス{/g}を得る。
この効果は港に戻るまで持続する。ほとんどのボーナスと異なり、探検ボーナスは複数が累積する。

### The character is affected by an effect akin to the protection from sound {g|Encyclopedia:Spell}spell

キー：d3c5bfa8-09a3-4fd7-928b-35e72957122f

理由：相手の累積を採用し、術者レベル増加が加算されることを明示。

変更前：このキャラクターはプロテクション・フロム・サウンド{g|Encyclopedia:Spell}呪文{/g}に似た効果を受ける。音波に対する一時的な{g|Encyclopedia:Energy_Immunity}完全耐性{/g}を得る。この効果が{g|Encyclopedia:Character_Level}キャラクターレベル{/g}ごとに12ポイントの{g|Encyclopedia:Energy_Damage}音波ダメージ{/g}（最大で10レベル時の120ポイント）を吸収すると、効果は解除される。さらにこの効果が持続する間、キャラクターの{g|Encyclopedia:Caster_Level}術者レベル{/g}が1上昇する（術者レベルを上昇させる他の効果と重複する）。
この効果は港に戻るまで持続する。

変更後：このキャラクターはプロテクション・フロム・サウンド{g|Encyclopedia:Spell}呪文{/g}に似た効果を受ける。音波に対する一時的な{g|Encyclopedia:Energy_Immunity}完全耐性{/g}を得る。この効果が{g|Encyclopedia:Character_Level}キャラクターレベル{/g}ごとに12ポイントの{g|Encyclopedia:Energy_Damage}音波ダメージ{/g}（最大で10レベル時の120ポイント）を吸収すると、効果は解除される。さらにこの効果が持続する間、キャラクターの{g|Encyclopedia:Caster_Level}術者レベル{/g}が1上昇する（術者レベルを上昇させる他の効果と累積する）。
この効果は港に戻るまで持続する。

### The character is affected by an effect akin to the {g|SpellsDivinePower}divine power{/g} spell. They

キー：8969a45a-f008-4af5-923d-2a0435028de8

理由：通常と異なり一時的HPが加算される効果を、相手の明確な表現で記述。

変更前：このキャラクターは{g|SpellsDivinePower}ディヴァイン・パワー{/g}に似た効果を受ける。{g|Encyclopedia:Attack}攻撃ロール{/g}、武器の{g|Encyclopedia:Damage}ダメージロール{/g}、{g|Encyclopedia:Strength}筋力{/g}{g|Encyclopedia:Check}判定{/g}、筋力に基づく{g|Encyclopedia:Skills}技能{/g}判定に、{g|Encyclopedia:Character_Level}キャラクターレベル{/g}3ごとに+1の探検{g|Encyclopedia:Bonus}ボーナス{/g}を得る（最大+6）。さらにキャラクターレベルごとに1ポイントの{g|Encyclopedia:Temporary_HP}一時的HP{/g}を得る（他の源から得たものと重複する）。全力攻撃を行うとき、最大の{g|Encyclopedia:BAB}基本攻撃ボーナス{/g}と適用可能な修正値で追加の攻撃を1回行える。この追加攻撃は{g|SpellsHaste}ヘイスト{/g}やスピード特性を持つ武器など、類似の効果と累積する。
この効果は港に戻るまで持続する。ほとんどのボーナスと異なり、探検ボーナスは複数が累積する。

変更後：このキャラクターは{g|SpellsDivinePower}ディヴァイン・パワー{/g}に似た効果を受ける。{g|Encyclopedia:Attack}攻撃ロール{/g}、武器の{g|Encyclopedia:Damage}ダメージロール{/g}、{g|Encyclopedia:Strength}筋力{/g}{g|Encyclopedia:Check}判定{/g}、筋力に基づく{g|Encyclopedia:Skills}技能{/g}判定に、{g|Encyclopedia:Character_Level}キャラクターレベル{/g}3ごとに+1の探検{g|Encyclopedia:Bonus}ボーナス{/g}を得る（最大+6）。さらにキャラクターレベルごとに1ポイントの{g|Encyclopedia:Temporary_HP}一時的HP{/g}を得る（他の発生源から得たものと累積する）。全力攻撃を行うとき、最大の{g|Encyclopedia:BAB}基本攻撃ボーナス{/g}と適用可能な修正値で追加の攻撃を1回行える。この追加攻撃は{g|SpellsHaste}ヘイスト{/g}やスピード特性を持つ武器など、類似の効果と累積する。
この効果は港に戻るまで持続する。ほとんどのボーナスと異なり、探検ボーナスは複数が累積する。

### All party members gain Shield Bash as a bonus {g|Encyclopedia:Feat}feat{/g} at 1st level, even if th

キー：83dfa8e1-bceb-44f4-ab21-fb67d4d06e8b

理由：説明内の特技表記を同じ登録訳に統一。

変更前：パーティー全員が1レベルでシールドバッシュをボーナス{g|Encyclopedia:Feat}特技{/g}として得る。前提条件を満たしていなくてもよい。盾を使用しているキャラクターは、{g|Encyclopedia:Armor_Class}AC{/g}に+1の{g|Encyclopedia:Bonus}ボーナス{/g}を得る。シールドバッシュを行う間、キャラクターは{g|Encyclopedia:Attack}攻撃ロール{/g}に+6のボーナスを得る。命中した場合、攻撃はキャラクターのレベルに等しいボーナス{g|Encyclopedia:Damage}ダメージ{/g}を与える。

変更後：パーティー全員が1レベルでシールド・バッシュをボーナス{g|Encyclopedia:Feat}特技{/g}として得る。前提条件を満たしていなくてもよい。盾を使用しているキャラクターは、{g|Encyclopedia:Armor_Class}AC{/g}に+1の{g|Encyclopedia:Bonus}ボーナス{/g}を得る。シールド・バッシュを行う間、キャラクターは{g|Encyclopedia:Attack}攻撃ロール{/g}に+6のボーナスを得る。命中した場合、攻撃はキャラクターのレベルに等しいボーナス{g|Encyclopedia:Damage}ダメージ{/g}を与える。

根拠：dev/res/glossary.json:Shield Bash

### Every time one of your party members casts a {g|Encyclopedia:Spell}spell{/g}, they gain a {g|Encyclo

キー：6fdaeac1-907c-466b-9fbe-904d9c4b3c09

理由：相手のロールの明示を部分採用し、攻撃とダメージの各ロールにかかるボーナスと明確にする。

変更前：パーティーの仲間が{g|Encyclopedia:Spell}呪文{/g}を発動するたびに、次の武器攻撃の{g|Encyclopedia:Attack}攻撃{/g}と{g|Encyclopedia:Damage}ダメージロール{/g}に、その呪文のレベルに等しい{g|Encyclopedia:Bonus}ボーナス{/g}を得る。この効果は複数回の適用が累積するが、持続時間は1分を超えない。

変更後：パーティーの仲間が{g|Encyclopedia:Spell}呪文{/g}を発動するたびに、次の武器攻撃の{g|Encyclopedia:Attack}攻撃{/g}ロールと{g|Encyclopedia:Damage}ダメージロール{/g}に、その呪文のレベルに等しい{g|Encyclopedia:Bonus}ボーナス{/g}を得る。この効果は複数回の適用が累積するが、持続時間は1分を超えない。

### This creature gains a +1 insight {g|Encyclopedia:Bonus}bonus{/g} on {g|Encyclopedia:Attack}attack{/g

キー：d57ebaca-8180-47b2-b102-417e04ceb022

理由：相手のロールの明示を部分採用し、攻撃とダメージの各ロールにかかるボーナスと明確にする。

変更前：このクリーチャーは、あなたが倒したベスマラーの海賊仲間5人ごとに（この島でも他の島でも）、{g|Encyclopedia:Attack}攻撃{/g}と{g|Encyclopedia:Damage}ダメージロール{/g}に+1の洞察{g|Encyclopedia:Bonus}ボーナス{/g}を得る。このボーナスは最大+25まで累積する。

変更後：このクリーチャーは、あなたが倒したベスマラーの海賊仲間5人ごとに（この島でも他の島でも）、{g|Encyclopedia:Attack}攻撃{/g}ロールと{g|Encyclopedia:Damage}ダメージロール{/g}に+1の洞察{g|Encyclopedia:Bonus}ボーナス{/g}を得る。このボーナスは最大+25まで累積する。

### All Besmaran pirates gain a +1 insight {g|Encyclopedia:Bonus}bonus{/g} on {g|Encyclopedia:Attack}att

キー：a355f640-b3df-4b86-9708-16f06eb69378

理由：相手のロールの明示を部分採用し、攻撃とダメージの各ロールにかかるボーナスと明確にする。

変更前：ベスマラーの海賊はすべて、あなたが倒した海賊仲間5人ごとに（この島でも他の島でも）、{g|Encyclopedia:Attack}攻撃{/g}と{g|Encyclopedia:Damage}ダメージロール{/g}に+1の洞察{g|Encyclopedia:Bonus}ボーナス{/g}を得る。このボーナスは最大+10まで累積する。

変更後：ベスマラーの海賊はすべて、あなたが倒した海賊仲間5人ごとに（この島でも他の島でも）、{g|Encyclopedia:Attack}攻撃{/g}ロールと{g|Encyclopedia:Damage}ダメージロール{/g}に+1の洞察{g|Encyclopedia:Bonus}ボーナス{/g}を得る。このボーナスは最大+10まで累積する。

### All Besmaran pirates gain a +1 insight {g|Encyclopedia:Bonus}bonus{/g} on {g|Encyclopedia:Attack}att

キー：d1561935-7917-4bfc-810d-da3e93c0fe88

理由：相手はyouを海賊自身に取り違える。プレイヤーが倒した仲間数を数える現行の主体を保持。

変更前：ベスマラーの海賊はすべて、あなたが倒した仲間5人ごとに（この島でも他の島でも）、{g|Encyclopedia:Attack}攻撃{/g}と{g|Encyclopedia:Damage}ダメージロール{/g}に+1の洞察{g|Encyclopedia:Bonus}ボーナス{/g}を得る。このボーナスは最大+25まで累積する。

変更後：ベスマラーの海賊はすべて、あなたが倒した仲間5人ごとに（この島でも他の島でも）、{g|Encyclopedia:Attack}攻撃{/g}ロールと{g|Encyclopedia:Damage}ダメージロール{/g}に+1の洞察{g|Encyclopedia:Bonus}ボーナス{/g}を得る。このボーナスは最大+25まで累積する。

### This island is affected by a magical undertow flowing beneath it. All creatures on this island go in

キー：a2e8226d-d4b7-4583-8763-826703be663e

理由：相手のロールの明示を部分採用し、攻撃とダメージの各ロールにかかるボーナスと明確にする。

変更前：この島の下には魔法の潮流が流れている。島にいるすべてのクリーチャーは、バーバリアンの激怒に似た激怒状態になる。{g|Encyclopedia:Ability_Scores}能力値{/g}のうち{g|Encyclopedia:Strength}筋力{/g}と{g|Encyclopedia:Constitution}耐久力{/g}に+2の士気{g|Encyclopedia:Bonus}ボーナス{/g}を、{g|Encyclopedia:Saving_Throw}意志セーヴ{/g}に+1の士気ボーナスを得るが、{g|Encyclopedia:Armor_Class}AC{/g}に-2の{g|Encyclopedia:Penalty}ペナルティ{/g}を受ける。隠れるために{g|Encyclopedia:Stealth}隠密{/g}{g|Encyclopedia:Skills}技能{/g}を使えないが、{g|Encyclopedia:Spell}呪文{/g}は通常どおり発動できる。加えて、この島のクリーチャーが敵を倒すたびに、{g|Encyclopedia:Attack}攻撃{/g}と{g|Encyclopedia:Damage}ダメージロール{/g}に+2のボーナスを得て、{g|SpellsEnlargePerson}エンラージ・パーソン{/g}の呪文と同様に3{g|Encyclopedia:Combat_Round}ラウンド{/g}の間巨大化する。

変更後：この島の下には魔法の潮流が流れている。島にいるすべてのクリーチャーは、バーバリアンの激怒に似た激怒状態になる。{g|Encyclopedia:Ability_Scores}能力値{/g}のうち{g|Encyclopedia:Strength}筋力{/g}と{g|Encyclopedia:Constitution}耐久力{/g}に+2の士気{g|Encyclopedia:Bonus}ボーナス{/g}を、{g|Encyclopedia:Saving_Throw}意志セーヴ{/g}に+1の士気ボーナスを得るが、{g|Encyclopedia:Armor_Class}AC{/g}に-2の{g|Encyclopedia:Penalty}ペナルティ{/g}を受ける。隠れるために{g|Encyclopedia:Stealth}隠密{/g}{g|Encyclopedia:Skills}技能{/g}を使えないが、{g|Encyclopedia:Spell}呪文{/g}は通常どおり発動できる。加えて、この島のクリーチャーが敵を倒すたびに、{g|Encyclopedia:Attack}攻撃{/g}ロールと{g|Encyclopedia:Damage}ダメージロール{/g}に+2のボーナスを得て、{g|SpellsEnlargePerson}エンラージ・パーソン{/g}の呪文と同様に3{g|Encyclopedia:Combat_Round}ラウンド{/g}の間巨大化する。

### You gain a +1 {g|Encyclopedia:Bonus}bonus{/g} on {g|Encyclopedia:Attack}attack{/g} and {g|Encycloped

キー：dd4abe81-aee6-4c9c-a5ab-417407a90faa

理由：相手のロールの明示を部分採用し、攻撃とダメージの各ロールにかかるボーナスと明確にする。

変更前：{g|Encyclopedia:Attack}攻撃{/g}と{g|Encyclopedia:Damage}ダメージロール{/g}に+1の{g|Encyclopedia:Bonus}ボーナス{/g}を得る。

変更後：{g|Encyclopedia:Attack}攻撃{/g}ロールと{g|Encyclopedia:Damage}ダメージロール{/g}に+1の{g|Encyclopedia:Bonus}ボーナス{/g}を得る。

### Venerable Age

キー：c092b2d5-39c0-4873-9d9a-eba49c7d4ea3

理由：PRD日本語版の年齢区分は中年・老年・古希。相手の老衰は年齢区分ではないため、定訳に基づき古希へ修正。

変更前：大老

変更後：古希

根拠：https://w.atwiki.jp/prdj/pages/1667.html

### When this counter reaches 6, you become middle-aged. When it reaches 11, you become old. When it rea

キー：d91b8558-372d-4bb6-bbe4-4781718b3721

理由：相手の古希がPRD日本語版の年齢区分と一致することを確認して採用。

変更前：このカウンターが6に達すると中年になる。11に達すると老齢になる。16に達すると大老になる。20に達すると、{g|ConditionStaggered}よろめき状態{/g}が永続する。これらの効果は島を離れると解除される。

変更後：このカウンターが6に達すると中年になる。11に達すると老年になる。16に達すると古希になる。20に達すると、{g|ConditionStaggered}よろめき状態{/g}が永続する。これらの効果は島を離れると解除される。

根拠：https://w.atwiki.jp/prdj/pages/1667.html

### The {g|Encyclopedia:DC}DC{/g} of all Illusion school {g|Encyclopedia:Spell}spells{/g} cast on this i

キー：8b0755fd-d946-4446-a5e7-cc1d6fbed147

理由：相手の自然な主述関係を参考に、呪文のDCが上昇することを先に対象を示して記述。

変更前：{g|Encyclopedia:DC}DC{/g}はこの島で発動されるすべての幻術系統の{g|Encyclopedia:Spell}呪文{/g}で1上昇する。

変更後：この島で発動されるすべての幻術系統の{g|Encyclopedia:Spell}呪文{/g}の{g|Encyclopedia:DC}DC{/g}が1上昇する。

### Venerable

キー：233e0f64-25cf-442e-b7a0-478adf42e58b

理由：年齢区分Venerableの用途を原文から確認。先に修正したVenerable Ageと、PRD日本語版の年齢表・更新した用語集に合わせる。相手の老齢はOldとの区別が曖昧になるためそのまま採用しない。

変更前：極老

変更後：古希

根拠：https://w.atwiki.jp/prdj/pages/1667.html / dev/res/glossary.json:Venerable

## 保存先と再開方法

- dev/lang/comparison-siratori-20261019/manifest.json：入力ファイルのSHA-256と比較順
- decisions.json：個別判定・根拠・採用訳・反映履歴
- review-ledger.csv：原文・両訳・最終訳の一覧
- base.json：今回開始時の日本語JSON。前回取り込んだ19件を含む
- before-*.json：各反映直前のバックアップ
- pending-categories.json：未レビューの機械分類（評価ではない）

リポジトリルートで実行：

```powershell
node --max-old-space-size=8192 dev/helper/compareTranslations.mjs status
node --max-old-space-size=8192 dev/helper/compareTranslations.mjs export 25 0 dev/lang/comparison-siratori-20261019/next.json
# next.jsonを原文・文脈・用語集と照合して判断し、判定JSONを作成
node dev/helper/compareTranslations.mjs record <判定JSON>
node dev/helper/compareTranslations.mjs apply
node dev/helper/compareTranslations.mjs report
```

record形式：key, decision, reason, translation（変更時）, evidence（調査時）。許容判定はkeep/adopt-part/rewrite/researched-keep/researched-rewrite/hold-mechanics。反映前に現行値とスナップショットの一致、タグ・数値の保持をチェックし、競合時は中止する。

## 検証

既存verify.jsの変更前後レポートは完全一致。変更後の既存エラー25件、警告3件。制御タグ不整合0件、キー欠落0件。今回の反映直後に照合済み。
