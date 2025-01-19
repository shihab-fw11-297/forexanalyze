const { EMA, RSI } = require('technicalindicators');

class MovingAverageScalpingStrategy {
  async analyze(data) {
    const { open, high, low, close, timestamp } = data;
    
    // Calculate EMAs
    const ema5 = EMA.calculate({ period: 5, values: close });
    const ema13 = EMA.calculate({ period: 13, values: close });
    
    // Calculate RSI
    const rsi = RSI.calculate({
      period: 14,
      values: close
    });
    
    // Get current and previous values
    const currentClose = close[close.length - 1];
    const currentHigh = high[high.length - 1];
    const currentLow = low[low.length - 1];
    
    // Get current and previous EMA values
    const currentEMA5 = ema5[ema5.length - 1];
    const previousEMA5 = ema5[ema5.length - 2];
    const currentEMA13 = ema13[ema13.length - 1];
    const previousEMA13 = ema13[ema13.length - 2];
    
    // Get current RSI
    const currentRSI = rsi[rsi.length - 1];
    
    // Calculate crossovers
    const bullishCrossover = previousEMA5 <= previousEMA13 && currentEMA5 > currentEMA13;
    const bearishCrossover = previousEMA5 >= previousEMA13 && currentEMA5 < currentEMA13;
    
    // Calculate pip values
    const pipMultiplier = 0.0001; // Adjust based on instrument
    const profitTarget = {
      long: currentClose + (7 * pipMultiplier),  // 7 pips target
      short: currentClose - (7 * pipMultiplier)
    };
    const stopLoss = {
      long: currentLow - (4 * pipMultiplier),    // 4 pips stop loss
      short: currentHigh + (4 * pipMultiplier)
    };
    
    // Generate signal based on conditions
    const signal = this.generateSignal({
      ema: {
        ema5: currentEMA5,
        ema13: currentEMA13
      },
      crossovers: {
        bullish: bullishCrossover,
        bearish: bearishCrossover
      },
      rsi: currentRSI,
      currentPrice: currentClose,
      profitTarget,
      stopLoss
    });
    
    return {
      signal,
      indicators: {
        ema: {
          ema5: currentEMA5,
          ema13: currentEMA13
        },
        rsi: currentRSI,
        crossovers: {
          bullish: bullishCrossover,
          bearish: bearishCrossover
        }
      }
    };
  }
  
  generateSignal({ ema, crossovers, rsi, currentPrice, profitTarget, stopLoss }) {
    // Buy conditions
    if (
      crossovers.bullish && // 5 EMA crosses above 13 EMA
      rsi > 30 && rsi < 70  // RSI between 30 and 70
    ) {
      return {
        type: 'BUY',
        entry: currentPrice,
        target: profitTarget.long,
        stopLoss: stopLoss.long,
        riskReward: 1.75, // 7:4 risk-reward ratio
        exitConditions: {
          targetHit: profitTarget.long,
          stopLossHit: stopLoss.long,
          emaCrossback: true, // Exit if EMAs cross back
          rsiOverbought: 70
        }
      };
    }
    
    // Sell conditions
    if (
      crossovers.bearish && // 5 EMA crosses below 13 EMA
      rsi > 30 && rsi < 70  // RSI between 30 and 70
    ) {
      return {
        type: 'SELL',
        entry: currentPrice,
        target: profitTarget.short,
        stopLoss: stopLoss.short,
        riskReward: 1.75, // 7:4 risk-reward ratio
        exitConditions: {
          targetHit: profitTarget.short,
          stopLossHit: stopLoss.short,
          emaCrossback: true, // Exit if EMAs cross back
          rsiOversold: 30
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

module.exports = { MovingAverageScalpingStrategy };