class SimpleLinearRegression {
  constructor(points) {
    this.points = points;
    this.calculate();
  }

  calculate() {
    const n = this.points.length;
    if (n < 2) {
      this.slope = 0;
      this.intercept = 0;
      return;
    }

    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;

    for (const point of this.points) {
      sumX += point.x;
      sumY += point.y;
      sumXY += point.x * point.y;
      sumXX += point.x * point.x;
    }

    const meanX = sumX / n;
    const meanY = sumY / n;

    // Calculate slope and intercept
    this.slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    this.intercept = meanY - this.slope * meanX;
  }
}

class FlagPatternStrategy {
  constructor() {
    this.minFlagpoleLength = 10;
    this.maxFlagLength = 20;
    this.channelDeviation = 0.0002; // Allowable deviation for parallel lines
    this.breakoutThreshold = 0.0001; // Minimum breakout distance
  }

  async analyze(data) {
    const { open, high, low, close } = data;
    
    // Find potential flag patterns
    const patterns = this.identifyFlagPatterns(high, low, close);
    
    // Analyze current market conditions
    const currentClose = close[close.length - 1];
    const currentHigh = high[high.length - 1];
    const currentLow = low[low.length - 1];
    
    // Check for breakouts and generate signals
    const signal = this.generateSignal(patterns, {
      currentClose,
      currentHigh,
      currentLow
    });
    
    return {
      signal,
      patterns
    };
  }
  
  identifyFlagPatterns(high, low, close) {
    const patterns = {
      bullFlag: null,
      bearFlag: null,
      neutralFlag: null
    };
    
    // Calculate price swings
    const swings = this.calculatePriceSwings(high, low);
    
    // Identify potential flagpoles
    const bullishFlagpole = this.identifyBullishFlagpole(swings);
    const bearishFlagpole = this.identifyBearishFlagpole(swings);
    
    if (bullishFlagpole) {
      patterns.bullFlag = this.analyzeBullFlag(bullishFlagpole, swings);
    }
    
    if (bearishFlagpole) {
      patterns.bearFlag = this.analyzeBearFlag(bearishFlagpole, swings);
    }
    
    // Check for neutral flag (horizontal channel)
    patterns.neutralFlag = this.analyzeNeutralFlag(swings);
    
    return patterns;
  }
  
  calculatePriceSwings(high, low) {
    const swings = [];
    let isHigh = true;
    
    for (let i = 2; i < high.length - 2; i++) {
      if (isHigh) {
        if (high[i] > high[i-1] && high[i] > high[i-2] &&
            high[i] > high[i+1] && high[i] > high[i+2]) {
          swings.push({
            type: 'high',
            price: high[i],
            index: i
          });
          isHigh = false;
        }
      } else {
        if (low[i] < low[i-1] && low[i] < low[i-2] &&
            low[i] < low[i+1] && low[i] < low[i+2]) {
          swings.push({
            type: 'low',
            price: low[i],
            index: i
          });
          isHigh = true;
        }
      }
    }
    
    return swings;
  }
  
  identifyBullishFlagpole(swings) {
    for (let i = 0; i < swings.length - 1; i++) {
      if (swings[i].type === 'low' && swings[i+1].type === 'high') {
        const move = swings[i+1].price - swings[i].price;
        if (move > this.minFlagpoleLength * this.breakoutThreshold) {
          return {
            start: swings[i],
            end: swings[i+1],
            length: move
          };
        }
      }
    }
    return null;
  }
  
  identifyBearishFlagpole(swings) {
    for (let i = 0; i < swings.length - 1; i++) {
      if (swings[i].type === 'high' && swings[i+1].type === 'low') {
        const move = swings[i].price - swings[i+1].price;
        if (move > this.minFlagpoleLength * this.breakoutThreshold) {
          return {
            start: swings[i],
            end: swings[i+1],
            length: move
          };
        }
      }
    }
    return null;
  }
  
  analyzeBullFlag(flagpole, swings) {
    const flagStart = swings.findIndex(swing => swing.index === flagpole.end.index);
    const potentialFlagSwings = swings.slice(flagStart, flagStart + 4);
    
    if (potentialFlagSwings.length < 4) return null;
    
    // Calculate regression lines for upper and lower bounds
    const upperBound = this.calculateRegressionLine(
      potentialFlagSwings.filter(swing => swing.type === 'high')
    );
    
    const lowerBound = this.calculateRegressionLine(
      potentialFlagSwings.filter(swing => swing.type === 'low')
    );
    
    // Check if lines are parallel and descending
    if (this.areParallelAndDescending(upperBound, lowerBound)) {
      return {
        type: 'bull',
        flagpole,
        channel: {
          upper: upperBound,
          lower: lowerBound
        }
      };
    }
    
    return null;
  }
  
