// fastEmaTrendReversalStrategy.js
const { EMA, RSI, MACD,ADX } = require('technicalindicators');
const { BollingerBands, SMA,Stochastic } = require("technicalindicators");

class fastEmaTrendReversalStrategy {
  async analyze(data) {
    const { close } = data;
    
    // Calculate EMAs
    const ema5 = EMA.calculate({ period: 2, values: close });
    const ema20 = EMA.calculate({ period: 5, values: close });
    
    // Calculate RSI
    const rsi = RSI.calculate({ period: 7, values: close });
    
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

module.exports = { fastEmaTrendReversalStrategy };