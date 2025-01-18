const { BollingerBands, Stochastic } = require("technicalindicators");

class BollingerStochBreakoutStrategy {
  async analyze(data) {
    const { close, high, low } = data;
    
    // Calculate Bollinger Bands
    const bb = BollingerBands.calculate({
      period: 20,
      stdDev: 2,
      values: close
    });
    
    // Calculate Stochastic
    const stoch = Stochastic.calculate({
      high,
      low,
      close,
      period: 14,
      signalPeriod: 3,
      kPeriod: 3
    });
    
    // Get current and previous values
    const currentPrice = close[close.length - 1];
    const prevPrice = close[close.length - 2];
    const currentBB = bb[bb.length - 1];
    const currentStoch = stoch[stoch.length - 1];
    const prevStoch = stoch[stoch.length - 2];
    
    const signal = this.generateSignal({
      price: currentPrice,
      prevPrice,
      bb: currentBB,
      stoch: currentStoch,
      prevStoch: prevStoch
    });
    
    return {
      signal,
      indicators: {
        stochastic: {
          k: currentStoch.k,
          d: currentStoch.d
        },
        bollingerBands: {
          upper: currentBB.upper,
          middle: currentBB.middle,
          lower: currentBB.lower
        }
      }
    };
  }
  
  generateSignal({ price, prevPrice, bb, stoch, prevStoch }) {
    // Check for Stochastic crossover
    const stochCrossUp = prevStoch.k <= prevStoch.d && stoch.k > stoch.d;
    const stochCrossDown = prevStoch.k >= prevStoch.d && stoch.k < stoch.d;
    
    // Check for oversold/overbought conditions
    const isOversold = stoch.k < 20 && stoch.d < 20;
    const isOverbought = stoch.k > 80 && stoch.d > 80;
    const isNeutral = stoch.k >= 45 && stoch.k <= 55;
    
    // Check Bollinger Band breakout
    const aboveUpperBB = price > bb.upper;
    const belowLowerBB = price < bb.lower;
    const withinBands = price >= bb.lower && price <= bb.upper;
    
    if (aboveUpperBB && stochCrossUp && isOversold) {
      return {
        type: 'BUY',
        reason: 'Price above upper BB + Stochastic bullish cross from oversold',
        conditions: {
          bbBreakout: 'Upper',
          stochastic: {
            k: stoch.k.toFixed(2),
            d: stoch.d.toFixed(2),
            cross: 'Bullish'
          }
        }
      };
    }
    
    if (belowLowerBB && stochCrossDown && isOverbought) {
      return {
        type: 'SELL',
        reason: 'Price below lower BB + Stochastic bearish cross from overbought',
        conditions: {
          bbBreakout: 'Lower',
          stochastic: {
            k: stoch.k.toFixed(2),
            d: stoch.d.toFixed(2),
            cross: 'Bearish'
          }
        }
      };
    }
    
    if (withinBands || isNeutral) {
      return {
        type: 'EXIT',
        reason: 'Price within BB bands or Stochastic in neutral zone',
        conditions: {
          priceLocation: withinBands ? 'Within Bands' : 'Outside Bands',
          stochasticZone: isNeutral ? 'Neutral' : 'Extreme'
        }
      };
    }
    
    return {
      type: 'WAIT',
      reason: 'Waiting for clear signal',
      conditions: {
        priceLocation: price > bb.upper ? 'Above BB' : price < bb.lower ? 'Below BB' : 'Within BB',
        stochastic: {
          k: stoch.k.toFixed(2),
          d: stoch.d.toFixed(2)
        }
      }
    };
  }
}

module.exports = { BollingerStochBreakoutStrategy };