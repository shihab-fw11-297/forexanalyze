const axios = require('axios');
const moment = require('moment');

async function fetchMarketData(timeframe, days = 10) {
  // Set the start date to fetch enough data to get approximately 5000 points
  let startDate;
  const endDate = moment().add(1, 'days').format('YYYY-MM-DD');
  const pair = 'XAUUSD'; // Default pair

  // Calculate start date based on timeframe to get roughly 5000 data points
  // Assuming trading hours and timeframe intervals
  switch(timeframe) {
    case '1': // 1 minute
      startDate = moment().subtract(3, 'days').format('YYYY-MM-DD'); // Around 1440 minutes per day
      break;
    case '5': // 5 minutes
      startDate = moment().subtract(5, 'days').format('YYYY-MM-DD'); // Around 288 5-min intervals per day
      break;
    case '15': // 15 minutes
      startDate = moment().subtract(8, 'days').format('YYYY-MM-DD'); // Around 96 15-min intervals per day
      break;
    case '30': // 30 minutes
      startDate = moment().subtract(15, 'days').format('YYYY-MM-DD'); // Around 48 30-min intervals per day
      break;
    case '60': // 1 hour
      startDate = moment().subtract(30, 'days').format('YYYY-MM-DD'); // Around 24 1-hour intervals per day
      break;
    default:
      startDate = moment().subtract(5, 'days').format('YYYY-MM-DD');
  }

  console.log("Fetching data with timeframe:", timeframe, "from:", startDate, "to:", endDate);

  try {
    // Construct the API URL dynamically based on timeframe
    let url = `https://api.finage.co.uk/agg/forex/${pair}/${timeframe}/minute/${startDate}/${endDate}?apikey=API_KEY3fY0TJDF1K08KRSJJA81R2K8OUSNYC7V&limit=25000`;

    console.log("API URL:", url);

    const response = await axios.get(url);

    if (!response.data || !response.data.results) {
      throw new Error("No data returned from API");
    }

    // If we get more than 5000 points, slice to get the most recent 5000
    let results = response.data.results;
    if (results.length > 5000) {
      results = results.slice(-5000);
    }

    return transformData(results);
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