const { ADX, RSI, MACD } = require('technicalindicators');

class AdxFibonacciRsiHarmonicStrategy {
  async analyze(data) {
    const { high, low, close } = data;
    
    // Calculate ADX
    const adx = ADX.calculate({
      high: high,
      low: low,
      close: close,
      period: 14
    });
    
    // Calculate RSI
    const rsi = RSI.calculate({
      period: 14,
      values: close
    });
    
    // Calculate MACD
    const macd = MACD.calculate({
      fastPeriod: 8,
      slowPeriod: 21,
      signalPeriod: 5,
      values: close
    });
    
    // Calculate Fibonacci levels
    const recentHigh = Math.max(...high.slice(-50));
    const recentLow = Math.min(...low.slice(-50));
    const fibLevels = this.calculateFibonacciLevels(recentHigh, recentLow);
    
    // Get current and previous values
    const currentPrice = close[close.length - 1];
    const currentADX = adx[adx.length - 1];
    const previousADX = adx[adx.length - 2];
    const currentRSI = rsi[rsi.length - 1];
    const previousRSI = rsi[rsi.length - 2];
    const currentMACD = macd[macd.length - 1];
    const previousMACD = macd[macd.length - 2];
    
    // Check signal conditions
    const strongTrend = currentADX.adx > 25;
    const rsiOversold = currentRSI < 30;
    const rsiOverbought = currentRSI > 70;
    const macdUpCross = previousMACD.MACD <= previousMACD.signal && currentMACD.MACD > currentMACD.signal;
    const macdDownCross = previousMACD.MACD >= previousMACD.signal && currentMACD.MACD < currentMACD.signal;
    
    // Check Fibonacci price proximity
    const nearFib50 = Math.abs(currentPrice - fibLevels.level_50) / fibLevels.level_50 < 0.01;
    const nearFib618 = Math.abs(currentPrice - fibLevels.level_618) / fibLevels.level_618 < 0.01;
    const nearFibLevel = nearFib50 || nearFib618;
    
    // Calculate profit target (4-5 points)
    const profitTarget = {
      long: currentPrice + 4,
      short: currentPrice - 4
    };
    
    // Generate signal based on conditions
    const signal = this.generateSignal({
      strongTrend,
      rsiOversold,
      rsiOverbought,
      macdUpCross,
      macdDownCross,
      nearFibLevel,
      profitTarget,
      fibLevels
    });
    
    return {
      signal,
      indicators: {
        adx: {
          adx: currentADX.adx,
          plusDI: currentADX.plusDI,
          minusDI: currentADX.minusDI
        },
        rsi: currentRSI,
        macd: {
          MACD: currentMACD.MACD,
          signal: currentMACD.signal,
          histogram: currentMACD.histogram
        },
        fibonacci: fibLevels,
        profitTarget: profitTarget
      }
    };
  }
  
  calculateFibonacciLevels(high, low) {
    const diff = high - low;
    return {
      level_0: low,
      level_50: low + diff * 0.5,
      level_618: low + diff * 0.618,
      extension_1618: low + diff * 1.618
    };
  }
  
  generateSignal({ strongTrend, rsiOversold, rsiOverbought, macdUpCross, macdDownCross, nearFibLevel, profitTarget, fibLevels }) {
    // Buy conditions
    if (strongTrend && rsiOversold && nearFibLevel && macdUpCross) {
      return {
        type: 'BUY',
        target: fibLevels.extension_1618,
        exitConditions: {
          primary: fibLevels.extension_1618,
          secondary: profitTarget.long,
          rsiOverbought: 70,
          macdReversal: true
        }
      };
    }
    
    // Sell conditions
    if (strongTrend && rsiOverbought && nearFibLevel && macdDownCross) {
      return {
        type: 'SELL',
        target: profitTarget.short,
        exitConditions: {
          primary: 2 * fibLevels.level_0 - fibLevels.extension_1618,
          secondary: profitTarget.short,
          rsiOversold: 30,
          macdReversal: true
        }
      };
    }
    
    return {
      type: 'WAIT',
      target: null,
      exitConditions: null
    };
  }
}

module.exports = { AdxFibonacciRsiHarmonicStrategy };