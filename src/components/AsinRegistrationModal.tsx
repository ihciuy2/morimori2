import React, { useState } from 'react';
<<<<<<< HEAD
import { X, Plus, Loader2, Package } from 'lucide-react';
=======
import { X, Plus, AlertCircle, Loader2, Package, BarChart3 } from 'lucide-react';
>>>>>>> d74dd3dd58d506f69fa8f9601861db586eb5fb0d
import { useProducts } from '../context/ProductContext';
import { fetchAmazonData } from '../services/keepaService';
import { formatCurrency } from '../utils/formatters';
import PriceAnalysisModal from './PriceAnalysisModal';

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
  const [showPriceAnalysis, setShowPriceAnalysis] = useState(false);
  const [productData, setProductData] = useState<{
    title: string;
    imageUrl: string | null;
    newPrice: number | null;
    usedPrice: number | null;
    priceAnalysis?: {
      isRecentData: boolean;
      priceVariation: number | null;
      marketComparison: string;
      confidenceLevel: 'high' | 'medium' | 'low';
      recommendations: string[];
    };
    avgPrice30Days?: number | null;
    avgPrice90Days?: number | null;
    avgPrice180Days?: number | null;
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
        usedPrice: data.usedPrice,
        priceAnalysis: data.priceAnalysis,
        avgPrice30Days: data.avgPrice30Days,
        avgPrice90Days: data.avgPrice90Days,
        avgPrice180Days: data.avgPrice180Days
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
      if (label.includes('中古')) {
        return `${label}：中古商品なし`;
      }
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
<<<<<<< HEAD
=======

    if (!productName.trim()) {
      setError('商品名を入力してください');
      return;
    }

>>>>>>> d74dd3dd58d506f69fa8f9601861db586eb5fb0d
    setIsLoading(true);
    setError(null);
    try {
<<<<<<< HEAD
      await addProduct(asin, false);
=======
      await addProduct({
        name: productName.trim(),
        asin: asin,
        yahooKeyword: productName.trim(),
        targetProfitRate: 30,
      });
      
      // フォームをリセット
>>>>>>> d74dd3dd58d506f69fa8f9601861db586eb5fb0d
      setAsin('');
      setProductName('');
      setProductData(null);
      onClose();
    } catch (error) {
      setError('商品の登録に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setAsin('');
<<<<<<< HEAD
    setError(null);
=======
    setProductName('');
    setProductData(null);
    setError(null);
    setShowPriceAnalysis(false);
>>>>>>> d74dd3dd58d506f69fa8f9601861db586eb5fb0d
    onClose();
  };

  if (!isOpen) return null;

  return (
<<<<<<< HEAD
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">ASIN登録</h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label htmlFor="asin" className="block text-sm font-medium text-gray-700 mb-2">
              ASINコード <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="text"
              id="asin"
              value={asin}
              onChange={(e) => setAsin(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10))}
              className={`w-full px-4 py-3 border-2 rounded-lg text-lg font-mono tracking-wider transition-colors ${error ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'}`}
              placeholder="B01EXAMPLE"
              maxLength={10}
              disabled={isLoading}
            />
            <p className="mt-2 text-xs text-gray-500">
              Amazon商品ページのURLまたは商品詳細から10桁のASINコードを入力してください
            </p>
          </div>

          <button
            type="submit"
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold text-lg hover:bg-green-700 transition-colors flex items-center justify-center"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                登録中...
              </>
            ) : (
              <>
                <Package className="w-5 h-5 mr-2" />
                ASIN登録
              </>
            )}
          </button>

          {error && <div className="text-red-500 text-sm">{error}</div>}
        </form>
=======
    <>
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
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-blue-800">取得した商品情報</h4>
                      {productData.priceAnalysis && (
                        <button
                          type="button"
                          onClick={() => setShowPriceAnalysis(true)}
                          className="flex items-center text-xs text-purple-600 hover:text-purple-800 bg-purple-100 hover:bg-purple-200 px-2 py-1 rounded transition-colors"
                        >
                          <BarChart3 className="w-3 h-3 mr-1" />
                          価格分析
                        </button>
                      )}
                    </div>
                    
                    <p className="text-xs text-blue-700 line-clamp-2 mb-3">
                      {productData.title}
                    </p>
                    
                    {/* 価格情報 */}
                    <div className="space-y-1">
                      <div className="text-sm font-medium text-gray-800">
                        {formatPriceDisplay(productData.newPrice, "新品価格")}
                      </div>
                      <div className="text-sm font-medium text-gray-800">
                        {formatPriceDisplay(productData.usedPrice, "中古価格")}
                      </div>
                      
                      {/* 価格分析サマリー */}
                      {productData.priceAnalysis && (
                        <div className="mt-2 p-2 bg-white rounded border">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600">データ信頼度:</span>
                            <span className={`font-medium ${
                              productData.priceAnalysis.confidenceLevel === 'high' ? 'text-green-600' :
                              productData.priceAnalysis.confidenceLevel === 'medium' ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>
                              {productData.priceAnalysis.confidenceLevel === 'high' ? '高' :
                               productData.priceAnalysis.confidenceLevel === 'medium' ? '中' : '低'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs mt-1">
                            <span className="text-gray-600">市場比較:</span>
                            <span className="font-medium text-gray-800">
                              {productData.priceAnalysis.marketComparison}
                            </span>
                          </div>
                        </div>
                      )}
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
>>>>>>> d74dd3dd58d506f69fa8f9601861db586eb5fb0d
      </div>

      {/* 価格分析モーダル */}
      <PriceAnalysisModal
        isOpen={showPriceAnalysis}
        onClose={() => setShowPriceAnalysis(false)}
        asin={asin}
        currentPrice={productData?.usedPrice || null}
        priceAnalysis={productData?.priceAnalysis || null}
        avgPrice30Days={productData?.avgPrice30Days || null}
        avgPrice90Days={productData?.avgPrice90Days || null}
        avgPrice180Days={productData?.avgPrice180Days || null}
      />
    </>
  );
};

export default AsinRegistrationModal;