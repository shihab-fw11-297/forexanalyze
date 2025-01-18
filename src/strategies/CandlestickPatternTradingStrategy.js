const { ADX, RSI, MACD } = require('technicalindicators');

// Base strategy class
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

// Enhanced strategy class that incorporates candlestick patterns
class CandlestickPatternTradingStrategy {
  constructor() {
    this.adxFibStrategy = new AdxFibonacciRsiHarmonicStrategy();
  }

  identifyCandlePattern(open, high, low, close) {
    const body = close - open;
    const upperShadow = high - Math.max(open, close);
    const lowerShadow = Math.min(open, close) - low;
    const totalLength = high - low;
    
    // Identify Hammer
    const isHammer = (
      lowerShadow > (2 * Math.abs(body)) &&
      upperShadow < (0.1 * totalLength) &&
      Math.abs(body) < (0.3 * totalLength)
    );
    
    // Identify Inverted Hammer
    const isInvertedHammer = (
      upperShadow > (2 * Math.abs(body)) &&
      lowerShadow < (0.1 * totalLength) &&
      Math.abs(body) < (0.3 * totalLength)
    );
    
    // Identify Shooting Star
    const isShootingStar = (
      upperShadow > (2 * Math.abs(body)) &&
      lowerShadow < (0.1 * totalLength) &&
      Math.abs(body) < (0.3 * totalLength) &&
      close < open
    );
    
    // Identify Hanging Man
    const isHangingMan = (
      lowerShadow > (2 * Math.abs(body)) &&
      upperShadow < (0.1 * totalLength) &&
      Math.abs(body) < (0.3 * totalLength) &&
      close < open
    );

    return {
      isHammer,
      isInvertedHammer,
      isShootingStar,
      isHangingMan
    };
  }

  identifyEngulfingPattern(currentCandle, previousCandle) {
    const isBullishEngulfing = (
      previousCandle.close < previousCandle.open && // Previous candle is bearish
      currentCandle.close > currentCandle.open &&   // Current candle is bullish
      currentCandle.open < previousCandle.close &&  // Opens below previous close
      currentCandle.close > previousCandle.open     // Closes above previous open
    );

    const isBearishEngulfing = (
      previousCandle.close > previousCandle.open && // Previous candle is bullish
      currentCandle.close < currentCandle.open &&   // Current candle is bearish
      currentCandle.open > previousCandle.close &&  // Opens above previous close
      currentCandle.close < previousCandle.open     // Closes below previous open
    );

    return {
      isBullishEngulfing,
      isBearishEngulfing
    };
  }

  async analyze(data) {
    // Get base analysis from existing strategy
    const baseAnalysis = await this.adxFibStrategy.analyze(data);
    
    // Get current and previous candles
    const currentIndex = data.close.length - 1;
    const currentCandle = {
      open: data.open[currentIndex],
      high: data.high[currentIndex],
      low: data.low[currentIndex],
      close: data.close[currentIndex]
    };
    
    const previousCandle = {
      open: data.open[currentIndex - 1],
      high: data.high[currentIndex - 1],
      low: data.low[currentIndex - 1],
      close: data.close[currentIndex - 1]
    };

    // Identify patterns
    const candlePatterns = this.identifyCandlePattern(
      currentCandle.open,
      currentCandle.high,
      currentCandle.low,
      currentCandle.close
    );
    
    const engulfingPatterns = this.identifyEngulfingPattern(currentCandle, previousCandle);

    // Calculate short-term trend
    const shortTermTrend = this.calculateShortTermTrend(data.close.slice(-10));

    // Generate enhanced signal
    const enhancedSignal = this.generateEnhancedSignal({
      baseSignal: baseAnalysis.signal,
      candlePatterns,
      engulfingPatterns,
      shortTermTrend,
      indicators: baseAnalysis.indicators
    });

    return {
      ...baseAnalysis,
      signal: enhancedSignal,
      patterns: {
        ...candlePatterns,
        ...engulfingPatterns
      }
    };
  }

  calculateShortTermTrend(prices) {
    const sma5 = prices.slice(-5).reduce((a, b) => a + b, 0) / 5;
    const currentPrice = prices[prices.length - 1];
    return {
      direction: currentPrice > sma5 ? 'up' : 'down',
      strength: Math.abs(currentPrice - sma5) / sma5
    };
  }

  generateEnhancedSignal({ baseSignal, candlePatterns, engulfingPatterns, shortTermTrend, indicators }) {
    // Buy conditions
    const bullishCandlePattern = (
      candlePatterns.isHammer || 
      candlePatterns.isInvertedHammer
    );
    
    const bullishConfirmation = (
      engulfingPatterns.isBullishEngulfing &&
      shortTermTrend.direction === 'up'
    );

    // Sell conditions
    const bearishCandlePattern = (
      candlePatterns.isShootingStar || 
      candlePatterns.isHangingMan
    );
    
    const bearishConfirmation = (
      engulfingPatterns.isBearishEngulfing &&
      shortTermTrend.direction === 'down'
    );

    // Enhanced signal generation
    if (baseSignal.type === 'BUY' && (bullishCandlePattern || bullishConfirmation)) {
      return {
        ...baseSignal,
        confidence: 'high',
        patterns: {
          candlePattern: bullishCandlePattern ? 'bullish' : null,
          engulfingPattern: bullishConfirmation ? 'bullish' : null
        },
        stopLoss: indicators.fibonacci.level_0
      };
    }

    if (baseSignal.type === 'SELL' && (bearishCandlePattern || bearishConfirmation)) {
      return {
        ...baseSignal,
        confidence: 'high',
        patterns: {
          candlePattern: bearishCandlePattern ? 'bearish' : null,
          engulfingPattern: bearishConfirmation ? 'bearish' : null
        },
        stopLoss: indicators.fibonacci.extension_1618
      };
    }

    return {
      ...baseSignal,
      confidence: 'low',
      patterns: {
        candlePattern: null,
        engulfingPattern: null
      }
    };
  }
}

module.exports = { CandlestickPatternTradingStrategy, AdxFibonacciRsiHarmonicStrategy };