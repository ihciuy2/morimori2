import React from 'react';
import { ExternalLink, Image as ImageIcon, TrendingUp, Package, Clock } from 'lucide-react';
import { Product } from '../context/ProductContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import KeepaChart from './KeepaChart';
import AmazonPriceTable from './AmazonPriceTable';
import YahooAuctionSummary from './YahooAuctionSummary';
import AuctionCandidates from './AuctionCandidates';

interface ProductDetailProps {
  product: Product | null;
}

const ProductDetail: React.FC<ProductDetailProps> = ({ product }) => {
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
      <div className="p-2 space-y-2">
        {/* Amazon情報タイトル */}
        <h2 className="text-base font-bold text-blue-700 mb-1">Amazon情報</h2>
        {/* 3分割横並びレイアウト */}
        <div className="bg-white border border-gray-200 rounded-lg p-2">
          <div className="flex flex-row gap-2 items-start">
            {/* 左: 商品画像 */}
            <div className="w-28 flex flex-col items-center justify-center">
              {product.images && product.images.length > 0 ? (
                <img
                  src={product.images[0]}
                  alt={product.title || product.asin}
                  className="w-24 h-24 object-contain rounded mb-1"
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/96x96?text=No+Image';
                  }}
                />
              ) : (
                <div className="w-24 h-24 flex items-center justify-center bg-gray-100 rounded mb-1">
                  <ImageIcon size={28} className="text-gray-400" />
                </div>
              )}
            </div>
            {/* 中央: タイトル・基本情報 */}
            <div className="flex-1 min-w-0 flex flex-col justify-between">
              <div>
                <div className="text-base font-bold text-gray-900 leading-tight mb-1 line-clamp-2">
                  {product.title || product.name || product.asin}
                </div>
                <div className="text-xs text-gray-700 mb-1 flex flex-wrap gap-x-2 gap-y-0.5">
                  <span>ASIN: {product.asin}</span>
                                <span>新品価格: {product.newPrice ? (String(product.newPrice).includes('¥') ? product.newPrice : `¥${Number(product.newPrice).toLocaleString()}`) : '--'}</span>
              <span>中古価格: {product.usedPrice ? (String(product.usedPrice).includes('¥') ? product.usedPrice : `¥${Number(product.usedPrice).toLocaleString()}`) : '--'}</span>
                  <span>ランキング: {product.salesRank ? `${product.salesRank}位` : '--'}</span>
                </div>
                <div className="text-xs text-gray-500 mb-1">
                  更新日時: {formatDate(product.updatedAt)}
                </div>
              </div>
              <div className="flex items-center space-x-2 mt-1">
                {product.status === 'loading' && (
                  <div className="flex items-center text-blue-600">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-1"></div>
                    <span className="text-xs">更新中...</span>
                  </div>
                )}
                {product.status === 'success' && (
                  <span className="px-1 py-0.5 bg-green-100 text-green-800 text-[10px] font-medium rounded-full">
                    データ取得済み
                  </span>
                )}
                {product.status === 'error' && (
                  <span className="px-1 py-0.5 bg-red-100 text-red-800 text-[10px] font-medium rounded-full">
                    エラー
                  </span>
                )}
              </div>
            </div>
            {/* 右: チャート＋価格表を横並び2分割 */}
            <div className="w-96 flex flex-row gap-1">
              <div className="flex-1 bg-gray-50 rounded-lg border border-gray-200 p-1">
                {product.keepaChart ? (
                  <img src={product.keepaChart} alt="Keepa Chart" className="w-full h-auto" />
                ) : (
                  <div className="h-32 flex items-center justify-center text-gray-400 text-xs">
                    チャートデータなし
                  </div>
                )}
              </div>
              <div className="flex-1 bg-gray-50 rounded-lg border border-gray-200 p-1">
                <div className="text-xs">
                  <div className="font-medium mb-1">価格情報</div>
                  <div className="space-y-1">
                                  <div>新品: {product.newPrice ? (String(product.newPrice).includes('¥') ? product.newPrice : `¥${Number(product.newPrice).toLocaleString()}`) : '--'}</div>
              <div>中古: {product.usedPrice ? (String(product.usedPrice).includes('¥') ? product.usedPrice : `¥${Number(product.usedPrice).toLocaleString()}`) : '--'}</div>
                    <div>ランキング: {product.salesRank ? `#${product.salesRank}` : '--'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* 外部リンク */}
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <h3 className="text-sm font-medium mb-2">外部サイト</h3>
          <div className="flex gap-2">
            <a
              href={`https://jp.mercari.com/search?keyword=${encodeURIComponent(product.title || product.asin)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center px-3 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              メルカリで検索
            </a>
            <a
              href={`https://auctions.yahoo.co.jp/search/search?p=${encodeURIComponent(product.title || product.asin)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center px-3 py-1 bg-purple-100 text-purple-700 rounded text-xs hover:bg-purple-200"
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              Yahoo!オークション
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;