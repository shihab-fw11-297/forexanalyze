const cron = require('node-cron');
const fs = require('fs').promises;
const path = require('path');
const { initializeStrategies } = require("./strategies");
const { fetchMarketData } = require("./services/marketData");

// Separate history files by year and month for better data management
const HISTORY_DIR = path.join(__dirname, "majorityHistory");
const LOCK_FILE = path.join(HISTORY_DIR, "write.lock");

// Helper function to count signals
function countSignals(signals) {
  const counts = {
    BUY: 0,
    SELL: 0,
    WAIT: 0
  };
  
  Object.values(signals).forEach(signal => {
    const type = signal.signal?.type || 'WAIT';
    counts[type]++;
  });
  
  return counts;
}

const TIMEFRAMES = [
  { interval: "1", unit: "minute" },
  { interval: "5", unit: "minute" },
  { interval: "15", unit: "minute" },
  { interval: "30", unit: "minute" },
];

async function ensureDirectoryExists(dirPath) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

// File locking mechanism to prevent concurrent writes
async function acquireLock() {
  try {
    await fs.writeFile(LOCK_FILE, Date.now().toString());
    return true;
  } catch (error) {
    console.error('Failed to acquire lock:', error);
    return false;
  }
}

async function releaseLock() {
  try {
    await fs.unlink(LOCK_FILE);
    return true;
  } catch (error) {
    console.error('Failed to release lock:', error);
    return false;
  }
}

async function isLocked() {
  try {
    await fs.access(LOCK_FILE);
    // Check if lock is stale (older than 5 minutes)
    const lockData = await fs.readFile(LOCK_FILE, 'utf8');
    const lockTime = parseInt(lockData);
    if (Date.now() - lockTime > 5 * 60 * 1000) {
      await releaseLock();
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

function getHistoryFilePath(timestamp) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return path.join(HISTORY_DIR, `${year}-${month}.json`);
}

async function analyzeTimeframe(timeframe, unit) {
  try {
    const marketData = await fetchMarketData(timeframe, unit);
    const signals = await initializeStrategies(marketData);
    const counts = countSignals(signals);
    
    return {
      timeframe: `${timeframe}${unit.charAt(0)}`,
      signals: counts,
      price: marketData.close[marketData.close.length - 1]
    };
  } catch (error) {
    console.error(`Error analyzing ${timeframe}${unit} timeframe:`, error);
    return null;
  }
}

async function readHistoryFile(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

async function appendToHistory(filePath, newEntries) {
  await ensureDirectoryExists(HISTORY_DIR);
  
  let retries = 3;
  while (retries > 0) {
    try {
      if (await isLocked()) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }
      
      await acquireLock();
      
      // Read existing data
      let existingData = [];
      try {
        existingData = await readHistoryFile(filePath);
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
      
      // Check for duplicates using timestamp
      const existingTimestamps = new Set(existingData.map(entry => entry.timestamp));
      const uniqueNewEntries = newEntries.filter(entry => !existingTimestamps.has(entry.timestamp));
      
      // Append new unique entries
      if (uniqueNewEntries.length > 0) {
        const updatedData = [...existingData, ...uniqueNewEntries];
        await fs.writeFile(filePath, JSON.stringify(updatedData, null, 2));
      }
      
      await releaseLock();
      return true;
    } catch (error) {
      console.error(`Error appending to history (retry ${4 - retries}/3):`, error);
      await releaseLock();
      retries--;
      if (retries === 0) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

async function readHistory(startDate, endDate) {
  const start = new Date(startDate || 0);
  const end = new Date(endDate || Date.now());
  const history = {};
  
  TIMEFRAMES.forEach(({ interval, unit }) => {
    history[`${interval}${unit.charAt(0)}`] = [];
  });

  for (let date = new Date(start); date <= end; date.setMonth(date.getMonth() + 1)) {
    const filePath = getHistoryFilePath(date);
    try {
      const monthlyData = await readHistoryFile(filePath);
      
      monthlyData.forEach(entry => {
        const entryDate = new Date(entry.timestamp);
        if (entryDate >= start && entryDate <= end) {
          const timeframe = entry.timeframe;
          if (history[timeframe]) {
            history[timeframe].push(entry);
          }
        }
      });
    } catch (error) {
      console.error(`Error reading history file ${filePath}:`, error);
    }
  }

  return history;
}

async function performAnalysis() {
  try {
    const results = await Promise.all(
      TIMEFRAMES.map(({ interval, unit }) => analyzeTimeframe(interval, unit))
    );
    
    const validResults = results.filter(result => result !== null);
    const timestamp = new Date().toISOString();
    
    const overall = validResults.reduce((acc, result) => {
      acc.BUY += result.signals.BUY;
      acc.SELL += result.signals.SELL;
      acc.WAIT += result.signals.WAIT;
      return acc;
    }, { BUY: 0, SELL: 0, WAIT: 0 });
    
    const newEntries = validResults.map(result => ({
      timestamp,
      timeframe: result.timeframe,
      signals: result.signals,
      price: result.price,
      overall,
      id: `${timestamp}-${result.timeframe}` // Unique identifier for each entry
    }));
    
    const currentFilePath = getHistoryFilePath(timestamp);
    await appendToHistory(currentFilePath, newEntries);
    
    if (global.io) {
      global.io.emit('analysisUpdate', {
        timeframes: validResults,
        overall,
        timestamp
      });
    }
    
    return {
      timeframes: validResults,
      overall,
      timestamp
    };
  } catch (error) {
    console.error("Error in automated analysis:", error);
    return null;
  }
}

function addAutomatedAnalysisRoutes(app) {
  app.get("/api/analysis/history", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const history = await readHistory(startDate, endDate);
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch analysis history" });
    }
  });
  
  app.get("/api/analysis/history/:year/:month", async (req, res) => {
    try {
      const { year, month } = req.params;
      const filePath = path.join(HISTORY_DIR, `${year}-${month}.json`);
      const monthlyData = await readHistoryFile(filePath);
      res.json(monthlyData);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch monthly analysis data" });
    }
  });
}

function startAutomatedAnalysis() {
  cron.schedule('* * * * *', async () => {
    console.log('Running automated analysis...');
    await performAnalysis();
  });
}

module.exports = {
  startAutomatedAnalysis,
  addAutomatedAnalysisRoutes,
  performAnalysis
};