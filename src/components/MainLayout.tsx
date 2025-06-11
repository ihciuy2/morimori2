import React, { useState } from 'react';
import ProductList from './ProductList';
import AmazonInfoCard from './AmazonInfoCard';
import { useProducts } from '../context/ProductContext';

const MainLayout: React.FC = () => {
  const { products } = useProducts();
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  
  const selectedProduct = selectedProductId 
    ? products.find(p => p.id === selectedProductId) 
    : null;

  return (
    <main className="flex-1 flex bg-gray-50">
      {/* 左側: 商品一覧 */}
      <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
        <ProductList 
          selectedProductId={selectedProductId}
          onProductSelect={setSelectedProductId}
        />
      </div>
      
      {/* 右側: 商品詳細 */}
      <div className="flex-1 bg-gray-50 overflow-auto">
        {selectedProduct ? (
          <AmazonInfoCard 
            key={selectedProduct.id}
            product={selectedProduct}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-lg flex items-center justify-center">
                📦
              </div>
              <p className="text-lg font-medium mb-2">商品を選択してください</p>
              <p className="text-sm">左側のリストから商品をクリックすると詳細情報が表示されます</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default MainLayout;