const { EMA, RSI, MACD,ADX } = require('technicalindicators');
const { BollingerBands, SMA,Stochastic } = require("technicalindicators");

// Strategy 1
class TripleEmaTrendStrategy {
    async analyze(data) {
      const { close, high, low } = data;
      
      // Calculate indicators
      const ema5 = EMA.calculate({ period: 5, values: close });
      const ema10 = EMA.calculate({ period: 10, values: close });
      const ema50 = EMA.calculate({ period: 50, values: close });
      const rsi = RSI.calculate({ period: 9, values: close });
      const macd = MACD.calculate({
        fastPeriod: 12,
        slowPeriod: 26,
        signalPeriod: 9,
        values: close
      });
      const stoch = Stochastic.calculate({
        high, low, close,
        period: 14,
        signalPeriod: 3
      });
      
      // Get current values
      const currentPrice = close[close.length - 1];
      const profitTarget = {
        long: currentPrice + 4,
        short: currentPrice - 4
      };
      
      const signal = this.generateSignal({
        price: currentPrice,
        ema5: ema5[ema5.length - 1],
        ema10: ema10[ema10.length - 1],
        ema50: ema50[ema50.length - 1],
        rsi: rsi[rsi.length - 1],
        macd: macd[macd.length - 1],
        stoch: stoch[stoch.length - 1],
        profitTarget
      });
      
      return {
        signal,
        indicators: {
          ema5: ema5[ema5.length - 1],
          ema10: ema10[ema10.length - 1],
          ema50: ema50[ema50.length - 1],
          rsi: rsi[rsi.length - 1],
          macd: {
            MACD: macd[macd.length - 1].MACD,
            signal: macd[macd.length - 1].signal,
            histogram: macd[macd.length - 1].histogram
          },
          stoch: {
            k: stoch[stoch.length - 1].k,
            d: stoch[stoch.length - 1].d
          },
          profitTarget
        }
      };
    }
    
    generateSignal({ price, ema5, ema10, ema50, rsi, macd, stoch, profitTarget }) {
      if (price > ema5 && price > ema10 && price > ema50) {
        return {
          type: 'BUY',
          target: profitTarget.long,
          exitConditions: {
            priceBelow: ema10,
            rsiOverbought: 70,
            stochOverbought: 80,
            profitTarget: profitTarget.long
          }
        };
      }
      
      if (price < ema5 && price < ema10 && price < ema50) {
        return {
          type: 'SELL',
          target: profitTarget.short,
          exitConditions: {
            priceAbove: ema10,
            rsiOversold: 30,
            stochOversold: 20,
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

  module.exports = { TripleEmaTrendStrategy };
