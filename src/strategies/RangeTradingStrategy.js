const { SMA } = require('technicalindicators');

class RangeTradingStrategy {
  constructor() {
    this.supportLevels = [];
    this.resistanceLevels = [];
    this.lookbackPeriod = 20; // Period for identifying support/resistance
  }

  async analyze(data) {
    const { open, high, low, close, timestamp } = data;
    
    // Update support and resistance levels
    this.updateLevels(high, low, close);
    
    // Get current and previous values
    const currentClose = close[close.length - 1];
    const previousClose = close[close.length - 2];
    const currentOpen = open[open.length - 1];
    const previousOpen = open[open.length - 2];
    const currentHigh = high[high.length - 1];
    const currentLow = low[low.length - 1];
    
    // Calculate nearest support and resistance
    const nearestSupport = this.findNearestSupport(currentClose);
    const nearestResistance = this.findNearestResistance(currentClose);
    
    // Check for candlestick patterns
    const bullishEngulfing = previousClose < previousOpen && 
                           currentClose > currentOpen && 
                           currentClose > previousOpen && 
                           currentOpen < previousClose;
                           
    const bearishEngulfing = previousClose > previousOpen && 
                           currentClose < currentOpen && 
                           currentClose < previousOpen && 
                           currentOpen > previousClose;
    
    // Calculate pip values for targets and stops
    const pipMultiplier = 0.0001;
    const profitTarget = {
      long: currentClose + (7 * pipMultiplier),
      short: currentClose - (7 * pipMultiplier)
    };
    const stopLoss = {
      long: currentClose - (4 * pipMultiplier),
      short: currentClose + (4 * pipMultiplier)
    };
    
    // Generate trading signal
    const signal = this.generateSignal({
      currentPrice: currentClose,
      nearestSupport,
      nearestResistance,
      bullishEngulfing,
      bearishEngulfing,
      profitTarget,
      stopLoss
    });
    
    return {
      signal,
      levels: {
        support: nearestSupport,
        resistance: nearestResistance
      },
      patterns: {
        bullishEngulfing,
        bearishEngulfing
      }
    };
  }
  
  updateLevels(high, low, close) {
    // Look for potential support levels
    const recentLows = low.slice(-this.lookbackPeriod);
    const potentialSupports = this.findSignificantLevels(recentLows);
    this.supportLevels = [...new Set([...this.supportLevels, ...potentialSupports])];
    
    // Look for potential resistance levels
    const recentHighs = high.slice(-this.lookbackPeriod);
    const potentialResistances = this.findSignificantLevels(recentHighs);
    this.resistanceLevels = [...new Set([...this.resistanceLevels, ...potentialResistances])];
  }
  
  findSignificantLevels(prices) {
    const levels = [];
    const tolerance = 0.0002; // 2 pip tolerance for level grouping
    
    for (let i = 1; i < prices.length - 1; i++) {
      if (this.isPivotPoint(prices, i)) {
        const level = prices[i];
        if (!levels.some(existingLevel => Math.abs(existingLevel - level) < tolerance)) {
          levels.push(level);
        }
      }
    }
    
    return levels;
  }
  
  isPivotPoint(prices, index) {
    return (prices[index] < prices[index - 1] && prices[index] < prices[index + 1]) ||
           (prices[index] > prices[index - 1] && prices[index] > prices[index + 1]);
  }
  
  findNearestSupport(price) {
    return this.supportLevels
      .filter(level => level < price)
      .reduce((nearest, current) => 
        Math.abs(current - price) < Math.abs(nearest - price) ? current : nearest, 
        this.supportLevels[0]
      );
  }
  
  findNearestResistance(price) {
    return this.resistanceLevels
      .filter(level => level > price)
      .reduce((nearest, current) => 
        Math.abs(current - price) < Math.abs(nearest - price) ? current : nearest, 
        this.resistanceLevels[0]
      );
  }
  
  generateSignal({ currentPrice, nearestSupport, nearestResistance, bullishEngulfing, bearishEngulfing, profitTarget, stopLoss }) {
    const supportDistance = Math.abs(currentPrice - nearestSupport);
    const resistanceDistance = Math.abs(currentPrice - nearestResistance);
    const pipMultiplier = 0.0001;
    
    // Buy conditions
    if (
      supportDistance < (5 * pipMultiplier) && // Price near support
      bullishEngulfing && // Bullish pattern
      resistanceDistance > (10 * pipMultiplier) // Enough room to target resistance
    ) {
      return {
        type: 'BUY',
        entry: currentPrice,
        target: profitTarget.long,
        stopLoss: stopLoss.long,
        riskReward: 7/4, // Based on 7 pip target and 4 pip stop
        exitConditions: {
          targetHit: profitTarget.long,
          stopLossHit: stopLoss.long,
          resistanceApproach: nearestResistance
        }
      };
    }
    
    // Sell conditions
    if (
      resistanceDistance < (5 * pipMultiplier) && // Price near resistance
      bearishEngulfing && // Bearish pattern
      supportDistance > (10 * pipMultiplier) // Enough room to target support
    ) {
      return {
        type: 'SELL',
        entry: currentPrice,
        target: profitTarget.short,
        stopLoss: stopLoss.short,
        riskReward: 7/4,
        exitConditions: {
          targetHit: profitTarget.short,
          stopLossHit: stopLoss.short,
          supportApproach: nearestSupport
        }
      };
    }
    
    return {
      type: 'WAIT',
      entry: null,
      target: null,
      stopLoss: null,
      riskReward: null,
      exitConditions: null
    };
  }
}

module.exports = { RangeTradingStrategy };