const { SMA, VWAP } = require('technicalindicators');

class MultiIndicatorBreakoutStrategy {
  constructor() {
    this.donchianPeriod = 10;
    this.vwapPeriod = 15;
    this.ichimokuConversionPeriod = 9;
    this.ichimokuBasePeriod = 26;
    this.fibonacciLevels = {
      fib50: 0.5,
      fib618: 0.618
    };
  }

  async analyze(data) {
    const { high, low, close, volume } = data;
    
    // Calculate Donchian Channels
    const donchian = this.calculateDonchianChannels(high, low);
    
    // Calculate Anchored VWAP (last 15 candles)
    const vwap = VWAP.calculate({
      high: high.slice(-this.vwapPeriod),
      low: low.slice(-this.vwapPeriod),
      close: close.slice(-this.vwapPeriod),
      volume: volume.slice(-this.vwapPeriod)
    });
    
    // Calculate Ichimoku Lines
    const ichimoku = this.calculateIchimoku(high, low);
    
    // Calculate Fibonacci Levels
    const fibLevels = this.calculateFibonacciLevels(high, low);
    
    // Get current values
    const currentClose = close[close.length - 1];
    const currentHigh = high[high.length - 1];
    const currentLow = low[low.length - 1];
    const currentVWAP = vwap[vwap.length - 1];
    
    // Check for breakouts and conditions
    const conditions = this.checkConditions({
      currentPrice: currentClose,
      currentHigh,
      currentLow,
      donchian,
      vwap: currentVWAP,
      ichimoku,
      fibLevels
    });
    
    // Generate trading signal
    const signal = this.generateSignal(conditions, currentClose);
    
    return {
      signal,
      indicators: {
        donchian,
        vwap: currentVWAP,
        ichimoku,
        fibLevels,
        conditions
      }
    };
  }
  
  calculateDonchianChannels(high, low) {
    const period = this.donchianPeriod;
    const highs = high.slice(-period);
    const lows = low.slice(-period);
    
    return {
      upper: Math.max(...highs),
      lower: Math.min(...lows),
      middle: (Math.max(...highs) + Math.min(...lows)) / 2
    };
  }
  
  calculateIchimoku(high, low) {
    const conversionPeriod = this.ichimokuConversionPeriod;
    const basePeriod = this.ichimokuBasePeriod;
    
    // Calculate Conversion Line (Tenkan-sen)
    const conversionHigh = Math.max(...high.slice(-conversionPeriod));
    const conversionLow = Math.min(...low.slice(-conversionPeriod));
    const conversionLine = (conversionHigh + conversionLow) / 2;
    
    // Calculate Base Line (Kijun-sen)
    const baseHigh = Math.max(...high.slice(-basePeriod));
    const baseLow = Math.min(...low.slice(-basePeriod));
    const baseLine = (baseHigh + baseLow) / 2;
    
    return {
      conversionLine,
      baseLine,
      crossover: this.checkIchimokuCrossover(high, low)
    };
  }
  
  checkIchimokuCrossover(high, low) {
    // Calculate previous values
    const prevConversionLine = this.calculateIchimokuValue(
      high.slice(-this.ichimokuConversionPeriod - 1, -1),
      low.slice(-this.ichimokuConversionPeriod - 1, -1)
    );
    const prevBaseLine = this.calculateIchimokuValue(
      high.slice(-this.ichimokuBasePeriod - 1, -1),
      low.slice(-this.ichimokuBasePeriod - 1, -1)
    );
    
    // Calculate current values
    const currentConversionLine = this.calculateIchimokuValue(
      high.slice(-this.ichimokuConversionPeriod),
      low.slice(-this.ichimokuConversionPeriod)
    );
    const currentBaseLine = this.calculateIchimokuValue(
      high.slice(-this.ichimokuBasePeriod),
      low.slice(-this.ichimokuBasePeriod)
    );
    
    return {
      bullish: prevConversionLine <= prevBaseLine && currentConversionLine > currentBaseLine,
      bearish: prevConversionLine >= prevBaseLine && currentConversionLine < currentBaseLine
    };
  }
  
  calculateIchimokuValue(high, low) {
    return (Math.max(...high) + Math.min(...low)) / 2;
  }
  
  calculateFibonacciLevels(high, low) {
    const period = 10;
    const recentHigh = Math.max(...high.slice(-period));
    const recentLow = Math.min(...low.slice(-period));
    const range = recentHigh - recentLow;
    
    return {
      level50: recentLow + (range * this.fibonacciLevels.fib50),
      level618: recentLow + (range * this.fibonacciLevels.fib618)
    };
  }
  
  checkConditions({ currentPrice, currentHigh, currentLow, donchian, vwap, ichimoku, fibLevels }) {
    return {
      bullish: {
        donchianBreakout: currentPrice > donchian.upper,
        aboveVWAP: currentPrice > vwap,
        ichimokuBullish: ichimoku.crossover.bullish,
        fibonacciSupport: currentLow >= fibLevels.level50 && currentLow <= fibLevels.level618
      },
      bearish: {
        donchianBreakout: currentPrice < donchian.lower,
        belowVWAP: currentPrice < vwap,
        ichimokuBearish: ichimoku.crossover.bearish,
        fibonacciResistance: currentHigh >= fibLevels.level50 && currentHigh <= fibLevels.level618
      }
    };
  }
  
  generateSignal(conditions, currentPrice) {
    const pipMultiplier = 0.0001; // Adjust based on instrument
    
    // Buy conditions
    if (
      conditions.bullish.donchianBreakout &&
      conditions.bullish.aboveVWAP &&
      conditions.bullish.ichimokuBullish &&
      conditions.bullish.fibonacciSupport
    ) {
      return {
        type: 'BUY',
        entry: currentPrice,
        target: currentPrice + (6.5 * pipMultiplier), // Average of 6-7 pips
        stopLoss: currentPrice - (3.5 * pipMultiplier), // Average of 3-4 pips
        riskReward: 1.86, // (6.5/3.5)
        entryType: 'MARKET',
        alternateEntry: {
          type: 'LIMIT',
          price: currentPrice - (2 * pipMultiplier) // Slightly better entry near Fib levels
        }
      };
    }
    
    // Sell conditions
    if (
      conditions.bearish.donchianBreakout &&
      conditions.bearish.belowVWAP &&
      conditions.bearish.ichimokuBearish &&
      conditions.bearish.fibonacciResistance
    ) {
      return {
        type: 'SELL',
        entry: currentPrice,
        target: currentPrice - (6.5 * pipMultiplier), // Average of 6-7 pips
        stopLoss: currentPrice + (3.5 * pipMultiplier), // Average of 3-4 pips
        riskReward: 1.86, // (6.5/3.5)
        entryType: 'MARKET',
        alternateEntry: {
          type: 'LIMIT',
          price: currentPrice + (2 * pipMultiplier) // Slightly better entry near Fib levels
        }
      };
    }
    
    return {
      type: 'WAIT',
      entry: null,
      target: null,
      stopLoss: null,
      riskReward: null,
      entryType: null,
      alternateEntry: null
    };
  }
}

module.exports = { MultiIndicatorBreakoutStrategy };