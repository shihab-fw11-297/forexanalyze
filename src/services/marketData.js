const axios = require('axios');
const moment = require('moment');

async function fetchMarketData(timeframe, days = 10) {
  // Set the start date to the last "days" and end date to now
  const startDate = moment().subtract(5, 'days').format('YYYY-MM-DD');
  const endDate = moment().add(1, 'days').format('YYYY-MM-DD');
  const pair = 'XAUUSD'; // Default pair

  console.log("Fetching data with timeframe:", timeframe, "from:", startDate, "to:", endDate);

  try {
    // Construct the API URL dynamically based on timeframe
    let url = `https://api.finage.co.uk/agg/forex/${pair}/${timeframe}/minute/${startDate}/${endDate}?apikey=API_KEY91Q0BICK311XSUEPKUBXPM6KCEYB0BEW&limit=7000`;

    console.log("API URL:", url);

    const response = await axios.get(url);

    if (!response.data || !response.data.results) {
      throw new Error("No data returned from API");
    }

    return transformData(response.data.results);
  } catch (error) {
    throw new Error(`Failed to fetch market data: ${error.message}`);
  }
}

function transformData(rawData) {
  // Transform the raw data into the format needed by technical indicators
  return {
    close: rawData.map(d => d.c),
    open: rawData.map(d => d.o),
    high: rawData.map(d => d.h),
    low: rawData.map(d => d.l),
    volume: rawData.map(d => d.v),
    timestamp: rawData.map(d => d.t)
  };
}

module.exports = { fetchMarketData };
