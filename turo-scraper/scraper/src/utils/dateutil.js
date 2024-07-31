const datefns = require("date-fns");

function now() {
  return datefns.format(new Date(), "yyyy/MM/dd");
}

function isBeforeToday(dateStr) {
  if(!dateStr) return true;

  const date1 = datefns.parse(dateStr, "yyyy/MM/dd", new Date());
  const date2 = new Date();

  return datefns.isAfter(date1, date2);
}

function addDays(date, days) {
  return datefns.format(datefns.addDays(date, days), "yyyy/MM/dd");
}


module.exports = {
  now,
  isBeforeToday,
  addDays
};