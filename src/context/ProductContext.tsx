import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';

export interface Product {
  id: string;
  asin: string;
  keyword?: string;
  title?: string;
  name?: string;
  newPrice?: string;
  usedPrice?: string;
  images?: string[];
  salesRank?: string;
  keepaChart?: string;
  createdAt: number;
  updatedAt: number;
  status: 'pending' | 'loading' | 'success' | 'error';
  error?: string;
  // キャッシュされたKeepaデータ
  keepaData?: any;
  lastFetched?: number;
}

interface ProductContextType {
  products: Product[];
  selectedProducts: Set<string>;
  addProduct: (asinOrKeyword: string, isKeyword?: boolean) => void;
  removeProduct: (id: string) => void;
  refreshProduct: (id: string) => Promise<void>;
  refreshSelectedProducts: () => Promise<void>;
  updateProductAsin: (id: string, asin: string) => Promise<void>;
  getProductData: (asin: string) => Promise<any>;
  toggleProductSelection: (id: string) => void;
  selectAllProducts: () => void;
  clearSelection: () => void;
  isLoading: boolean;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
};

// キャッシュ保持時間（30分）
const CACHE_DURATION = 30 * 60 * 1000;

export const ProductProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [lastRequestTime, setLastRequestTime] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  // ローカルストレージからデータを復元
  useEffect(() => {
    console.log('Loading data from localStorage...');
    
    const savedProducts = localStorage.getItem('products');
    if (savedProducts) {
      try {
        const parsedProducts = JSON.parse(savedProducts);
        console.log('Restored products from localStorage:', parsedProducts);
        setProducts(parsedProducts);
      } catch (error) {
        console.error('Error parsing saved products:', error);
        localStorage.removeItem('products');
      }
    }

    const savedSelectedProducts = localStorage.getItem('selectedProducts');
    if (savedSelectedProducts) {
      try {
        const selectedArray = JSON.parse(savedSelectedProducts);
        console.log('Restored selected products from localStorage:', selectedArray);
        setSelectedProducts(new Set(selectedArray));
      } catch (error) {
        console.error('Error parsing saved selected products:', error);
        localStorage.removeItem('selectedProducts');
      }
    }
    
    setIsInitialized(true);
    console.log('Data initialization completed');
  }, []);

  // 製品データをローカルストレージに保存
  useEffect(() => {
    // 初期化が完了してからのみ保存処理を実行
    if (!isInitialized) return;
    
    console.log('Saving products to localStorage:', products);
    if (products.length > 0) {
      localStorage.setItem('products', JSON.stringify(products));
    } else {
      // 全ての製品が削除された場合は、ローカルストレージからも削除
      const savedProducts = localStorage.getItem('products');
      if (savedProducts) {
        console.log('Removing products from localStorage (all products deleted)');
        localStorage.removeItem('products');
      }
    }
  }, [products, isInitialized]);

  // 選択状態をローカルストレージに保存
  useEffect(() => {
    // 初期化が完了してからのみ保存処理を実行
    if (!isInitialized) return;
    
    console.log('Saving selected products to localStorage:', Array.from(selectedProducts));
    localStorage.setItem('selectedProducts', JSON.stringify(Array.from(selectedProducts)));
  }, [selectedProducts, isInitialized]);

  const addProduct = (asinOrKeyword: string, isKeyword?: boolean) => {
    const newProduct: Product = {
      id: uuidv4(),
      asin: isKeyword ? '' : asinOrKeyword,
      keyword: isKeyword ? asinOrKeyword : undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: 'success', // 登録時は成功状態で追加
    };
    setProducts(prev => [...prev, newProduct]);
    // API呼び出しは削除 - 商品詳細表示時のみAPI使用
  };

  const removeProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };

  const refreshProduct = async (id: string) => {
    const product = products.find(p => p.id === id);
    if (product) {
      setProducts(prev => prev.map(p => p.id === id ? { ...p, status: 'loading', error: undefined } : p));
      await fetchAndUpdateProduct(id, product.asin);
    }
  };

  const fetchAndUpdateProduct = async (id: string, asin: string) => {
    try {
      setIsLoading(true);
      
      // レート制限対策：前回のリクエストから2秒以上空ける
      const now = Date.now();
      const timeSinceLastRequest = now - lastRequestTime;
      const minInterval = 2000; // 2秒
      
      if (timeSinceLastRequest < minInterval) {
        const waitTime = minInterval - timeSinceLastRequest;
        console.log(`レート制限対策のため${waitTime}ms待機中...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
      
      setLastRequestTime(Date.now());
      
      const apiKey = localStorage.getItem('keepaApiKey') || '';
      
      if (!apiKey) {
        throw new Error('Keepa APIキーが設定されていません。設定画面から入力してください。');
      }
      
      console.log('Fetching data for ASIN:', asin);
      
      // Viteプロキシを使用してKeepa APIを呼び出し
      const keepaUrl = `/keepa-api/product?key=${apiKey}&domain=5&asin=${asin}&history=1`;
      
      const res = await fetch(keepaUrl, {
        method: 'GET',
        headers: {
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Keepa API Error:', res.status, errorText);
        
        if (res.status === 429) {
          throw new Error('レート制限に達しました。1分ほど待ってから再試行してください。');
        } else if (res.status === 401) {
          throw new Error('APIキーが無効です。設定を確認してください。');
        } else {
          throw new Error(`APIエラー: ${res.status} - ${errorText.substring(0, 100)}`);
        }
      }
      
      const keepaData = await res.json();
      console.log('Keepa API Response:', keepaData);
      
      // Keepa APIレスポンスを変換
      const product = keepaData.products?.[0];
      if (!product) {
        throw new Error('商品が見つかりません');
      }
      
      console.log('Product object:', product);
      console.log('CSV data structure:', product.csv);
      console.log('CSV length:', product.csv?.length);
      
      // 価格データの解析（正しいインデックスを使用）
      let amazonPrice: number | null = null;
      let newPrice: number | null = null;
      let usedPrice: number | null = null;
      
      if (product.csv && product.csv.length > 0) {
        // csv[0]: Amazon price（Amazon直販価格）
        const amazonPriceData = product.csv[0] || [];
        // csv[1]: NEW（マーケットプレイス新品価格）
        const newPriceData = product.csv[1] || [];
        // csv[2]: USED（中古価格）
        const usedPriceData = product.csv[2] || [];
        
        console.log('Price data - Amazon (csv[0]):', amazonPriceData);
        console.log('Price data - New (csv[1]):', newPriceData);
        console.log('Price data - Used (csv[2]):', usedPriceData);
        
        // Amazon価格の最新値を取得
        if (amazonPriceData.length >= 2) {
          const latestAmazonPrice = amazonPriceData[amazonPriceData.length - 1];
          console.log('Latest Amazon price raw:', latestAmazonPrice);
          if (latestAmazonPrice !== -1 && latestAmazonPrice !== null) {
            amazonPrice = latestAmazonPrice;
            console.log('Amazon price processed:', amazonPrice);
          }
        }
        
        // 新品価格の最新値を取得
        if (newPriceData.length >= 2) {
          const latestNewPrice = newPriceData[newPriceData.length - 1];
          console.log('Latest New price raw:', latestNewPrice);
          if (latestNewPrice !== -1 && latestNewPrice !== null) {
            newPrice = latestNewPrice;
            console.log('New price processed:', newPrice);
          }
        }
        
        // 中古価格の最新値を取得
        if (usedPriceData.length >= 2) {
          const latestUsedPrice = usedPriceData[usedPriceData.length - 1];
          console.log('Latest Used price raw:', latestUsedPrice);
          if (latestUsedPrice !== -1 && latestUsedPrice !== null) {
            usedPrice = latestUsedPrice;
            console.log('Used price processed:', usedPrice);
          }
        }
      }
      
      // 新品価格：Amazon価格があればそれを、なければマーケットプレイス新品価格を使用
      const bestNewPrice = amazonPrice || newPrice;
      
      // ランキング取得（sales rank）
      let salesRank: number | null = null;
      if (product.csv && product.csv.length > 3 && product.csv[3]) {
        const rankData = product.csv[3]; // csv[3]: SALES（セールスランク）
        if (rankData.length >= 2) {
          salesRank = rankData[rankData.length - 1];
        }
      }
      
      // 商品画像の取得（Keepa APIから）
      const images = product.imagesCSV ? 
        product.imagesCSV.split(',').filter(Boolean).map((img: string) => `https://images-na.ssl-images-amazon.com/images/I/${img}`) :
        [];
      
      const data = {
        title: product.title || '',
        newPrice: bestNewPrice ? `¥${bestNewPrice.toLocaleString()}` : '',
        usedPrice: usedPrice ? `¥${usedPrice.toLocaleString()}` : '',
        salesRank: salesRank ? salesRank.toLocaleString() : '',
        images: images.length > 0 ? images : [`https://images-na.ssl-images-amazon.com/images/P/${asin}.01.L.jpg`],
      };
      
      console.log('Parsed data:', data);
      
      setProducts(prev => prev.map(p => p.id === id ? {
        ...p,
        ...data,
        title: data.title || '',
        name: data.title || '',
        newPrice: data.newPrice || '',
        usedPrice: data.usedPrice || '',
        images: data.images || [],
        salesRank: data.salesRank || '',
        updatedAt: Date.now(),
        status: 'success',
        error: undefined,
        keepaData: keepaData,
        lastFetched: Date.now()
      } : p));
    } catch (e: any) {
      console.error('Error fetching product data:', e);
      setProducts(prev => prev.map(p => p.id === id ? {
        ...p,
        status: 'error',
        error: e.message || '取得に失敗しました'
      } : p));
    } finally {
      setIsLoading(false);
    }
  };

  const getProductData = async (asin: string) => {
    const product = products.find(p => p.asin === asin);
    if (product && product.lastFetched && Date.now() - product.lastFetched < CACHE_DURATION) {
      return product.keepaData;
    }
    await fetchAndUpdateProduct(product?.id || '', asin);
    return product?.keepaData;
  };

  const refreshSelectedProducts = async () => {
    if (selectedProducts.size === 0) {
      console.log('No products selected for refresh');
      return;
    }
    
    setIsLoading(true);
    
    for (const productId of selectedProducts) {
      const product = products.find(p => p.id === productId);
      if (product && product.asin) {
        try {
          await refreshProduct(productId);
          // レート制限対策のため少し待機
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`Failed to refresh product ${productId}:`, error);
        }
      }
    }
    
    setIsLoading(false);
    // 更新完了後に選択をクリア
    setSelectedProducts(new Set());
  };

  const toggleProductSelection = (id: string) => {
    setSelectedProducts(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(id)) {
        newSelection.delete(id);
      } else {
        newSelection.add(id);
      }
      return newSelection;
    });
  };

  const selectAllProducts = () => {
    const allProductIds = products.map(p => p.id);
    setSelectedProducts(new Set(allProductIds));
  };

  const clearSelection = () => {
    setSelectedProducts(new Set());
  };

  const updateProductAsin = async (id: string, asin: string) => {
    if (!/^[A-Z0-9]{10}$/.test(asin)) {
      throw new Error('有効な10桁のASINコードを入力してください');
    }
    
    // 商品のASINを更新
    setProducts(prev => prev.map(p => 
      p.id === id 
        ? { ...p, asin: asin, status: 'loading', updatedAt: Date.now() }
        : p
    ));
    
    // Keepa APIでデータを取得
    await fetchAndUpdateProduct(id, asin);
  };

  return (
    <ProductContext.Provider value={{
      products,
      selectedProducts,
      addProduct,
      removeProduct,
      refreshProduct,
      refreshSelectedProducts,
      updateProductAsin,
      getProductData,
      toggleProductSelection,
      selectAllProducts,
      clearSelection,
      isLoading
    }}>
      {children}
    </ProductContext.Provider>
  );
};