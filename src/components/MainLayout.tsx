import React, { useState } from 'react';
import ProductList from './ProductList';
import ProductDetail from './ProductDetail';
import { Product } from '../types';

const MainLayout: React.FC = () => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  return (
    <main className="flex-1 flex bg-gray-50">
      {/* Left Sidebar: Product List */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <ProductList 
          selectedProduct={selectedProduct}
          onSelectProduct={setSelectedProduct}
        />
      </div>
      
      {/* Main Panel: Product Detail */}
      <div className="flex-1 bg-gray-50">
        <ProductDetail product={selectedProduct} />
      </div>
    </main>
  );
};

export default MainLayout;