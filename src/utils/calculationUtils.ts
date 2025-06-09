interface ProfitCalculationParams {
  amazonUsedPrice: number | null;
  yahooAvgPrice: number | null;
  targetProfitRate: number;
}

/**
 * Calculate profit and profitability based on Amazon and Yahoo prices
 */
export const calculateProfit = ({ amazonUsedPrice, yahooAvgPrice, targetProfitRate }: ProfitCalculationParams) => {
  // If either price is missing, we can't calculate profit
  if (!amazonUsedPrice || !yahooAvgPrice) {
    return {
      potentialProfit: null,
      profitRate: null,
      isProfitable: false,
      amazonFees: null,
      yahooFees: null,
      recommendedPurchasePrice: null
    };
  }

  // Calculate Amazon fees (assuming 10% category fee + 15% FBA fee)
  const categoryFeeRate = 0.10;
  const fbaFeeRate = 0.15;
  const totalFeeRate = categoryFeeRate + fbaFeeRate;
  
  const amazonFees = amazonUsedPrice * totalFeeRate;
  
  // Calculate Yahoo fees (typically around 10%)
  const yahooFeeRate = 0.10;
  const yahooFees = yahooAvgPrice * yahooFeeRate;
  
  // Calculate potential profit
  const potentialProfit = amazonUsedPrice - amazonFees - yahooAvgPrice - yahooFees;
  
  // Calculate profit rate
  const profitRate = (potentialProfit / amazonUsedPrice) * 100;
  
  // Determine if profitable based on target profit rate
  const isProfitable = profitRate >= targetProfitRate;
  
  // Calculate recommended purchase price
  // This is the maximum price to pay at Yahoo to achieve the target profit rate
  const targetProfit = amazonUsedPrice * (targetProfitRate / 100);
  const recommendedPurchasePrice = Math.max(0, 
    (amazonUsedPrice - amazonFees - targetProfit) / (1 + yahooFeeRate)
  );
  
  return {
    potentialProfit,
    profitRate,
    isProfitable,
    amazonFees,
    yahooFees,
    recommendedPurchasePrice: Math.floor(recommendedPurchasePrice) // Round down to be conservative
  };
};