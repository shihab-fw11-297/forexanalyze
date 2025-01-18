const { SMA, RSI } = require('technicalindicators');

class RSIDivergenceStrategy {
  constructor() {
    this.previousRsiLows = [];
    this.previousRsiHighs = [];
    this.previousPriceLows = [];
    this.previousPriceHighs = [];
    this.divergenceMemory = 5; // Number of points to store for divergence analysis
  }

  async analyze(data) {
    const { close, high, low } = data;
    
    // Calculate SMAs
    const sma21 = SMA.calculate({ period: 21, values: close });
    const sma150 = SMA.calculate({ period: 150, values: close });
    const sma200 = SMA.calculate({ period: 200, values: close });
    
    // Calculate RSI
    const rsi = RSI.calculate({
      period: 14,
      values: close
    });
    
    // Get current values
    const currentClose = close[close.length - 1];
    const currentRsi = rsi[rsi.length - 1];
    const currentSMA21 = sma21[sma21.length - 1];
    const currentSMA150 = sma150[sma150.length - 1];
    const currentSMA200 = sma200[sma200.length - 1];
    
    // Update price and RSI history for divergence analysis
    this.updateDivergenceHistory(currentClose, currentRsi, high[high.length - 1], low[low.length - 1]);
    
    // Check for divergences
    const { bullishDivergence, bearishDivergence } = this.checkDivergences();
    
    // Generate signal based on conditions
    const signal = this.generateSignal({
      currentClose,
      currentRsi,
      sma: {
        sma21: currentSMA21,
        sma150: currentSMA150,
        sma200: currentSMA200
      },
      divergence: {
        bullish: bullishDivergence,
        bearish: bearishDivergence
      }
    });
    
    return {
      signal,
      indicators: {
        rsi: currentRsi,
        sma: {
          sma21: currentSMA21,
          sma150: currentSMA150,
          sma200: currentSMA200
        },
        divergence: {
          bullish: bullishDivergence,
          bearish: bearishDivergence
        }
      }
    };
  }
  
  updateDivergenceHistory(currentPrice, currentRsi, currentHigh, currentLow) {
    // Update price lows and highs
    if (this.isNewLow(currentLow)) {
      this.previousPriceLows.push(currentLow);
      this.previousRsiLows.push(currentRsi);
    }
    
    if (this.isNewHigh(currentHigh)) {
      this.previousPriceHighs.push(currentHigh);
      this.previousRsiHighs.push(currentRsi);
    }
    
    // Keep only recent points
    this.previousPriceLows = this.previousPriceLows.slice(-this.divergenceMemory);
    this.previousRsiLows = this.previousRsiLows.slice(-this.divergenceMemory);
    this.previousPriceHighs = this.previousPriceHighs.slice(-this.divergenceMemory);
    this.previousRsiHighs = this.previousRsiHighs.slice(-this.divergenceMemory);
  }
  
  isNewLow(currentLow) {
    return this.previousPriceLows.length === 0 || currentLow < Math.min(...this.previousPriceLows);
  }
  
  isNewHigh(currentHigh) {
    return this.previousPriceHighs.length === 0 || currentHigh > Math.max(...this.previousPriceHighs);
  }
  
  checkDivergences() {
    let bullishDivergence = false;
    let bearishDivergence = false;
    
    // Check for bullish divergence (lower lows in price, higher lows in RSI)
    if (this.previousPriceLows.length >= 2 && this.previousRsiLows.length >= 2) {
      const priceTrend = this.previousPriceLows[this.previousPriceLows.length - 1] < 
                        this.previousPriceLows[this.previousPriceLows.length - 2];
      const rsiTrend = this.previousRsiLows[this.previousRsiLows.length - 1] > 
                      this.previousRsiLows[this.previousRsiLows.length - 2];
      
      bullishDivergence = priceTrend && rsiTrend;
    }
    
    // Check for bearish divergence (higher highs in price, lower highs in RSI)
    if (this.previousPriceHighs.length >= 2 && this.previousRsiHighs.length >= 2) {
      const priceTrend = this.previousPriceHighs[this.previousPriceHighs.length - 1] > 
                        this.previousPriceHighs[this.previousPriceHighs.length - 2];
      const rsiTrend = this.previousRsiHighs[this.previousRsiHighs.length - 1] < 
                      this.previousRsiHighs[this.previousRsiHighs.length - 2];
      
      bearishDivergence = priceTrend && rsiTrend;
    }
    
    return { bullishDivergence, bearishDivergence };
  }
  
  generateSignal({ currentClose, currentRsi, sma, divergence }) {
    // Calculate pip value for stop loss and target
    const pipMultiplier = 0.0001;
    
    // Buy conditions
    if (
      divergence.bullish && // Bullish RSI divergence
      currentRsi > 50 && // RSI above 50
      currentClose > sma.sma21 && // Price above 21 SMA
      this.isMovingAverageAligned(sma, 'bullish') // Moving averages aligned bullish
    ) {
      return {
        type: 'BUY',
        entry: currentClose,
        target: currentClose + (10 * pipMultiplier),
        stopLoss: currentClose - (5 * pipMultiplier),
        riskReward: 2,
        exitConditions: {
          rsiLevel: 70,
          maBreak: sma.sma21,
          divergenceReversal: true
        }
      };
    }
    
    // Sell conditions
    if (
      divergence.bearish && // Bearish RSI divergence
      currentRsi < 50 && // RSI below 50
      currentClose < sma.sma21 && // Price below 21 SMA
      this.isMovingAverageAligned(sma, 'bearish') // Moving averages aligned bearish
    ) {
      return {
        type: 'SELL',
        entry: currentClose,
        target: currentClose - (10 * pipMultiplier),
        stopLoss: currentClose + (5 * pipMultiplier),
        riskReward: 2,
        exitConditions: {
          rsiLevel: 30,
          maBreak: sma.sma21,
          divergenceReversal: true
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
  
  isMovingAverageAligned(sma, direction) {
    if (direction === 'bullish') {
      return sma.sma21 > sma.sma150 && sma.sma150 > sma.sma200;
    } else {
      return sma.sma21 < sma.sma150 && sma.sma150 < sma.sma200;
    }
  }
}

module.exports = { RSIDivergenceStrategy };