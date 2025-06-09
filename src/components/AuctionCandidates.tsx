import React from 'react';
import { Download, Star, Clock, Eye, Image as ImageIcon } from 'lucide-react';
import { Product } from '../types';
import { formatCurrency } from '../utils/formatters';

interface AuctionCandidatesProps {
  product: Product;
}

const AuctionCandidates: React.FC<AuctionCandidatesProps> = ({ product }) => {
  const candidates = product.yahooData?.recentSoldItems || [];
  
  return (
    <div id="candidateList" className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Eye className="w-5 h-5 text-purple-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-800">落札候補一覧</h3>
          </div>
          <span className="text-sm text-gray-500">{candidates.length}件の候補</span>
        </div>
      </div>
      
      <div className="p-4">
        {candidates.length === 0 ? (
          <div className="text-center py-8">
            <Eye className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-gray-500">落札候補がありません</p>
            <p className="text-gray-400 text-sm">データ更新後に表示されます</p>
          </div>
        ) : (
          <div className="space-y-3">
            {candidates.map((candidate, index) => (
              <div
                key={index}
                className="flex items-center space-x-4 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {/* Thumbnail */}
                <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  {candidate.imageUrl ? (
                    <img
                      src={candidate.imageUrl}
                      alt={candidate.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/64x64?text=No+Image';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon size={20} className="text-gray-400" />
                    </div>
                  )}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                    {candidate.title}
                  </h4>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span className="font-medium text-blue-600">
                      {formatCurrency(candidate.price)}
                    </span>
                    <span className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      終了済み
                    </span>
                    <span>入札: 0件</span>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex items-center space-x-2">
                  <button
                    className="p-2 text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 rounded-lg transition-colors"
                    title="お気に入りに追加"
                  >
                    <Star className="w-4 h-4" />
                  </button>
                  <button
                    className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                    title="データをダウンロード"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuctionCandidates;