const { EMA, RSI, MACD } = require('technicalindicators');

class Strategy3 {
  async analyze(data) {
    const { close } = data;
    
    // Calculate EMAs
    const ema9 = EMA.calculate({ period: 9, values: close });
    const ema21 = EMA.calculate({ period: 21, values: close });
    
    // Calculate RSI
    const rsi = RSI.calculate({ period: 14, values: close });
    
    // Calculate MACD
    const macd = MACD.calculate({
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9,
      values: close
    });
    
    // Get previous and current values for crossover detection
    const currentEma9 = ema9[ema9.length - 1];
    const previousEma9 = ema9[ema9.length - 2];
    const currentEma21 = ema21[ema21.length - 1];
    const previousEma21 = ema21[ema21.length - 2];
    
    const currentRsi = rsi[rsi.length - 1];
    const currentMacd = macd[macd.length - 1];
    const previousMacd = macd[macd.length - 2];
    
    // Check for crossovers
    const emaUpCross = previousEma9 <= previousEma21 && currentEma9 > currentEma21;
    const emaDownCross = previousEma9 >= previousEma21 && currentEma9 < currentEma21;
    const macdUpCross = previousMacd.MACD <= previousMacd.signal && currentMacd.MACD > currentMacd.signal;
    const macdDownCross = previousMacd.MACD >= previousMacd.signal && currentMacd.MACD < currentMacd.signal;
    
    // Calculate profit target (4-5 points)
    const currentPrice = close[close.length - 1];
    const profitTarget = {
      long: currentPrice + 4,
      short: currentPrice - 4
    };
    
    // Generate signal based on conditions
    const signal = this.generateSignal({
      emaUpCross,
      emaDownCross,
      rsi: currentRsi,
      macdUpCross,
      macdDownCross,
      profitTarget
    });
    
    return {
      signal,
      indicators: {
        ema9: currentEma9,
        ema21: currentEma21,
        rsi: currentRsi,
        macd: {
          MACD: currentMacd.MACD,
          signal: currentMacd.signal,
          histogram: currentMacd.histogram
        },
        profitTarget: profitTarget
      }
    };
  }
  
  generateSignal({ emaUpCross, emaDownCross, rsi, macdUpCross, macdDownCross, profitTarget }) {
    // Buy conditions
    if (emaUpCross && rsi < 70 && macdUpCross) {
      return {
        type: 'BUY',
        target: profitTarget.long,
        exitConditions: {
          rsiOverbought: 70,
          macdReversal: true,
          profitTarget: profitTarget.long
        }
      };
    }
    
    // Sell conditions
    if (emaDownCross && rsi > 30 && macdDownCross) {
      return {
        type: 'SELL',
        target: profitTarget.short,
        exitConditions: {
          rsiOversold: 30,
          macdReversal: true,
          profitTarget: profitTarget.short
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

module.exports = { Strategy3 };