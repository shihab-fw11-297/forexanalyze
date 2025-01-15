const { EMA, RSI, MACD,ADX } = require('technicalindicators');
const { BollingerBands, SMA,Stochastic } = require("technicalindicators");

// Strategy 1
class Strategy1 {
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
  
  // Strategy 2
  class Strategy2 {
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
  
  // Strategy 5
  class Strategy5 {
    async analyze(data) {
      const { close, high, low } = data;
      
      const ema5 = EMA.calculate({ period: 5, values: close });
      const ema13 = EMA.calculate({ period: 13, values: close });
      const rsi = RSI.calculate({ period: 14, values: close });
      const stoch = Stochastic.calculate({
        high, low, close,
        period: 14,
        signalPeriod: 3
      });
      
      const currentPrice = close[close.length - 1];
      const profitTarget = {
        long: currentPrice + 4,
        short: currentPrice - 4
      };
      
      const signal = this.generateSignal({
        price: currentPrice,
        ema5: ema5[ema5.length - 1],
        ema13: ema13[ema13.length - 1],
        previousEma5: ema5[ema5.length - 2],
        previousEma13: ema13[ema13.length - 2],
        rsi: rsi[rsi.length - 1],
        stoch: stoch[stoch.length - 1],
        previousStoch: stoch[stoch.length - 2],
        profitTarget
      });
      
      return {
        signal,
        indicators: {
          ema5: ema5[ema5.length - 1],
          ema13: ema13[ema13.length - 1],
          rsi: rsi[rsi.length - 1],
          stochastic: {
            k: stoch[stoch.length - 1].k,
            d: stoch[stoch.length - 1].d
          },
          trendBias: currentPrice > ema13 ? 'BULLISH' : 'BEARISH',
          profitTarget
        }
      };
    }
    
    generateSignal({ price, ema5, ema13, previousEma5, previousEma13, rsi, stoch, previousStoch, profitTarget }) {
      const emaCrossoverUp = previousEma5 <= previousEma13 && ema5 > ema13;
      const emaCrossoverDown = previousEma5 >= previousEma13 && ema5 < ema13;
      const stochCrossAbove20 = previousStoch.k <= 20 && stoch.k > 20;
      const stochCrossBelow80 = previousStoch.k >= 80 && stoch.k < 80;
      
      if (price > ema13 && emaCrossoverUp && rsi > 50 && rsi < 70 && stochCrossAbove20) {
        return {
          type: 'BUY',
          target: profitTarget.long,
          exitConditions: {
            emaCrossover: 'EMA5 crosses below EMA13',
            rsiOverbought: 70,
            stochOverbought: 80,
            profitTarget: profitTarget.long
          },
          conditions: {
            trendAlignment: 'Bullish - Price above 13 EMA',
            emaCrossover: '5 EMA crossed above 13 EMA',
            rsiStrength: rsi,
            stochasticTrigger: 'Crossed above 20'
          }
        };
      }
      
      if (price < ema13 && emaCrossoverDown && rsi < 50 && rsi > 30 && stochCrossBelow80) {
        return {
          type: 'SELL',
          target: profitTarget.short,
          exitConditions: {
            emaCrossover: 'EMA5 crosses above EMA13',
            rsiOversold: 30,
            stochOversold: 20,
            profitTarget: profitTarget.short
          },
          conditions: {
            trendAlignment: 'Bearish - Price below 13 EMA',
            emaCrossover: '5 EMA crossed below 13 EMA',
            rsiStrength: rsi,
            stochasticTrigger: 'Crossed below 80'
          }
        };
      }
      
      return {
        type: 'WAIT',
        target: null,
        exitConditions: null,
        conditions: {
          reason: 'Waiting for scalping setup alignment'
        }
      };
    }
  }
  
  // Strategy 6
  class Strategy6 {
    async analyze(data) {
      const { close, high, low } = data;
      
      const rsi = RSI.calculate({ period: 7, values: close });
      const stoch = Stochastic.calculate({
        high, low, close,
        period: 5,
        signalPeriod: 3
      });
      const macd = MACD.calculate({
        fastPeriod: 8,
        slowPeriod: 17,
        signalPeriod: 9,
        values: close
      });
      
      const currentPrice = close[close.length - 1];
      const profitTarget = {
        long: currentPrice + 4,
        short: currentPrice - 4
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
          type: 'BUY',
          target: profitTarget.long,
          exitConditions: {
            rsiOverbought: 70,
            stochOverbought: 80,
            macdReversal: 'MACD histogram turns negative',
            profitTarget: profitTarget.long
          }
        };
      }
      
      if (isOverbought && macdCrossunder) {
        return {
          type: 'SELL',
          target: profitTarget.short,
          exitConditions: {
            rsiOversold: 30,
            stochOversold: 20,
            macdReversal: 'MACD histogram turns positive',
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
  
  module.exports = { Strategy1, Strategy2, Strategy5, Strategy6 };