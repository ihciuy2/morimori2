import React, { useState, useMemo } from 'react';
import { Star, Search, Filter, Clock, TrendingUp, Package } from 'lucide-react';
import { useProducts } from '../context/ProductContext';
import { Product } from '../types';
import { formatCurrency } from '../utils/formatters';

interface ProductListProps {
  selectedProduct: Product | null;
  onSelectProduct: (product: Product) => void;
}

type SortOption = 'name' | 'profitRate' | 'updatedAt' | 'maxPurchasePrice';
type FilterOption = 'all' | 'favorites' | 'profitable' | 'new' | 'used';
type TimeFilter = '24h' | '12h' | 'all';

const ProductList: React.FC<ProductListProps> = ({ selectedProduct, onSelectProduct }) => {
  const { products, updateProduct } = useProducts();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('updatedAt');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const toggleFavorite = (productId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(productId)) {
      newFavorites.delete(productId);
    } else {
      newFavorites.add(productId);
    }
    setFavorites(newFavorites);
  };

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products.filter(product => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!product.name.toLowerCase().includes(query) && 
            !product.asin.toLowerCase().includes(query) &&
            !product.yahooKeyword.toLowerCase().includes(query)) {
          return false;
        }
      }

      // Category filter
      switch (filterBy) {
        case 'favorites':
          return favorites.has(product.id);
        case 'profitable':
          return product.profitAnalysis?.isProfitable || false;
        case 'new':
          return product.amazonData?.newPrice !== null;
        case 'used':
          return product.amazonData?.usedPrice !== null;
        default:
          return true;
      }
    });

    // Time filter
    if (timeFilter !== 'all') {
      const now = Date.now();
      const timeLimit = timeFilter === '24h' ? 24 * 60 * 60 * 1000 : 12 * 60 * 60 * 1000;
      filtered = filtered.filter(product => now - product.updatedAt <= timeLimit);
    }

    // Sort
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'profitRate':
          const aProfitRate = a.profitAnalysis?.profitRate || -Infinity;
          const bProfitRate = b.profitAnalysis?.profitRate || -Infinity;
          return bProfitRate - aProfitRate;
        case 'maxPurchasePrice':
          const aPrice = a.maxPurchasePrice || 0;
          const bPrice = b.maxPurchasePrice || 0;
          return bPrice - aPrice;
        case 'updatedAt':
        default:
          return b.updatedAt - a.updatedAt;
      }
    });
  }, [products, searchQuery, sortBy, filterBy, timeFilter, favorites]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">登録済商品一覧</h2>
        
        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="商品名、ASIN、キーワードで検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-1 mb-3">
          {[
            { key: 'all', label: '全て', icon: Package },
            { key: 'favorites', label: 'お気に入り', icon: Star },
            { key: 'profitable', label: '利益対象', icon: TrendingUp },
            { key: 'new', label: '新品', icon: Package },
            { key: 'used', label: '中古', icon: Package },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setFilterBy(key as FilterOption)}
              className={`flex items-center px-2 py-1 text-xs rounded-md transition-colors ${
                filterBy === key
                  ? 'bg-blue-100 text-blue-700 font-medium'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Icon className="w-3 h-3 mr-1" />
              {label}
            </button>
          ))}
        </div>

        {/* Sort and Time Filter */}
        <div className="flex gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
          >
            <option value="updatedAt">更新日時順</option>
            <option value="profitRate">利益率順</option>
            <option value="name">商品名順</option>
            <option value="maxPurchasePrice">上限金額順</option>
          </select>
          
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
            className="px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">全期間</option>
            <option value="24h">24時間</option>
            <option value="12h">12時間</option>
          </select>
        </div>
      </div>

      {/* Product List */}
      <div className="flex-1 overflow-y-auto">
        {filteredAndSortedProducts.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <Package className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">条件に一致する商品がありません</p>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {filteredAndSortedProducts.map((product) => (
              <div
                key={product.id}
                onClick={() => onSelectProduct(product)}
                className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                  selectedProduct?.id === product.id
                    ? 'bg-blue-50 border-2 border-blue-200 shadow-sm'
                    : 'bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(product.id);
                    }}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <Star
                      className={`w-4 h-4 ${
                        favorites.has(product.id)
                          ? 'text-yellow-500 fill-current'
                          : 'text-gray-400'
                      }`}
                    />
                  </button>
                  
                  {product.status === 'loading' && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  )}
                </div>

                <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-2 leading-tight">
                  {product.name}
                </h3>

                {product.maxPurchasePrice && (
                  <p className="text-xs text-gray-600 mb-2">
                    上限金額：{formatCurrency(product.maxPurchasePrice)}
                  </p>
                )}

                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500">
                    {product.profitAnalysis?.isProfitable ? (
                      <span className="text-green-600 font-medium">利益対象</span>
                    ) : (
                      <span className="text-gray-500">対象外</span>
                    )}
                  </span>
                  
                  {product.profitAnalysis?.profitRate && (
                    <span className={`font-medium ${
                      product.profitAnalysis.profitRate >= product.targetProfitRate
                        ? 'text-green-600'
                        : 'text-amber-600'
                    }`}>
                      {product.profitAnalysis.profitRate.toFixed(1)}%
                    </span>
                  )}
                </div>

                {product.status === 'error' && (
                  <div className="mt-2 text-xs text-red-600 flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    エラー
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-600 space-y-1">
          <div className="flex justify-between">
            <span>表示中:</span>
            <span>{filteredAndSortedProducts.length}件</span>
          </div>
          <div className="flex justify-between">
            <span>利益対象:</span>
            <span className="text-green-600 font-medium">
              {filteredAndSortedProducts.filter(p => p.profitAnalysis?.isProfitable).length}件
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductList;