import { loadLayersModel, browser, scalar, dispose } from "@tensorflow/tfjs";
import { createCanvas, loadImage } from "canvas";
import roboflow  from "roboflow";
import { writeFileSync, createWriteStream, unlinkSync } from "fs";

const API_KEY = process.env.ROBOFLOW_API_KEY;
const MODEL_URL = process.env.ROBOFLOW_MODEL_URL;

class ML {
  constructor() {
    this.model = null;
    this.modelLoaded = false;
  }

  /**
   * @param {string} modelURL
   * @returns {Promise<void>}
   */
  async loadModel(modelURL) {
    console.log("Loading model...");
    console.log(modelURL);
    this.model = await loadLayersModel(modelURL);

    console.log("Model loaded!");
    this.modelLoaded = true;
  }

  /**
   *
   * @param {Buffer} imgBuffer
   * @returns {Promise<string>}
   */
  async saveImage(imgBuffer) {
    const name = Math.floor(new Date().getTime() / 1000);

    const imgPath = `public/upload/${name}.png`;

    await writeFileSync(`./${imgPath}`, imgBuffer);

    return imgPath;
  }

  /**
   *
   * @param {string} imgPath
   * @returns {Promise<Object>}
   */
  async predictYOLO(imgPath) {
    const result = await roboflow.classify(`./${imgPath}`, MODEL_URL, API_KEY, {
      confidence: 70,
      oferlap: 30,
    });

    return result;
  }

  /**
   *
   * @param {string} imgPath
   * @param {Array<Object>} predictions - result of predictions from Roboflow
   * @returns {Promise<Array<Object>>} - result of predictions with imagePath
   */
  async cropImageFromYOLO(imgPath, predictions) {
    const image = await loadImage(`./${imgPath}`);
    const imageName = imgPath.split("/")[2].split(".")[0];

    for (let index = 0; index < predictions.length; index++) {
      const prediction = predictions[index];
      const centerX = prediction.x;
      const centerY = prediction.y;
      const width = prediction.width;
      const height = prediction.height;

      // Calculate the top-left corner of the crop
      const x = centerX - width / 2;
      const y = centerY - height / 2;

      // Create a canvas for each crop
      const cropCanvas = createCanvas(width, height);
      const cropContext = cropCanvas.getContext("2d");

      // Crop the image to a circle
      cropContext.arc(
        width / 2,
        height / 2,
        Math.min(width, height) / 2,
        0,
        Math.PI * 2,
        true
      );
      cropContext.clip();

      cropContext.drawImage(image, x, y, width, height, 0, 0, width, height);

      // Save the cropped image to a file
      const outputImagePath = `./temp/${imageName}_${index}.jpg`;
      const output = createWriteStream(outputImagePath);
      const stream = cropCanvas.createJPEGStream();
      await new Promise((resolve, reject) => {
        stream.pipe(output);
        output.on("finish", resolve);
        output.on("error", reject);
      });

      prediction.imagePath = outputImagePath;
    }

    return predictions;
  }

  /**
   * @param {Array<Object>} predictions
   * @returns {Promise<string>}
   */
  async predictCNN(predictions) {
    for (let index = 0; index < predictions.length; index++) {
      console.log(`Predicting image ${index + 1}...`);

      const prediction = predictions[index];
      const img = await loadImage(prediction.imagePath);

      const canvas = createCanvas(img.width, img.height);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, img.width, img.height);

      const inputTensor = browser
        .fromPixels(canvas)
        .resizeNearestNeighbor([90, 90])
        .toFloat()
        .div(scalar(255))
        .expandDims();

      // Perform prediction
      const cnnPredictions = await this.model.predict(inputTensor);

      // Convert the prediction result to a JavaScript array
      const predictionsArray = await cnnPredictions.data();

      // Make sure to clean up
      dispose([inputTensor, cnnPredictions]);

      const label = ["s0", "s1", "s2", "s3", "s4"];

      const cnnResult = {
        label: label[predictionsArray.indexOf(Math.max(...predictionsArray))],
        confidence: Math.max(...predictionsArray),
      };

      console.log(cnnResult);

      predictions[index].cnn = cnnResult;
    }

    return predictions;
  }

  async drawBoundingBoxes(imgPath, predictions) {
    // Load the image on which you want to draw boxes
    const image = await loadImage(`./${imgPath}`);

    // Create a canvas to draw on
    const canvas = createCanvas(image.width, image.height);
    const context = canvas.getContext("2d");
    context.drawImage(image, 0, 0);

    for (let i = 0; i < predictions.length; i++) {
      const prediction = predictions[i];
      const x = prediction.x;
      const y = prediction.y;
      const width = prediction.width;
      const height = prediction.height;

      // Calculate the center point
      const centerX = x + width / 2;
      const centerY = y + height / 2;

      // Calculate half-width and half-height for the bounding box
      const halfWidth = width / 2;
      const halfHeight = height / 2;

      // Set the style for the bounding box
      context.strokeStyle = "red";
      context.lineWidth = 2;

      // Draw the bounding box with the center point
      context.strokeRect(x - halfWidth, y - halfHeight, width, height);

      // Draw the label background
      context.fillStyle = "red";
      context.font = "24px Arial";
      let textWidth = context.measureText(prediction.cnn.label).width;
      context.fillRect(x - halfWidth, y - halfHeight - 30, textWidth + 10, 30);

      // write the label
      context.fillStyle = "white";
      context.font = "28px Arial";
      context.fillText(prediction.cnn.label, x - halfWidth, y - halfHeight);
    }

    const outputPath = imgPath.replace("upload", "result");

    // Save the image with bounding boxes
    const outputImage = createWriteStream(outputPath); // Gantilah dengan path gambar keluaran
    canvas.createPNGStream().pipe(outputImage);

    return outputPath;
  }
  
  /**
   * @param {Array<Object>} predictions
   * @returns {void}
   */
  cleanUp(predictions) {
    predictions.forEach((prediction) => {
      unlinkSync(prediction.imagePath);
    });
  }

  /**
   * @param {string} name 
   * @returns {void}
   */
  deletePrediction(name) {
    const imgPath = `public/upload/${name}.png`;
    const resultPath = `public/result/${name}.png`;

    unlinkSync(imgPath);
    unlinkSync(resultPath);
  }
}

export default ML;
