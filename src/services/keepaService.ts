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
 * コンディション別に価格を分析し、最適な価格を返す
 */
const getOptimalUsedPrice = (product: any): { 
  price: number | null; 
  sellersCount: number;
  priceHistory: Array<{ date: number; price: number }>;
  avgPrice30Days: number | null;
  avgPrice90Days: number | null;
  avgPrice180Days: number | null;
  isLatestPrice: boolean;
} => {
  try {
    // CSVデータから中古価格を取得
    const USED_PRICE_INDEX = 1;
    const usedPriceData = product.csv?.[USED_PRICE_INDEX] || [];
    
    // 現在のオファー情報から中古商品を抽出
    const usedOffers = product.offers?.filter((offer: any) => {
      // コンディション: 1=Used-Like New, 2=Used-Very Good, 3=Used-Good, 4=Used-Acceptable
      return offer.condition >= 1 && offer.condition <= 4 && offer.price > 0;
    }) || [];

    let bestPrice: number | null = null;
    let sellersCount = 0;
    let isLatestPrice = false;

    // 価格履歴の構築（過去30日分）
    const priceHistory: Array<{ date: number; price: number }> = [];
    const now = Date.now();
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

    // 統計データから平均価格を取得
    const avgPrice30Days = convertKeepaPrice(product.stats?.avg30?.[USED_PRICE_INDEX]);
    const avgPrice90Days = convertKeepaPrice(product.stats?.avg90?.[USED_PRICE_INDEX]);
    const avgPrice180Days = convertKeepaPrice(product.stats?.avg180?.[USED_PRICE_INDEX]);

    // オファー情報がある場合は、それを優先して使用
    if (usedOffers.length > 0) {
      // 最新のオファーを確認
      const latestOffers = usedOffers.filter((offer: any) => {
        const lastSeen = offer.lastSeen || 0;
        const oneHourAgo = now - (60 * 60 * 1000);
        return lastSeen >= oneHourAgo;
      });

      if (latestOffers.length > 0) {
        // 価格順にソートして最安値を取得
        const sortedOffers = latestOffers.sort((a: any, b: any) => {
          const totalPriceA = a.price + (a.shipping || 0);
          const totalPriceB = b.price + (b.shipping || 0);
          return totalPriceA - totalPriceB;
        });

        const bestOffer = sortedOffers[0];
        bestPrice = convertKeepaPrice(bestOffer.price + (bestOffer.shipping || 0));
        sellersCount = latestOffers.length;
        isLatestPrice = true;

        console.log(`Found ${latestOffers.length} recent used offers, best price: ${bestPrice}`);
      } else {
        // 古いオファー情報を使用
        const sortedOffers = usedOffers.sort((a: any, b: any) => {
          const totalPriceA = a.price + (a.shipping || 0);
          const totalPriceB = b.price + (b.shipping || 0);
          return totalPriceA - totalPriceB;
        });

        const bestOffer = sortedOffers[0];
        bestPrice = convertKeepaPrice(bestOffer.price + (bestOffer.shipping || 0));
        sellersCount = usedOffers.length;
        isLatestPrice = false;

        console.log(`Using older offer data, ${usedOffers.length} offers, best price: ${bestPrice}`);
      }
    } else {
      // オファー情報がない場合は、CSVデータから最新価格を取得
      const validPrices = usedPriceData.filter((price: number, index: number) => {
        return index % 2 === 1 && price !== -1 && price > 0;
      });
      
      if (validPrices.length > 0) {
        bestPrice = convertKeepaPrice(validPrices[validPrices.length - 1]);
        sellersCount = Math.floor(validPrices.length / 2);
        isLatestPrice = false;
        console.log(`Using CSV data, latest price: ${bestPrice}, data points: ${sellersCount}`);
      }
    }

    // 価格データの妥当性をチェック
    if (bestPrice !== null) {
      // 異常に高い価格（100万円以上）や安い価格（100円未満）をフィルタリング
      if (bestPrice > 1000000 || bestPrice < 100) {
        console.warn(`Suspicious price detected: ${bestPrice}, filtering out`);
        bestPrice = null;
        sellersCount = 0;
        isLatestPrice = false;
      }
    }

    return { 
      price: bestPrice, 
      sellersCount,
      priceHistory: priceHistory.sort((a, b) => a.date - b.date),
      avgPrice30Days,
      avgPrice90Days,
      avgPrice180Days,
      isLatestPrice
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
      isLatestPrice: false
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

    // Add retry logic with exponential backoff
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        // より詳細な統計データとオファー情報を取得
        const response = await fetch(`${KEEPA_API_URL}/product?key=${apiKey}&domain=5&asin=${asin}&stats=1&rating=1&offers=50&update=1&history=1&days=30`, {
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
          isLatestPrice
        } = getOptimalUsedPrice(product);

        // CSVデータから新品価格を取得
        const NEW_PRICE_INDEX = 0;
        const newPriceData = product.csv?.[NEW_PRICE_INDEX] || [];
        const getLatestPrice = (priceArray: number[] | undefined): number | null => {
          if (!priceArray || !Array.isArray(priceArray)) return null;
          const validPrices = priceArray.filter(p => p !== -1 && p > 0);
          return validPrices.length > 0 ? validPrices[validPrices.length - 1] : null;
        };
        const newPrice = getLatestPrice(newPriceData);

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

        // 特定のASIN（B01HC98W74）の場合は詳細ログを出力
        if (asin === 'B01HC98W74') {
          console.log('=== B01HC98W74 価格分析レポート ===');
          console.log(`現在の中古価格: ${validatedData.usedPrice ? `¥${validatedData.usedPrice.toLocaleString()}` : '取得不可'}`);
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