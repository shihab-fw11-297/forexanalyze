// strategy9.js - Range Trading Strategy
const { RSI, Stochastic } = require('technicalindicators');

class strategy9 {
  constructor() {
    this.rangeHistory = [];
    this.currentRange = {
      support: null,
      resistance: null,
      confirmed: false
    };
  }

  async analyze(data) {
    const { close, high, low } = data;
    
    // Calculate RSI
    const rsi = RSI.calculate({
      period: 14,
      values: close
    });

    // Calculate Stochastic
    const stoch = Stochastic.calculate({
      high,
      low,
      close,
      period: 14,
      signalPeriod: 3
    });

    // Update and validate range
    this.updateRange(high, low);

    const currentPrice = close[close.length - 1];
    const signal = this.generateSignal({
      price: currentPrice,
      rsi: rsi[rsi.length - 1],
      stoch: stoch[stoch.length - 1]
    });

    return {
      signal,
      indicators: {
        rsi: rsi[rsi.length - 1],
        stoch: {
          k: stoch[stoch.length - 1].k,
          d: stoch[stoch.length - 1].d
        },
        range: {
          support: this.currentRange.support,
          resistance: this.currentRange.resistance,
          confirmed: this.currentRange.confirmed
        }
      }
    };
  }

  updateRange(high, low, periods = 20) {
    // Add new price points to history
    this.rangeHistory.push({ high, low });
    if (this.rangeHistory.length > periods) {
      this.rangeHistory.shift();
    }

    // Only update range if we have enough history
    if (this.rangeHistory.length >= periods) {
      const highs = this.rangeHistory.map(p => p.high);
      const lows = this.rangeHistory.map(p => p.low);

      // Calculate potential new range levels
      const newResistance = Math.max(...highs);
      const newSupport = Math.min(...lows);

      // Check if price is moving sideways (range trading conditions)
      const rangeSize = newResistance - newSupport;
      const averagePrice = (newResistance + newSupport) / 2;
      const rangePercent = (rangeSize / averagePrice) * 100;

      // Validate if this is a tradeable range (e.g., range is between 0.5% and 2% of price)
      if (rangePercent >= 0.5 && rangePercent <= 2) {
        this.currentRange = {
          support: newSupport,
          resistance: newResistance,
          confirmed: true
        };
      } else {
        // Range is too wide or too narrow for reliable range trading
        this.currentRange.confirmed = false;
      }
    }
  }

  generateSignal({ price, rsi, stoch }) {
    // Only generate signals if we have a confirmed range
    if (!this.currentRange.confirmed) {
      return 'WAIT';
    }

    const { support, resistance } = this.currentRange;
    const rangeSize = resistance - support;
    const supportZone = support + (rangeSize * 0.1); // 10% above support
    const resistanceZone = resistance - (rangeSize * 0.1); // 10% below resistance

    // Calculate price position in range
    const pricePosition = (price - support) / (resistance - support);

    // Buy Conditions
    const buyConditions = 
      price <= supportZone && // Price near support
      rsi < 30 && // Oversold RSI
      stoch.k < 20 && // Oversold Stochastic
      stoch.k > stoch.d; // Stochastic showing potential reversal

    // Sell Conditions
    const sellConditions = 
      price >= resistanceZone && // Price near resistance
      rsi > 70 && // Overbought RSI
      stoch.k > 80 && // Overbought Stochastic
      stoch.k < stoch.d; // Stochastic showing potential reversal

    if (buyConditions) {
      return 'BUY'
    }

    if (sellConditions) {
      return 'SELL';
    }

    return 'WAIT';
  }
}

module.exports = { strategy9 };