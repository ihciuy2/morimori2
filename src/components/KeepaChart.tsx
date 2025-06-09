import React from 'react';
import { TrendingUp, ExternalLink } from 'lucide-react';

interface KeepaChartProps {
  asin: string;
}

const KeepaChart: React.FC<KeepaChartProps> = ({ asin }) => {
  const keepaUrl = `https://keepa.com/#!product/5-${asin}`;
  
  return (
    <div id="keepaChart" className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
        <div className="flex items-center">
          <TrendingUp className="w-5 h-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-800">価格推移チャート</h3>
        </div>
        <a
          href={keepaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center text-blue-600 hover:text-blue-800 text-sm"
        >
          Keepaで詳細を見る
          <ExternalLink size={14} className="ml-1" />
        </a>
      </div>
      
      <div className="p-4">
        {/* Keepa Chart Placeholder */}
        <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <TrendingUp className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p className="text-gray-500 text-sm">
              Keepa価格チャートがここに表示されます
            </p>
            <p className="text-gray-400 text-xs mt-1">
              実装時にKeepa APIまたはiframeで埋め込み
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KeepaChart;