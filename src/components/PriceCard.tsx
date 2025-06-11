import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend);

type PriceCardProps = {
  asin: string;
};

type ProductData = {
  asin: string;
  newBuyBox: number | null;
  usedBuyBox: number | null;
  salesRank: number | null;
  priceHistory: number[];
  historyDates: string[];
  images: string[];
};

export const PriceCard: React.FC<PriceCardProps> = ({ asin }) => {
  const [data, setData] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/product?asin=${asin}`)
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [asin]);

  if (loading) {
    return (
      <div className="border rounded p-4 shadow bg-white w-full text-center">
        読み込み中…
      </div>
    );
  }

  if (!data) {
    return (
      <div className="border rounded p-4 shadow bg-white w-full text-center text-red-500">
        データ取得失敗
      </div>
    );
  }

  const chartData = {
    labels: data.historyDates,
    datasets: [
      {
        label: "新品価格",
        data: data.priceHistory,
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59,130,246,0.1)",
        tension: 0.3,
        borderWidth: 2,
        pointRadius: 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
    },
    scales: {
      x: { display: false },
      y: {
        title: { display: true, text: "¥" },
        ticks: { callback: (v: number) => `¥${v.toLocaleString()}` },
      },
    },
  };

  return (
    <div className="border rounded p-4 shadow bg-white w-full flex flex-col items-center">
      <div className="w-full mb-4">
        <Line data={chartData} options={chartOptions} height={120} />
      </div>
      <table className="w-full text-sm">
        <tbody>
          <tr>
            <td className="font-medium w-1/3">新品最安値</td>
            <td>¥{data.newBuyBox?.toLocaleString() ?? "–"}</td>
          </tr>
          <tr>
            <td className="font-medium">中古最安値</td>
            <td>¥{data.usedBuyBox?.toLocaleString() ?? "–"}</td>
          </tr>
          <tr>
            <td className="font-medium">売れ筋ランキング</td>
            <td>#{data.salesRank?.toLocaleString() ?? "–"}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default PriceCard; 