import React, { useState } from 'react';
import { X, Plus, AlertCircle, Loader2, Package } from 'lucide-react';
import { useProducts } from '../context/ProductContext';
import { fetchAmazonData } from '../services/keepaService';
import { formatCurrency } from '../utils/formatters';

interface AsinRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AsinRegistrationModal: React.FC<AsinRegistrationModalProps> = ({ isOpen, onClose }) => {
  const { addProduct } = useProducts();
  const [asin, setAsin] = useState('');
  const [productName, setProductName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [productData, setProductData] = useState<{
    title: string;
    imageUrl: string | null;
    newPrice: number | null;
    usedPrice: number | null;
  } | null>(null);

  const handleAsinChange = async (value: string) => {
    const upperValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const truncatedValue = upperValue.slice(0, 10);
    setAsin(truncatedValue);
    
    if (error) {
      setError(null);
    }

    // ASINが10桁になったら自動で商品データを取得
    if (truncatedValue.length === 10 && /^[A-Z0-9]{10}$/.test(truncatedValue)) {
      await fetchProductData(truncatedValue);
    } else {
      // ASINが不完全な場合はデータをクリア
      setProductData(null);
      setProductName('');
    }
  };

  const fetchProductData = async (asinCode: string) => {
    setIsFetchingData(true);
    setError(null);
    setProductData(null);
    setProductName('');

    try {
      const data = await fetchAmazonData(asinCode);
      
      setProductData({
        title: data.title,
        imageUrl: data.imageUrl,
        newPrice: data.newPrice,
        usedPrice: data.usedPrice
      });
      
      setProductName(data.title);
      
    } catch (error) {
      console.error('Failed to fetch product data:', error);
      setError(error instanceof Error ? error.message : '商品データの取得に失敗しました');
    } finally {
      setIsFetchingData(false);
    }
  };

  const formatPriceDisplay = (price: number | null, label: string) => {
    if (price === null) {
      return `${label}：価格情報なし`;
    }
    return `${label}：${formatCurrency(price)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!asin.trim()) {
      setError('ASINコードを入力してください');
      return;
    }
    
    if (!/^[A-Z0-9]{10}$/.test(asin)) {
      setError('有効な10桁のASINコードを入力してください');
      return;
    }

    if (!productName.trim()) {
      setError('商品名を入力してください');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await addProduct({
        name: productName.trim(),
        asin: asin,
        yahooKeyword: productName.trim(), // 商品名をヤフオクキーワードとしても使用
        targetProfitRate: 30,
      });
      
      // フォームをリセット
      setAsin('');
      setProductName('');
      setProductData(null);
      onClose();
    } catch (error) {
      console.error('Failed to add product:', error);
      setError('商品の登録に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setAsin('');
    setProductName('');
    setProductData(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div id="modalAsinInput" className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">新規商品登録</h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* ASIN入力 */}
          <div>
            <label htmlFor="asin" className="block text-sm font-medium text-gray-700 mb-2">
              ASINコード
              <span className="text-red-500 ml-1">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                id="asin"
                value={asin}
                onChange={(e) => handleAsinChange(e.target.value)}
                className={`w-full px-4 py-3 border-2 rounded-lg text-lg font-mono tracking-wider transition-colors ${
                  error ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'
                }`}
                placeholder="B01EXAMPLE"
                maxLength={10}
                disabled={isLoading || isFetchingData}
              />
              {isFetchingData && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                </div>
              )}
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Amazon商品ページのURLまたは商品詳細から10桁のASINコードを入力してください
            </p>
          </div>

          {/* 商品データプレビュー */}
          {productData && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-4">
                {/* 商品画像 */}
                <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  {productData.imageUrl ? (
                    <img
                      src={productData.imageUrl}
                      alt={productData.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/80x80?text=No+Image';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* 商品情報 */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">取得した商品情報</h4>
                  <p className="text-xs text-blue-700 line-clamp-2 mb-3">
                    {productData.title}
                  </p>
                  
                  {/* 価格情報 */}
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-gray-800">
                      {formatPriceDisplay(productData.newPrice, "新品価格")}
                    </div>
                    <div className="text-sm font-medium text-gray-800">
                      {productData.usedPrice !== null 
                        ? formatPriceDisplay(productData.usedPrice, "中古価格")
                        : "中古価格：中古商品なし"
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 商品名入力 */}
          <div>
            <label htmlFor="productName" className="block text-sm font-medium text-gray-700 mb-2">
              商品名
              <span className="text-red-500 ml-1">*</span>
            </label>
            <textarea
              id="productName"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className={`w-full px-4 py-3 border-2 rounded-lg transition-colors resize-none ${
                error && !productName.trim() ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'
              }`}
              placeholder="商品名を入力または編集してください"
              rows={3}
              disabled={isLoading}
            />
            <p className="mt-2 text-xs text-gray-500">
              自動取得された商品名を確認・編集できます
            </p>
          </div>

          {/* エラーメッセージ */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                {error}
              </p>
            </div>
          )}
          
          {/* ボタン */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading || isFetchingData}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isLoading || isFetchingData || !asin.trim() || !productName.trim()}
              className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-lg transition-colors"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  登録中...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  登録
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AsinRegistrationModal;