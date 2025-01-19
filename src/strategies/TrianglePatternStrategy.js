// Custom Linear Regression implementation
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

class TrianglePatternStrategy {
  constructor() {
    this.minPatternLength = 10; // Minimum number of candles to form a triangle
    this.maxPatternLength = 30; // Maximum number of candles to look back
    this.breakoutThreshold = 0.0001; // Minimum breakout distance
    this.retestTolerance = 0.0002; // Maximum distance for retest validation
  }

  async analyze(data) {
    const { high, low, close } = data;
    
    // Find swing points
    const swings = this.calculateSwingPoints(high, low);
    
    // Identify triangle patterns
    const patterns = this.identifyTrianglePatterns(swings);
    
    // Analyze current market conditions
    const currentClose = close[close.length - 1];
    const previousClose = close[close.length - 2];
    
    // Check for breakouts and generate signals
    const signal = this.generateSignal(patterns, {
      currentClose,
      previousClose,
      swings
    });
    
    return {
      signal,
      patterns
    };
  }
  
  calculateSwingPoints(high, low) {
    const swings = [];
    let isHigh = true;
    
    // Look for swing highs and lows
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
  
  identifyTrianglePatterns(swings) {
    return {
      ascending: this.identifyAscendingTriangle(swings),
      descending: this.identifyDescendingTriangle(swings),
      symmetrical: this.identifySymmetricalTriangle(swings)
    };
  }
  
  identifyAscendingTriangle(swings) {
    const recentSwings = swings.slice(-this.maxPatternLength);
    if (recentSwings.length < this.minPatternLength) return null;
    
    const highs = recentSwings.filter(swing => swing.type === 'high');
    const lows = recentSwings.filter(swing => swing.type === 'low');
    
    // Check for horizontal resistance
    const highsRegression = this.calculateRegressionLine(highs);
    if (!highsRegression || Math.abs(highsRegression.slope) > 0.0001) return null;
    
    // Check for ascending support
    const lowsRegression = this.calculateRegressionLine(lows);
    if (!lowsRegression || lowsRegression.slope <= 0) return null;
    
    return {
      type: 'ascending',
      resistance: highsRegression,
      support: lowsRegression,
      lastHigh: highs[highs.length - 1].price,
      lastLow: lows[lows.length - 1].price
    };
  }
  
  identifyDescendingTriangle(swings) {
    const recentSwings = swings.slice(-this.maxPatternLength);
    if (recentSwings.length < this.minPatternLength) return null;
    
    const highs = recentSwings.filter(swing => swing.type === 'high');
    const lows = recentSwings.filter(swing => swing.type === 'low');
    
    // Check for descending resistance
    const highsRegression = this.calculateRegressionLine(highs);
    if (!highsRegression || highsRegression.slope >= 0) return null;
    
    // Check for horizontal support
    const lowsRegression = this.calculateRegressionLine(lows);
    if (!lowsRegression || Math.abs(lowsRegression.slope) > 0.0001) return null;
    
    return {
      type: 'descending',
      resistance: highsRegression,
      support: lowsRegression,
      lastHigh: highs[highs.length - 1].price,
      lastLow: lows[lows.length - 1].price
    };
  }
  
  identifySymmetricalTriangle(swings) {
    const recentSwings = swings.slice(-this.maxPatternLength);
    if (recentSwings.length < this.minPatternLength) return null;
    
    const highs = recentSwings.filter(swing => swing.type === 'high');
    const lows = recentSwings.filter(swing => swing.type === 'low');
    
    // Calculate regression lines
    const highsRegression = this.calculateRegressionLine(highs);
    const lowsRegression = this.calculateRegressionLine(lows);
    
    if (!highsRegression || !lowsRegression) return null;

    // Check for converging lines
    if (highsRegression.slope >= 0 || lowsRegression.slope <= 0) return null;
    
    // Check if slopes are roughly symmetrical
    const slopeRatio = Math.abs(highsRegression.slope / lowsRegression.slope);
    if (slopeRatio < 0.7 || slopeRatio > 1.3) return null;
    
    return {
      type: 'symmetrical',
      resistance: highsRegression,
      support: lowsRegression,
      lastHigh: highs[highs.length - 1].price,
      lastLow: lows[lows.length - 1].price
    };
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
  
  checkBreakout(pattern, currentClose, previousClose) {
    const resistance = pattern.resistance.intercept + 
                      (pattern.resistance.slope * this.maxPatternLength);
    const support = pattern.support.intercept + 
                   (pattern.support.slope * this.maxPatternLength);
    
    // Check for upward breakout
    if (currentClose > resistance && previousClose <= resistance) {
      return 'up';
    }
    
    // Check for downward breakout
    if (currentClose < support && previousClose >= support) {
      return 'down';
    }
    
    return null;
  }
  
  checkRetest(breakoutDirection, pattern, currentClose) {
    if (breakoutDirection === 'up') {
      const resistance = pattern.resistance.intercept + 
                        (pattern.resistance.slope * this.maxPatternLength);
      return Math.abs(currentClose - resistance) <= this.retestTolerance;
    }
    
    if (breakoutDirection === 'down') {
      const support = pattern.support.intercept + 
                     (pattern.support.slope * this.maxPatternLength);
      return Math.abs(currentClose - support) <= this.retestTolerance;
    }
    
    return false;
  }
  
  generateSignal(patterns, { currentClose, previousClose, swings }) {
    const pipMultiplier = 0.0001;
    let signal = null;
    
    // Check each pattern type for breakouts
    Object.entries(patterns).forEach(([patternType, pattern]) => {
      if (!pattern) return;
      
      const breakout = this.checkBreakout(pattern, currentClose, previousClose);
      const retest = this.checkRetest(breakout, pattern, currentClose);
      
      if (breakout) {
        signal = this.createSignal(
          patternType,
          breakout,
          retest,
          currentClose
        );
      }
    });
    
    return signal || {
      type: 'WAIT',
      entry: null,
      target: null,
      stopLoss: null,
      riskReward: null,
      patternType: null,
      breakoutType: null,
      retest: false
    };
  }
  
  createSignal(patternType, breakoutDirection, retest, currentPrice) {
    const pipMultiplier = 0.0001;
    
    const signal = {
      type: breakoutDirection === 'up' ? 'BUY' : 'SELL',
      entry: currentPrice,
      patternType,
      breakoutType: breakoutDirection,
      retest,
      riskReward: 1.86 // (6.5/3.5)
    };
    
    if (signal.type === 'BUY') {
      signal.target = currentPrice + (6.5 * pipMultiplier);
      signal.stopLoss = currentPrice - (3.5 * pipMultiplier);
    } else {
      signal.target = currentPrice - (6.5 * pipMultiplier);
      signal.stopLoss = currentPrice + (3.5 * pipMultiplier);
    }
    
    return signal;
  }
}

module.exports = { TrianglePatternStrategy };