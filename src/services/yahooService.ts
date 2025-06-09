import { YahooData, YahooSoldItem } from '../types';

export const fetchYahooData = async (keyword: string): Promise<YahooData> => {
  console.log(`Fetching Yahoo Auction data for keyword: ${keyword}`);
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Generate mock data
  const avgPrice = Math.floor(1000 + Math.random() * 10000);
  const soldCount = Math.floor(1 + Math.random() * 30);
  const listingCount = Math.floor(soldCount * (1 + Math.random()));
  const highestPrice = Math.floor(avgPrice * (1.2 + Math.random() * 0.5));
  
  // Generate mock recent sold items
  const recentSoldItems: YahooSoldItem[] = Array.from({ length: 3 }, (_, i) => ({
    title: `${keyword} 落札商品 ${i + 1}`,
    price: Math.floor(avgPrice * (0.8 + Math.random() * 0.4)),
    imageUrl: `https://images.pexels.com/photos/${Math.floor(1000 + Math.random() * 9000)}/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=160`,
    auctionUrl: `https://page.auctions.yahoo.co.jp/jp/auction/${Math.random().toString(36).substring(2, 10)}`,
    endDate: Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)
  }));
  
  return {
    avgPrice,
    soldCount,
    listingCount,
    highestPrice,
    recentSoldItems,
    lastUpdated: Date.now()
  };
};