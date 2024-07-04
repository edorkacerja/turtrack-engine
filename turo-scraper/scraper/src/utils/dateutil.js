const datefns = require("date-fns");

function now() {
  return datefns.format(new Date(), "yyyy-MM-dd");
}

// first date is greater than second date
function isBeforeToday(dateStr) {
  if(!dateStr) return true;

  const date1 = datefns.parse(dateStr, "yyyy-MM-dd", new Date());
  const date2 = new Date();

  return datefns.isAfter(date1, date2);
}

module.exports = {
  now,
  isBeforeToday,
};
