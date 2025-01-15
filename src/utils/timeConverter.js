const moment = require('moment');

function epochToIST(epochTime) {
  return moment(epochTime)
    .utcOffset('+05:30')  // IST offset
    .format('YYYY-MM-DD HH:mm:ss [IST]');
}

module.exports = { epochToIST };