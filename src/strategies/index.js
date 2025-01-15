const { Strategy3 } = require("./strategy3");
const { Strategy4 } = require("./strategy4");

const { logSignal } = require("../utils/logger");
const { strategy9 } = require("./strategy9");
const { strategy8 } = require("./strategy8");
const { Strategy7 } = require("./Strategy7");
const { Strategy10, Strategy11, Strategy12, Strategy13 } = require("./Strategy10To13");
const { Strategy1, Strategy2, Strategy5, Strategy6 } = require("./Strategy1256");
const { Strategy14, Strategy15 } = require("./Strategy1415");
const { Strategy16 } = require("./Strategy16");

const strategies = {
  1: new Strategy1(),
  2: new Strategy2(),
  3: new Strategy3(),
  4: new Strategy4(),
  5: new Strategy5(),
  6: new Strategy6(),
  7: new Strategy7(),
  8: new strategy8(),
  9: new strategy9(),
  10: new Strategy10(),
  11: new Strategy11(),
  12: new Strategy12(),
  13: new Strategy13(),
  14: new Strategy14(),
  15: new Strategy15(),
  16: new Strategy16(),
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
