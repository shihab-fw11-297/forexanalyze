const { EmaRsiMacdCombinedStrategy } = require("./ema-rsi-macd-combined-strategy");
const { MultiSmaWilliamsFractalStrategy } = require("./multi-sma-williams-fractal-strategy");
const { AdvancedMultiIndicatorBreakoutStrategy } = require("./advanced-multi-indicator-breakout-strategy");
const { RsiStochasticSmaConfluenceStrategy } = require("./rsi-stochastic-sma-confluence-strategy");
const { FastRsiStochMacdScalpingStrategy } = require("./fast-rsi-stoch-macd-scalping-strategy");
const { AdxFibonacciRsiHarmonicStrategy } = require("./adx-fibonacci-rsi-harmonic-strategy");
const { fastEmaTrendReversalStrategy } = require("./fast-ema-trend-reversal-strategy");
const { macdBollingerBreakoutStrategy } = require("./macd-bollinger-breakout-strategy");
const { TripleEmaTrendStrategy } = require("./triple-ema-trend-strategy");
const { BasicMaBreakoutStrategy } = require("./basic-ma-breakout-strategy");
const { BollingerStochBreakoutStrategy } = require("./BollingerStochBreakoutStrategy ");
const { EmaRsiMacdStrategy } = require("./EmaRsiMacdStrategy");
const { RSIDivergenceStrategy } = require("./RSIDivergenceStrategy");
const { MultiIndicatorBreakoutStrategy } = require("./MultiIndicatorBreakoutStrategy");
const { FlagPatternStrategy } = require("./FlagPatternStrategy");
const { TrianglePatternStrategy } = require("./TrianglePatternStrategy");
const { CandlestickPatternTradingStrategy } = require("./CandlestickPatternTradingStrategy");

const strategies = {
  1: new TripleEmaTrendStrategy(), //EMA Momentum Scalping Strategy
  2: new BasicMaBreakoutStrategy(), //Basic Moving Average Breakout Strategy
  3: new EmaRsiMacdCombinedStrategy(),//standard trend-following setup
  4: new MultiSmaWilliamsFractalStrategy(), //Fractal Breakout Strategy
  5: new FastRsiStochMacdScalpingStrategy(), //Quick-Pip Scalpe
  6: new AdvancedMultiIndicatorBreakoutStrategy(),//Precision Trend Scalping
  7: new fastEmaTrendReversalStrategy(),//Quick-Pip Trend Scalper
  8: new macdBollingerBreakoutStrategy(), //Bollinger Bands & MACD Breakout Scalper
  9:new BollingerStochBreakoutStrategy(), //Bollinger Bands & Stochastic Breakout Scalper
  10: new RsiStochasticSmaConfluenceStrategy(), //Momentum Reversal Scalper
  11:new EmaRsiMacdStrategy(), //ignore for short term
  12: new RSIDivergenceStrategy(),
  13: new MultiIndicatorBreakoutStrategy(),
  14:new FlagPatternStrategy(),
  15:new TrianglePatternStrategy(),
  16: new CandlestickPatternTradingStrategy()
};

async function initializeStrategies(marketData) {
  const signals = {};

  for (const [id, strategy] of Object.entries(strategies)) {
    const signal = await strategy.analyze(marketData);
    signals[id] = signal;
    // logSignal(id, signal);
  }

  return signals;
}

module.exports = {
  initializeStrategies,
};
