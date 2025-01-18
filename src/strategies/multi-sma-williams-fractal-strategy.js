// strategy4.js
const { SMA, RSI } = require('technicalindicators');

class MultiSmaWilliamsFractalStrategy {
  calculateWilliamsFractals(high, low, period = 5) {
    const bearishFractals = [];
    const bullishFractals = [];
    
    // Need at least period*2-1 candles to calculate fractals
    for (let i = period-1; i < high.length-(period-1); i++) {
      // Check for bearish fractal
      let isBearish = true;
      for (let j = 1; j < period; j++) {
        if (high[i-j] >= high[i] || high[i+j] >= high[i]) {
          isBearish = false;
          break;
        }
      }
      bearishFractals[i] = isBearish ? high[i] : null;
      
      // Check for bullish fractal
      let isBullish = true;
      for (let j = 1; j < period; j++) {
        if (low[i-j] <= low[i] || low[i+j] <= low[i]) {
          isBullish = false;
          break;
        }
      }
      bullishFractals[i] = isBullish ? low[i] : null;
    }
    
    return {
      bearish: bearishFractals,
      bullish: bullishFractals
    };
  }
  
  async analyze(data) {
    const { close, high, low } = data;
    
    // Calculate SMAs
    const sma21 = SMA.calculate({ period: 21, values: close });
    const sma50 = SMA.calculate({ period: 50, values: close });
    const sma200 = SMA.calculate({ period: 200, values: close });
    
    // Calculate RSI
    const rsi = RSI.calculate({ period: 14, values: close });
    
    // Calculate Williams Fractals
    const fractals = this.calculateWilliamsFractals(high, low);
    
    // Get current values
    const currentPrice = close[close.length - 1];
    const currentSma21 = sma21[sma21.length - 1];
    const currentSma50 = sma50[sma50.length - 1];
    const currentSma200 = sma200[sma200.length - 1];
    const currentRsi = rsi[rsi.length - 1];
    
    // Check for latest fractal signals
    const latestBearishFractal = fractals.bearish.slice().reverse().find(f => f !== null);
    const latestBullishFractal = fractals.bullish.slice().reverse().find(f => f !== null);
    
    // Get previous values for confirmation
    const previousClose = close[close.length - 2];
    
    const signal = this.generateSignal({
      currentPrice,
      previousClose,
      sma21: currentSma21,
      sma50: currentSma50,
      sma200: currentSma200,
      rsi: currentRsi,
      bearishFractal: latestBearishFractal,
      bullishFractal: latestBullishFractal
    });
    
    return {
      signal,
      indicators: {
        sma21: currentSma21,
        sma50: currentSma50,
        sma200: currentSma200,
        rsi: currentRsi,
        latestBearishFractal,
        latestBullishFractal,
        trendStrength: this.calculateTrendStrength({
          currentPrice,
          sma21: currentSma21,
          sma50: currentSma50,
          sma200: currentSma200
        })
      }
    };
  }
  
  calculateTrendStrength({ currentPrice, sma21, sma50, sma200 }) {
    if (currentPrice > sma21 && sma21 > sma50 && sma50 > sma200) {
      return 'Strong Uptrend';
    } else if (currentPrice < sma21 && sma21 < sma50 && sma50 < sma200) {
      return 'Strong Downtrend';
    } else if (currentPrice > sma200) {
      return 'Weak Uptrend';
    } else if (currentPrice < sma200) {
      return 'Weak Downtrend';
    }
    return 'No Clear Trend';
  }
  
  generateSignal({ 
    currentPrice, 
    previousClose, 
    sma21, 
    sma50, 
    sma200, 
    rsi, 
    bearishFractal, 
    bullishFractal 
  }) {
    // Check for uptrend alignment
    const isUptrend = currentPrice > sma21 && sma21 > sma50 && sma50 > sma200;
    
    // Check for downtrend alignment
    const isDowntrend = currentPrice < sma21 && sma21 < sma50 && sma50 < sma200;
    
    // Confirm candle close
    const candleClosed = currentPrice !== previousClose;
    
    if (isUptrend && bullishFractal && rsi > 50 && candleClosed) {
      return {
        type: 'BUY',
        reason: 'Uptrend confirmed with bullish fractal and RSI strength',
        conditions: {
          trendAlignment: 'Price above all SMAs',
          rsiStrength: rsi,
          fractalSignal: bullishFractal
        }
      };
    }
    
    if (isDowntrend && bearishFractal && rsi < 50 && candleClosed) {
      return {
        type: 'SELL',
        reason: 'Downtrend confirmed with bearish fractal and RSI weakness',
        conditions: {
          trendAlignment: 'Price below all SMAs',
          rsiStrength: rsi,
          fractalSignal: bearishFractal
        }
      };
    }
    
    return {
      type: 'WAIT',
      reason: 'Waiting for trend alignment and fractal signal',
      conditions: {
        trendAlignment: this.calculateTrendStrength({
          currentPrice,
          sma21,
          sma50,
          sma200
        }),
        rsiStrength: rsi,
        fractalSignal: null
      }
    };
  }
}

module.exports = { MultiSmaWilliamsFractalStrategy };