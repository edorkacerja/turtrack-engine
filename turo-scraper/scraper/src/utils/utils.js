const datefns = require("date-fns");
const v8 = require('v8');

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

const getRandomDelay = () => {
  return Math.random() * (1200 - 1100) + 1100; // Random number between 1100 and 1200 ms
};


function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}



function logMemoryUsage() {
  const memoryUsage = process.memoryUsage();
  const heapStats = v8.getHeapStatistics();
  console.log('Memory Usage:');
  console.log(`  RSS: ${memoryUsage.rss / 1024 / 1024} MB`);
  console.log(`  Heap Total: ${memoryUsage.heapTotal / 1024 / 1024} MB`);
  console.log(`  Heap Used: ${memoryUsage.heapUsed / 1024 / 1024} MB`);
  console.log(`  External: ${memoryUsage.external / 1024 / 1024} MB`);
  console.log(`  Heap Size Limit: ${heapStats.heap_size_limit / 1024 / 1024} MB`);
}



module.exports = {
  sleep,
  getRandomDelay,
  getRandomInt,
  logMemoryUsage
};
