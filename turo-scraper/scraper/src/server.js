require('dotenv').config()
const express = require("express");
const cors = require("cors");

const routesV1 = require("./routes/v1");
const MetadataManager = require("./managers/MetadataManager");

const port = process.env.PORT || 5001;

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

MetadataManager.init();
MetadataManager.sync(5000);

app.use("/api/v1", routesV1);

app.get("/", (req, res) => {
  res.send(`Server started on port ${port}`);
});

app.listen(port, () => console.log(`Server started on port ${port}`));
