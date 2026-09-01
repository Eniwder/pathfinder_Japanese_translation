import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';

const anthropic = new Anthropic();

async function runBatch() {
  const filePath = './splitLang/batch_0.jsonl';

  if (!fs.existsSync(filePath)) {
    console.error(`ファイルが見つかりません: ${filePath}`);
    return;
  }

  // JSONLを読み込んで1行ずつパース
  const lines = fs.readFileSync(filePath, 'utf8')
    .trim()
    .split('\n')
    .filter(line => line.trim().length > 0);

  const requests = lines.map((line, idx) => {
    const data = JSON.parse(line);

    // 構造の明確化: custom_id と params が確実に存在するように設定
    return {
      custom_id: data.custom_id || `req_${idx}`,
      params: data.params || data // data自体にparamsが含まれていればそのまま使う
    };
  });

  console.log(`送信リクエスト件数: ${requests.length}`);

  try {
    const batch = await anthropic.messages.batches.create({
      requests: requests
    });

    console.log(`✓ バッチを作成しました！`);
    console.log(`Batch ID: ${batch.id}`);
    console.log(`Status: ${batch.processing_status}`);
  } catch (error) {
    console.error('Batch作成エラー:', error);
  }
}

runBatch();
