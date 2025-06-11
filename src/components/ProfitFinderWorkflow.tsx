import React, { useState } from 'react';

const ProfitFinderWorkflow: React.FC = () => {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [copiedText, setCopiedText] = useState('');
  const [amazonData, setAmazonData] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);

  // オークファン検索URL生成（メルカリ履歴含む）
  const generateAucfanUrl = (query: string) => {
    const encodedQuery = encodeURIComponent(query);
    return `https://aucfan.com/search1/q-${encodedQuery}/s-end_time/o1/`;
  };

  // メルカリ特化オークファン検索
  const generateAucfanMercariUrl = (query: string) => {
    const encodedQuery = encodeURIComponent(query);
    return `https://aucfan.com/search1/q-${encodedQuery}/c-mercari/s-end_time/o1/`;
  };

  // クリップボードからテキストを取得
  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setSearchKeyword(text);
      setCopiedText(text);
    } catch (err) {
      console.error('クリップボードの読み取りに失敗:', err);
    }
  };

  // Amazonデータ検索（簡易版）
  const searchAmazonData = async () => {
    if (!searchKeyword.trim()) return;
    
    setIsSearching(true);
    // 実際のAmazon検索は既存のAPIを活用
    // ここでは模擬データを表示
    setTimeout(() => {
      setAmazonData({
        title: searchKeyword,
        newPrice: 15800,
        usedPrice: 12500,
        asin: 'B08XXXXXXX',
        ranking: 1234,
        category: '家電&カメラ'
      });
      setIsSearching(false);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-3">
          🎯 ヤフオク利益商品探し
        </h2>
        <p className="text-blue-100">
          オークファンで履歴調査 → Amazon価格確認 → 利益計算の効率的ワークフロー
        </p>
      </div>

      {/* ステップ1: オークファン調査 */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          📊 ステップ1: オークファン履歴調査
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="https://aucfan.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white p-4 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md text-center"
          >
            <div className="text-2xl mb-2">🔍</div>
            <div className="font-medium">オークファン総合検索</div>
            <div className="text-sm opacity-90 mt-1">ヤフオク・メルカリ・ラクマ履歴</div>
          </a>
          
          <a
            href="https://aucfan.com/search1/c-mercari/"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white p-4 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md text-center"
          >
            <div className="text-2xl mb-2">💰</div>
            <div className="font-medium">メルカリ履歴専用</div>
            <div className="text-sm opacity-90 mt-1">メルカリの過去取引のみ</div>
          </a>
        </div>

        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-sm text-blue-800">
            <strong>💡 調査のコツ:</strong>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li>商品名で検索して過去の落札価格をチェック</li>
              <li>「この商品、安いかも」と思ったら商品名をコピー</li>
              <li>定期的に相場より安い商品が出品されているかチェック</li>
            </ul>
          </div>
        </div>
      </div>

      {/* ステップ2: 商品名入力・Amazon検索 */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          🛒 ステップ2: Amazon価格確認
        </h3>

        {/* 商品名入力エリア */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            商品名・検索キーワード
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="オークファンで見つけた商品名を入力"
              className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={pasteFromClipboard}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              📋 貼り付け
            </button>
            <button
              onClick={searchAmazonData}
              disabled={!searchKeyword.trim() || isSearching}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              {isSearching ? '検索中...' : '🔍 Amazon検索'}
            </button>
          </div>
        </div>

        {/* クイックアクション */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
          <button
            onClick={() => navigator.clipboard.writeText(searchKeyword)}
            className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded transition-colors"
          >
            📋 コピー
          </button>
          <button
            onClick={() => setSearchKeyword('')}
            className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded transition-colors"
          >
            🗑️ クリア
          </button>
          <a
            href={searchKeyword ? `https://www.amazon.co.jp/s?k=${encodeURIComponent(searchKeyword)}` : '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs bg-orange-100 hover:bg-orange-200 text-orange-700 px-3 py-2 rounded transition-colors text-center"
          >
            🛒 Amazon
          </a>
          <a
            href={searchKeyword ? generateAucfanMercariUrl(searchKeyword) : '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs bg-pink-100 hover:bg-pink-200 text-pink-700 px-3 py-2 rounded transition-colors text-center"
          >
            💰 メルカリ履歴
          </a>
        </div>

        {/* Amazon検索結果 */}
        {amazonData && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
            <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              🛒 Amazon商品情報
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-slate-600">新品価格</div>
                <div className="text-lg font-bold text-blue-600">¥{amazonData.newPrice?.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-slate-600">中古価格</div>
                <div className="text-lg font-bold text-green-600">¥{amazonData.usedPrice?.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-slate-600">ASIN</div>
                <div className="font-mono text-slate-800">{amazonData.asin}</div>
              </div>
              <div>
                <div className="text-slate-600">ランキング</div>
                <div className="font-semibold text-slate-800">{amazonData.ranking?.toLocaleString()}位</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ステップ3: 利益計算 */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          💹 ステップ3: 利益シミュレーション
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="text-yellow-800 font-medium mb-2">📈 仕入価格想定</div>
            <input
              type="number"
              placeholder="5000"
              className="w-full px-3 py-2 border border-yellow-300 rounded focus:ring-yellow-500 focus:border-yellow-500"
            />
            <div className="text-xs text-yellow-600 mt-1">オークファンで確認した相場</div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-blue-800 font-medium mb-2">💰 販売価格想定</div>
            <div className="text-xl font-bold text-blue-600">
              ¥{amazonData?.usedPrice?.toLocaleString() || '---'}
            </div>
            <div className="text-xs text-blue-600 mt-1">Amazon中古価格基準</div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-green-800 font-medium mb-2">🎯 予想利益</div>
            <div className="text-xl font-bold text-green-600">¥---</div>
            <div className="text-xs text-green-600 mt-1">手数料・送料込み</div>
          </div>
        </div>

        <div className="mt-4 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
          <div className="text-sm text-emerald-800">
            <strong>💡 利益計算のポイント:</strong>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li>Amazon手数料: カテゴリによって8-15%</li>
              <li>FBA手数料: 商品サイズ・重量で変動</li>
              <li>送料: 仕入れ・発送両方を考慮</li>
              <li>最低利益率: 30%以上を目安に</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfitFinderWorkflow; 