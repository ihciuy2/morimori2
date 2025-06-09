import React, { useState, useEffect } from 'react';
import { Play, Pause, BarChart3, Download, Settings, AlertCircle } from 'lucide-react';
import { DataCollectionService } from '../services/dataCollectionService';
import { DataAnalysisService } from '../services/dataAnalysisService';
import { useProducts } from '../context/ProductContext';

const DataCollectionDashboard: React.FC = () => {
  const { products } = useProducts();
  const [isCollecting, setIsCollecting] = useState(false);
  const [collectionStats, setCollectionStats] = useState({
    totalCollected: 0,
    successRate: 0,
    lastUpdate: null as Date | null
  });
  const [config, setConfig] = useState({
    interval: 60, // minutes
    maxRetries: 3,
    batchSize: 5
  });

  const dataCollectionService = new DataCollectionService(config);

  const startCollection = async () => {
    const asins = products.map(p => p.asin);
    if (asins.length === 0) {
      alert('収集する商品がありません');
      return;
    }

    setIsCollecting(true);
    try {
      await dataCollectionService.startPeriodicCollection(asins);
    } catch (error) {
      console.error('Collection failed:', error);
      setIsCollecting(false);
    }
  };

  const stopCollection = () => {
    dataCollectionService.stopCollection();
    setIsCollecting(false);
  };

  const exportData = () => {
    const historyData = localStorage.getItem('price_history');
    if (!historyData) {
      alert('エクスポートするデータがありません');
      return;
    }

    const blob = new Blob([historyData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `price_history_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center">
          <BarChart3 className="w-6 h-6 mr-2 text-blue-600" />
          データ収集ダッシュボード
        </h2>
        
        <div className="flex space-x-3">
          {!isCollecting ? (
            <button
              onClick={startCollection}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Play className="w-4 h-4 mr-2" />
              収集開始
            </button>
          ) : (
            <button
              onClick={stopCollection}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Pause className="w-4 h-4 mr-2" />
              収集停止
            </button>
          )}
          
          <button
            onClick={exportData}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            データエクスポート
          </button>
        </div>
      </div>

      {/* 収集設定 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            収集間隔（分）
          </label>
          <input
            type="number"
            value={config.interval}
            onChange={(e) => setConfig({...config, interval: parseInt(e.target.value)})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            min="5"
            max="1440"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            リトライ回数
          </label>
          <input
            type="number"
            value={config.maxRetries}
            onChange={(e) => setConfig({...config, maxRetries: parseInt(e.target.value)})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            min="1"
            max="10"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            バッチサイズ
          </label>
          <input
            type="number"
            value={config.batchSize}
            onChange={(e) => setConfig({...config, batchSize: parseInt(e.target.value)})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            min="1"
            max="20"
          />
        </div>
      </div>

      {/* 収集統計 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-600">収集済みデータ</span>
            <BarChart3 className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-blue-800">{collectionStats.totalCollected}</p>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-green-600">成功率</span>
            <Settings className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-green-800">{collectionStats.successRate}%</p>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">最終更新</span>
            <AlertCircle className="w-5 h-5 text-gray-600" />
          </div>
          <p className="text-sm font-medium text-gray-800">
            {collectionStats.lastUpdate ? collectionStats.lastUpdate.toLocaleString() : '未実行'}
          </p>
        </div>
      </div>

      {/* 注意事項 */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-2" />
          <div>
            <h3 className="text-sm font-medium text-yellow-800">重要な注意事項</h3>
            <ul className="mt-2 text-sm text-yellow-700 space-y-1">
              <li>• Keepa APIの利用規約を遵守してください</li>
              <li>• 適切な収集間隔を設定し、サーバーに負荷をかけないようにしてください</li>
              <li>• APIキーの使用量制限にご注意ください</li>
              <li>• 収集したデータは適切に管理してください</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataCollectionDashboard;