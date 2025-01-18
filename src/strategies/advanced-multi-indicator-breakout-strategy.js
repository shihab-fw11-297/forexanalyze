const { SMA, StochasticRSI, VWAP, BollingerBands } = require('technicalindicators');

class AdvancedMultiIndicatorBreakoutStrategy {
  async analyze(data) {
    const { open, high, low, close, volume, timestamp } = data;  // Added 'open' to destructuring
    
    // Calculate SMAs
    const sma21 = SMA.calculate({ period: 21, values: close });
    const sma50 = SMA.calculate({ period: 50, values: close });
    const sma200 = SMA.calculate({ period: 200, values: close });
    
    // Calculate Stochastic RSI
    const stochRSI = StochasticRSI.calculate({
      values: close,
      rsiPeriod: 14,
      stochasticPeriod: 3,
      kPeriod: 3,
      dPeriod: 8
    });
    
    // Calculate VWAP
    const vwap = VWAP.calculate({
      high,
      low,
      close,
      volume
    });
    
    // Calculate Bollinger Bands
    const bb = BollingerBands.calculate({
      period: 20,
      values: close,
      stdDev: 2
    });
    
    // Get current and previous values
    const currentClose = close[close.length - 1];
    const previousClose = close[close.length - 2];
    const currentOpen = open[open.length - 1];          // Added open price references
    const previousOpen = open[open.length - 2];         // Added open price references
    const currentHigh = high[high.length - 1];
    const previousHigh = high[high.length - 2];
    const currentLow = low[low.length - 1];
    const previousLow = low[low.length - 2];
    
    // Get indicator values
    const currentSMA21 = sma21[sma21.length - 1];
    const currentSMA50 = sma50[sma50.length - 1];
    const currentSMA200 = sma200[sma200.length - 1];
    const currentStochRSI = stochRSI[stochRSI.length - 1];
    const currentVWAP = vwap[vwap.length - 1];
    const currentBB = bb[bb.length - 1];
    
    // Check for bullish/bearish engulfing patterns
    const bullishEngulfing = previousClose < previousOpen && 
                           currentClose > currentOpen && 
                           currentClose > previousOpen && 
                           currentOpen < previousClose;
                           
    const bearishEngulfing = previousClose > previousOpen && 
                           currentClose < currentOpen && 
                           currentClose < previousOpen && 
                           currentOpen > previousClose;
    
    // Check for market structure (Higher Lows / Lower Highs)
    const higherLow = currentLow > previousLow;
    const lowerHigh = currentHigh < previousHigh;
    
    // Calculate profit targets and stop loss
    const pipMultiplier = 0.0001; // Adjust based on instrument
    const profitTarget = {
      long: currentClose + (5 * pipMultiplier),
      short: currentClose - (5 * pipMultiplier)
    };
    const stopLoss = {
      long: currentClose - (2.5 * pipMultiplier),
      short: currentClose + (2.5 * pipMultiplier)
    };
    
    // Generate signal based on conditions
    const signal = this.generateSignal({
      sma: {
        sma21: currentSMA21,
        sma50: currentSMA50,
        sma200: currentSMA200
      },
      stochRSI: currentStochRSI,
      engulfing: {
        bullish: bullishEngulfing,
        bearish: bearishEngulfing
      },
      marketStructure: {
        higherLow,
        lowerHigh
      },
      vwap: currentVWAP,
      bb: currentBB,
      currentPrice: currentClose,
      profitTarget,
      stopLoss
    });
    
    return {
      signal,
      indicators: {
        sma: {
          sma21: currentSMA21,
          sma50: currentSMA50,
          sma200: currentSMA200
        },
        stochRSI: currentStochRSI,
        vwap: currentVWAP,
        bb: currentBB,
        engulfing: {
          bullish: bullishEngulfing,
          bearish: bearishEngulfing
        },
        marketStructure: {
          higherLow,
          lowerHigh
        }
      }
    };
  }
  
  generateSignal({ sma, stochRSI, engulfing, marketStructure, vwap, bb, currentPrice, profitTarget, stopLoss }) {
    // Buy conditions
    if (
      sma.sma21 > sma.sma50 && sma.sma50 > sma.sma200 && // Bullish trend
      stochRSI.k < 20 && stochRSI.k > stochRSI.d && // Oversold, crossing up
      (engulfing.bullish || marketStructure.higherLow) && // Bullish pattern or structure
      currentPrice > vwap && // VWAP bounce
      currentPrice <= bb.lower // Bollinger Band touch
    ) {
      return {
        type: 'BUY',
        entry: currentPrice,
        target: profitTarget.long,
        stopLoss: stopLoss.long,
        riskReward: 2, // 2:1 risk-reward ratio
        exitConditions: {
          stochRSIOverbought: 80,
          trendReversal: true,
          profitTarget: profitTarget.long,
          stopLoss: stopLoss.long
        }
      };
    }
    
    // Sell conditions
    if (
      sma.sma21 < sma.sma50 && sma.sma50 < sma.sma200 && // Bearish trend
      stochRSI.k > 80 && stochRSI.k < stochRSI.d && // Overbought, crossing down
      (engulfing.bearish || marketStructure.lowerHigh) && // Bearish pattern or structure
      currentPrice < vwap // Below VWAP
    ) {
      return {
        type: 'SELL',
        entry: currentPrice,
        target: profitTarget.short,
        stopLoss: stopLoss.short,
        riskReward: 2, // 2:1 risk-reward ratio
        exitConditions: {
          stochRSIOversold: 20,
          trendReversal: true,
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

module.exports = { AdvancedMultiIndicatorBreakoutStrategy };