// Strategy10.js
const { EMA, RSI, MACD,ADX } = require('technicalindicators');
const { BollingerBands, SMA,Stochastic } = require("technicalindicators");

// RsiStochasticSmaConfluenceStrategy.js
class RsiStochasticSmaConfluenceStrategy {
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

module.exports = {  RsiStochasticSmaConfluenceStrategy };