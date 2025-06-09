export interface Product {
  id: string;
  name: string;
  asin: string;
  yahooKeyword: string;
  targetProfitRate: number;
  maxPurchasePrice?: number;
  amazonData?: AmazonData;
  yahooData?: YahooData;
  profitAnalysis?: ProfitAnalysis;
  createdAt: number;
  updatedAt: number;
  status: 'pending' | 'loading' | 'success' | 'error';
  error?: string;
}

export interface AmazonData {
  usedPrice: number | null;
  usedSellersCount: number | null;
  avgPrice90Days: number | null;
  newPrice: number | null;
  imageUrl: string | null;
  lastUpdated: number;
}

export interface YahooData {
  avgPrice: number | null;
  soldCount: number | null;
  listingCount: number | null;
  highestPrice: number | null;
  lastUpdated: number;
  recentSoldItems: YahooSoldItem[];
}

export interface YahooSoldItem {
  title: string;
  price: number;
  imageUrl: string;
  auctionUrl: string;
  endDate: number;
}

export interface ProfitAnalysis {
  potentialProfit: number | null;
  profitRate: number | null;
  isProfitable: boolean;
  amazonFees: number | null;
  yahooFees: number | null;
  recommendedPurchasePrice: number | null;
}