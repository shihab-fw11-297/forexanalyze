const createIndicatorDisplay = {
    macd: (macd) => {
      const { macdLine, signalLine, histogram } = macd;
      return `
        <div class="indicator-group macd">
          <div class="indicator-item">
            <span class="indicator-label">MACD Line:</span>
            <span class="indicator-value ${parseFloat(macdLine) >= 0 ? 'positive' : 'negative'}">${macdLine}</span>
          </div>
          <div class="indicator-item">
            <span class="indicator-label">Signal Line:</span>
            <span class="indicator-value ${parseFloat(signalLine) >= 0 ? 'positive' : 'negative'}">${signalLine}</span>
          </div>
          <div class="indicator-item">
            <span class="indicator-label">Histogram:</span>
            <span class="indicator-value ${parseFloat(histogram) >= 0 ? 'positive' : 'negative'}">${histogram}</span>
          </div>
        </div>
      `;
    },
  
    stoch: (stoch) => {
      const { k, d } = stoch;
      return `
        <div class="indicator-group stoch">
          <div class="indicator-item">
            <span class="indicator-label">%K:</span>
            <span class="indicator-value">${k}</span>
          </div>
          <div class="indicator-item">
            <span class="indicator-label">%D:</span>
            <span class="indicator-value">${d}</span>
          </div>
        </div>
      `;
    }
  };
  
  module.exports = createIndicatorDisplay;