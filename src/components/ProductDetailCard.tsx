import React, { useState } from "react";
import AmazonInfoCard from "./AmazonInfoCard";

type Props = {
  asin: string;
  title: string;
  imageUrl: string;
};

const ProductDetailCard: React.FC<Props> = ({ asin, title, imageUrl }) => {
  const [keyword, setKeyword] = useState<string>("");

  return (
    <div className="space-y-6 w-full">
      {/* Amazon商品詳細情報 */}
      <AmazonInfoCard asin={asin} />

      {/* オークファン検索セクション */}
      <div className="bg-white shadow rounded p-6 space-y-4 w-full">
        <h3 className="font-bold text-lg text-gray-900 mb-3">中古市場価格チェック</h3>
        
        {/* 検索キーワード入力欄 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            検索キーワード
          </label>
          <input
            type="text"
            placeholder={`検索キーワードを入力 (例: ${title || asin})`}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="w-full max-w-lg border rounded p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* メルカリ検索結果 */}
        <div className="w-full">
          <h4 className="font-semibold mb-3 text-gray-800">メルカリ検索結果</h4>
          {keyword.trim() ? (
            <iframe
              src={`https://aucfan.com/search1/s-mc/?q=${encodeURIComponent(keyword)}`}
              className="w-full border rounded min-h-[600px]"
              title="メルカリ検索結果"
            />
          ) : (
            <div className="w-full border rounded bg-gray-50 flex items-center justify-center text-gray-500 min-h-[600px]">
              <div className="text-center">
                <p className="text-lg mb-2">🔍 検索準備完了</p>
                <p>上記にキーワードを入力してメルカリの相場をチェック</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetailCard; 