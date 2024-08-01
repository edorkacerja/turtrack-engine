require('dotenv').config();
const express = require("express");
const cors = require("cors");

const routesV1 = require("./routes/v1");
const MetadataManager = require("./managers/MetadataManager");
const { initializeProducer } = require("./utils/kafkaUtil");
const { startConsumer } = require("./kafka-consumers/pricingScraperConsumer");

const port = process.env.PORT || 5011;

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

async function startServer() {
  try {
    // Initialize MetadataManager
    await MetadataManager.init();
    MetadataManager.sync(5000);

    // Initialize Kafka producer
    await initializeProducer();

    // Start the availability scraper consumer
    await startConsumer();

    // Set up routes
    app.use("/api/v1", routesV1);

    app.get("/", (req, res) => {
      res.send(`Server started on port ${port}`);
    });

    // Start the server
    app.listen(port, () => console.log(`Server started on port ${port}`));
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();