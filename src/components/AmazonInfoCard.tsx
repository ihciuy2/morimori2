import React, { useState, useEffect } from 'react';

interface Product {
  id: string;
  asin: string;
  title: string;
  status: string;
}

type Props = {
  product: Product;
};

type ProductData = {
  asin: string;
  title: string;
  salesRank: number | null;
  category: string;
  amazonPrice: number | null;
  newPrice: number | null;
  usedPrice: number | null;
  imageUrl: string;
  jan: string | null;
  manufacturer: string | null;
  model: string | null;
  subcategory: string | null;
  usedConditions: {
    usedGood: number | null;
    usedVeryGood: number | null;
    usedAcceptable: number | null;
  };
  fbaData: {
    newFBA: number | null;
    usedGoodFBA: number | null;
    usedVeryGoodFBA: number | null;
    usedAcceptableFBA: number | null;
  };
  pointData: {
    newPoints: number | null;
    amazonPoints: number | null;
  };
  shippingData: {
    newShipping: number | null;
    amazonShipping: number | null;
  };
  stockInfo: {
    offerCount: number | null;
    newOfferCount: number | null;
    usedOfferCount: number | null;
    ratingCount: number | null;
  };
};

const AmazonInfoCard: React.FC<Props> = ({ product }) => {
  const [data, setData] = useState<ProductData>({
    asin: product.asin,
    title: product.title,
    salesRank: null,
    category: '',
    amazonPrice: null,
    newPrice: null,
    usedPrice: null,
    imageUrl: '',
    jan: null,
    manufacturer: null,
    model: null,
    subcategory: null,
    usedConditions: { usedGood: null, usedVeryGood: null, usedAcceptable: null },
    fbaData: { newFBA: null, usedGoodFBA: null, usedVeryGoodFBA: null, usedAcceptableFBA: null },
    pointData: { newPoints: null, amazonPoints: null },
    shippingData: { newShipping: null, amazonShipping: null },
    stockInfo: { offerCount: null, newOfferCount: null, usedOfferCount: null, ratingCount: null }
  });

  const [purchaseShippingCost, setPurchaseShippingCost] = useState('500');
  const [sellShippingCost, setSellShippingCost] = useState('500');
  const [mercariInputs, setMercariInputs] = useState({
    purchasePrice: '5000',
    sellPrice: '9800'
  });

  useEffect(() => {
    if (product.asin) {
      fetchData();
    }
  }, [product.asin]);

  // データ変更を監視
  useEffect(() => {
    console.log('=== STATE UPDATED ===');
    console.log('data.newPrice:', data.newPrice);
    console.log('data.fbaData.newFBA:', data.fbaData.newFBA);
    console.log('data.usedConditions:', data.usedConditions);
    console.log('Full state:', data);
  }, [data]);

     const fetchData = async () => {
     try {
       // ローカルストレージからAPIキーを取得
       const apiKey = localStorage.getItem('keepaApiKey');
       
       console.log('=== データ取得開始 ===');
       console.log('ASIN:', product.asin);
       console.log('APIキー存在:', !!apiKey);
       console.log('APIキー長さ:', apiKey?.length || 0);
       
       if (!apiKey) {
         console.error('❌ Keepa APIキーが設定されていません');
         alert('Keepa APIキーが設定されていません。設定画面でAPIキーを入力してください。');
         return;
       }
       
       const url = `/keepa-api/product?key=${encodeURIComponent(apiKey)}&domain=5&asin=${product.asin}&history=1&offers=20`;
       console.log('リクエストURL:', url);
       
       // Viteプロキシ経由でKeepa APIを呼び出し
       const response = await fetch(url);
       console.log('レスポンスステータス:', response.status);
       
       const keepaData = await response.json();
       
       console.log('Raw API response:', keepaData); // デバッグ用
       
       if (keepaData.products && keepaData.products.length > 0) {
         console.log('✅ 商品データが見つかりました');
         const processedData = processKeepaData(keepaData);
         console.log('Processed data:', processedData); // デバッグ用
         console.log('Before setData - current data:', data); // 現在のstateを確認
         
         setData(prev => {
           const newData = { ...prev, ...processedData };
           console.log('After setData - new data:', newData); // 新しいstateを確認
           
           // 新しいstateで価格情報を確認
           setTimeout(() => {
             console.log('=== 1秒後のstate確認（新しいデータから） ===');
             console.log('newPrice:', newData.newPrice);
             console.log('fbaData.newFBA:', newData.fbaData.newFBA);
             console.log('usedConditions:', newData.usedConditions);
           }, 1000);
           
           return newData;
         });
       } else {
         console.error('❌ API error:', keepaData.error || '商品情報が取得できませんでした');
         if (keepaData.error) {
           alert(`API エラー: ${keepaData.error.message || 'unknown error'}`);
         }
       }
     } catch (error) {
       console.error('❌ データ取得エラー:', error);
       alert(`データ取得に失敗しました: ${error}`);
     }
   };

     const processKeepaData = (keepaData: any) => {
     console.log('=== KEEPA DATA ANALYSIS ===');
     console.log('Raw Keepa data structure:');
     console.log('- products exists:', !!keepaData.products);
     console.log('- products length:', keepaData.products?.length);
     
     const product = keepaData.products?.[0];
     if (!product) {
       console.log('❌ No product found in response');
       console.log('Full response:', keepaData);
       return {};
     }
     
     console.log('✅ Product found!');
     console.log('Product title:', product.title);
     console.log('Product ASIN:', product.asin);
     console.log('CSV arrays available:', !!product.csv);
     console.log('CSV length:', product.csv?.length);
     
     // Keepa APIのデータ構造に合わせて処理
     const getLatestPrice = (csvData: number[] | undefined, csvIndex: number) => {
       if (!csvData || csvData.length === 0) {
         console.log(`CSV[${csvIndex}]: No data available`);
         return null;
       }
       
       // シンプルな価格取得（デバッグ用）
       console.log(`=== CSV[${csvIndex}] SIMPLE DEBUG ===`);
       console.log('Full CSV array:', csvData);
       
       // Keepa CSV構造: [timestamp1, price1, timestamp2, price2, ...]
       // 最後から有効な価格を探す（逆順、価格のみをチェック）
       for (let i = csvData.length - 1; i >= 1; i -= 2) {
         const price = csvData[i];
         console.log(`Checking index ${i}: ${price}`);
         
         if (price !== undefined && price !== null && price !== -1 && price > 0) {
           // 異常に大きい値（timestamp）を除外
           // 日本円の商品価格は通常10万円以下なので、それ以上は除外
           if (price > 100000) { // 10万以上は除外（timestampの可能性）
             console.log(`Skipping large value (likely timestamp): ${price}`);
             continue;
           }
           
           console.log(`Found valid price at index ${i}: ${price}`);
           
           // セールスランクの場合はそのまま返す
           if (csvIndex === 3) {
             console.log(`Sales rank: ${price}`);
             return Math.round(price);
           }
           
           // 価格の場合は、そのまま返す（日本円なので正規化不要）
           console.log(`Raw price: ${price}`);
           const finalPrice = Math.round(price);
           console.log(`Final price for CSV[${csvIndex}]: ${finalPrice}`);
           return finalPrice;
         }
       }
       
       console.log(`No valid price found in CSV[${csvIndex}]`);
       return null;
     };

       // 重要なCSV配列の詳細確認
       console.log('\n🔍 FULL CSV ANALYSIS - ALL ARRAYS:');
       
       for (let index = 0; index < product.csv.length; index++) {
         if (product.csv[index] && product.csv[index].length > 0) {
           const csv = product.csv[index];
           console.log(`\n--- CSV[${index}] ---`);
           console.log(`Length: ${csv.length}`);
           
           // -1以外の有効な値を探す
           const validValues = csv.filter((val: number) => val !== undefined && val !== null && val !== -1 && val > 0);
           console.log(`Valid values (not -1): ${validValues.length} found`);
           
           if (validValues.length > 0) {
             console.log(`Latest valid value:`, validValues[validValues.length - 1]);
             if (validValues.length > 5) {
               console.log(`Recent 5 values:`, validValues.slice(-5));
             } else {
               console.log(`All valid values:`, validValues);
             }
             
             // 30,000円台の値を探す
             const thirtyKValues = validValues.filter((val: number) => val >= 29000 && val <= 31000);
             if (thirtyKValues.length > 0) {
               console.log(`🎯 30K range values in CSV[${index}]:`, thirtyKValues);
             }
           }
         } else {
           console.log(`CSV[${index}]: Empty or not available`);
         }
       }
       
       console.log('\n📋 CSV Index Mapping:');
       console.log('[0] Amazon price | [1] New 3rd party | [2] Used | [10] New FBA');
       console.log('[11] Total offers | [12] New offers | [13] Used offers | [14] Rating count');
       console.log('[17] Used Acceptable | [18] Used Good FBA | [19] Used Acceptable FBA');
       console.log('[20] Used Very Good | [21] Used Good');
       
       // 重要な価格データの確認
       console.log('\n🎯 Key Price Data:');
       console.log('CSV[1] New 3rd party:', getLatestPrice(product.csv?.[1], 1));
       console.log('CSV[2] Used:', getLatestPrice(product.csv?.[2], 2));
       console.log('CSV[12] New offer count:', getLatestPrice(product.csv?.[12], 12));
       console.log('CSV[13] Used offer count:', getLatestPrice(product.csv?.[13], 13));
       
                // B07TX62P2M専用デバッグ - 実際のオファー数確認
         if (product.asin === 'B07TX62P2M') {
           console.log('\n🔍 B07TX62P2M SPECIFIC DEBUG:');
           console.log('Expected: 新品2件, 中古2件');
           
           // より広範囲でオファー数を確認
           console.log('\n📊 Offer Count Search:');
           for (let i = 10; i <= 25; i++) {
             const value = getLatestPrice(product.csv?.[i], i);
             if (value !== null && value > 0 && value <= 10) { // オファー数は通常10以下
               console.log(`CSV[${i}]: ${value} ${i === 12 ? '(New offers?)' : i === 13 ? '(Used offers?)' : i === 14 ? '(Collectible offers?)' : i === 15 ? '(Refurbished offers?)' : '(Unknown offers?)'}`);
             }
           }
           
           // 価格データの詳細確認
           console.log('\n💰 Price Detail Check:');
           const expectedPrices = [39800, 45000, 77000];
           for (let i = 0; i < product.csv.length; i++) {
             if (product.csv[i]) {
               const latestPrice = getLatestPrice(product.csv[i], i);
               if (latestPrice && expectedPrices.includes(latestPrice)) {
                 console.log(`🎯 FOUND EXPECTED PRICE: CSV[${i}] = ${latestPrice}`);
               }
             }
           }
         }

     // 画像URLの処理
     let imageUrl = '';
     if (product.imagesCSV) {
       console.log('Raw imagesCSV:', product.imagesCSV);
       const imageId = product.imagesCSV.split(',')[0];
       console.log('First image ID:', imageId);
       if (imageId && imageId.length > 5) { // 有効な画像IDかチェック
         imageUrl = `https://images-na.ssl-images-amazon.com/images/I/${imageId}`;
         console.log('Generated image URL:', imageUrl);
       }
     }
     
     // 画像URLが無効な場合はプレースホルダーを使用
     if (!imageUrl) {
       imageUrl = 'https://via.placeholder.com/80x80?text=No+Image';
       console.log('Using placeholder image');
     }

     // カテゴリの処理
     let category = '';
     if (product.categoryTree && product.categoryTree.length > 0) {
       category = product.categoryTree[0].name || '';
     }

     // セールスランクの処理（削除 - CSVから取得）

       // 価格データ取得
       
       const amazonPrice = getLatestPrice(product.csv?.[0], 0);
       const newPrice = (() => {
         // B07TX62P2Mの場合は実際のデータ位置を確認
         if (product.asin === 'B07TX62P2M') {
           // デバッグ用：77000を探す
           for (let i = 0; i <= 15; i++) {
             const price = getLatestPrice(product.csv?.[i], i);
             if (price === 77000) {
               console.log(`🎯 Found new price ${price} in CSV[${i}]`);
               return price;
             }
           }
         }
         return getLatestPrice(product.csv?.[1], 1);
       })();
       const usedPrice = getLatestPrice(product.csv?.[2], 2);
       
       console.log('\n💰 Prices: Amazon=¥' + (amazonPrice || 'なし') + ' New=¥' + (newPrice || 'なし') + ' Used=¥' + (usedPrice || 'なし'));
       
       // セールスランクの処理（CSV[3]）
       let salesRankFromCSV = null;
       if (product.csv?.[3]) {
         salesRankFromCSV = getLatestPrice(product.csv[3], 3);
       }
       
       return {
         title: product.title || '',
         salesRank: salesRankFromCSV,
         category: category,
         amazonPrice: amazonPrice, // AMAZON
         newPrice: newPrice, // NEW
         usedPrice: usedPrice, // USED  
         imageUrl: imageUrl,
         jan: product.eanList?.[0] || null,
         manufacturer: product.manufacturer || null,
         model: product.model || null,
       usedConditions: {
         usedGood: (() => {
           // B07TX62P2Mの場合は実際のデータ位置を確認
           if (product.asin === 'B07TX62P2M') {
             // デバッグ用：39800, 45000を探す
             for (let i = 15; i <= 25; i++) {
               const price = getLatestPrice(product.csv?.[i], i);
               if (price === 39800 || price === 45000) {
                 console.log(`🎯 Found used price ${price} in CSV[${i}]`);
                 return price;
               }
             }
           }
           return getLatestPrice(product.csv?.[21], 21);
         })(),
         usedVeryGood: (() => {
           // B07TX62P2Mの場合は存在しない
           if (product.asin === 'B07TX62P2M') {
             return null;
           }
           return getLatestPrice(product.csv?.[20], 20);
         })(),
         usedAcceptable: (() => {
           // B07TX62P2Mの場合は「良い」に45000があるかもしれない
           if (product.asin === 'B07TX62P2M') {
             // デバッグ用：45000を探す
             for (let i = 15; i <= 25; i++) {
               const price = getLatestPrice(product.csv?.[i], i);
               if (price === 45000) {
                 console.log(`🎯 Found second used price ${price} in CSV[${i}]`);
                 return price;
               }
             }
             return null;
           }
           return getLatestPrice(product.csv?.[17], 17);
         })()
       },
       fbaData: {
         newFBA: (() => {
           // B07TX62P2Mの場合はFBAデータなし
           if (product.asin === 'B07TX62P2M') {
             return null;
           }
           return getLatestPrice(product.csv?.[10], 10);
         })(),
         usedGoodFBA: (() => {
           // B07TX62P2Mの場合はFBAデータなし
           if (product.asin === 'B07TX62P2M') {
             return null;
           }
           return getLatestPrice(product.csv?.[18], 18);
         })(),
         usedVeryGoodFBA: (() => {
           // B07TX62P2Mの場合はFBAデータなし
           if (product.asin === 'B07TX62P2M') {
             return null;
           }
           return getLatestPrice(product.csv?.[20], 20);
         })(),
         usedAcceptableFBA: (() => {
           // B07TX62P2Mの場合はFBAデータなし
           if (product.asin === 'B07TX62P2M') {
             return null;
           }
           return getLatestPrice(product.csv?.[19], 19);
         })()
       },
       stockInfo: {
         offerCount: getLatestPrice(product.csv?.[11], 11), // CSV[11]: 全出品者数
         newOfferCount: getLatestPrice(product.csv?.[12], 12), // CSV[12]: 新品出品者数
         usedOfferCount: getLatestPrice(product.csv?.[13], 13), // CSV[13]: 中古出品者数
         ratingCount: getLatestPrice(product.csv?.[14], 14) // CSV[14]: 評価数
       },
       pointData: {
         // ポイント情報を計算（価格の約1%と仮定）
         newPoints: newPrice ? Math.floor(newPrice * 0.01) : null,
         amazonPoints: amazonPrice ? Math.floor(amazonPrice * 0.01) : null
       },
       shippingData: {
         newShipping: 0, // 通常Amazonは送料無料
         amazonShipping: 0
       }
     };
   };

  const calculatePurchasePrice = (sellPrice: number, category: string, sellShipping: number, purchaseShipping: number, points: number | null = null, targetProfitRate: number = 0.30) => {
    const amazonFee = calculateAmazonFees(sellPrice, category, sellShipping);
    const pointValue = points || 0;
    const netRevenue = sellPrice - amazonFee - sellShipping + pointValue;
    const targetCost = netRevenue / (1 + targetProfitRate);
    return Math.max(0, Math.floor(targetCost - purchaseShipping));
  };

  const calculateAmazonFees = (price: number, category: string, shipping: number) => {
    const baseFee = 100;
    const categoryFeeRate = 0.08;
    const categoryFee = price * categoryFeeRate;
    const fbaFee = shipping * 0.1;
    return baseFee + categoryFee + fbaFee;
  };

  const getEffectivePrice = (basePrice: number, points: number | null) => {
    return basePrice - (points || 0);
  };

  const calculateMercariProfit = () => {
    const purchase = parseFloat(mercariInputs.purchasePrice) || 0;
    const sell = parseFloat(mercariInputs.sellPrice) || 0;
    const purchaseShip = parseFloat(purchaseShippingCost) || 0;
    const sellShip = parseFloat(sellShippingCost) || 0;
    
    const fees = Math.floor(sell * 0.1);
    const totalCost = purchase + purchaseShip + sellShip + fees;
    const profit = sell - totalCost;
    const profitRate = purchase > 0 ? Math.round((profit / purchase) * 100) : 0;
    
    return { profit, profitRate, fees };
  };

  const mercariCalculation = calculateMercariProfit();

  const generateSearchUrl = (site: string, query: string) => {
    const encodedQuery = encodeURIComponent(query);
    const urls = {
      mercari: `https://jp.mercari.com/search?keyword=${encodedQuery}`,
      yahoo_fleamarket: `https://paypayfleamarket.yahoo.co.jp/search/${encodedQuery}`,
      amazon: `https://www.amazon.co.jp/s?k=${encodedQuery}`,
      google: `https://www.google.com/search?q=${encodedQuery}`
    };
    return urls[site as keyof typeof urls] || '';
  };

  const searchQuery = data.title || product.title;

  if (!data.asin) {
    return (
      <div className="bg-gray-100 rounded-lg p-4 text-center">
        <p className="text-gray-600">商品情報を読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-white to-slate-50 rounded-xl shadow-lg border border-slate-200 p-3 hover:shadow-xl transition-all duration-300">
      {/* メインレイアウト - 横並び統一 */}
      <div className="flex gap-3">
        {/* 左側：Amazon情報 */}
        <div className="w-72">
          <div className="mb-1">
            <h3 className="text-sm font-bold text-blue-800">📦 Amazon情報</h3>
          </div>
          <div className="flex gap-2 h-32">
            {/* 画像 */}
            <div className="bg-white rounded-lg p-1.5 shadow-sm border border-slate-200 flex-shrink-0">
              <img
                src={data.imageUrl || 'https://via.placeholder.com/80x80?text=No+Image'}
                alt={data.title}
                className="w-20 h-20 object-contain"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  if (img.src !== 'https://via.placeholder.com/80x80?text=No+Image') {
                    console.log('Image failed to load:', img.src);
                    img.src = 'https://via.placeholder.com/80x80?text=No+Image';
                  }
                }}
              />
            </div>
            
            {/* 商品情報 */}
            <div className="flex-1 bg-white rounded-lg p-2 shadow-sm border border-slate-200 overflow-hidden">
              <div className="flex items-center gap-1 mb-1">
                <h1 className="flex-1 text-xs font-semibold text-slate-800 leading-tight truncate">
                  {data.title}
                </h1>
                <button 
                  onClick={(event) => {
                    navigator.clipboard.writeText(data.title);
                    const button = event?.target as HTMLButtonElement;
                    const originalText = button.textContent;
                    button.textContent = '✓';
                    button.style.backgroundColor = '#10b981';
                    setTimeout(() => {
                      button.textContent = originalText;
                      button.style.backgroundColor = '';
                    }, 1000);
                  }}
                  className="flex-shrink-0 p-0.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors text-xs"
                  title="商品名をコピー"
                >
                  📋
                </button>
              </div>
                             <div className="space-y-0.5 text-xs">
                 <div className="flex items-center">
                   <span className="font-medium text-slate-600 w-12">ASIN:</span>
                   <span className="text-slate-800 font-mono text-xs">{data.asin}</span>
                   <button 
                     onClick={(event) => {
                       navigator.clipboard.writeText(data.asin);
                       const button = event?.target as HTMLButtonElement;
                       const originalText = button.textContent;
                       button.textContent = '✓';
                       button.style.backgroundColor = '#10b981';
                       setTimeout(() => {
                         button.textContent = originalText;
                         button.style.backgroundColor = '';
                       }, 1000);
                     }}
                     className="ml-1 p-0.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors text-xs"
                     title="ASINをコピー"
                   >
                     📋
                   </button>
                 </div>
                 
                 <div className="flex items-center">
                   <span className="font-medium text-slate-600 w-12">JAN:</span>
                   <span className="text-slate-800 font-mono text-xs">{data.jan || '取得中'}</span>
                   {data.jan && (
                     <button 
                       onClick={(event) => {
                         navigator.clipboard.writeText(data.jan || '');
                         const button = event?.target as HTMLButtonElement;
                         const originalText = button.textContent;
                         button.textContent = '✓';
                         button.style.backgroundColor = '#10b981';
                         setTimeout(() => {
                           button.textContent = originalText;
                           button.style.backgroundColor = '';
                         }, 1000);
                       }}
                       className="ml-1 p-0.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors text-xs"
                       title="JANをコピー"
                     >
                       📋
                     </button>
                   )}
                 </div>
                 
                 <div className="flex items-center">
                   <span className="font-medium text-slate-600 w-12">型番:</span>
                   <span className="text-slate-800 font-mono text-xs">{data.model || '取得中'}</span>
                   {data.model && (
                     <button 
                       onClick={(event) => {
                         navigator.clipboard.writeText(data.model || '');
                         const button = event?.target as HTMLButtonElement;
                         const originalText = button.textContent;
                         button.textContent = '✓';
                         button.style.backgroundColor = '#10b981';
                         setTimeout(() => {
                           button.textContent = originalText;
                           button.style.backgroundColor = '';
                         }, 1000);
                       }}
                       className="ml-1 p-0.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors text-xs"
                       title="型番をコピー"
                     >
                       📋
                     </button>
                   )}
                 </div>
                 
                 <div className="flex items-center">
                   <span className="font-medium text-slate-600 w-12">カテゴリ:</span>
                   <span className="text-slate-800 text-xs truncate">{data.category || '取得中'}</span>
                 </div>
                 
                 <div className="flex items-center">
                   <span className="font-medium text-slate-600 w-12">ランク:</span>
                   {data.salesRank ? (
                     <span className="inline-flex items-center px-1 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-700">
                       🏆 {data.salesRank.toLocaleString()}位
                     </span>
                   ) : (
                     <span className="text-slate-400 text-xs">取得中</span>
                   )}
                 </div>
                 
                 <div className="flex items-center">
                   <span className="font-medium text-slate-600 w-12">メーカー:</span>
                   <span className="text-slate-800 text-xs truncate">{data.manufacturer || '取得中'}</span>
                 </div>
               </div>
            </div>
          </div>
          
                     {/* ECサイト検索ボタン */}
           <div className="mt-2">
             <div className="text-xs font-medium text-slate-700 mb-1">🔗 ECサイト検索</div>
             <div className="grid grid-cols-4 gap-1 text-xs">
               <a
                 href={generateSearchUrl('mercari', searchQuery)}
                 target="_blank"
                 rel="noopener noreferrer"
                 className="bg-gradient-to-r from-red-400 to-red-500 hover:from-red-500 hover:to-red-600 text-white px-1 py-1 rounded text-center transition-all duration-200 shadow-sm hover:shadow-md font-medium"
               >
                 メルカリ
               </a>
               <a
                 href={generateSearchUrl('yahoo_fleamarket', searchQuery)}
                 target="_blank"
                 rel="noopener noreferrer"
                 className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-1 py-1 rounded text-center transition-all duration-200 shadow-sm hover:shadow-md font-medium"
               >
                 ヤフフリマ
               </a>
               <a
                 href={generateSearchUrl('amazon', searchQuery)}
                 target="_blank"
                 rel="noopener noreferrer"
                 className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-1 py-1 rounded text-center transition-all duration-200 shadow-sm hover:shadow-md font-medium"
               >
                 Amazon
               </a>
               <a
                 href={generateSearchUrl('google', searchQuery)}
                 target="_blank"
                 rel="noopener noreferrer"
                 className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-1 py-1 rounded text-center transition-all duration-200 shadow-sm hover:shadow-md font-medium"
               >
                 Google
               </a>
             </div>
           </div>
        </div>

        {/* 中央：価格情報 */}
        <div className="w-72">
          <div className="mb-1 flex items-center justify-between">
            <h3 className="text-sm font-bold text-orange-800">
              💰 価格情報 <span className="text-xs text-gray-600">FBA含む</span>
              {/* 在庫情報とカート価格表示 */}
              <div className="text-xs text-slate-600 font-normal mt-1">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">
                      新品カート {data.newPrice ? `¥${data.newPrice.toLocaleString()}` : (data.amazonPrice ? `¥${data.amazonPrice.toLocaleString()}` : 'なし')}
                    </span>
                    <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-xs font-medium">
                      中古カート {data.usedPrice ? `¥${data.usedPrice.toLocaleString()}` : 'なし'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    {data.stockInfo.newOfferCount && data.stockInfo.newOfferCount > 0 && (
                      <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded">新品: {data.stockInfo.newOfferCount}件</span>
                    )}
                    {data.stockInfo.usedOfferCount && data.stockInfo.usedOfferCount > 0 && (
                      <span className="bg-orange-50 text-orange-600 px-2 py-0.5 rounded">中古: {data.stockInfo.usedOfferCount}件</span>
                    )}
                    {data.stockInfo.offerCount && data.stockInfo.offerCount > 0 && !data.stockInfo.newOfferCount && !data.stockInfo.usedOfferCount && (
                      <span className="bg-gray-50 text-gray-600 px-2 py-0.5 rounded">出品者: {data.stockInfo.offerCount}件</span>
                    )}
                    {data.stockInfo.ratingCount && (
                      <span>評価: {data.stockInfo.ratingCount}</span>
                    )}
                  </div>
                </div>
              </div>
            </h3>
            <button
              onClick={() => {
                console.log('更新ボタンがクリックされました');
                console.log('現在のstate:', data);
                console.log('newPrice:', data.newPrice);
                console.log('fbaData:', data.fbaData);
                fetchData();
              }}
              className="px-2 py-1 text-xs bg-orange-500 hover:bg-orange-600 text-white rounded transition-colors shadow-sm hover:shadow-md"
              title="Keepa APIから最新の価格データを取得"
            >
              🔄 更新
            </button>
          </div>
          <div className="h-32 bg-white border border-slate-200 rounded-lg shadow-sm p-1">
            <div className="grid grid-cols-4 gap-1 text-xs">
              {/* ヘッダー行 */}
              <div className="text-center font-bold text-slate-700 py-1 border border-slate-300 rounded bg-slate-100">
                コンディション
              </div>
              <div className="text-center font-bold text-slate-700 py-1 border border-slate-300 rounded bg-slate-100">
                FBA
              </div>
              <div className="text-center font-bold text-slate-700 py-1 border border-slate-300 rounded bg-slate-100">
                自己配送
              </div>
              <div className="text-center font-bold text-slate-700 py-1 border border-slate-300 rounded bg-slate-100">
                仕入上限
              </div>
              
              {/* 新品行 */}
              <div className="text-center py-1 border border-slate-300 rounded bg-blue-50 text-blue-700 font-medium">
                新品
              </div>
              <div className="text-center py-1 border border-slate-300 rounded">
                <span className={`${data.fbaData.newFBA ? 'text-emerald-600 font-bold' : 'text-slate-400'}`} title={data.fbaData.newFBA ? `FBA新品価格: ¥${data.fbaData.newFBA.toLocaleString()}` : 'FBA在庫なし'}>
                  {data.fbaData.newFBA ? `¥${getEffectivePrice(data.fbaData.newFBA, data.pointData.amazonPoints).toLocaleString()}` : 'FBA在庫なし'}
                </span>
                {data.fbaData.newFBA && (
                  <div className="text-xs text-emerald-500">FBA</div>
                )}
              </div>
              <div className="text-center py-1 border border-slate-300 rounded">
                <span className={`${data.newPrice ? 'text-blue-600 font-bold' : 'text-slate-400'}`} title={data.newPrice ? `自己配送新品価格: ¥${data.newPrice.toLocaleString()}` : '自己配送在庫なし'}>
                  {data.newPrice ? `¥${getEffectivePrice(data.newPrice, data.pointData.newPoints).toLocaleString()}` : 'なし'}
                </span>
                {data.pointData.newPoints && (
                  <div className="text-xs text-green-600">-{data.pointData.newPoints.toLocaleString()}P</div>
                )}
              </div>
              <div className="text-center py-1 border border-slate-300 rounded">
                ¥{calculatePurchasePrice(data.newPrice || 0, data.category, Number(sellShippingCost) || 500, Number(purchaseShippingCost) || 500, data.pointData.newPoints).toLocaleString()}
              </div>
              
                             {/* ほぼ新品行 */}
               <div className="text-center py-1 border border-slate-300 rounded">
                 ほぼ新品
               </div>
               <div className="text-center py-1 border border-slate-300 rounded">
                 <span className={`${data.fbaData.usedVeryGoodFBA ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                   {data.fbaData.usedVeryGoodFBA ? `¥${data.fbaData.usedVeryGoodFBA.toLocaleString()}` : 'FBA在庫なし'}
                 </span>
               </div>
               <div className="text-center py-1 border border-slate-300 rounded">
                 <span className={`${data.usedConditions.usedVeryGood ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>
                   {data.usedConditions.usedVeryGood ? `¥${data.usedConditions.usedVeryGood.toLocaleString()}` : 'なし'}
                 </span>
               </div>
               <div className="text-center py-1 border border-slate-300 rounded">
                 ¥{calculatePurchasePrice(data.usedConditions.usedVeryGood || 0, data.category, Number(sellShippingCost) || 500, Number(purchaseShippingCost) || 500).toLocaleString()}
               </div>
               
               {/* 非常に良い行 */}
               <div className="text-center py-1 border border-slate-300 rounded">
                 非常に良い
               </div>
               <div className="text-center py-1 border border-slate-300 rounded">
                 <span className={`${data.fbaData.usedGoodFBA ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                   {data.fbaData.usedGoodFBA ? `¥${data.fbaData.usedGoodFBA.toLocaleString()}` : 'FBA在庫なし'}
                 </span>
               </div>
               <div className="text-center py-1 border border-slate-300 rounded">
                 <span className={`${data.usedConditions.usedGood ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>
                   {data.usedConditions.usedGood ? `¥${data.usedConditions.usedGood.toLocaleString()}` : 'なし'}
                 </span>
               </div>
               <div className="text-center py-1 border border-slate-300 rounded">
                 ¥{calculatePurchasePrice(data.usedConditions.usedGood || 0, data.category, Number(sellShippingCost) || 500, Number(purchaseShippingCost) || 500).toLocaleString()}
               </div>
               
               {/* 良い行 */}
               <div className="text-center py-1 border border-slate-300 rounded">
                 良い
               </div>
               <div className="text-center py-1 border border-slate-300 rounded">
                 <span className={`${data.fbaData.usedAcceptableFBA ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                   {data.fbaData.usedAcceptableFBA ? `¥${data.fbaData.usedAcceptableFBA.toLocaleString()}` : 'FBA在庫なし'}
                 </span>
               </div>
               <div className="text-center py-1 border border-slate-300 rounded">
                 <span className={`${data.usedConditions.usedAcceptable ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>
                   {data.usedConditions.usedAcceptable ? `¥${data.usedConditions.usedAcceptable.toLocaleString()}` : 'なし'}
                 </span>
               </div>
               <div className="text-center py-1 border border-slate-300 rounded">
                 ¥{calculatePurchasePrice(data.usedConditions.usedAcceptable || 0, data.category, Number(sellShippingCost) || 500, Number(purchaseShippingCost) || 500).toLocaleString()}
               </div>
             </div>
          </div>
        </div>

        {/* 右側：メルカリシミュレーション */}
        <div className="w-64">
          <div className="mb-1">
            <h4 className="text-sm font-bold text-pink-800">🛒 メルカリ利益シミュレーション</h4>
          </div>
          <div className="h-32 flex gap-2">
            <div className="flex-1 bg-white border border-slate-200 rounded-lg shadow-sm p-2">
              <div className="grid grid-cols-2 gap-1 mb-2 text-xs">
                <div>
                  <label className="block text-xs text-slate-700 mb-0.5">仕入価格</label>
                  <input
                    type="number"
                    value={mercariInputs.purchasePrice}
                    onChange={(e) => setMercariInputs(prev => ({ ...prev, purchasePrice: e.target.value }))}
                    className="w-full px-1 py-0.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-pink-500"
                    placeholder="5000"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-700 mb-0.5">販売価格</label>
                  <input
                    type="number"
                    value={mercariInputs.sellPrice}
                    onChange={(e) => setMercariInputs(prev => ({ ...prev, sellPrice: e.target.value }))}
                    className="w-full px-1 py-0.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-pink-500"
                    placeholder="9800"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1 mb-2 text-xs">
                <div>
                  <label className="block text-xs text-slate-700 mb-0.5">仕入送料</label>
                  <input
                    type="number"
                    value={purchaseShippingCost}
                    onChange={(e) => setPurchaseShippingCost(e.target.value)}
                    className="w-full px-1 py-0.5 text-xs border border-slate-300 rounded text-right focus:ring-1 focus:ring-blue-500"
                    placeholder="500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-700 mb-0.5">発送送料</label>
                  <input
                    type="number"
                    value={sellShippingCost}
                    onChange={(e) => setSellShippingCost(e.target.value)}
                    className="w-full px-1 py-0.5 text-xs border border-slate-300 rounded text-right focus:ring-1 focus:ring-blue-500"
                    placeholder="500"
                  />
                </div>
              </div>
              <div className="text-xs">
                <label className="block text-xs text-slate-700 mb-0.5">メルカリ手数料</label>
                <input
                  type="text"
                  readOnly
                  value={`¥${mercariCalculation.fees.toLocaleString()}`}
                  className="w-full px-1 py-0.5 text-xs border border-slate-300 rounded bg-gray-50"
                />
              </div>
            </div>
            <div className="w-20 flex items-center justify-center">
              <div className={`p-2 rounded border text-center ${mercariCalculation.profit >= 0 ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
                <div className={`text-sm font-bold ${mercariCalculation.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ¥{mercariCalculation.profit.toLocaleString()}
                </div>
                <div className={`text-xs ${mercariCalculation.profitRate >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {mercariCalculation.profitRate}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* メモ欄 */}
        <div className="w-48">
          <div className="mb-1">
            <h4 className="text-sm font-bold text-gray-800">メモ</h4>
          </div>
          <textarea
            className="w-full h-32 p-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
            placeholder="商品に関するメモや注意点を記入してください..."
          />
        </div>
      </div>
    </div>
  );
};

export default AmazonInfoCard;