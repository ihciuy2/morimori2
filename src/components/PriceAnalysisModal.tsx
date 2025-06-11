import React from 'react';
import { X, TrendingUp, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

interface PriceAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  asin: string;
  currentPrice: number | null;
  priceAnalysis: {
    isRecentData: boolean;
    priceVariation: number | null;
    marketComparison: string;
    confidenceLevel: 'high' | 'medium' | 'low';
    recommendations: string[];
  } | null;
  avgPrice30Days: number | null;
  avgPrice90Days: number | null;
  avgPrice180Days: number | null;
}

const PriceAnalysisModal: React.FC<PriceAnalysisModalProps> = ({
  isOpen,
  onClose,
  asin,
  currentPrice,
  priceAnalysis,
  avgPrice30Days,
  avgPrice90Days,
  avgPrice180Days
}) => {
  if (!isOpen || !priceAnalysis) return null;

  const getConfidenceColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getConfidenceIcon = (level: string) => {
    switch (level) {
      case 'high': return <CheckCircle className="w-5 h-5" />;
      case 'medium': return <Info className="w-5 h-5" />;
      case 'low': return <AlertTriangle className="w-5 h-5" />;
      default: return <Info className="w-5 h-5" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">価格分析レポート</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* 商品情報 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">分析対象商品</h3>
            <p className="text-blue-700 font-mono">{asin}</p>
          </div>

          {/* 現在価格と信頼度 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">現在の中古価格</h3>
              <p className="text-2xl font-bold text-gray-900">
                {currentPrice ? formatCurrency(currentPrice) : '取得不可'}
              </p>
            </div>
            
            <div className={`border rounded-lg p-4 ${getConfidenceColor(priceAnalysis.confidenceLevel)}`}>
              <div className="flex items-center mb-2">
                {getConfidenceIcon(priceAnalysis.confidenceLevel)}
                <h3 className="text-sm font-medium ml-2">データ信頼度</h3>
              </div>
              <p className="text-lg font-semibold capitalize">
                {priceAnalysis.confidenceLevel === 'high' ? '高' : 
                 priceAnalysis.confidenceLevel === 'medium' ? '中' : '低'}
              </p>
            </div>
          </div>

          {/* 価格履歴比較 */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              価格履歴比較
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">30日平均</p>
                <p className="text-lg font-semibold text-gray-900">
                  {avgPrice30Days ? formatCurrency(avgPrice30Days) : '--'}
                </p>
              </div>
              
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">90日平均</p>
                <p className="text-lg font-semibold text-gray-900">
                  {avgPrice90Days ? formatCurrency(avgPrice90Days) : '--'}
                </p>
              </div>
              
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">180日平均</p>
                <p className="text-lg font-semibold text-gray-900">
                  {avgPrice180Days ? formatCurrency(avgPrice180Days) : '--'}
                </p>
              </div>
            </div>

            {/* 市場比較 */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>市場比較:</strong> {priceAnalysis.marketComparison}
              </p>
              {priceAnalysis.priceVariation !== null && (
                <p className="text-sm text-blue-700 mt-1">
                  90日平均との差異: {priceAnalysis.priceVariation.toFixed(1)}%
                </p>
              )}
            </div>
          </div>

          {/* データの新しさ */}
          <div className={`border rounded-lg p-4 ${
            priceAnalysis.isRecentData ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
          }`}>
            <h3 className="text-sm font-medium mb-2 flex items-center">
              <Info className="w-4 h-4 mr-2" />
              データの新しさ
            </h3>
            <p className={`text-sm ${
              priceAnalysis.isRecentData ? 'text-green-700' : 'text-yellow-700'
            }`}>
              {priceAnalysis.isRecentData ? 
                'データは最新です（24時間以内に更新）' : 
                'データが古い可能性があります'
              }
            </p>
          </div>

          {/* 推奨事項 */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">推奨事項</h3>
            <div className="space-y-2">
              {priceAnalysis.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm text-gray-700">{recommendation}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 検証結果サマリー */}
          {asin === 'B01HC98W74' && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-purple-800 mb-3">
                B01HC98W74 検証結果
              </h3>
              <div className="space-y-2 text-sm text-purple-700">
                <p><strong>参考価格 6,890円の妥当性:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>現在価格と90日平均価格の比較結果を確認</li>
                  <li>価格変動の範囲内かどうかを検証</li>
                  <li>同カテゴリ商品との相場比較</li>
                  <li>データの更新頻度と信頼性を評価</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};

export default PriceAnalysisModal;