import React, { useState } from 'react';
import { X, Loader2, Search } from 'lucide-react';
import { useProducts } from '../context/ProductContext';

interface KeywordRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const KeywordRegistrationModal: React.FC<KeywordRegistrationModalProps> = ({ isOpen, onClose }) => {
  const { addProduct } = useProducts();
  const [keyword, setKeyword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) {
      setError('キーワードを入力してください');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await addProduct(keyword, true);
      setKeyword('');
      onClose();
    } catch (error) {
      setError('キーワード登録に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setKeyword('');
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">キーワード登録</h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label htmlFor="keyword" className="block text-sm font-medium text-gray-700 mb-2">
              キーワード <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="text"
              id="keyword"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className={`w-full px-4 py-3 border-2 rounded-lg text-lg transition-colors ${error ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'}`}
              placeholder="商品名、ブランド名、型番など"
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-orange-600 text-white py-3 rounded-lg font-semibold text-lg hover:bg-orange-700 transition-colors flex items-center justify-center"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                登録中...
              </>
            ) : (
              <>
                <Search className="w-5 h-5 mr-2" />
                キーワード登録
              </>
            )}
          </button>

          {error && <div className="text-red-500 text-sm">{error}</div>}
        </form>
      </div>
    </div>
  );
};

export default KeywordRegistrationModal; 