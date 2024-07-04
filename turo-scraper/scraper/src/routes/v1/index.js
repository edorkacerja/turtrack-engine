const express = require("express");
const router = express.Router();
const scraperRoutes = require("./scraper.routes");

router.use("/scraper", scraperRoutes);

module.exports = router;
