import React, { useState } from 'react';

const MarketPriceCheck: React.FC = () => {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showResults, setShowResults] = useState(false);

  // メルカリ売り切れ商品URL生成（中古のみ、新しい順）
  const generateMercariSoldUrl = (query: string) => {
    const encodedQuery = encodeURIComponent(query);
    // status=3: 売り切れ商品, item_condition_id=3,4,5,6: 中古コンディション, sort=created_time&order=desc: 新しい順
    return `https://jp.mercari.com/search?keyword=${encodedQuery}&status=3&item_condition_id=3&item_condition_id=4&item_condition_id=5&item_condition_id=6&sort=created_time&order=desc`;
  };

  const handleSearch = () => {
    if (searchKeyword.trim()) {
      setShowResults(true);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="bg-gradient-to-br from-white to-slate-50 rounded-xl shadow-lg border border-slate-200 p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
          📊 中古市場価格チェック
        </h2>
        <p className="text-sm text-slate-600">
          検索キーワードを入力してメルカリの売り切れ商品相場をチェックできます
        </p>
      </div>

      {/* 検索キーワード入力 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          検索キーワード
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="検索キーワードを入力 (例: 東芝 掃除機 サイクロン キャニスター型クリーナー コード式 軽量コンパクト トルネオミニ VC-C7-R グランレッド)"
            className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
          <button
            onClick={handleSearch}
            className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md"
          >
            検索
          </button>
        </div>
      </div>

      {/* メルカリ検索結果 */}
      {showResults && searchKeyword && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
            💰 メルカリ検索結果
            <span className="text-sm font-normal text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
              中古のみ・新しい順・売切れ商品
            </span>
          </h3>
          
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
            {/* 新しいタブで開くリンク */}
            <div className="bg-slate-50 p-3 border-b border-slate-200 flex items-center justify-between">
              <span className="text-sm text-slate-600">
                メルカリの検索結果を表示中: 「{searchKeyword}」
              </span>
              <a
                href={generateMercariSoldUrl(searchKeyword)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center gap-1"
              >
                新しいタブで開く ↗
              </a>
            </div>
            
            {/* iframe埋め込み（メルカリが許可している場合のみ動作） */}
            <div className="relative" style={{ height: '600px' }}>
              <iframe
                src={generateMercariSoldUrl(searchKeyword)}
                className="w-full h-full"
                frameBorder="0"
                title="メルカリ検索結果"
                onError={() => {
                  console.log('iframe loading failed - this is expected as Mercari likely blocks iframe embedding');
                }}
              />
              
              {/* iframe が読み込めない場合のフォールバック */}
              <div className="absolute inset-0 flex items-center justify-center bg-slate-100 border-2 border-dashed border-slate-300">
                <div className="text-center p-6">
                  <div className="text-4xl mb-4">🛍️</div>
                  <h4 className="text-lg font-semibold text-slate-700 mb-2">
                    メルカリ検索結果
                  </h4>
                  <p className="text-sm text-slate-600 mb-4">
                    セキュリティ上の理由により、メルカリページの埋め込み表示ができません。
                  </p>
                  <a
                    href={generateMercariSoldUrl(searchKeyword)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    <span>🔗</span>
                    メルカリで検索結果を見る
                  </a>
                  <div className="mt-3 text-xs text-slate-500">
                    中古コンディション・売り切れ商品・新しい順
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketPriceCheck; 