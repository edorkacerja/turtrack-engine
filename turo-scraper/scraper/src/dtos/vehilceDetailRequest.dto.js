const BaseScraperRequest = require("./BaseScraperRequest");
const datefns = require("date-fns");

class VehicleDetailRequest extends BaseScraperRequest {
  constructor(config) {
    super(config);

    this.startAt = config?.startAt ?? 0;
    this.limit = config?.limit ?? Infinity;

    const today = new Date();
    const formattedToday = datefns.format(today, "MM/dd/yyyy");

    const dateAfter7Days = datefns.addDays(today, 7);
    const formattedDateAfter7Days = datefns.format(dateAfter7Days, "MM/dd/yyyy");

    this.startDate = config?.startDate ?? formattedToday;
    this.endDate = config?.endDate ?? formattedDateAfter7Days;

    const currentTime = datefns.format(new Date(), "HH:mm");

    this.startTime = config?.startTime ?? currentTime;
    this.endTime = config?.endTime ?? currentTime;
  }
}

module.exports = VehicleDetailRequest;
