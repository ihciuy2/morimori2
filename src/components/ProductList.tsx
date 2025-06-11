import React, { useState, useMemo } from 'react';
import { Search, Package, Star, TrendingUp, RefreshCw, Trash2, Loader2, Edit3 } from 'lucide-react';
import { useProducts } from '../context/ProductContext';

type SortOption = 'name' | 'profitRate' | 'updatedAt' | 'maxPurchasePrice';
type FilterOption = 'all' | 'favorites' | 'profitable' | 'new' | 'used';
type TimeFilter = '24h' | '12h' | 'all';

interface ProductListProps {
  selectedProductId: string | null;
  onProductSelect: (id: string) => void;
}

const ProductList: React.FC<ProductListProps> = ({ selectedProductId, onProductSelect }) => {
  const { 
    products, 
    removeProduct, 
    refreshProduct,
    selectedProducts,
    toggleProductSelection,
    selectAllProducts,
    clearSelection,
    updateProductAsin
  } = useProducts();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('updatedAt');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [asinInputs, setAsinInputs] = useState<{ [productId: string]: string }>({});
  const [updating, setUpdating] = useState<Set<string>>(new Set());

  const handleAsinInputChange = (productId: string, value: string) => {
    const cleanValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
    setAsinInputs(prev => ({
      ...prev,
      [productId]: cleanValue
    }));
  };

  const handleAsinUpdate = async (productId: string) => {
    const asin = asinInputs[productId];
    if (!asin || asin.length !== 10) {
      return;
    }

    setUpdating(prev => new Set(prev).add(productId));
    try {
      await updateProductAsin(productId, asin);
      setAsinInputs(prev => {
        const newInputs = { ...prev };
        delete newInputs[productId];
        return newInputs;
      });
    } catch (error) {
      console.error('ASIN更新エラー:', error);
    } finally {
      setUpdating(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products.filter(product => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const target = (product.title || product.name || product.asin || '').toLowerCase();
        if (!target.includes(query)) {
          return false;
        }
      }

      // Category filter
      switch (filterBy) {
        case 'favorites':
          return favorites.has(product.id);
        case 'new':
          return product.newPrice !== undefined && product.newPrice !== '';
        case 'used':
          return product.usedPrice !== undefined && product.usedPrice !== '';
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
          return (a.title || a.name || '').localeCompare(b.title || b.name || '');
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
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-800">登録済商品一覧</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">
              {selectedProducts.size}件選択中
            </span>
            <button
              onClick={selectAllProducts}
              className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
            >
              全選択
            </button>
            <button
              onClick={clearSelection}
              className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
            >
              選択解除
            </button>
          </div>
        </div>
        
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
                className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors rounded-lg ${
                  selectedProductId === product.id 
                    ? 'bg-white shadow border-2 border-blue-200' 
                    : 'border border-gray-200'
                }`}
              >
                <div className="flex gap-3 items-start">
                  {/* 左: チェックボックス */}
                  <div className="flex items-center pt-1">
                    <input
                      type="checkbox"
                      checked={selectedProducts.has(product.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleProductSelection(product.id);
                      }}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </div>

                  {/* サムネイル */}
                  <div 
                    className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded cursor-pointer"
                    onClick={() => onProductSelect(product.id)}
                  >
                    {product.status === 'loading' ? (
                      <Loader2 className="animate-spin text-blue-500" size={16} />
                    ) : product.images && product.images.length > 0 ? (
                      <img 
                        src={product.images[0]} 
                        alt={product.keyword || product.asin} 
                        className="w-10 h-10 object-contain rounded" 
                      />
                    ) : (
                      <Package className="w-6 h-6 text-gray-300" />
                    )}
                  </div>
                  
                  {/* 中央: 商品情報 */}
                  <div className="flex-1 min-w-0">
                    <div 
                      className="cursor-pointer"
                      onClick={() => onProductSelect(product.id)}
                    >
                      <div className="font-medium text-sm mb-1 truncate">
                        {product.keyword || product.asin}
                      </div>
                      <div className="text-xs text-gray-600 space-y-0.5">
                        <div>
                          {product.keyword ? `キーワード: ${product.keyword}` : `ASIN: ${product.asin}`}
                        </div>
                        {product.status === 'loading' ? (
                          <div className="text-blue-500">取得中...</div>
                        ) : product.status === 'error' ? (
                          <div className="text-red-500">エラー</div>
                        ) : product.keyword && !product.asin ? (
                          <div className="text-orange-600">キーワード登録</div>
                        ) : (
                          <div className="text-green-600">ASIN登録</div>
                        )}
                      </div>
                    </div>
                    
                    {/* ASIN入力フィールド（キーワード登録商品のみ） */}
                    {product.keyword && !product.asin && (
                      <div className="mt-2 space-y-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={asinInputs[product.id] || ''}
                          onChange={(e) => handleAsinInputChange(product.id, e.target.value)}
                          placeholder="ASIN入力 (10桁)"
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded font-mono tracking-wider focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          maxLength={10}
                          disabled={updating.has(product.id)}
                        />
                        <button
                          onClick={() => handleAsinUpdate(product.id)}
                          disabled={!asinInputs[product.id] || asinInputs[product.id].length !== 10 || updating.has(product.id)}
                          className={`w-full px-2 py-1 text-xs rounded font-medium transition-colors ${
                            (!asinInputs[product.id] || asinInputs[product.id].length !== 10 || updating.has(product.id))
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          {updating.has(product.id) ? (
                            <div className="flex items-center justify-center">
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              更新中...
                            </div>
                          ) : (
                            <div className="flex items-center justify-center">
                              <Edit3 className="w-3 h-3 mr-1" />
                              ASIN設定
                            </div>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* 右: アクションボタン */}
                  <div className="flex flex-col items-center space-y-1">
                    <button
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        refreshProduct(product.id); 
                      }}
                      className="p-1.5 rounded hover:bg-blue-100 transition-colors"
                      title="データ再取得"
                      disabled={product.status === 'loading'}
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-blue-500" />
                    </button>

                    <button
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setFavorites(prev => {
                          const newFavorites = new Set(prev);
                          if (newFavorites.has(product.id)) {
                            newFavorites.delete(product.id);
                          } else {
                            newFavorites.add(product.id);
                          }
                          return newFavorites;
                        });
                      }}
                      className={`p-1.5 rounded transition-colors ${
                        favorites.has(product.id) 
                          ? 'text-yellow-500 bg-yellow-50 hover:bg-yellow-100' 
                          : 'text-gray-400 hover:bg-gray-100'
                      }`}
                      title={favorites.has(product.id) ? 'お気に入りを解除' : 'お気に入りに追加'}
                    >
                      <Star className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        removeProduct(product.id); 
                      }}
                      className="p-1.5 rounded hover:bg-red-100 transition-colors"
                      title="削除"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </button>
                  </div>
                </div>
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
            <span className="text-green-600 font-medium">--件</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductList; 