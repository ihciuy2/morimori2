import React, { useState } from 'react';
import { X, Plus, AlertCircle, Loader2 } from 'lucide-react';
import { useProducts } from '../context/ProductContext';

interface AsinRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AsinRegistrationModal: React.FC<AsinRegistrationModalProps> = ({ isOpen, onClose }) => {
  const { addProduct } = useProducts();
  const [asin, setAsin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!asin.trim()) {
      setError('ASINコードを入力してください');
      return;
    }
    
    if (!/^[A-Z0-9]{10}$/.test(asin)) {
      setError('有効な10桁のASINコードを入力してください');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await addProduct({
        name: asin, // Will be updated with actual product name
        asin: asin,
        yahooKeyword: asin,
        targetProfitRate: 30,
      });
      
      setAsin('');
      onClose();
    } catch (error) {
      console.error('Failed to add product:', error);
      setError('商品の登録に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAsinChange = (value: string) => {
    const upperValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const truncatedValue = upperValue.slice(0, 10);
    setAsin(truncatedValue);
    
    if (error) {
      setError(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div id="modalAsinInput" className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">新規商品登録</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label htmlFor="asin" className="block text-sm font-medium text-gray-700 mb-2">
              ASINコード
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="text"
              id="asin"
              value={asin}
              onChange={(e) => handleAsinChange(e.target.value)}
              className={`w-full px-4 py-3 border-2 rounded-lg text-lg font-mono tracking-wider transition-colors ${
                error ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'
              }`}
              placeholder="B01EXAMPLE"
              maxLength={10}
              disabled={isLoading}
            />
            {error && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {error}
              </p>
            )}
            <p className="mt-2 text-xs text-gray-500">
              Amazon商品ページのURLまたは商品詳細から10桁のASINコードを入力してください
            </p>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isLoading || !asin.trim()}
              className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-lg transition-colors"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  登録中...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  登録
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AsinRegistrationModal;