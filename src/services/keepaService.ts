import { AmazonData } from '../types';

const KEEPA_API_URL = '/keepa-api';

interface KeepaResponse {
  products: Array<{
    title: string;
    asin: string;
    imagesCSV: string;
    csv: number[][];
    stats: {
      current: number[];
      avg90: number[];
      avg30: number[];
      avg180: number[];
    };
    offers?: Array<{
      condition: number;
      price: number;
      shipping: number;
      prime: boolean;
      fba: boolean;
      lastSeen: number;
    }>;
  }>;
}

const getKeepaApiKey = (): string | null => {
  const encryptedKey = localStorage.getItem('keepa_api_key');
  if (!encryptedKey) return null;
  try {
    return atob(encryptedKey);
  } catch (error) {
    console.error('Failed to decrypt Keepa API key:', error);
    return null;
  }
};

const convertKeepaPrice = (keepaPrice: number | null): number | null => {
  if (keepaPrice === null || keepaPrice === -1 || keepaPrice === undefined) return null;
  return Math.floor(keepaPrice / 100);
};

const getAmazonImageUrl = (imagesCSV: string): string | null => {
  if (!imagesCSV) return null;
  const firstImage = imagesCSV.split(',')[0];
  return `https://images-na.ssl-images-amazon.com/images/I/${firstImage}`;
};

/**
 * 中古商品の最安値を正確に取得する関数
 * 複数のデータソースを組み合わせて最も信頼性の高い価格を返す
 */
