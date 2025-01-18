const { EMA, RSI, MACD,ADX } = require('technicalindicators');
const { BollingerBands, SMA,Stochastic } = require("technicalindicators");

  // Strategy 2
  class BasicMaBreakoutStrategy {
    async analyze(data) {
      const { close } = data;
      
      const ma20 = SMA.calculate({ period: 20, values: close });
      const ma50 = SMA.calculate({ period: 50, values: close });
      
      const currentPrice = close[close.length - 1];
      const profitTarget = {
        long: currentPrice + 4,
        short: currentPrice - 4
      };
      
      const signal = this.generateSignal({
        price: currentPrice,
        ma20: ma20[ma20.length - 1],
        ma50: ma50[ma50.length - 1],
        profitTarget
      });
      
      return {
        signal,
        indicators: {
          ma20: ma20[ma20.length - 1],
          ma50: ma50[ma50.length - 1],
          profitTarget
        }
      };
    }
    
    generateSignal({ price, ma20, ma50, profitTarget }) {
      if (price > ma20 && ma20 > ma50) {
        return {
          type: 'BUY',
          target: profitTarget.long,
          exitConditions: {
            priceBelow: ma20,
            maReversal: 'MA20 crosses below MA50',
            profitTarget: profitTarget.long
          }
        };
      }
      
      if (price < ma20 && ma20 < ma50) {
        return {
          type: 'SELL',
          target: profitTarget.short,
          exitConditions: {
            priceAbove: ma20,
            maReversal: 'MA20 crosses above MA50',
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
  module.exports = { BasicMaBreakoutStrategy };