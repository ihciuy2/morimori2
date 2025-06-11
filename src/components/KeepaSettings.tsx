import React, { useState, useEffect } from 'react';

const STORAGE_KEY = 'keepaApiKey';

const KeepaSettings: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const key = localStorage.getItem(STORAGE_KEY);
    if (key) setApiKey(key);
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem(STORAGE_KEY, apiKey.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded shadow">
      <h2 className="text-lg font-bold mb-4">Keepa APIキー設定</h2>
      <form onSubmit={handleSave}>
        <input
          type="text"
          className="w-full border rounded px-3 py-2 mb-2"
          placeholder="Keepa APIキーを入力"
          value={apiKey}
          onChange={e => setApiKey(e.target.value)}
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">保存</button>
        {saved && <span className="ml-3 text-green-600">保存しました</span>}
      </form>
      <p className="text-xs text-gray-500 mt-2">APIキーはローカルにのみ保存されます。</p>
    </div>
  );
};

export default KeepaSettings;