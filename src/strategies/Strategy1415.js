const { EMA, RSI, MACD, Stochastic } = require('technicalindicators');

class Strategy14 {
  isPinBar(open, high, low, close) {
    const bodyLength = Math.abs(open - close);
    const upperWick = high - Math.max(open, close);
    const lowerWick = Math.min(open, close) - low;
    const totalLength = high - low;
    
    // Bullish pin bar
    if (lowerWick > 2 * bodyLength && lowerWick > upperWick && bodyLength/totalLength < 0.3) {
      return 'bullish';
    }
    // Bearish pin bar
    if (upperWick > 2 * bodyLength && upperWick > lowerWick && bodyLength/totalLength < 0.3) {
      return 'bearish';
    }
    return null;
  }

  async analyze(data) {
    const { open, high, low, close } = data;

    // console.log(data);
    
    
    // Calculate RSI
    const rsi = RSI.calculate({ period: 14, values: close });
    
    // Calculate MACD
    const macd = MACD.calculate({
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9,
      values: close
    });
    
    // Get current values
    const currentRsi = rsi[rsi.length - 1];
    const currentMacd = macd[macd.length - 1];
    const previousMacd = macd[macd.length - 2];
    
    // Check for MACD crossovers
    const macdUpCross = previousMacd.MACD <= previousMacd.signal && currentMacd.MACD > currentMacd.signal;
    const macdDownCross = previousMacd.MACD >= previousMacd.signal && currentMacd.MACD < currentMacd.signal;
    
    // console.log("-----",
    //     open
    // );
    
    // Check for pin bar
    const pinBarType = this.isPinBar(
      open[open.length - 1],
      high[high.length - 1],
      low[low.length - 1],
      close[close.length - 1]
    );
    
    // Calculate profit target
    const currentPrice = close[close.length - 1];
    const profitTarget = {
      long: currentPrice + 4,
      short: currentPrice - 4
    };
    
    // Generate signal
    const signal = this.generateSignal({
      pinBarType,
      rsi: currentRsi,
      macdUpCross,
      macdDownCross,
      profitTarget
    });
    
    return {
      signal,
      indicators: {
        pinBar: pinBarType,
        rsi: currentRsi,
        macd: {
          MACD: currentMacd.MACD,
          signal: currentMacd.signal,
          histogram: currentMacd.histogram
        },
        profitTarget
      }
    };
  }
  
  generateSignal({ pinBarType, rsi, macdUpCross, macdDownCross, profitTarget }) {
    // Buy conditions
    if (pinBarType === 'bullish' && rsi < 30 && macdUpCross) {
      return {
        type: 'BUY',
        target: profitTarget.long,
        exitConditions: {
          profitTarget: profitTarget.long,
          macdReversal: true
        }
      };
    }
    
    // Sell conditions
    if (pinBarType === 'bearish' && rsi > 70 && macdDownCross) {
      return {
        type: 'SELL',
        target: profitTarget.short,
        exitConditions: {
          profitTarget: profitTarget.short,
          macdReversal: true
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

class Strategy15 {
  findRsiDivergence(prices, rsiValues, lookback = 5) {
    const priceLen = prices.length;
    const currentPrice = prices[priceLen - 1];
    const prevPrice = prices[priceLen - lookback];
    
    const currentRsi = rsiValues[rsiValues.length - 1];
    const prevRsi = rsiValues[rsiValues.length - lookback];
    
    // Bullish divergence
    if (currentPrice < prevPrice && currentRsi > prevRsi) {
      return 'bullish';
    }
    // Bearish divergence
    if (currentPrice > prevPrice && currentRsi < prevRsi) {
      return 'bearish';
    }
    return null;
  }

  async analyze(data) {
    const { close } = data;
    
    // Calculate indicators
    const ema9 = EMA.calculate({ period: 9, values: close });
    const rsi = RSI.calculate({ period: 14, values: close });
    const stoch = Stochastic.calculate({
      high: data.high,
      low: data.low,
      close: data.close,
      period: 14,
      signalPeriod: 3,
      kPeriod: 3
    });
    
    // Get current values
    const currentPrice = close[close.length - 1];
    const currentEma = ema9[ema9.length - 1];
    const currentStoch = stoch[stoch.length - 1];
    const currentRsi = rsi[rsi.length - 1];
    
    // Check for RSI divergence
    const divergenceType = this.findRsiDivergence(close, rsi);
    
    // Generate signal
    const signal = this.generateSignal({
      price: currentPrice,
      ema: currentEma,
      stoch: currentStoch,
      rsi: currentRsi,
      divergenceType
    });
    
    return {
      signal,
      indicators: {
        ema: currentEma,
        stoch: currentStoch,
        rsi: currentRsi,
        divergence: divergenceType
      }
    };
  }
  
  generateSignal({ price, ema, stoch, divergenceType }) {
    // Buy conditions
    if (divergenceType === 'bullish' && 
        stoch.k < 20 && 
        price > ema) {
      return {
        type: 'BUY',
        target: null,
        exitConditions: {
          stochasticNeutral: 50
        }
      };
    }
    
    // Sell conditions
    if (divergenceType === 'bearish' && 
        stoch.k > 80 && 
        price < ema) {
      return {
        type: 'SELL',
        target: null,
        exitConditions: {
          stochasticNeutral: 50
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

module.exports = { Strategy14, Strategy15 };