const express = require("express");
const router = express.Router();

const scraperController = require("../../controllers/scraper.controller");

router.post("/calibrate", scraperController.calibrate);
router.post("/search", scraperController.search);
router.post("/daily_pricing", scraperController.dailyPricing);
router.post("/vehicle_detail", scraperController.vehicleDetail);
router.post("/clear_database", scraperController.clearDatabase);

router.get("/stop_all", scraperController.stopAll);
router.get("/database_size", scraperController.getDatabaseSize);

module.exports = router;
