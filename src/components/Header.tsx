import React, { useState } from 'react';
import { Plus, Upload, RefreshCw, Settings, Search } from 'lucide-react';
import { useProducts } from '../context/ProductContext';
import AsinRegistrationModal from './AsinRegistrationModal';
import KeywordRegistrationModal from './KeywordRegistrationModal';
import BulkRegistrationModal from './BulkRegistrationModal';
import KeepaSettings from './KeepaSettings';

const Header: React.FC = () => {
  const { products, isLoading, refreshSelectedProducts } = useProducts();
  const [showAsinModal, setShowAsinModal] = useState(false);
  const [showKeywordModal, setShowKeywordModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const maxRegistrations = 2000;
  const currentCount = products.length;

  return (
    <>
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            {/* Left: Logo and Title */}
            <div className="flex items-center">
              <div className="bg-blue-600 text-white p-2 rounded-lg mr-3">
                <Search className="h-6 w-6" />
              </div>
              <h1 className="text-xl font-bold text-gray-800">Amazon-Yahoo 価格比較ツール</h1>
            </div>
            
            {/* Right: Action Buttons and Counter */}
            <div className="flex items-center space-x-3">
              {/* Action Buttons */}
              <div className="flex space-x-2">
                <button
                  id="btnNew"
                  onClick={() => setShowAsinModal(true)}
                  className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm transition-colors"
                >
                  <Plus size={16} className="mr-2" />
                  ASIN登録
                </button>
                
                <button
                  id="btnKeyword"
                  onClick={() => setShowKeywordModal(true)}
                  className="flex items-center px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium text-sm transition-colors"
                >
                  <Search size={16} className="mr-2" />
                  キーワード登録
                </button>
                
                <button
                  id="btnBatch"
                  onClick={() => setShowBulkModal(true)}
                  className="flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium text-sm transition-colors"
                >
                  <Upload size={16} className="mr-2" />
                  一括登録
                </button>
                
                <button
                  id="btnRefresh"
                  onClick={refreshSelectedProducts}
                  disabled={isLoading}
                  className={`flex items-center px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    isLoading 
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  <RefreshCw size={16} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  選択更新
                </button>
                
                <button
                  id="btnSettings"
                  onClick={() => setShowSettings(!showSettings)}
                  className="flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium text-sm transition-colors"
                >
                  <Settings size={16} className="mr-2" />
                  設定
                </button>
              </div>
              
              {/* Registration Counter */}
              <div className="bg-gray-100 px-3 py-2 rounded-lg">
                <span className="text-sm font-medium text-gray-700">
                  登録数: {currentCount.toLocaleString()} / {maxRegistrations.toLocaleString()}件
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Modals */}
      <AsinRegistrationModal 
        isOpen={showAsinModal} 
        onClose={() => setShowAsinModal(false)}
      />
      <KeywordRegistrationModal 
        isOpen={showKeywordModal} 
        onClose={() => setShowKeywordModal(false)}
      />
      <BulkRegistrationModal 
        isOpen={showBulkModal} 
        onClose={() => setShowBulkModal(false)} 
      />
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="relative">
            <button
              onClick={() => setShowSettings(false)}
              className="absolute top-2 right-2 p-1 bg-gray-200 rounded-full hover:bg-gray-300"
              aria-label="閉じる"
            >
              ×
            </button>
            <KeepaSettings />
          </div>
        </div>
      )}
    </>
  );
};

export default Header;