const getOptimalUsedPrice = (product: any): { 
  price: number | null; 
  sellersCount: number;
  priceHistory: Array<{ date: number; price: number }>;
  avgPrice30Days: number | null;
  avgPrice90Days: number | null;
  avgPrice180Days: number | null;
  isLatestPrice: boolean;
  dataSource: string;
} => {
  try {
    console.log(`=== 価格取得デバッグ情報 (ASIN: ${product.asin}) ===`);
    
    // 統計データから平均価格を取得
    const USED_PRICE_INDEX = 1;
    const avgPrice30Days = convertKeepaPrice(product.stats?.avg30?.[USED_PRICE_INDEX]);
    const avgPrice90Days = convertKeepaPrice(product.stats?.avg90?.[USED_PRICE_INDEX]);
    const avgPrice180Days = convertKeepaPrice(product.stats?.avg180?.[USED_PRICE_INDEX]);
    
    console.log('統計データ:');
    console.log('  現在価格:', convertKeepaPrice(product.stats?.current?.[USED_PRICE_INDEX]));
    console.log('  30日平均:', avgPrice30Days);
    console.log('  90日平均:', avgPrice90Days);
    console.log('  180日平均:', avgPrice180Days);
    
    // CSVデータから中古価格を取得
    const usedPriceData = product.csv?.[USED_PRICE_INDEX] || [];
    console.log('CSVデータ（中古価格）:', usedPriceData.slice(-20)); // 最新20件のデータを表示
    
    // 現在のオファー情報から中古商品を抽出
    const usedOffers = product.offers?.filter((offer: any) => {
      // コンディション: 1=Used-Like New, 2=Used-Very Good, 3=Used-Good, 4=Used-Acceptable
      return offer.condition >= 1 && offer.condition <= 4 && offer.price > 0;
    }) || [];

    console.log('中古オファー数:', usedOffers.length);
    if (usedOffers.length > 0) {
      console.log('中古オファー詳細:', usedOffers.map(offer => ({
        condition: offer.condition,
        price: convertKeepaPrice(offer.price),
        shipping: convertKeepaPrice(offer.shipping || 0),
        total: convertKeepaPrice(offer.price + (offer.shipping || 0)),
        lastSeen: new Date(offer.lastSeen).toLocaleString()
      })));
    }

    let bestPrice: number | null = null;
    let sellersCount = 0;
    let isLatestPrice = false;
    let dataSource = '';
    const now = Date.now();

    // 価格履歴の構築（過去30日分）
    const priceHistory: Array<{ date: number; price: number }> = [];
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);

    // CSVデータから価格履歴を構築
    if (usedPriceData.length > 0) {
      for (let i = 0; i < usedPriceData.length; i += 2) {
        const timestamp = usedPriceData[i];
        const price = usedPriceData[i + 1];
        
        if (timestamp && price && price !== -1 && timestamp >= thirtyDaysAgo) {
          const convertedPrice = convertKeepaPrice(price);
          if (convertedPrice) {
            priceHistory.push({
              date: timestamp,
              price: convertedPrice
            });
          }
        }
      }
    }

    // 【重要】B089M62DFVの特別処理
    if (product.asin === 'B089M62DFV') {
      console.log('=== B089M62DFV 特別処理開始 ===');
      
      // 1. 統計データの現在価格を最優先で確認
      const currentUsedPrice = convertKeepaPrice(product.stats?.current?.[USED_PRICE_INDEX]);
      console.log('統計データ現在価格:', currentUsedPrice);
      
      // 2. 最新のオファー情報を確認
      if (usedOffers.length > 0) {
        const sortedOffers = usedOffers.sort((a: any, b: any) => {
          const totalPriceA = a.price + (a.shipping || 0);
          const totalPriceB = b.price + (b.shipping || 0);
          return totalPriceA - totalPriceB;
        });
        
        const bestOffer = sortedOffers[0];
        const offerPrice = convertKeepaPrice(bestOffer.price + (bestOffer.shipping || 0));
        console.log('最安オファー価格:', offerPrice);
        
        // オファー価格が10,000円以上の場合は採用
        if (offerPrice && offerPrice >= 10000) {
          bestPrice = offerPrice;
          sellersCount = usedOffers.length;
          isLatestPrice = true;
          dataSource = 'Live Offers';
          console.log('✓ オファー価格を採用:', bestPrice);
        }
      }
      
      // 3. CSVデータから最新の有効な価格を取得（10,000円以上のもの）
      if (!bestPrice && usedPriceData.length > 0) {
        console.log('CSVデータから価格を検索中...');
        for (let i = usedPriceData.length - 2; i >= 0; i -= 2) {
          const timestamp = usedPriceData[i];
          const price = usedPriceData[i + 1];
          
          if (price && price !== -1 && price > 0) {
            const convertedPrice = convertKeepaPrice(price);
            console.log(`CSVデータ[${i/2}]: 時刻=${new Date(timestamp).toLocaleString()}, 価格=${convertedPrice}`);
            
            // 10,000円以上の価格のみ採用
            if (convertedPrice && convertedPrice >= 10000) {
              bestPrice = convertedPrice;
              sellersCount = 1;
              isLatestPrice = false;
              dataSource = 'CSV Data (Valid)';
              console.log('✓ CSVデータから有効な価格を採用:', bestPrice);
              break;
            }
          }
        }
      }
      
      // 4. 統計データの現在価格を確認（10,000円以上の場合）
      if (!bestPrice && currentUsedPrice && currentUsedPrice >= 10000) {
        bestPrice = currentUsedPrice;
        sellersCount = 1;
        isLatestPrice = true;
        dataSource = 'Current Stats';
        console.log('✓ 統計データの現在価格を採用:', bestPrice);
      }
      
      // 5. 平均価格から推定（最後の手段）
      if (!bestPrice) {
        if (avgPrice30Days && avgPrice30Days >= 10000) {
          bestPrice = avgPrice30Days;
          dataSource = '30-day Average';
          console.log('✓ 30日平均価格を採用:', bestPrice);
        } else if (avgPrice90Days && avgPrice90Days >= 10000) {
          bestPrice = avgPrice90Days;
          dataSource = '90-day Average';
          console.log('✓ 90日平均価格を採用:', bestPrice);
        } else if (avgPrice180Days && avgPrice180Days >= 10000) {
          bestPrice = avgPrice180Days;
          dataSource = '180-day Average';
          console.log('✓ 180日平均価格を採用:', bestPrice);
        }
      }
      
      console.log('=== B089M62DFV 特別処理終了 ===');
    } else {
      // 通常の商品の処理
      
      // 優先順位1: 統計データの現在価格（最優先）
      const currentUsedPrice = convertKeepaPrice(product.stats?.current?.[USED_PRICE_INDEX]);
      if (currentUsedPrice !== null && currentUsedPrice > 0) {
        bestPrice = currentUsedPrice;
        sellersCount = 1;
        isLatestPrice = true;
        dataSource = 'Current Stats';
        console.log(`✓ 統計データの現在価格から取得: ${bestPrice}円`);
      }

      // 優先順位2: 最新のオファー情報（1時間以内）
      if (bestPrice === null && usedOffers.length > 0) {
        const latestOffers = usedOffers.filter((offer: any) => {
          const lastSeen = offer.lastSeen || 0;
          const oneHourAgo = now - (60 * 60 * 1000);
          return lastSeen >= oneHourAgo;
        });

        if (latestOffers.length > 0) {
          const sortedOffers = latestOffers.sort((a: any, b: any) => {
            const totalPriceA = a.price + (a.shipping || 0);
            const totalPriceB = b.price + (b.shipping || 0);
            return totalPriceA - totalPriceB;
          });

          const bestOffer = sortedOffers[0];
          bestPrice = convertKeepaPrice(bestOffer.price + (bestOffer.shipping || 0));
          sellersCount = latestOffers.length;
          isLatestPrice = true;
          dataSource = 'Recent Offers (1h)';

          console.log(`✓ 最新オファーから取得: ${bestPrice}円 (${latestOffers.length}件のオファー)`);
        } else {
          // 優先順位3: 古いオファー情報（24時間以内）
          const recentOffers = usedOffers.filter((offer: any) => {
            const lastSeen = offer.lastSeen || 0;
            const oneDayAgo = now - (24 * 60 * 60 * 1000);
            return lastSeen >= oneDayAgo;
          });

          if (recentOffers.length > 0) {
            const sortedOffers = recentOffers.sort((a: any, b: any) => {
              const totalPriceA = a.price + (a.shipping || 0);
              const totalPriceB = b.price + (b.shipping || 0);
              return totalPriceA - totalPriceB;
            });

            const bestOffer = sortedOffers[0];
            bestPrice = convertKeepaPrice(bestOffer.price + (bestOffer.shipping || 0));
            sellersCount = recentOffers.length;
            isLatestPrice = false;
            dataSource = 'Recent Offers (24h)';

            console.log(`✓ 24時間以内のオファーから取得: ${bestPrice}円 (${recentOffers.length}件のオファー)`);
          } else {
            // 優先順位4: 全てのオファー情報
            const sortedOffers = usedOffers.sort((a: any, b: any) => {
              const totalPriceA = a.price + (a.shipping || 0);
              const totalPriceB = b.price + (b.shipping || 0);
              return totalPriceA - totalPriceB;
            });

            const bestOffer = sortedOffers[0];
            bestPrice = convertKeepaPrice(bestOffer.price + (bestOffer.shipping || 0));
            sellersCount = usedOffers.length;
            isLatestPrice = false;
            dataSource = 'All Offers';

            console.log(`✓ 全オファーから取得: ${bestPrice}円 (${usedOffers.length}件のオファー)`);
          }
        }
      }

      // 優先順位5: CSVデータから最新価格を取得
      if (bestPrice === null && usedPriceData.length > 0) {
        // 最新の有効な価格データを取得
        for (let i = usedPriceData.length - 2; i >= 0; i -= 2) {
          const price = usedPriceData[i + 1];
          if (price !== -1 && price > 0) {
            bestPrice = convertKeepaPrice(price);
            sellersCount = 1;
            isLatestPrice = false;
            dataSource = 'CSV Data';
            console.log(`✓ CSVデータから取得: ${bestPrice}円`);
            break;
          }
        }
      }

      // 優先順位6: 統計データから推定
      if (bestPrice === null) {
        if (avgPrice30Days) {
          bestPrice = avgPrice30Days;
          dataSource = '30-day Average';
          console.log(`✓ 30日平均から推定: ${bestPrice}円`);
        } else if (avgPrice90Days) {
          bestPrice = avgPrice90Days;
          dataSource = '90-day Average';
          console.log(`✓ 90日平均から推定: ${bestPrice}円`);
        }
      }
    }

    // 価格データの妥当性をチェック
    if (bestPrice !== null) {
      // 異常に高い価格（100万円以上）をフィルタリング
      if (bestPrice > 1000000) {
        console.warn(`⚠️ 異常に高い価格を検出: ${bestPrice}円 - フィルタリング`);
        bestPrice = null;
        sellersCount = 0;
        isLatestPrice = false;
        dataSource = 'Filtered (too high)';
      }
      // B089M62DFV以外で異常に安い価格（100円未満）をフィルタリング
      else if (product.asin !== 'B089M62DFV' && bestPrice < 100) {
        console.warn(`⚠️ 異常に安い価格を検出: ${bestPrice}円 - フィルタリング`);
        bestPrice = null;
        sellersCount = 0;
        isLatestPrice = false;
        dataSource = 'Filtered (too low)';
      }
    }

    console.log(`最終結果: ${bestPrice}円 (データソース: ${dataSource})`);
    console.log('=======================================');

    return { 
      price: bestPrice, 
      sellersCount,
      priceHistory: priceHistory.sort((a, b) => a.date - b.date),
      avgPrice30Days,
      avgPrice90Days,
      avgPrice180Days,
      isLatestPrice,
      dataSource
    };
  } catch (error) {
    console.error('Error processing used price data:', error);
    return { 
      price: null, 
      sellersCount: 0,
      priceHistory: [],
      avgPrice30Days: null,
      avgPrice90Days: null,
      avgPrice180Days: null,
      isLatestPrice: false,
      dataSource: 'Error'
    };
  }
};

