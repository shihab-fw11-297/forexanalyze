// Strategy10.js
const { EMA, RSI, MACD,ADX } = require('technicalindicators');
const { BollingerBands, SMA,Stochastic } = require("technicalindicators");

class Strategy10 {
  async analyze(data) {
    const { close } = data;
    
    // Calculate EMAs
    const ema5 = EMA.calculate({ period: 5, values: close });
    const ema20 = EMA.calculate({ period: 20, values: close });
    
    // Calculate RSI
    const rsi = RSI.calculate({ period: 14, values: close });
    
    // Calculate MACD
    const macd = MACD.calculate({
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9,
      values: close
    });
    
    // Get current and previous values for crossover detection
    const currentValues = {
      ema5: ema5[ema5.length - 1],
      ema20: ema20[ema20.length - 1],
      prevEma5: ema5[ema5.length - 2],
      prevEma20: ema20[ema20.length - 2],
      rsi: rsi[rsi.length - 1],
      macd: macd[macd.length - 1],
      prevMacd: macd[macd.length - 2]
    };
    
    const signal = this.generateSignal(currentValues);
    
    return {
      signal,
      indicators: {
        ema5: currentValues.ema5,
        ema20: currentValues.ema20,
        rsi: currentValues.rsi,
        macd: {
          MACD: currentValues.macd.MACD,
          signal: currentValues.macd.signal,
          histogram: currentValues.macd.histogram
        }
      }
    };
  }
  
  generateSignal(current) {
    // Check for EMA crossover
    const emaCrossUp = current.prevEma5 <= current.prevEma20 && current.ema5 > current.ema20;
    const emaCrossDown = current.prevEma5 >= current.prevEma20 && current.ema5 < current.ema20;
    
    // Check for MACD crossover
    const macdCrossUp = current.prevMacd.MACD <= current.prevMacd.signal && 
                       current.macd.MACD > current.macd.signal;
    const macdCrossDown = current.prevMacd.MACD >= current.prevMacd.signal && 
                         current.macd.MACD < current.macd.signal;
    
    // Generate buy signal
    if (emaCrossUp && current.rsi < 30 && macdCrossUp) {
      return {
        type: 'BUY',
        reason: 'EMA crossover up + RSI oversold + MACD bullish cross',
        conditions: {
          emaCross: 'Bullish',
          rsiValue: current.rsi,
          macdCross: 'Bullish'
        }
      };
    }
    
    // Generate sell signal
    if (emaCrossDown && current.rsi > 70 && macdCrossDown) {
      return {
        type: 'SELL',
        reason: 'EMA crossover down + RSI overbought + MACD bearish cross',
        conditions: {
          emaCross: 'Bearish',
          rsiValue: current.rsi,
          macdCross: 'Bearish'
        }
      };
    }
    
    // Exit indicators
    if (
      (current.rsi >= 45 && current.rsi <= 55) || 
      (current.macd.MACD < current.macd.signal && current.prevMacd.MACD > current.prevMacd.signal) || 
      (current.macd.MACD > current.macd.signal && current.prevMacd.MACD < current.prevMacd.signal)    
    ) {
      return {
        type: 'EXIT',
        reason: 'Exit indicators met: RSI neutral or MACD signal cross',
        conditions: {
          rsiValue: current.rsi,
          macdCross: current.macd.MACD > current.macd.signal ? 'Bullish' : 'Bearish'
        }
      };
    }
    
    return {
      type: 'WAIT',
      reason: 'Waiting for clear signal',
      conditions: {
        rsiValue: current.rsi,
        emaDiff: (current.ema5 - current.ema20).toFixed(2),
        macdHist: current.macd.histogram.toFixed(2)
      }
    };
  }
}

