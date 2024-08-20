const datefns = require("date-fns");

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

const getRandomDelay = () => {
  return Math.random() * (1200 - 1100) + 1100; // Random number between 1100 and 1200 ms
};


function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}



module.exports = {
  sleep,
  getRandomDelay,
  getRandomInt
};
