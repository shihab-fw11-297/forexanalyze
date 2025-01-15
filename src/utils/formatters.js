// Utility functions for formatting indicator values
const formatters = {
    macd: (macd) => ({
      macdLine: macd.MACD ? macd.MACD.toFixed(4) : '0.0000',
      signalLine: macd.signal ? macd.signal.toFixed(4) : '0.0000',
      histogram: macd.histogram ? macd.histogram.toFixed(4) : '0.0000'
    }),
    
    stoch: (stoch) => ({
      k: stoch.k ? stoch.k.toFixed(2) : '0.00',
      d: stoch.d ? stoch.d.toFixed(2) : '0.00'
    })
  };
  
  module.exports = formatters;