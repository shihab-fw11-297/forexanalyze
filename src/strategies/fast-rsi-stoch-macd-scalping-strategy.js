const { EMA, RSI, MACD } = require('technicalindicators');
const { BollingerBands, SMA, Stochastic } = require("technicalindicators");

class FastRsiStochMacdScalpingStrategy {
  async analyze(data, timeframe = '1m') {
    const { close, high, low } = data;
    
    // Faster periods for quicker signals
    const rsi = RSI.calculate({ period: 5, values: close });
    const stoch = Stochastic.calculate({
      high, low, close,
      period: 3,
      signalPeriod: 2
    });
    const macd = MACD.calculate({
      fastPeriod: 6,
      slowPeriod: 13,
      signalPeriod: 9,
      values: close
    });
    
    const currentPrice = close[close.length - 1];
    // Increased pip targets and stop loss
    const pipValue = timeframe === '1m' ? 6 : 7; // 6 pips for 1m, 7 pips for 5m
    const stopLoss = timeframe === '1m' ? 2 : 3; // 2 pips for 1m, 3 pips for 5m
    
    const profitTarget = {
      long: currentPrice + pipValue,
      short: currentPrice - pipValue,
      stopLossLong: currentPrice - stopLoss,
      stopLossShort: currentPrice + stopLoss
    };
    
    const signal = this.generateSignal({
      price: currentPrice,
      rsi: rsi[rsi.length - 1],
      stoch: stoch[stoch.length - 1],
      macd: macd[macd.length - 1],
      profitTarget
    });
    
    return {
      signal,
      indicators: {
        timeframe,
        rsi: rsi[rsi.length - 1],
        stoch: {
          k: stoch[stoch.length - 1].k,
          d: stoch[stoch.length - 1].d
        },
        macd: {
          MACD: macd[macd.length - 1].MACD,
          signal: macd[macd.length - 1].signal,
          histogram: macd[macd.length - 1].histogram
        },
        profitTarget
      }
    };
  }
  
  generateSignal({ price, rsi, stoch, macd, profitTarget }) {
    const isOverbought = rsi > 70 && stoch.k > 80;
    const isOversold = rsi < 30 && stoch.k < 20;
    const macdCrossover = macd.histogram > 0 && Math.abs(macd.histogram) > 0.0001;
    const macdCrossunder = macd.histogram < 0 && Math.abs(macd.histogram) > 0.0001;
    
    if (isOversold && macdCrossover) {
      return {
        type: 'MARKET_BUY',  // Changed to market order for quick execution
        entryPrice: price,
        target: profitTarget.long,
        stopLoss: profitTarget.stopLossLong,
        exitConditions: {
          rsiOverbought: 70,
          stochOverbought: 80,
          macdReversal: 'MACD histogram turns negative',
          profitTarget: profitTarget.long,
          stopLoss: profitTarget.stopLossLong
        }
      };
    }
    
    if (isOverbought && macdCrossunder) {
      return {
        type: 'MARKET_SELL',  // Changed to market order for quick execution
        entryPrice: price,
        target: profitTarget.short,
        stopLoss: profitTarget.stopLossShort,
        exitConditions: {
          rsiOversold: 30,
          stochOversold: 20,
          macdReversal: 'MACD histogram turns positive',
          profitTarget: profitTarget.short,
          stopLoss: profitTarget.stopLossShort
        }
      };
    }
    
    return {
      type: 'WAIT',
      target: null,
      stopLoss: null,
      exitConditions: null
    };
  }
}

module.exports = { FastRsiStochMacdScalpingStrategy };