// server.js
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");
const { initializeStrategies } = require("./strategies");
const { setupLogging } = require("./utils/logger");
const { fetchMarketData } = require("./services/marketData");
const fs = require("fs").promises;
const { startAutomatedAnalysis, addAutomatedAnalysisRoutes } = require('./automatedAnalysis');
const { startTradingSystem } = require('./automatedTrading');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const logger = setupLogging();

// Make io available globally
global.io = io;

// Store active clients and their settings
const activeClients = new Map();
const HISTORY_FILE_PATH = path.join(__dirname, "history.json");

// Setup middleware
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.get("/", (req, res) => {
  res.render("index", {
    strategies: [
      { id: 1, name: "Triple EMA Trend Strategy" },
      { id: 2, name: "Basic MA Breakout Strategy" },
      { id: 3, name: "EMA RSI MACD Combined Strategy" },
      { id: 4, name: "Multi SMA Williams Fractal Strategy" },
      { id: 5, name: "Fast RSI Stochastic MACD Scalping Strategy" },
      { id: 6, name: "Advanced Multi-Indicator Breakout Strategy" },
      { id: 7, name: "Fast EMA Trend Reversal Strategy" },
      { id: 8, name: "MACD Bollinger Breakout Strategy" },
      { id: 9, name: "Bollinger Bands & Stochastic Breakout Scalper" },
      { id: 10, name: "RSI Stochastic SMA Confluence Strategy" },
      { id: 11, name: "1-Minute Trend Confirmation" },
      { id: 12, name: "RSI divergence" },
      { id: 13, name: " Donchian Channels, Anchored VWAP, Ichimoku Cloud, and Fibonacci retracements." },
      { id: 14, name: "Moving Average Scalper (Quick-EMA)" },
      { id: 15, name: "Stochastic Momentum" },
      { id: 16, name: "Multi-Indicator Breakout" },
      { id: 17, name: "Triangle Pattern Strategy" },
      { id: 18, name: "Flag Pattern Strategy" },
      { id: 19, name: "Candlesticks patten" }
    ],
  });
});


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
  { interval: "1", unit: "hour" },
  { interval: "4", unit: "hour" }
];

async function analyzeTimeframe(timeframe, unit) {
  try {
    const marketData = await fetchMarketData(timeframe, unit);
    const signals = await initializeStrategies(marketData);
    const counts = countSignals(signals);

    return {
      timeframe: `${timeframe}${unit.charAt(0)}`,
      signals: counts
    };
  } catch (error) {
    console.error(`Error analyzing ${timeframe}${unit} timeframe:`, error);
    return null;
  }
}

// Add this after your other routes
addAutomatedAnalysisRoutes(app);

app.get("/api/multi-timeframe-analysis", async (req, res) => {
  try {
    const results = await Promise.all(
      TIMEFRAMES.map(({ interval, unit }) => analyzeTimeframe(interval, unit))
    );

    const validResults = results.filter(result => result !== null);

    // Calculate overall totals
    const overall = validResults.reduce((acc, result) => {
      acc.BUY += result.signals.BUY;
      acc.SELL += result.signals.SELL;
      acc.WAIT += result.signals.WAIT;
      return acc;
    }, { BUY: 0, SELL: 0, WAIT: 0 });

    res.json({
      timeframes: validResults,
      overall,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Error in timeframe analysis:", error);
    res.status(500).json({
      error: "Failed to perform timeframe analysis"
    });
  }
});

app.get("/api/analysis/history/:year/:month", async (req, res) => {
  try {
    const { year, month } = req.params;
    const filePath = path.join(__dirname, "majorityHistory", `${year}-${month}.json`);

    try {
      const data = await fs.readFile(filePath, 'utf8');
      const historyData = JSON.parse(data);
      res.json(historyData);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // If file doesn't exist, return empty array
        res.json([]);
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error("Error fetching monthly history:", error);
    res.status(500).json({ error: "Failed to fetch monthly history data" });
  }
});


async function readHistoryFile() {
  try {
    const data = await fs.readFile(HISTORY_FILE_PATH, "utf8");
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

app.get("/api/history", async (req, res) => {
  try {
    const history = await readHistoryFile();
    res.json(history);
  } catch (error) {
    logger.error("Error reading history:", error);
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

io.on("connection", (socket) => {
  logger.info("Client connected");

  activeClients.set(socket.id, {
    timeframe: "1",
    selectedTimes: "minute",
    strategyId: null,
    lastUpdate: Date.now(),
  });

  socket.on("requestAnalysis", async ({ strategyId, timeframe, selectedTimes }) => {
    try {
      activeClients.set(socket.id, {
        timeframe,
        selectedTimes,
        strategyId,
        lastUpdate: Date.now(),
      });

      const data = await fetchMarketData(timeframe, selectedTimes);
      const signals = await initializeStrategies(data);
      socket.emit("analysisResult", { data, signals });
    } catch (error) {
      logger.error("Error performing analysis:", error);
      socket.emit("analysisError", { message: "Failed to perform analysis" });
    }
  });

  socket.on("disconnect", () => {
    activeClients.delete(socket.id);
    logger.info("Client disconnected");
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  // Import and start trading system only after server is fully initialized
  // startTradingSystem();
  // startAutomatedAnalysis();
});