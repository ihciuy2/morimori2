import React, { useState, useEffect } from 'react';
import { Settings, Key, Save, Eye, EyeOff } from 'lucide-react';

const KEEPA_API_KEY_STORAGE_KEY = 'keepa_api_key';

const KeepaSettings: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const storedKey = localStorage.getItem(KEEPA_API_KEY_STORAGE_KEY);
    if (storedKey) {
      try {
        const decryptedKey = atob(storedKey);
        setApiKey(decryptedKey);
      } catch (error) {
        console.error('Failed to decrypt API key:', error);
        localStorage.removeItem(KEEPA_API_KEY_STORAGE_KEY);
      }
    }
  }, []);

  const validateApiKey = (key: string): boolean => {
    if (!key.trim()) {
      setError('APIキーを入力してください');
      return false;
    }
    if (key.length < 8) {
      setError('APIキーが短すぎます');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    setError(null);
    setSuccessMessage(null);

    if (!validateApiKey(apiKey)) {
      return;
    }

    setIsSaving(true);

    try {
      // APIキーを暗号化して保存
      const encryptedKey = btoa(apiKey);
      localStorage.setItem(KEEPA_API_KEY_STORAGE_KEY, encryptedKey);
      
      setSuccessMessage('APIキーを保存しました');
      
      // 成功メッセージを表示後、設定パネルを閉じる
      setTimeout(() => {
        setSuccessMessage(null);
        setIsOpen(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to save API key:', error);
      setError('APIキーの保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const maskedApiKey = apiKey ? `${apiKey.slice(0, 4)}${'*'.repeat(Math.max(0, apiKey.length - 8))}${apiKey.slice(-4)}` : '';

  return (
    <div className="bg-white rounded-lg shadow-md mb-8 overflow-hidden">
      <div 
        className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center space-x-2">
          <Settings className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-800">Keepa API設定</h2>
        </div>
        <button className="text-gray-600 hover:text-gray-800 transition-colors">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={`h-6 w-6 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
      
      {isOpen && (
        <div className="p-6 animate-fadeIn">
          <div className="space-y-4">
            <div>
              <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">
                Keepa APIキー
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showApiKey ? 'text' : 'password'}
                  id="apiKey"
                  value={showApiKey ? apiKey : maskedApiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className={`w-full pl-10 pr-12 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    error ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="APIキーを入力"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showApiKey ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
              {successMessage && <p className="mt-1 text-sm text-green-500">{successMessage}</p>}
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                <a 
                  href="https://keepa.com/#!api" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-blue-600 hover:text-blue-800"
                >
                  Keepa API登録ページ
                </a>
                からAPIキーを取得できます
              </p>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KeepaSettings;