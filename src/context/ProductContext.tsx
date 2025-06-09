import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Product } from '../types';
import { fetchAmazonData } from '../services/keepaService';
import { fetchYahooData } from '../services/yahooService';
import { calculateProfit } from '../utils/calculationUtils';
import { v4 as uuidv4 } from 'uuid';

interface ProductContextType {
  products: Product[];
  addProduct: (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'error'>) => void;
  updateProduct: (id: string, productData: Partial<Product>) => void;
  removeProduct: (id: string) => void;
  refreshProduct: (id: string) => Promise<void>;
  refreshAllProducts: () => Promise<void>;
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

export const ProductProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const savedProducts = localStorage.getItem('products');
    if (savedProducts) {
      try {
        setProducts(JSON.parse(savedProducts));
      } catch (error) {
        console.error('Failed to parse saved products:', error);
        localStorage.removeItem('products');
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('products', JSON.stringify(products));
  }, [products]);

  const addProduct = (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'error'>) => {
    const newProduct: Product = {
      ...productData,
      id: uuidv4(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: 'pending',
    };
    
    setProducts(prevProducts => [...prevProducts, newProduct]);
    refreshProduct(newProduct.id);
  };

  const updateProduct = (id: string, productData: Partial<Product>) => {
    setProducts(prevProducts => 
      prevProducts.map(product => 
        product.id === id 
          ? { 
              ...product, 
              ...productData, 
              updatedAt: Date.now(),
              // 商品名やキーワードが変更された場合は再取得
              status: productData.name || productData.yahooKeyword ? 'pending' : product.status
            } 
          : product
      )
    );

    // 商品名やキーワードが変更された場合は価格情報を再取得
    if (productData.name || productData.yahooKeyword) {
      refreshProduct(id);
    }
  };

  const removeProduct = (id: string) => {
    setProducts(prevProducts => prevProducts.filter(product => product.id !== id));
  };

  const refreshProduct = async (id: string) => {
    const product = products.find(p => p.id === id);
    if (!product) return;

    updateProduct(id, { status: 'loading', error: undefined });

    try {
      const amazonData = await fetchAmazonData(product.asin);
      updateProduct(id, { amazonData });

      const yahooData = await fetchYahooData(product.yahooKeyword);
      updateProduct(id, { yahooData });

      if (amazonData && yahooData) {
        const profitAnalysis = calculateProfit({
          amazonUsedPrice: amazonData.usedPrice,
          yahooAvgPrice: yahooData.avgPrice,
          targetProfitRate: product.targetProfitRate
        });
        
        updateProduct(id, { 
          profitAnalysis,
          status: 'success'
        });
      }
    } catch (error) {
      console.error(`Failed to refresh product ${id}:`, error);
      updateProduct(id, { 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      });
    }
  };

  const refreshAllProducts = async () => {
    setIsLoading(true);
    
    try {
      await Promise.all(products.map(product => refreshProduct(product.id)));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProductContext.Provider value={{
      products,
      addProduct,
      updateProduct,
      removeProduct,
      refreshProduct,
      refreshAllProducts,
      isLoading
    }}>
      {children}
    </ProductContext.Provider>
  );
};