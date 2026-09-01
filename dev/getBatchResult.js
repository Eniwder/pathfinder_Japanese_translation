import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';

const anthropic = new Anthropic();

async function getResults(batchId) {
  // ① ステータスの確認
  const batch = await anthropic.messages.batches.retrieve(batchId);
  console.log(`現在のステータス: ${batch.processing_status}`);

  if (batch.processing_status === 'ended') {
    // ② 結果のストリーム取得
    const results = await anthropic.messages.batches.results(batchId);

    const output = [];
    for await (const result of results) {
      if (result.result.type === 'succeeded') {
        output.push({
          custom_id: result.custom_id, // リクエスト時の textKey (例: 632d08ce-...)
          translatedText: result.result.message.content[0].text
        });
      }
    }

    fs.writeFileSync('./translated_results.json', JSON.stringify(output, null, 2));
    console.log('翻訳結果を保存しました！');
  }
}
getResults(''); // ここに実際のバッチIDを指定
