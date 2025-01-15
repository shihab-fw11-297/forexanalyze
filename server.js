// server.js
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");
const { initializeStrategies } = require("./src/strategies");
const { setupLogging } = require("./src/utils/logger");
const { fetchMarketData } = require("./src/services/marketData");
const fs = require("fs").promises;

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
      { id: 1, name: "EMA Crossover Strategy" },
      { id: 2, name: "MA Breakout Strategy" },
      { id: 4, name: "Smoothed Moving Average Scalping Strategy" },
      { id: 5, name: "High-Frequency EMA Scalping Strategy" },
      { id: 6, name: "Scalping Strategy" },
      { id: 7, name: "Breakout Strategy" },
      { id: 8, name: "Momentum Strategy" },
      { id: 9, name: "Range Trading Strategy" },
      { id: 10, name: "EMA RSI MACD Trend Reversal Strategy" },
      { id: 11, name: "MACD Bollinger Bands Breakout Strategy" },
      { id: 12, name: "RSI Stochastic MA Crossover Strategy" },
      { id: 13, name: "Fibonacci RSI ADX Strategy" },
      { id: 14, name: "Pin Bar + RSI + MACD Reversal Strategy" },
      { id: 15, name: "Stochastic Oscillator + RSI Divergence + EMA Trend Confirmation Strategy" },
      { id: 16, name: "ADX + RSI + Fibonacci Extension MACD Confirmation"}
    ],
  });
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
  logger.info(`Server running on port ${PORT}`);
  
  // Import and start trading system only after server is fully initialized
  const { startTradingSystem } = require('./src/automatedTrading');
  // startTradingSystem();
});