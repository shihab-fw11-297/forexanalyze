// strategy8.js - Momentum Trading Strategy
const { RSI, MACD, CCI, Stochastic } = require('technicalindicators');

class strategy8 {
  constructor() {
    this.previousSignal = 'WAIT';
    this.lastPivots = {
      high: null,
      low: null
    };
  }

  async analyze(data) {
    const { close, high, low } = data;
    
    // Calculate momentum indicators
    const rsi = RSI.calculate({
      period: 14,
      values: close
    });

    const macd = MACD.calculate({
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9,
      values: close
    });

    const cci = CCI.calculate({
      high,
      low,
      close,
      period: 20
    });

    const stoch = Stochastic.calculate({
      high,
      low,
      close,
      period: 14,
      signalPeriod: 3
    });

    // Update pivot points for stop loss calculation
    this.updatePivots(high[high.length - 1], low[low.length - 1]);

    const currentPrice = close[close.length - 1];
    const signal = this.generateSignal({
      price: currentPrice,
      rsi: rsi[rsi.length - 1],
      macd: macd[macd.length - 1],
      cci: cci[cci.length - 1],
      stoch: stoch[stoch.length - 1],
      candlePattern: this.identifyCandlePattern({
        current: {
          close: close[close.length - 1],
          high: high[high.length - 1],
          low: low[low.length - 1]
        },
        previous: {
          close: close[close.length - 2],
          high: high[high.length - 2],
          low: low[low.length - 2]
        }
      })
    });

    return {
      signal,
      indicators: {
        rsi: rsi[rsi.length - 1],
        macd: {
          MACD: macd[macd.length - 1].MACD,
          signal: macd[macd.length - 1].signal,
          histogram: macd[macd.length - 1].histogram
        },
        cci: cci[cci.length - 1],
        stoch: {
          k: stoch[stoch.length - 1].k,
          d: stoch[stoch.length - 1].d
        }
      }
    };
  }

  updatePivots(currentHigh, currentLow) {
    // Update pivot highs and lows for stop loss calculation
    if (this.lastPivots.high === null || currentHigh > this.lastPivots.high) {
      this.lastPivots.high = currentHigh;
    }
    if (this.lastPivots.low === null || currentLow < this.lastPivots.low) {
      this.lastPivots.low = currentLow;
    }
  }

  identifyCandlePattern({ current, previous }) {
    const bodySize = Math.abs(current.close - previous.close);
    const upperWick = current.high - Math.max(current.close, previous.close);
    const lowerWick = Math.min(current.close, previous.close) - current.low;

    // Identify bullish engulfing
    const isBullishEngulfing = 
      current.close > previous.close &&
      current.close > previous.close &&
      bodySize > (upperWick + lowerWick);

    // Identify bearish engulfing
    const isBearishEngulfing = 
      current.close < previous.close &&
      current.close < previous.close &&
      bodySize > (upperWick + lowerWick);

    return {
      isBullishEngulfing,
      isBearishEngulfing
    };
  }

  generateSignal({ price, rsi, macd, cci, stoch, candlePattern }) {
    // Calculate momentum strength factors
    const bullishMomentum = this.calculateBullishMomentum({ rsi, macd, cci, stoch });
    const bearishMomentum = this.calculateBearishMomentum({ rsi, macd, cci, stoch });

    // Define trade parameters
    const riskPercent = 0.01; // 1% risk per trade
    const rewardRatio = 2; // 2:1 reward-to-risk ratio

    // Bullish momentum conditions
    if (bullishMomentum && candlePattern.isBullishEngulfing) {
      const stopLoss = this.lastPivots.low * (1 - 0.001); // 0.1% below recent low
      const takeProfit = price + ((price - stopLoss) * rewardRatio);

      return 'BUY'
    }

    // Bearish momentum conditions
    if (bearishMomentum && candlePattern.isBearishEngulfing) {
      const stopLoss = this.lastPivots.high * (1 + 0.001); // 0.1% above recent high
      const takeProfit = price - ((stopLoss - price) * rewardRatio);

      return 'SELL';
    }

    return 'WAIT';
  }

  calculateBullishMomentum({ rsi, macd, cci, stoch }) {
    let momentumScore = 0;

    // RSI momentum (30% weight)
    if (rsi > 30 && rsi < 70) momentumScore += 0.3;
    if (rsi > 50) momentumScore += 0.3;

    // MACD momentum (30% weight)
    if (macd.MACD > macd.signal) momentumScore += 0.3;
    if (macd.histogram > 0) momentumScore += 0.3;

    // CCI momentum (20% weight)
    if (cci > 0 && cci < 200) momentumScore += 0.2;

    // Stochastic momentum (20% weight)
    if (stoch.k > stoch.d && stoch.k < 80) momentumScore += 0.2;

    return momentumScore;
  }

  calculateBearishMomentum({ rsi, macd, cci, stoch }) {
    let momentumScore = 0;

    // RSI momentum (30% weight)
    if (rsi < 70 && rsi > 30) momentumScore += 0.3;
    if (rsi < 50) momentumScore += 0.3;

    // MACD momentum (30% weight)
    if (macd.MACD < macd.signal) momentumScore += 0.3;
    if (macd.histogram < 0) momentumScore += 0.3;

    // CCI momentum (20% weight)
    if (cci < 0 && cci > -200) momentumScore += 0.2;

    // Stochastic momentum (20% weight)
    if (stoch.k < stoch.d && stoch.k > 20) momentumScore += 0.2;

    return momentumScore;
  }
}

module.exports = { strategy8 };