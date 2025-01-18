const { EMA, RSI, MACD } = require('technicalindicators');

class EmaRsiMacdStrategy {
  async analyze(data) {
    const { close, high, low, timestamp } = data;
    
    // Calculate EMAs
    const ema5 = EMA.calculate({ period: 5, values: close });
    const ema20 = EMA.calculate({ period: 20, values: close });
    
    // Calculate RSI with 7-period SMA smoothing
    const rsi = RSI.calculate({ period: 14, values: close });
    const rsiSMA = EMA.calculate({ period: 7, values: rsi }); // Using SMA on RSI values
    
    // Calculate MACD
    const macd = MACD.calculate({
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9,
      values: close
    });
    
    // Get current and previous values
    const currentClose = close[close.length - 1];
    const currentHigh = high[high.length - 1];
    const currentLow = low[low.length - 1];
    const prevHigh = high[high.length - 2];
    const prevLow = low[low.length - 2];
    
    // Get indicator values
    const currentEMA5 = ema5[ema5.length - 1];
    const prevEMA5 = ema5[ema5.length - 2];
    const currentEMA20 = ema20[ema20.length - 1];
    const prevEMA20 = ema20[ema20.length - 2];
    const currentRSI = rsiSMA[rsiSMA.length - 1];
    const currentMACD = macd[macd.length - 1];
    const prevMACD = macd[macd.length - 2];
    
    // Calculate cross conditions
    const emaCrossUp = prevEMA5 <= prevEMA20 && currentEMA5 > currentEMA20;
    const emaCrossDown = prevEMA5 >= prevEMA20 && currentEMA5 < currentEMA20;
    
    // Calculate MACD histogram movement
    const macdHistogramRising = currentMACD.histogram > prevMACD.histogram;
    const macdHistogramFalling = currentMACD.histogram < prevMACD.histogram;
    
    // Calculate pip multiplier (adjust based on instrument)
    const pipMultiplier = 0.0001;
    
    // Calculate profit targets and stop loss
    const profitTarget = {
      long: currentClose + (6 * pipMultiplier), // 4.5 pips
      short: currentClose - (6 * pipMultiplier)
    };
    
    const stopLoss = {
      long: Math.min(prevLow, currentLow) - (4 * pipMultiplier), // 4 pips below recent low
      short: Math.max(prevHigh, currentHigh) + (4 * pipMultiplier) // 4 pips above recent high
    };
    
    // Generate signal based on conditions
    const signal = this.generateSignal({
      emaCross: { up: emaCrossUp, down: emaCrossDown },
      rsi: currentRSI,
      macdHistogram: { rising: macdHistogramRising, falling: macdHistogramFalling },
      currentPrice: currentClose,
      profitTarget,
      stopLoss
    });
    
    return {
      signal,
      indicators: {
        ema: {
          ema5: currentEMA5,
          ema20: currentEMA20
        },
        rsi: currentRSI,
        macd: currentMACD,
        timestamp: timestamp[timestamp.length - 1]
      }
    };
  }
  
  generateSignal({ emaCross, rsi, macdHistogram, currentPrice, profitTarget, stopLoss }) {
    // Buy conditions
    if (
      emaCross.up && // EMA5 crosses above EMA20
      rsi > 50 && // RSI above 50
      rsi < 70 && // Not overbought
      macdHistogram.rising // MACD histogram rising
    ) {
      return {
        type: 'BUY',
        entry: currentPrice,
        target: profitTarget.long,
        stopLoss: stopLoss.long,
        riskReward: (profitTarget.long - currentPrice) / (currentPrice - stopLoss.long),
        exitConditions: {
          rsiOverbought: 70,
          emaCrossDown: true,
          profitTarget: profitTarget.long,
          stopLoss: stopLoss.long
        }
      };
    }
    
    // Sell conditions
    if (
      emaCross.down && // EMA5 crosses below EMA20
      rsi < 50 && // RSI below 50
      rsi > 30 && // Not oversold
      macdHistogram.falling // MACD histogram falling
    ) {
      return {
        type: 'SELL',
        entry: currentPrice,
        target: profitTarget.short,
        stopLoss: stopLoss.short,
        riskReward: (currentPrice - profitTarget.short) / (stopLoss.short - currentPrice),
        exitConditions: {
          rsiOversold: 30,
          emaCrossUp: true,
          profitTarget: profitTarget.short,
          stopLoss: stopLoss.short
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
}

module.exports = { EmaRsiMacdStrategy };