// Strategy11.js
class Strategy11 {
  async analyze(data) {
    const { close } = data;
    
    // Calculate MACD
    const macd = MACD.calculate({
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9,
      values: close
    });
    
    // Calculate Bollinger Bands
    const bb = BollingerBands.calculate({
      period: 20,
      stdDev: 2,
      values: close
    });
    
    // Get current and previous values
    const currentPrice = close[close.length - 1];
    const prevPrice = close[close.length - 2];
    const currentBB = bb[bb.length - 1];
    const currentMACD = macd[macd.length - 1];
    const prevMACD = macd[macd.length - 2];
    
    const signal = this.generateSignal({
      price: currentPrice,
      prevPrice,
      bb: currentBB,
      macd: currentMACD,
      prevMacd: prevMACD
    });
    
    return {
      signal,
      indicators: {
        macd: {
          MACD: currentMACD.MACD,
          signal: currentMACD.signal,
          histogram: currentMACD.histogram
        },
        bollingerBands: {
          upper: currentBB.upper,
          middle: currentBB.middle,
          lower: currentBB.lower
        }
      }
    };
  }
  
  generateSignal({ price, prevPrice, bb, macd, prevMacd }) {
    // Check for MACD crossover
    const macdCrossUp = prevMacd.MACD <= prevMacd.signal && macd.MACD > macd.signal;
    const macdCrossDown = prevMacd.MACD >= prevMacd.signal && macd.MACD < macd.signal;
    
    // Check Bollinger Band breakout
    const aboveUpperBB = price > bb.upper;
    const belowLowerBB = price < bb.lower;
    const withinBands = price >= bb.lower && price <= bb.upper;
    
    if (aboveUpperBB && macdCrossUp) {
      return {
        type: 'BUY',
        reason: 'Price above upper BB + MACD bullish cross',
        conditions: {
          bbBreakout: 'Upper',
          macdCross: 'Bullish'
        }
      };
    }
    
    if (belowLowerBB && macdCrossDown) {
      return {
        type: 'SELL',
        reason: 'Price below lower BB + MACD bearish cross',
        conditions: {
          bbBreakout: 'Lower',
          macdCross: 'Bearish'
        }
      };
    }
    
    if (withinBands || macdCrossDown) {
      return {
        type: 'EXIT',
        reason: 'Price within BB bands or MACD signal cross',
        conditions: {
          priceLocation: withinBands ? 'Within Bands' : 'Outside Bands',
          macdStatus: macd.MACD > macd.signal ? 'Bullish' : 'Bearish'
        }
      };
    }
    
    return {
      type: 'WAIT',
      reason: 'Waiting for clear signal',
      conditions: {
        priceLocation: price > bb.upper ? 'Above BB' : price < bb.lower ? 'Below BB' : 'Within BB',
        macdDiff: (macd.MACD - macd.signal).toFixed(2)
      }
    };
  }
}

// Strategy12.js
class Strategy12 {
  async analyze(data) {
    const { close, high, low } = data;
    
    const rsi = RSI.calculate({ period: 14, values: close });
    const stoch = Stochastic.calculate({
      high,
      low,
      close,
      period: 14,
      signalPeriod: 3,
      kPeriod: 3
    });
    
    const sma50 = SMA.calculate({ period: 50, values: close });
    const currentSMA = sma50[sma50.length - 1];
    const prevSMA = sma50[sma50.length - 2];
    const smaDirection = currentSMA > prevSMA ? 'up' : 'down';
    
    const currentRSI = rsi[rsi.length - 1];
    const currentStoch = stoch[stoch.length - 1];
    
    const signal = this.generateSignal({
      rsi: currentRSI,
      stoch: currentStoch,
      smaDirection,
      currentSMA
    });
    
    return {
      signal,
      indicators: {
        rsi: currentRSI,
        stochastic: {
          k: currentStoch.k,
          d: currentStoch.d
        },
        sma50: currentSMA,
        trend: smaDirection
      }
    };
  }
  
