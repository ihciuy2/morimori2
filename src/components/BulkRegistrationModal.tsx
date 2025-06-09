import React, { useState, useRef } from 'react';
import { X, Upload, Download, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { useProducts } from '../context/ProductContext';
import * as XLSX from 'xlsx';

interface BulkRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface BulkProductData {
  asin: string;
  name?: string;
  yahooKeyword?: string;
  targetProfitRate: number;
  maxPurchasePrice?: number;
}

const BulkRegistrationModal: React.FC<BulkRegistrationModalProps> = ({ isOpen, onClose }) => {
  const { addProduct } = useProducts();
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedData, setUploadedData] = useState<BulkProductData[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const templateData = [
      {
        'ASIN': 'B01EXAMPLE1',
        '商品名': 'サンプル商品1（省略可）',
        'ヤフオク検索キーワード': 'サンプル キーワード（省略可）',
        '目標利益率(%)': 30,
        '仕入れ上限価格(円)': 5000
      },
      {
        'ASIN': 'B01EXAMPLE2',
        '商品名': 'サンプル商品2（省略可）',
        'ヤフオク検索キーワード': 'サンプル キーワード（省略可）',
        '目標利益率(%)': 25,
        '仕入れ上限価格(円)': ''
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'テンプレート');
    XLSX.writeFile(wb, 'amazon_yahoo_bulk_template.xlsx');
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const validData: BulkProductData[] = [];
        const newErrors: string[] = [];

        jsonData.forEach((row: any, index: number) => {
          const asin = row['ASIN']?.toString().trim();
          const targetProfitRate = Number(row['目標利益率(%)']);
          
          if (!asin || !/^[A-Z0-9]{10}$/.test(asin)) {
            newErrors.push(`行${index + 2}: 有効なASINコードが必要です`);
            return;
          }
          
          if (!targetProfitRate || targetProfitRate <= 0) {
            newErrors.push(`行${index + 2}: 目標利益率は0より大きい値が必要です`);
            return;
          }

          validData.push({
            asin,
            name: row['商品名']?.toString().trim() || undefined,
            yahooKeyword: row['ヤフオク検索キーワード']?.toString().trim() || undefined,
            targetProfitRate,
            maxPurchasePrice: row['仕入れ上限価格(円)'] ? Number(row['仕入れ上限価格(円)']) : undefined
          });
        });

        setUploadedData(validData);
        setErrors(newErrors);
      } catch (error) {
        setErrors(['ファイルの読み込みに失敗しました']);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    processFile(file);
  };

  const handleBulkRegister = async () => {
    if (uploadedData.length === 0) return;

    setIsProcessing(true);

    try {
      for (const productData of uploadedData) {
        await addProduct(productData);
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      setUploadedData([]);
      setErrors([]);
      onClose();
    } catch (error) {
      setErrors(['一括登録中にエラーが発生しました']);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">一括登録</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Template Download */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-blue-800 mb-1">
                  テンプレートファイルをダウンロード
                </h3>
                <p className="text-sm text-blue-700 mb-3">
                  一括登録用のExcelテンプレートをダウンロードして、商品情報を入力してください。
                </p>
                <button
                  onClick={downloadTemplate}
                  className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <Download className="w-4 h-4 mr-2" />
                  テンプレートをダウンロード
                </button>
              </div>
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Excelファイルをアップロード
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-2">
                ファイルをドラッグ&ドロップするか、クリックして選択
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="hidden"
                id="bulk-upload"
              />
              <label
                htmlFor="bulk-upload"
                className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors cursor-pointer text-sm"
              >
                ファイルを選択
              </label>
            </div>
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-red-800 mb-2">
                    エラー ({errors.length}件)
                  </h3>
                  <div className="max-h-32 overflow-y-auto">
                    {errors.map((error, index) => (
                      <div key={index} className="text-sm text-red-700 mb-1">
                        {error}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Success */}
          {uploadedData.length > 0 && errors.length === 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-green-800 mb-1">
                    登録準備完了
                  </h3>
                  <p className="text-sm text-green-700">
                    {uploadedData.length}件の商品データが正常に読み込まれました。
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              閉じる
            </button>
            <button
              onClick={handleBulkRegister}
              disabled={uploadedData.length === 0 || errors.length > 0 || isProcessing}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isProcessing ? '登録中...' : `${uploadedData.length}件を一括登録`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkRegistrationModal;