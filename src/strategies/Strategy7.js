// Strategy7.js - Breakout Trading Strategy
const { BollingerBands, SMA } = require("technicalindicators");

class Strategy7 {
  constructor() {
    this.previousLevels = {
      support: null,
      resistance: null,
    };
  }

  async analyze(data) {
    const { close, high, low, volume } = data;

    // Calculate Bollinger Bands
    const bbands = BollingerBands.calculate({
      period: 20,
      values: close,
      stdDev: 2,
    });

    // Calculate support and resistance levels
    const { support, resistance } = this.calculateSupportResistance(high, low);

    // Calculate volume moving average for volume confirmation
    const volumeSMA = SMA.calculate({
      period: 20,
      values: volume,
    });

    const currentPrice = close[close.length - 1];
    const currentVolume = volume[volume.length - 1];
    const avgVolume = volumeSMA[volumeSMA.length - 1];

    const signal = this.generateSignal({
      price: currentPrice,
      support,
      resistance,
      bband: bbands[bbands.length - 1],
      volume: currentVolume,
      avgVolume,
      previousCandle: {
        close: close[close.length - 2],
        high: high[high.length - 2],
        low: low[low.length - 2],
      },
    });

    // Update previous levels after signal generation
    this.previousLevels = {
      support,
      resistance,
    };

    return {
      signal,
      indicators: {
        support,
        resistance,
        bband: bbands[bbands.length - 1],
        volumeRatio: (currentVolume / avgVolume).toFixed(2),
      },
    };
  }

  calculateSupportResistance(high, low, period = 20) {
    // Get recent price action
    const recentHigh = Math.max(...high.slice(-period));
    const recentLow = Math.min(...low.slice(-period));

    // If we have previous levels, use them to avoid frequent changes
    if (this.previousLevels.support && this.previousLevels.resistance) {
      const supportChange =
        Math.abs(this.previousLevels.support - recentLow) /
        this.previousLevels.support;
      const resistanceChange =
        Math.abs(this.previousLevels.resistance - recentHigh) /
        this.previousLevels.resistance;

      // Only update levels if there's a significant change (>0.5%)
      return {
        support:
          supportChange > 0.005 ? recentLow : this.previousLevels.support,
        resistance:
          resistanceChange > 0.005
            ? recentHigh
            : this.previousLevels.resistance,
      };
    }

    return {
      support: recentLow,
      resistance: recentHigh,
    };
  }

  generateSignal({
    price,
    support,
    resistance,
    bband,
    volume,
    avgVolume,
    previousCandle,
  }) {
    const volumeConfirmation = volume > avgVolume * 1.5; // 50% above average volume
    const priceRange = resistance - support;
    const breakoutThreshold = priceRange * 0.001; // 0.1% of the range

    // Bullish Breakout Conditions
    const bullishBreakout =
      price > resistance + breakoutThreshold && // Price breaks above resistance
      price > bband.upper && // Price above upper Bollinger Band
      previousCandle.close < resistance && // Previous candle was below resistance
      volumeConfirmation; // Confirmed by volume

    // Bearish Breakout Conditions
    const bearishBreakout =
      price < support - breakoutThreshold && // Price breaks below support
      price < bband.lower && // Price below lower Bollinger Band
      previousCandle.close > support && // Previous candle was above support
      volumeConfirmation; // Confirmed by volume

    if (bullishBreakout) {
      return "BUY";
    }

    if (bearishBreakout) {
      return "SELL";
    }

    return "WAIT";
  }
}

module.exports = { Strategy7 };