  analyzeBearFlag(flagpole, swings) {
    const flagStart = swings.findIndex(swing => swing.index === flagpole.end.index);
    const potentialFlagSwings = swings.slice(flagStart, flagStart + 4);
    
    if (potentialFlagSwings.length < 4) return null;
    
    // Calculate regression lines for upper and lower bounds
    const upperBound = this.calculateRegressionLine(
      potentialFlagSwings.filter(swing => swing.type === 'high')
    );
    
    const lowerBound = this.calculateRegressionLine(
      potentialFlagSwings.filter(swing => swing.type === 'low')
    );
    
    // Check if lines are parallel and ascending
    if (this.areParallelAndAscending(upperBound, lowerBound)) {
      return {
        type: 'bear',
        flagpole,
        channel: {
          upper: upperBound,
          lower: lowerBound
        }
      };
    }
    
    return null;
  }
  
  analyzeNeutralFlag(swings) {
    const recentSwings = swings.slice(-6);
    if (recentSwings.length < 4) return null;
    
    const highs = recentSwings.filter(swing => swing.type === 'high');
    const lows = recentSwings.filter(swing => swing.type === 'low');
    
    // Check if price is moving sideways (horizontal channel)
    const highsRegression = this.calculateRegressionLine(highs);
    const lowsRegression = this.calculateRegressionLine(lows);
    
    if (Math.abs(highsRegression.slope) < this.channelDeviation &&
        Math.abs(lowsRegression.slope) < this.channelDeviation) {
      return {
        type: 'neutral',
        channel: {
          resistance: Math.max(...highs.map(h => h.price)),
          support: Math.min(...lows.map(l => l.price))
        }
      };
    }
    
    return null;
  }
  
  calculateRegressionLine(points) {
    if (points.length < 2) return null;
    
    const input = points.map((point, index) => ({
      x: index,
      y: point.price
    }));
    
    const regression = new SimpleLinearRegression(input);
    return {
      slope: regression.slope,
      intercept: regression.intercept
    };
  }
  
  areParallelAndDescending(line1, line2) {
    if (!line1 || !line2) return false;
    
    const slopeDifference = Math.abs(line1.slope - line2.slope);
    return slopeDifference < this.channelDeviation && line1.slope < 0;
  }
  
  areParallelAndAscending(line1, line2) {
    if (!line1 || !line2) return false;
    
    const slopeDifference = Math.abs(line1.slope - line2.slope);
    return slopeDifference < this.channelDeviation && line1.slope > 0;
  }
  
  generateSignal(patterns, { currentClose, currentHigh, currentLow }) {
    const pipMultiplier = 0.0001;
    
    // Check for bull flag breakout
    if (patterns.bullFlag && 
        currentClose > patterns.bullFlag.channel.upper.intercept) {
      return this.createSignal('BUY', currentClose);
    }
    
    // Check for bear flag breakout
    if (patterns.bearFlag && 
        currentClose < patterns.bearFlag.channel.lower.intercept) {
      return this.createSignal('SELL', currentClose);
    }
    
    // Check for neutral flag breakout
    if (patterns.neutralFlag) {
      if (currentHigh > patterns.neutralFlag.channel.resistance) {
        return this.createSignal('BUY', currentClose);
      }
      if (currentLow < patterns.neutralFlag.channel.support) {
        return this.createSignal('SELL', currentClose);
      }
    }
    
    return {
      type: 'WAIT',
      entry: null,
      target: null,
      stopLoss: null,
      riskReward: null,
      entryType: null,
      alternateEntry: null
    };
  }
  
  createSignal(type, currentPrice) {
    const pipMultiplier = 0.0001;
    const signal = {
      type,
      entry: currentPrice,
      entryType: 'MARKET',
      riskReward: 1.86, // (6.5/3.5)
      alternateEntry: {
        type: 'LIMIT',
        price: type === 'BUY' ? 
          currentPrice - (2 * pipMultiplier) : 
          currentPrice + (2 * pipMultiplier)
      }
    };
    
    if (type === 'BUY') {
      signal.target = currentPrice + (6.5 * pipMultiplier);
      signal.stopLoss = currentPrice - (3.5 * pipMultiplier);
    } else {
      signal.target = currentPrice - (6.5 * pipMultiplier);
      signal.stopLoss = currentPrice + (3.5 * pipMultiplier);
    }
    
    return signal;
  }
}

module.exports = { FlagPatternStrategy };