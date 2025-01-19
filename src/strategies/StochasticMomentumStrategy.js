const { Stochastic } = require('technicalindicators');

class StochasticMomentumStrategy {
  async analyze(data) {
    const { open, high, low, close } = data;
    
    // Calculate Stochastic Oscillator
    const stoch = Stochastic.calculate({
      high,
      low,
      close,
      period: 14,
      signalPeriod: 3,
      kPeriod: 3
    });
    
    // Get current and previous values
    const currentClose = close[close.length - 1];
    const previousClose = close[close.length - 2];
    const currentOpen = open[open.length - 1];
    const previousOpen = open[open.length - 2];
    const currentHigh = high[high.length - 1];
    const previousHigh = high[high.length - 2];
    const currentLow = low[low.length - 1];
    const previousLow = low[low.length - 2];
    
    // Get current and previous Stochastic values
    const currentStoch = stoch[stoch.length - 1];
    const previousStoch = stoch[stoch.length - 2];
    
    // Check for candlestick patterns
    const bullishEngulfing = previousClose < previousOpen && 
                           currentClose > currentOpen && 
                           currentClose > previousOpen && 
                           currentOpen < previousClose;
                           
    const bearishEngulfing = previousClose > previousOpen && 
                           currentClose < currentOpen && 
                           currentClose < previousOpen && 
                           currentOpen > previousClose;
    
    const hammer = currentClose > currentOpen &&
                  (currentHigh - currentClose) < (currentClose - currentLow) * 0.5 &&
                  (currentClose - currentOpen) < (currentOpen - currentLow) * 0.3;
                  
    const shootingStar = currentClose < currentOpen &&
                        (currentHigh - currentOpen) > (currentClose - currentLow) * 2 &&
                        (currentOpen - currentClose) < (currentHigh - currentOpen) * 0.3;
    
    // Calculate Stochastic crossovers
    const crossAbove20 = previousStoch.k <= 20 && currentStoch.k > 20;
    const crossBelow80 = previousStoch.k >= 80 && currentStoch.k < 80;
    
    // Calculate pip values
    const pipMultiplier = 0.0001; // Adjust based on instrument
    const profitTarget = {
      long: currentClose + (7 * pipMultiplier),
      short: currentClose - (7 * pipMultiplier)
    };
    const stopLoss = {
      long: currentLow - (4 * pipMultiplier),
      short: currentHigh + (4 * pipMultiplier)
    };
    
    // Generate signal based on conditions
    const signal = this.generateSignal({
      stoch: {
        current: currentStoch,
        crossAbove20,
        crossBelow80
      },
      patterns: {
        bullishEngulfing,
        bearishEngulfing,
        hammer,
        shootingStar
      },
      currentPrice: currentClose,
      profitTarget,
      stopLoss
    });
    
    return {
      signal,
      indicators: {
        stochastic: currentStoch,
        patterns: {
          bullishEngulfing,
          bearishEngulfing,
          hammer,
          shootingStar
        }
      }
    };
  }
  
  generateSignal({ stoch, patterns, currentPrice, profitTarget, stopLoss }) {
    // Buy conditions
    if (
      stoch.crossAbove20 && // Stochastic crosses above 20
      (patterns.bullishEngulfing || patterns.hammer) // Confirmation patterns
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
          stochasticOverbought: 80,
          bearishPattern: true // Exit on bearish pattern formation
        }
      };
    }
    
    // Sell conditions
    if (
      stoch.crossBelow80 && // Stochastic crosses below 80
      (patterns.bearishEngulfing || patterns.shootingStar) // Confirmation patterns
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
          stochasticOversold: 20,
          bullishPattern: true // Exit on bullish pattern formation
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

module.exports = { StochasticMomentumStrategy };