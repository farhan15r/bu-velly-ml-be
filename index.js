const express = require("express");
require("dotenv/config");
const ML = require("./ml.js");
const multer = require("multer");
var cors = require("cors");
const bodyParser = require('body-parser');

const upload = multer();

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "localhost";
const PROTOCOL = process.env.PROTOCOL || "http";
const BASE_URL = `${PROTOCOL}://${HOST}:${PORT}`;

const app = express();
const ml = new ML();

app.use(cors());
app.use(express.json());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(`/public`, express.static("./public"));

app.get("/", (req, res) => {
  res.send(`model loaded is ${ml.modelLoaded}`);
});

app.post("/predict", upload.single("image"), async (req, res) => {
  if (!req.file.mimetype.includes("png")) {
    return res.status(400).json({
      message: "File must be png",
    });
  }

  try {
    const imgUploadPath = await ml.saveImage(req.file.buffer);
    const result = await ml.predictYOLO(imgUploadPath);
    result.predictions = await ml.cropImageFromYOLO(
      imgUploadPath,
      result.predictions
    );
    
    result.predictions = await ml.predictCNN(result.predictions);
    const imgResultPath = await ml.drawBoundingBoxes(
      imgUploadPath,
      result.predictions
    );

    ml.cleanUp(result.predictions);

    res.json({
      uploaded_image: `/${imgUploadPath}`,
      result_image: `/${imgResultPath}`,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
});

app.all("*", (req, res) => {
  res.status(404).json({
    message: "Not found",
  });
});

app.listen(PORT, HOST, async () => {
  console.log(`server run on ${BASE_URL}`);

  const baseURL = `${BASE_URL}`;

  // Load model
  await ml.loadModel(
    `https://ml-ridwan-jazgayulua-et.a.run.app/public/model-ml/model.json`
  );
});
