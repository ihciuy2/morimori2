// データ分析サービス
export interface PriceAnalysis {
  currentPrice: number | null;
  averagePrice: number;
  priceChange24h: number;
  priceChange7d: number;
  priceChange30d: number;
  volatility: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  recommendations: string[];
}

export class DataAnalysisService {
  // 価格履歴の分析
  static analyzePriceHistory(asin: string): PriceAnalysis {
    const historyData = this.getPriceHistory(asin);
    
    if (historyData.length === 0) {
      return this.getEmptyAnalysis();
    }

    const prices = historyData.map(record => record.price).filter(p => p !== null);
    const currentPrice = prices[prices.length - 1] || null;
    const averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;

    return {
      currentPrice,
      averagePrice,
      priceChange24h: this.calculatePriceChange(historyData, 1),
      priceChange7d: this.calculatePriceChange(historyData, 7),
      priceChange30d: this.calculatePriceChange(historyData, 30),
      volatility: this.calculateVolatility(prices),
      trend: this.determineTrend(prices),
      recommendations: this.generateRecommendations(historyData)
    };
  }

  // 価格履歴の取得
  private static getPriceHistory(asin: string): Array<{timestamp: number, price: number}> {
    const allData = JSON.parse(localStorage.getItem('price_history') || '[]');
    return allData
      .filter((record: any) => record.asin === asin)
      .map((record: any) => ({
        timestamp: record.collected_at,
        price: this.extractPrice(JSON.parse(record.data))
      }))
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  // 価格変動の計算
  private static calculatePriceChange(history: Array<{timestamp: number, price: number}>, days: number): number {
    const targetTime = Date.now() - (days * 24 * 60 * 60 * 1000);
    const currentPrice = history[history.length - 1]?.price;
    const pastPrice = history.find(record => record.timestamp >= targetTime)?.price;

    if (!currentPrice || !pastPrice) return 0;
    return ((currentPrice - pastPrice) / pastPrice) * 100;
  }

  // ボラティリティの計算
  private static calculateVolatility(prices: number[]): number {
    if (prices.length < 2) return 0;
    
    const mean = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const variance = prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length;
    return Math.sqrt(variance) / mean * 100;
  }

  // トレンドの判定
  private static determineTrend(prices: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (prices.length < 3) return 'stable';
    
    const recentPrices = prices.slice(-5);
    const slope = this.calculateSlope(recentPrices);
    
    if (slope > 0.02) return 'increasing';
    if (slope < -0.02) return 'decreasing';
    return 'stable';
  }

  // 推奨事項の生成
  private static generateRecommendations(history: Array<{timestamp: number, price: number}>): string[] {
    const recommendations: string[] = [];
    const analysis = this.analyzePriceHistory(history[0]?.asin || '');
    
    if (analysis.priceChange24h < -5) {
      recommendations.push('価格が24時間で5%以上下落しています。購入のチャンスかもしれません。');
    }
    
    if (analysis.volatility > 20) {
      recommendations.push('価格変動が大きいため、購入タイミングに注意が必要です。');
    }
    
    if (analysis.trend === 'decreasing') {
      recommendations.push('価格が下降トレンドにあります。もう少し待つことを検討してください。');
    }
    
    return recommendations;
  }

  // ユーティリティメソッド
  private static extractPrice(keepaData: any): number | null {
    // Keepaデータから価格を抽出
    const usedPrice = keepaData.products?.[0]?.csv?.[1]; // Used price index
    if (usedPrice && usedPrice.length > 0) {
      const latestPrice = usedPrice[usedPrice.length - 1];
      return latestPrice !== -1 ? Math.floor(latestPrice / 100) : null;
    }
    return null;
  }

  private static calculateSlope(prices: number[]): number {
    const n = prices.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = prices.reduce((sum, price) => sum + price, 0);
    const sumXY = prices.reduce((sum, price, index) => sum + (index * price), 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
    
    return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  }

  private static getEmptyAnalysis(): PriceAnalysis {
    return {
      currentPrice: null,
      averagePrice: 0,
      priceChange24h: 0,
      priceChange7d: 0,
      priceChange30d: 0,
      volatility: 0,
      trend: 'stable',
      recommendations: ['データが不足しています。']
    };
  }
}