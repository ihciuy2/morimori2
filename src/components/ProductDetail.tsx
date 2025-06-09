import React from 'react';
import { ExternalLink, Image as ImageIcon, TrendingUp, Package, Clock } from 'lucide-react';
import { Product } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import KeepaChart from './KeepaChart';
import AmazonPriceTable from './AmazonPriceTable';
import YahooAuctionSummary from './YahooAuctionSummary';
import AuctionCandidates from './AuctionCandidates';

interface ProductDetailProps {
  product: Product | null;
}

const ProductDetail: React.FC = ({ product }) => {
  if (!product) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">商品を選択してください</h3>
          <p className="text-gray-500">
            左側のリストから商品を選択すると、詳細情報が表示されます
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="p-6 space-y-6">
        {/* Product Header */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-start space-x-6">
            {/* Product Image */}
            <div className="w-32 h-32 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
              {product.amazonData?.imageUrl ? (
                <img
                  src={product.amazonData.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/160x160?text=No+Image';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon size={32} className="text-gray-400" />
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                {product.name}
              </h1>
              
              <div className="text-sm text-gray-600 space-y-1 mb-4">
                <div className="flex items-center space-x-4">
                  <span>ホーム＆キッチン:478位 (平均:8,053位)</span>
                  <span>参考価格: {product.amazonData?.newPrice ? formatCurrency(product.amazonData.newPrice) : '--'}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <a 
                    href={`https://www.amazon.co.jp/dp/${product.asin}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    ASIN：{product.asin}
                    <ExternalLink size={14} className="ml-1" />
                  </a>
                  <span>サイズ：大型3</span>
                  <span className="text-gray-500">{formatDate(product.updatedAt)}</span>
                </div>
              </div>

              {/* Status Indicators */}
              <div className="flex items-center space-x-3">
                {product.status === 'loading' && (
                  <div className="flex items-center text-blue-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    <span className="text-sm">更新中...</span>
                  </div>
                )}
                
                {product.profitAnalysis?.isProfitable && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                    利益対象
                  </span>
                )}
                
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                  目標利益率: {product.targetProfitRate}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Keepa Chart */}
        <KeepaChart asin={product.asin} />

        {/* Amazon Price Table */}
        <AmazonPriceTable product={product} />

        {/* Yahoo Auction Summary */}
        <YahooAuctionSummary product={product} />

        {/* Auction Candidates */}
        <AuctionCandidates product={product} />
      </div>
    </div>
  );
};

export default ProductDetail;