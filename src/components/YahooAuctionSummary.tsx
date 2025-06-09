import React from 'react';
import { Gavel } from 'lucide-react';
import { Product } from '../types';
import { formatCurrency } from '../utils/formatters';

interface YahooAuctionSummaryProps {
  product: Product;
}

const YahooAuctionSummary: React.FC<YahooAuctionSummaryProps> = ({ product }) => {
  const yahooData = product.yahooData;
  
  return (
    <div id="auctionSummary" className="bg-gray-100 border border-gray-300 rounded-lg p-4">
      <div className="flex items-center mb-3">
        <Gavel className="w-5 h-5 text-orange-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-800">ヤフオク検索結果サマリー</h3>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center space-x-4 text-sm">
          <span className="font-medium">◎ {product.asin}</span>
          <span>上限金額: {product.maxPurchasePrice ? formatCurrency(product.maxPurchasePrice) : '未設定'}</span>
          <span>平均落札価格: {yahooData?.avgPrice ? formatCurrency(yahooData.avgPrice) : '--'}</span>
          <span>落札件数: {yahooData?.soldCount || 0}件</span>
          <Gavel className="w-4 h-4 text-orange-600" />
        </div>
        
        <div className="flex items-center space-x-4 text-xs text-gray-600">
          <span>状態: 中古</span>
          <span>購入方法: すべて</span>
          <span>出品者: すべて</span>
          <span>カテゴリー: すべて</span>
          <span>検索対象: タイトル</span>
        </div>
      </div>
    </div>
  );
};

export default YahooAuctionSummary;