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
    };
    offers?: Array<{
      condition: number;
      price: number;
      shipping: number;
      prime: boolean;
      fba: boolean;
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
const getOptimalUsedPrice = (product: any): { price: number | null; sellersCount: number } => {
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

    // オファー情報がある場合は、それを優先して使用
    if (usedOffers.length > 0) {
      // 価格順にソートして最安値を取得
      const sortedOffers = usedOffers.sort((a: any, b: any) => {
        const totalPriceA = a.price + (a.shipping || 0);
        const totalPriceB = b.price + (b.shipping || 0);
        return totalPriceA - totalPriceB;
      });

      const bestOffer = sortedOffers[0];
      bestPrice = convertKeepaPrice(bestOffer.price + (bestOffer.shipping || 0));
      sellersCount = usedOffers.length;

      console.log(`Found ${usedOffers.length} used offers, best price: ${bestPrice}`);
    } else {
      // オファー情報がない場合は、CSVデータから最新価格を取得
      const validPrices = usedPriceData.filter((price: number) => price !== -1 && price > 0);
      if (validPrices.length > 0) {
        // 最新の価格を取得
        bestPrice = convertKeepaPrice(validPrices[validPrices.length - 1]);
        sellersCount = validPrices.length;
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
      }
    }

    return { price: bestPrice, sellersCount };
  } catch (error) {
    console.error('Error processing used price data:', error);
    return { price: null, sellersCount: 0 };
  }
};

/**
 * 価格データの検証を行う関数
 */
const validatePriceData = (amazonData: AmazonData, asin: string): AmazonData => {
  const validatedData = { ...amazonData };

  // 中古価格の検証
  if (validatedData.usedPrice !== null) {
    if (validatedData.usedPrice <= 0) {
      console.warn(`Invalid used price for ${asin}: ${validatedData.usedPrice}`);
      validatedData.usedPrice = null;
    }
  }

  // 新品価格の検証
  if (validatedData.newPrice !== null) {
    if (validatedData.newPrice <= 0) {
      console.warn(`Invalid new price for ${asin}: ${validatedData.newPrice}`);
      validatedData.newPrice = null;
    }
  }

  // 価格の論理的整合性チェック
  if (validatedData.usedPrice !== null && validatedData.newPrice !== null) {
    // 中古価格が新品価格より高い場合は警告
    if (validatedData.usedPrice > validatedData.newPrice * 1.2) {
      console.warn(`Used price (${validatedData.usedPrice}) is significantly higher than new price (${validatedData.newPrice}) for ${asin}`);
    }
  }

  return validatedData;
};

export const fetchAmazonData = async (asin: string): Promise<AmazonData & { title: string }> => {
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
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds timeout

        // オファー情報も含めて取得するようにパラメータを調整
        const response = await fetch(`${KEEPA_API_URL}/product?key=${apiKey}&domain=5&asin=${asin}&stats=90&rating=1&offers=20&update=1&history=1`, {
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
        const { price: usedPrice, sellersCount: usedSellersCount } = getOptimalUsedPrice(product);

        // CSVデータから新品価格を取得
        const NEW_PRICE_INDEX = 0;
        const newPriceData = product.csv?.[NEW_PRICE_INDEX] || [];
        const getLatestPrice = (priceArray: number[] | undefined): number | null => {
          if (!priceArray || !Array.isArray(priceArray)) return null;
          const validPrices = priceArray.filter(p => p !== -1 && p > 0);
          return validPrices.length > 0 ? validPrices[validPrices.length - 1] : null;
        };
        const newPrice = getLatestPrice(newPriceData);

        // 90日平均価格を取得
        const USED_PRICE_INDEX = 1;
        const avgPrice90Days = product.stats?.avg90?.[USED_PRICE_INDEX] || null;

        const amazonData: AmazonData = {
          usedPrice,
          usedSellersCount,
          avgPrice90Days: convertKeepaPrice(avgPrice90Days),
          newPrice: convertKeepaPrice(newPrice),
          imageUrl: getAmazonImageUrl(product.imagesCSV),
          lastUpdated: Date.now()
        };

        // 価格データの検証を実行
        const validatedData = validatePriceData(amazonData, asin);

        console.log(`Successfully fetched data for ${asin}:`, {
          usedPrice: validatedData.usedPrice,
          usedSellersCount: validatedData.usedSellersCount,
          newPrice: validatedData.newPrice
        });

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
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Max 10 seconds
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError || new Error('不明なエラーが発生しました');
  } catch (error) {
    console.error('Error fetching Amazon data:', error);
    
    if (error instanceof Error) {
      // If it's already a user-friendly error message, throw it as is
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