import React from 'react';
import { Package } from 'lucide-react';
import { Product } from '../types';
import { formatCurrency } from '../utils/formatters';

interface AmazonPriceTableProps {
  product: Product;
}

const AmazonPriceTable: React.FC<AmazonPriceTableProps> = ({ product }) => {
  const amazonData = product.amazonData;
  
  const tableData = [
    {
      condition: '新品',
      lowestPrice: amazonData?.newPrice,
      sellerCount: 19,
      salesCount: 9,
      avgPrice: amazonData?.newPrice,
      recentPrice: amazonData?.newPrice,
    },
    {
      condition: '中古',
      lowestPrice: amazonData?.usedPrice,
      sellerCount: amazonData?.usedSellersCount || 0,
      salesCount: 4,
      avgPrice: amazonData?.avgPrice90Days,
      recentPrice: amazonData?.usedPrice,
      isHighlighted: product.profitAnalysis?.isProfitable,
    },
  ];

  return (
    <div id="tblAmazon" className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center">
          <Package className="w-5 h-5 text-green-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-800">Amazon価格情報</h3>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                コンディション
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                最安値
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                出品者数
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                販売数
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                平均価格
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                直近価格
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tableData.map((row, index) => (
              <tr 
                key={index}
                className={row.isHighlighted ? 'bg-green-50' : ''}
              >
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                  {row.condition}
                </td>
                <td className={`px-4 py-3 whitespace-nowrap text-sm ${
                  row.isHighlighted ? 'font-bold text-green-700' : 'text-gray-900'
                }`}>
                  {row.lowestPrice ? formatCurrency(row.lowestPrice) : '--'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {row.sellerCount}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {row.salesCount}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {row.avgPrice ? formatCurrency(row.avgPrice) : '--'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {row.recentPrice ? formatCurrency(row.recentPrice) : '--'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AmazonPriceTable;