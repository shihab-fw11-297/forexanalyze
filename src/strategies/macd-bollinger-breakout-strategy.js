const { EMA, RSI, MACD,ADX } = require('technicalindicators');
const { BollingerBands, SMA,Stochastic } = require("technicalindicators");

// macdBollingerBreakoutStrategy.js
class macdBollingerBreakoutStrategy {
  async analyze(data) {
    const { close } = data;
    
    // Calculate MACD
    const macd = MACD.calculate({
      fastPeriod: 6,
      slowPeriod: 13,
      signalPeriod: 5,
      values: close
    });
    
    // Calculate Bollinger Bands
    const bb = BollingerBands.calculate({
      period: 10,
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
module.exports = {  macdBollingerBreakoutStrategy  };