const winston = require('winston');
const path = require('path');

function setupLogging() {
  return winston.createLogger({
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    transports: [
      new winston.transports.File({
        filename: path.join(__dirname, '../../logs/signals.log'),
        level: 'info'
      }),
      new winston.transports.Console({
        format: winston.format.simple(),
        level: 'info'
      })
    ]
  });
}

function logSignal(strategyId, signal) {
  const logger = setupLogging();
  logger.info('Strategy Signal', {
    strategyId,
    signal,
    timestamp: new Date().toISOString()
  });
}

module.exports = { setupLogging, logSignal };