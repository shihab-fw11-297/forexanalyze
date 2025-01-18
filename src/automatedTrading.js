// automatedTrading.js
const cron = require('node-cron');
const fs = require('fs').promises;
const path = require('path');
const { fetchMarketData } = require('./services/marketData');
const { initializeStrategies } = require('./strategies');
const { setupLogging } = require('./utils/logger');

const logger = setupLogging();
const HISTORY_FILE_PATH = path.join(__dirname, 'history.json');
let isProcessing = false;
let cronJob = null;

const timeframes = [
  { interval: '1', unit: 'minute' },
  { interval: '5', unit: 'minute' },
  { interval: '15', unit: 'minute' }
];

async function ensureHistoryFile() {
  try {
    await fs.access(HISTORY_FILE_PATH);
  } catch (error) {
    if (error.code === 'ENOENT') {
      await fs.writeFile(HISTORY_FILE_PATH, '[]', 'utf8');
      logger.info('Created new history.json file');
    }
  }
}

async function readHistoryFile() {
  try {
    const data = await fs.readFile(HISTORY_FILE_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    logger.error('Error reading history file:', error);
    return [];
  }
}

async function appendToHistoryFile(newEntries) {
  try {
    const existingHistory = await readHistoryFile();
    const updatedHistory = [...existingHistory, ...newEntries];
    await fs.writeFile(HISTORY_FILE_PATH, JSON.stringify(updatedHistory, null, 2), 'utf8');
    logger.info(`Successfully appended ${newEntries.length} entries to history.json`);
  } catch (error) {
    logger.error('Error appending to history file:', error);
    throw error;
  }
}

async function processTimeframes() {
  if (isProcessing) {
    logger.warn('Previous cycle still running, skipping this cycle');
    return;
  }

  isProcessing = true;
  logger.info('Starting 3-minute analysis cycle for all timeframes');

  try {
    const newResults = [];

    // Process all timeframes sequentially
    for (const timeframe of timeframes) {
      try {
        logger.info(`Processing ${timeframe.interval}${timeframe.unit} timeframe`);
        
        const marketData = await fetchMarketData(timeframe.interval, timeframe.unit);
        const signals = await initializeStrategies(marketData);
        
        const result = {
          timestamp: Date.now(),
          timeframe: `${timeframe.interval}${timeframe.unit}`,
          data: {
            close: marketData.close[marketData.close.length - 1],
            open: marketData.open[marketData.open.length - 1],
            high: marketData.high[marketData.high.length - 1],
            low: marketData.low[marketData.low.length - 1]
          },
          signals
        };
        
        newResults.push(result);
        
        // Wait 1 second between timeframes to prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        logger.error(`Error processing ${timeframe.interval}${timeframe.unit}:`, error);
      }
    }

    if (newResults.length > 0) {
      // Append new results to history file
      await appendToHistoryFile(newResults);

      // Emit updates through socket.io
      if (global.io) {
        global.io.emit('historyUpdate', { timeframes: newResults });
      }
    }

    logger.info('Completed 3-minute analysis cycle for all timeframes');
  } catch (error) {
    logger.error('Error in processing cycle:', error);
  } finally {
    isProcessing = false;
  }
}

function startTradingSystem() {
  // Stop existing cron job if any
  if (cronJob) {
    cronJob.stop();
  }

  // Initialize system
  ensureHistoryFile()
    .then(() => {
      // Schedule to run exactly every 3 minutes
      cronJob = cron.schedule('* * * * *', async () => {
        await processTimeframes();
      }, {
        scheduled: true,
        timezone: "UTC"
      });

      logger.info('Automated trading system started - will run every 3 minutes');
    })
    .catch(error => {
      logger.error('Failed to initialize trading system:', error);
    });
}

module.exports = {
  startTradingSystem
};