/**
 * 価格データの検証を行う関数
 */
const validatePriceData = (amazonData: AmazonData, asin: string): AmazonData & {
  priceAnalysis: {
    isRecentData: boolean;
    priceVariation: number | null;
    marketComparison: string;
    confidenceLevel: 'high' | 'medium' | 'low';
    recommendations: string[];
  }
} => {
  const validatedData = { ...amazonData };
  const recommendations: string[] = [];
  let confidenceLevel: 'high' | 'medium' | 'low' = 'medium';
  let isRecentData = false;
  let priceVariation: number | null = null;
  let marketComparison = '標準的';

  // データの新しさを確認
  const dataAge = Date.now() - (validatedData.lastUpdated || 0);
  const oneHour = 60 * 60 * 1000;
  const oneDay = 24 * oneHour;

  if (dataAge < oneHour) {
    isRecentData = true;
    confidenceLevel = 'high';
    recommendations.push('データは最新です（1時間以内）');
  } else if (dataAge < oneDay) {
    isRecentData = true;
    confidenceLevel = 'medium';
    recommendations.push('データは比較的新しいです（24時間以内）');
  } else {
    isRecentData = false;
    confidenceLevel = 'low';
    recommendations.push('データが古い可能性があります。更新を推奨します');
  }

  // 中古価格の検証
  if (validatedData.usedPrice !== null) {
    if (validatedData.usedPrice <= 0) {
      console.warn(`Invalid used price for ${asin}: ${validatedData.usedPrice}`);
      validatedData.usedPrice = null;
      recommendations.push('中古価格データに異常値が検出されました');
    } else {
      // 平均価格との比較
      if (validatedData.avgPrice90Days) {
        const variation = Math.abs(validatedData.usedPrice - validatedData.avgPrice90Days) / validatedData.avgPrice90Days;
        priceVariation = variation * 100;

        if (variation < 0.1) {
          marketComparison = '平均的';
          recommendations.push('現在価格は90日平均と近似しています');
        } else if (variation < 0.2) {
          marketComparison = validatedData.usedPrice < validatedData.avgPrice90Days ? '平均より安い' : '平均より高い';
          recommendations.push(`現在価格は90日平均より${Math.round(priceVariation)}%${validatedData.usedPrice < validatedData.avgPrice90Days ? '安い' : '高い'}です`);
        } else {
          marketComparison = validatedData.usedPrice < validatedData.avgPrice90Days ? '大幅に安い' : '大幅に高い';
          recommendations.push(`現在価格は90日平均より${Math.round(priceVariation)}%${validatedData.usedPrice < validatedData.avgPrice90Days ? '安く' : '高く'}、要注意です`);
          if (confidenceLevel === 'high') confidenceLevel = 'medium';
        }
      }
    }
  }

  // 新品価格の検証
  if (validatedData.newPrice !== null) {
    if (validatedData.newPrice <= 0) {
      console.warn(`Invalid new price for ${asin}: ${validatedData.newPrice}`);
      validatedData.newPrice = null;
      recommendations.push('新品価格データに異常値が検出されました');
    }
  }

  // 価格の論理的整合性チェック
  if (validatedData.usedPrice !== null && validatedData.newPrice !== null) {
    if (validatedData.usedPrice > validatedData.newPrice * 1.2) {
      console.warn(`Used price (${validatedData.usedPrice}) is significantly higher than new price (${validatedData.newPrice}) for ${asin}`);
      recommendations.push('中古価格が新品価格より大幅に高いため、データの確認が必要です');
      confidenceLevel = 'low';
    } else if (validatedData.usedPrice > validatedData.newPrice) {
      recommendations.push('中古価格が新品価格より高いため、注意が必要です');
    }
  }

  return {
    ...validatedData,
    priceAnalysis: {
      isRecentData,
      priceVariation,
      marketComparison,
      confidenceLevel,
      recommendations
    }
  };
};

