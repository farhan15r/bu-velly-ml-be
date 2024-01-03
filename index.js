import express, { json } from "express";
import "dotenv/config";
import ML from "./ml.js";
import multer from "multer";
import cors from "cors";
import bodyParser from 'body-parser';
import Convert from "./convert.js";

const upload = multer();

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "localhost";
const PROTOCOL = process.env.PROTOCOL || "http";
const BASE_URL = `${PROTOCOL}://${HOST}:${PORT}`;

const app = express();
const ml = new ML();

app.use(cors());
app.use(json());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(`/public`, express.static("./public"));

app.get("/", (req, res) => {
  res.send(`model loaded is ${ml.modelLoaded}`);
});

app.post("/predict", upload.single("image"), async (req, res) => {
  // if (!req.file.mimetype.includes("png")) {
  //   return res.status(400).json({
  //     message: "File must be png",
  //   });
  // }
  if (!req.file.mimetype.includes("tif")) {
    return res.status(400).json({
      message: "File must be tif",
    });
  }

  try {
    // const imgUploadPath = await ml.saveImage(req.file.buffer);
    const convert = new Convert(req.file.buffer);
    await convert.convertTifToPng();

    const imgUploadPath = convert.imgPathPng;

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
    `${baseURL}/public/model-ml/model.json`
  );
});
