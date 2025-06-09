import React, { useState } from 'react';
import { Search, Upload, Download, AlertCircle, CheckCircle, Loader2, Package } from 'lucide-react';
import { fetchAmazonData } from '../services/keepaService';
import { formatCurrency } from '../utils/formatters';

interface ProductInfo {
  asin: string;
  title: string;
  currentPrice: number | null;
  imageUrl: string | null;
  status: 'pending' | 'loading' | 'success' | 'error';
  error?: string;
}

const ProductAutoFetch: React.FC = () => {
  const [singleAsin, setSingleAsin] = useState('');
  const [bulkAsins, setBulkAsins] = useState('');
  const [fetchedProducts, setFetchedProducts] = useState<ProductInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');

  // 単品取得
  const handleSingleFetch = async () => {
    if (!singleAsin.trim()) {
      alert('ASINコードを入力してください');
      return;
    }

    const asin = singleAsin.trim().toUpperCase();
    if (!/^[A-Z0-9]{10}$/.test(asin)) {
      alert('有効な10桁のASINコードを入力してください');
      return;
    }

    setIsLoading(true);
    const newProduct: ProductInfo = {
      asin,
      title: '',
      currentPrice: null,
      imageUrl: null,
      status: 'loading'
    };

    setFetchedProducts([newProduct]);

    try {
      const data = await fetchAmazonData(asin);
      
      const updatedProduct: ProductInfo = {
        asin,
        title: data.title,
        currentPrice: data.usedPrice || data.newPrice,
        imageUrl: data.imageUrl,
        status: 'success'
      };

      setFetchedProducts([updatedProduct]);
    } catch (error) {
      const errorProduct: ProductInfo = {
        asin,
        title: '',
        currentPrice: null,
        imageUrl: null,
        status: 'error',
        error: error instanceof Error ? error.message : '取得に失敗しました'
      };

      setFetchedProducts([errorProduct]);
    } finally {
      setIsLoading(false);
    }
  };

  // 一括取得
  const handleBulkFetch = async () => {
    const asinList = bulkAsins
      .split(/[\n,\s]+/)
      .map(asin => asin.trim().toUpperCase())
      .filter(asin => asin.length > 0);

    if (asinList.length === 0) {
      alert('ASINコードを入力してください');
      return;
    }

    if (asinList.length > 100) {
      alert('一括登録は100商品までです');
      return;
    }

    // 無効なASINをチェック
    const invalidAsins = asinList.filter(asin => !/^[A-Z0-9]{10}$/.test(asin));
    if (invalidAsins.length > 0) {
      alert(`無効なASINコードが含まれています: ${invalidAsins.join(', ')}`);
      return;
    }

    setIsLoading(true);
    
    // 初期状態を設定
    const initialProducts: ProductInfo[] = asinList.map(asin => ({
      asin,
      title: '',
      currentPrice: null,
      imageUrl: null,
      status: 'pending'
    }));

    setFetchedProducts(initialProducts);

    // 順次取得（レート制限対応）
    for (let i = 0; i < asinList.length; i++) {
      const asin = asinList[i];
      
      // ステータスを更新
      setFetchedProducts(prev => 
        prev.map(p => p.asin === asin ? { ...p, status: 'loading' } : p)
      );

      try {
        const data = await fetchAmazonData(asin);
        
        setFetchedProducts(prev => 
          prev.map(p => p.asin === asin ? {
            ...p,
            title: data.title,
            currentPrice: data.usedPrice || data.newPrice,
            imageUrl: data.imageUrl,
            status: 'success'
          } : p)
        );
      } catch (error) {
        setFetchedProducts(prev => 
          prev.map(p => p.asin === asin ? {
            ...p,
            status: 'error',
            error: error instanceof Error ? error.message : '取得に失敗しました'
          } : p)
        );
      }

      // レート制限対応（2秒間隔）
      if (i < asinList.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    setIsLoading(false);
  };

  // CSVエクスポート
  const exportToCSV = () => {
    if (fetchedProducts.length === 0) {
      alert('エクスポートするデータがありません');
      return;
    }

    const csvHeader = 'ASIN,商品名,価格(円),ステータス,エラー\n';
    const csvData = fetchedProducts.map(product => {
      const price = product.currentPrice ? product.currentPrice.toString() : '取得不可';
      const status = product.status === 'success' ? '成功' : 
                    product.status === 'error' ? 'エラー' : '処理中';
      const error = product.error || '';
      
      return `"${product.asin}","${product.title}","${price}","${status}","${error}"`;
    }).join('\n');

    const blob = new Blob([csvHeader + csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `amazon_products_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // テンプレートダウンロード
  const downloadTemplate = () => {
    const template = 'B07PXGQC1Q\nB01HC98W74\nB08N5WRWNW\n';
    const blob = new Blob([template], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'asin_template.txt';
    link.click();
  };

  const successCount = fetchedProducts.filter(p => p.status === 'success').length;
  const errorCount = fetchedProducts.filter(p => p.status === 'error').length;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center">
          <Search className="w-6 h-6 mr-2 text-blue-600" />
          Amazon商品情報自動取得
        </h2>
      </div>

      <div className="p-6">
        {/* タブ切り替え */}
        <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('single')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'single'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            単品登録
          </button>
          <button
            onClick={() => setActiveTab('bulk')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'bulk'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            一括登録
          </button>
        </div>

        {/* 単品登録タブ */}
        {activeTab === 'single' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ASINコード
              </label>
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={singleAsin}
                  onChange={(e) => setSingleAsin(e.target.value.toUpperCase())}
                  placeholder="例: B07PXGQC1Q"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                  maxLength={10}
                />
                <button
                  onClick={handleSingleFetch}
                  disabled={isLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition-colors flex items-center"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Search className="w-4 h-4 mr-2" />
                  )}
                  情報取得
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 一括登録タブ */}
        {activeTab === 'bulk' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-gray-700">
                ASINコードリスト（改行またはカンマ区切り）
              </label>
              <button
                onClick={downloadTemplate}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
              >
                <Download className="w-4 h-4 mr-1" />
                テンプレート
              </button>
            </div>
            <textarea
              value={bulkAsins}
              onChange={(e) => setBulkAsins(e.target.value)}
              placeholder="B07PXGQC1Q&#10;B01HC98W74&#10;B08N5WRWNW"
              className="w-full h-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
            />
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">
                最大100商品まで（現在: {bulkAsins.split(/[\n,\s]+/).filter(s => s.trim()).length}商品）
              </span>
              <button
                onClick={handleBulkFetch}
                disabled={isLoading}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 transition-colors flex items-center"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                一括取得
              </button>
            </div>
          </div>
        )}

        {/* 取得結果 */}
        {fetchedProducts.length > 0 && (
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">取得結果</h3>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  成功: {successCount} / エラー: {errorCount} / 合計: {fetchedProducts.length}
                </span>
                {successCount > 0 && (
                  <button
                    onClick={exportToCSV}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center text-sm"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    CSVエクスポート
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {fetchedProducts.map((product) => (
                <div
                  key={product.asin}
                  className={`p-4 border rounded-lg ${
                    product.status === 'success' ? 'border-green-200 bg-green-50' :
                    product.status === 'error' ? 'border-red-200 bg-red-50' :
                    'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    {/* 商品画像 */}
                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = 'https://via.placeholder.com/64x64?text=No+Image';
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
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-mono text-sm font-medium text-gray-800">
                          {product.asin}
                        </span>
                        {product.status === 'loading' && (
                          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                        )}
                        {product.status === 'success' && (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                        {product.status === 'error' && (
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        )}
                      </div>

                      {product.title && (
                        <h4 className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">
                          {product.title}
                        </h4>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          {product.status === 'success' && (
                            <span className="font-medium text-blue-600">
                              価格: {product.currentPrice ? formatCurrency(product.currentPrice) : '在庫なし'}
                            </span>
                          )}
                          {product.status === 'error' && (
                            <span className="text-red-600">
                              {product.error || 'エラーが発生しました'}
                            </span>
                          )}
                          {product.status === 'loading' && (
                            <span className="text-blue-600">取得中...</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 注意事項 */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-2" />
            <div>
              <h4 className="text-sm font-medium text-blue-800 mb-2">ご利用上の注意</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• 価格情報はKeepa APIと同期し、常に最新価格を表示します</li>
                <li>• 在庫切れ商品は「在庫なし」と表示されます</li>
                <li>• 一括取得時は2秒間隔で順次処理されます</li>
                <li>• 1回の一括登録上限は100商品までです</li>
                <li>• 取得できない場合はエラーメッセージが表示されます</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductAutoFetch;