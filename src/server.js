const express = require('express');
const nodeFetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3001;

// CORSを許可
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, x-keepa-api-key');
  next();
});

app.use(express.json());

app.get('/api/scrape', async (req, res) => {
  const asin = req.query.asin;
  const apiKey = req.headers['x-keepa-api-key'];
  if (!asin) {
    return res.status(400).json({ error: 'ASIN is required' });
  }
  if (!apiKey) {
    return res.status(400).json({ error: 'Keepa APIキーが必要です' });
  }
  try {
    const url = `https://api.keepa.com/product?key=${apiKey}&domain=5&asin=${asin}&offers=20&stock=1&rating=1`;
    const response = await nodeFetch(url, {
      method: 'GET',
      headers: {
        'Connection': 'keep-alive',
        'Accept-Encoding': 'gzip'
      }
    });
    const data = await response.json();
    const product = data.products && data.products[0];
    if (!product) {
      return res.status(404).json({ error: '商品情報が取得できませんでした' });
    }
    const title = product.title;
    const image = product.imagesCSV
      ? `https://images-na.ssl-images-amazon.com/images/I/${product.imagesCSV.split(',')[0]}`
      : null;
    const newPrice = product.csv && product.csv[1] ? product.csv[1][product.csv[1].length - 1] : null;
    const usedPrice = product.csv && product.csv[2] ? product.csv[2][product.csv[2].length - 1] : null;
    res.json({ asin, title, image, newPrice, usedPrice });
  } catch (e) {
    res.status(500).json({ error: e.message || 'Unknown error' });
  }
});

// 基本的なヘルスチェックエンドポイント
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// モックデータのエンドポイント（テスト用）
app.get('/api/keepa-data-mock/:asin', (req, res) => {
  const { asin } = req.params;
  
  const mockData = {
    success: true,
    data: {
      products: [{
        asin: asin,
        title: '東芝 掃除機 サイクロン キャニスター型 クリーナー コード式 軽量 コンパクト',
        imagesCSV: '61OTv5GJXJS._AC_SL1500_,71R+vQKfGnL._AC_SL1500_,61H8rJ8zJqL._AC_SL1500_',
        categoryTree: [{ name: 'ホーム&キッチン' }],
        manufacturer: '東芝(TOSHIBA)',
        model: 'VC-C7',
        eanList: ['4904550935651'],
        salesRanks: [1280],
        csv: [
          [1735344000000, 2001900], // AMAZON price
          [1735344000000, 1972000], // NEW price  
          [1735344000000, 1500000], // USED price
          [1735344000000, 1450000], // USED_GOOD
          [1735344000000, 1500000], // USED_VERY_GOOD
          [1735344000000, 1400000], // USED_ACCEPTABLE
          [1735344000000, 2001900], // NEW_FBM
          null, null,
          [1735344000000, 1450000], // USED_GOOD_FBM
          [1735344000000, 1500000], // USED_VERY_GOOD_FBM
          [1735344000000, 1400000]  // USED_ACCEPTABLE_FBM
        ]
      }]
    }
  };
  
  res.json(mockData);
});

// Keepaデータ取得用エンドポイント
app.get('/api/keepa-data/:asin', async (req, res) => {
  const { asin } = req.params;
  const apiKey = req.query.key;
  
  if (!asin) {
    return res.status(400).json({ error: 'ASIN is required' });
  }

  if (!apiKey) {
    return res.status(400).json({ 
      success: false, 
      error: 'Keepa APIキーが必要です。クエリパラメータとして送信してください。' 
    });
  }

  try {
    console.log('Received API key:', apiKey?.substring(0, 10) + '...');
    console.log('ASIN:', asin);
    
    const url = `https://api.keepa.com/product?key=${apiKey}&domain=5&asin=${asin}&offers=20&stock=1&rating=1&history=1`;
    console.log('Fetching from Keepa:', url);
    
    const response = await nodeFetch(url, {
      method: 'GET',
      headers: {
        'Connection': 'keep-alive',
        'Accept-Encoding': 'gzip',
        'User-Agent': 'keepa-api-client'
      }
    });

    const data = await response.json();
    console.log('Keepa response:', JSON.stringify(data, null, 2));

    if (!data.products || data.products.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: '商品情報が取得できませんでした',
        response: data 
      });
    }

    res.json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('Keepa API Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Keepa API request failed',
      details: error
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
}); 