  generateSignal({ rsi, stoch, smaDirection, currentSMA }) {
    if (rsi < 30 && stoch.k < 20 && smaDirection === 'up') {
      return {
        type: 'BUY',
        reason: 'RSI oversold + Stochastic oversold + Upward SMA',
        conditions: {
          rsiValue: rsi,
          stochK: stoch.k,
          smaDirection
        }
      };
    }
    
    if (rsi > 70 && stoch.k > 80 && smaDirection === 'down') {
      return {
        type: 'SELL',
        reason: 'RSI overbought + Stochastic overbought + Downward SMA',
        conditions: {
          rsiValue: rsi,
          stochK: stoch.k,
          smaDirection
        }
      };
    }
    
    if ((rsi >= 40 && rsi <= 60) || (stoch.k >= 40 && stoch.k <= 60)) {
      return {
        type: 'EXIT',
        reason: 'RSI or Stochastic returned to neutral levels',
        conditions: {
          rsiValue: rsi,
          stochK: stoch.k
        }
      };
    }
    
    return {
      type: 'WAIT',
      reason: 'Waiting for clear signal',
      conditions: {
        rsiValue: rsi,
        stochK: stoch.k,
        smaDirection
      }
    };
  }
}

// Strategy13.js
class Strategy13 {
  async analyze(data) {
    const { close, high, low } = data;
    
    const rsi = RSI.calculate({ period: 14, values: close });
    const adx = ADX.calculate({
      high,
      low,
      close,
      period: 14
    });
    
    const highestPrice = Math.max(...high);
    const lowestPrice = Math.min(...low);
    const fibLevels = this.calculateFibonacciLevels(highestPrice, lowestPrice);
    
    const currentPrice = close[close.length - 1];
    const currentRSI = rsi[rsi.length - 1];
    const currentADX = adx[adx.length - 1];
    
    const signal = this.generateSignal({
      price: currentPrice,
      rsi: currentRSI,
      adx: currentADX,
      fibLevels
    });
    
    return {
      signal,
      indicators: {
        rsi: currentRSI,
        adx: currentADX.adx,
        fibonacciLevels: fibLevels
      }
    };
  }
  
  calculateFibonacciLevels(high, low) {
    const diff = high - low;
    return {
      level0: high,
      level50: high - (diff * 0.5),
      level618: high - (diff * 0.618),
      level100: low
    };
  }
  
  isNearFibLevel(price, fibLevels, tolerance = 0.001) {
    const levels = [fibLevels.level50, fibLevels.level618];
    return levels.some(level => 
      Math.abs(price - level) / level < tolerance
    );
  }
  
  generateSignal({ price, rsi, adx, fibLevels }) {
    const nearFibLevel = this.isNearFibLevel(price, fibLevels);
    const strongTrend = adx.adx > 25;
    const weakTrend = adx.adx < 20;
    
    if (nearFibLevel && rsi < 30 && strongTrend) {
      return {
        type: 'BUY',
        reason: 'Price at Fib level + RSI oversold + Strong trend',
        conditions: {
          rsiValue: rsi,
          adxStrength: adx.adx,
          fibLevel: 'Support'
        }
      };
    }
    
    if (nearFibLevel && rsi > 70 && strongTrend) {
      return {
        type: 'SELL',
        reason: 'Price at Fib level + RSI overbought + Strong trend',
        conditions: {
          rsiValue: rsi,
          adxStrength: adx.adx,
          fibLevel: 'Resistance'
        }
      };
    }
    
    if (weakTrend) {
      return {
        type: 'EXIT',
        reason: 'ADX indicates weak trend',
        conditions: {
          adxStrength: adx.adx,
          rsiValue: rsi
        }
      };
    }
    
    return {
      type: 'WAIT',
      reason: 'Waiting for clear signal',
      conditions: {
        rsiValue: rsi,
        adxStrength: adx.adx,
        nearFibLevel: nearFibLevel ? 'Yes' : 'No'
      }
    };
  }
}

module.exports = { Strategy10, Strategy11, Strategy12, Strategy13 };