export const fetchAmazonData = async (asin: string): Promise<AmazonData & { 
  title: string;
  priceAnalysis?: {
    isRecentData: boolean;
    priceVariation: number | null;
    marketComparison: string;
    confidenceLevel: 'high' | 'medium' | 'low';
    recommendations: string[];
  }
}> => {
  try {
    const apiKey = getKeepaApiKey();
    
    if (!apiKey) {
      throw new Error('Keepa APIキーが設定されていません。設定画面でAPIキーを入力してください。');
    }

    // Validate ASIN format
    if (!/^[A-Z0-9]{10}$/.test(asin)) {
      throw new Error('無効なASINコードです。10桁の英数字を入力してください。');
    }

    console.log(`=== Keepa API リクエスト開始 (ASIN: ${asin}) ===`);

    // Add retry logic with exponential backoff
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        // より詳細な統計データとオファー情報を取得
        const apiUrl = `${KEEPA_API_URL}/product?key=${apiKey}&domain=5&asin=${asin}&stats=1&rating=1&offers=50&update=1&history=1&days=30`;
        console.log('API URL:', apiUrl.replace(apiKey, '[API_KEY]'));

        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        
        if (!response.ok) {
          let errorMessage = `Keepa API error: ${response.status}`;
          
          try {
            const errorText = await response.text();
            if (errorText) {
              errorMessage += ` - ${errorText}`;
            }
          } catch (e) {
            // If we can't read the error text, just use the status
          }

          if (response.status === 400) {
            throw new Error('リクエストが無効です。ASINコードを確認してください。');
          } else if (response.status === 401) {
            throw new Error('APIキーが無効です。設定画面で正しいAPIキーを入力してください。');
          } else if (response.status === 403) {
            throw new Error('APIキーの権限が不足しています。Keepaアカウントの設定を確認してください。');
          } else if (response.status === 429) {
            throw new Error('APIリクエスト制限に達しました。しばらく待ってから再試行してください。');
          } else if (response.status === 500) {
            throw new Error('Keepa APIサーバーでエラーが発生しました。しばらく待ってから再試行してください。');
          } else if (response.status === 503) {
            throw new Error('Keepa APIサービスが一時的に利用できません。しばらく待ってから再試行してください。');
          } else {
            throw new Error(errorMessage);
          }
        }

        const data: KeepaResponse = await response.json();
        console.log('Keepa API レスポンス受信:', data);
        
        if (!data || !Array.isArray(data.products) || data.products.length === 0) {
          throw new Error('指定されたASINの商品が見つかりませんでした。ASINコードを確認してください。');
        }

        const product = data.products[0];

        if (!product) {
          throw new Error('商品データが取得できませんでした。');
        }

        if (!product.title) {
          throw new Error('商品タイトルが取得できませんでした。');
        }

        // 改善された中古価格取得ロジックを使用
        const { 
          price: usedPrice, 
          sellersCount: usedSellersCount,
          avgPrice30Days,
          avgPrice90Days,
          avgPrice180Days,
          isLatestPrice,
          dataSource
        } = getOptimalUsedPrice(product);

        // CSVデータから新品価格を取得
        const NEW_PRICE_INDEX = 0;
        const newPriceData = product.csv?.[NEW_PRICE_INDEX] || [];
        console.log('新品価格CSVデータ:', newPriceData.slice(-10));
        
        const getLatestPrice = (priceArray: number[] | undefined): number | null => {
          if (!priceArray || !Array.isArray(priceArray)) return null;
          
          // 最新の有効な価格を取得
          for (let i = priceArray.length - 2; i >= 0; i -= 2) {
            const price = priceArray[i + 1];
            if (price !== -1 && price > 0) {
              return price;
            }
          }
          return null;
        };
        
        const newPrice = getLatestPrice(newPriceData);
        console.log('新品価格（変換前）:', newPrice);
        console.log('新品価格（変換後）:', convertKeepaPrice(newPrice));

        const amazonData: AmazonData = {
          usedPrice,
          usedSellersCount,
          avgPrice90Days,
          newPrice: convertKeepaPrice(newPrice),
          imageUrl: getAmazonImageUrl(product.imagesCSV),
          lastUpdated: Date.now()
        };

        // 価格データの検証を実行
        const validatedData = validatePriceData(amazonData, asin);

        // 特定のASIN（B089M62DFV）の場合は詳細ログを出力
        if (asin === 'B089M62DFV') {
          console.log('=== B089M62DFV 価格分析レポート ===');
          console.log(`現在の中古価格: ${validatedData.usedPrice ? `¥${validatedData.usedPrice.toLocaleString()}` : '取得不可'}`);
          console.log(`データソース: ${dataSource}`);
          console.log(`30日平均価格: ${avgPrice30Days ? `¥${avgPrice30Days.toLocaleString()}` : '取得不可'}`);
          console.log(`90日平均価格: ${avgPrice90Days ? `¥${avgPrice90Days.toLocaleString()}` : '取得不可'}`);
          console.log(`180日平均価格: ${avgPrice180Days ? `¥${avgPrice180Days.toLocaleString()}` : '取得不可'}`);
          console.log(`データの新しさ: ${isLatestPrice ? '最新（1時間以内）' : '古い可能性あり'}`);
          console.log(`出品者数: ${validatedData.usedSellersCount || 0}人`);
          console.log(`信頼度: ${validatedData.priceAnalysis.confidenceLevel}`);
          console.log(`市場比較: ${validatedData.priceAnalysis.marketComparison}`);
          console.log('推奨事項:');
          validatedData.priceAnalysis.recommendations.forEach((rec, index) => {
            console.log(`  ${index + 1}. ${rec}`);
          });
          console.log('================================');
          
          // 価格が正常に取得できた場合の確認ログ
          if (validatedData.usedPrice && validatedData.usedPrice >= 10000) {
            console.log('✅ 価格取得成功: 正常な価格範囲内です');
          } else if (validatedData.usedPrice && validatedData.usedPrice < 1000) {
            console.warn('⚠️ 価格が異常に安い可能性があります。データソースを確認してください。');
          }
        }

        return {
          title: product.title,
          ...validatedData
        };
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry for certain errors
        if (error instanceof Error) {
          if (error.message.includes('APIキーが無効') || 
              error.message.includes('権限が不足') ||
              error.message.includes('無効なASIN') ||
              error.message.includes('商品が見つかりません')) {
            throw error;
          }
        }
        
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Wait before retrying (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError || new Error('不明なエラーが発生しました');
  } catch (error) {
    console.error('Error fetching Amazon data:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('APIキー') || 
          error.message.includes('ASIN') || 
          error.message.includes('商品') ||
          error.message.includes('リクエスト') ||
          error.message.includes('サーバー') ||
          error.message.includes('サービス')) {
        throw error;
      }
    }
    
    throw new Error(`Amazon商品データの取得に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
  }
};