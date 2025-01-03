import InvariantError from "../../exceptions/InvariantError.js";
import ML from "../../utils/ML.js";
import Convert from "../../utils/Convert.js";
import Prediction from "./../../models/Prediction.js";
import DistanceObject from "../../models/DistanceObject.js";
import DistanceObjects from "../../models/DistanceObjects.js";
import PredictionLabels from "../../models/PredictionLables.js";

const ml = new ML();

const checkModel = (req, res) => {
  return res.send({
    modelIsLoaded: ml.modelLoaded,
  });
};

const loadModel = (req, res, next) => {
  try {
    const modelURL = req.query.modelURL;

    ml.loadModel(modelURL);

    return res.send({
      message: "Model is loaded",
    });
  } catch (error) {
    next(error);
  }
};

const getPredict = async (req, res, next) => {
  try {
    const prediction = new Prediction();
    const predictions = await prediction.getAll();
    res.json(predictions);
  } catch (error) {
    next(error);
  }
};

const postPredict = async (req, res, next) => {
  try {
    if (!ml.modelLoaded) throw new InvariantError("Model is not loaded");

    if (!req.files || !req.files[0])
      throw new InvariantError("File must be uploaded");

    const image = req.files[0];

    if (!image.mimetype.includes("tif"))
      throw new InvariantError("File must be tif");

    const convert = new Convert(image.buffer);
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

    const predictionLabels = new PredictionLabels().transform(
      convert.imgName,
      result.predictions.map((prediction) => prediction.cnn.label)
    );
    await predictionLabels.saveAll();

    const distanceEachOthers = ml.calculateDistanceEachObjects(
      result.predictions
    );

    const distanceObjects = new DistanceObjects().transform(
      convert.imgName,
      distanceEachOthers
    );
    await distanceObjects.saveAll();

    ml.cleanUp(result.predictions);

    const prediction = new Prediction({
      id: convert.imgName,
      uploadUrl: `/${imgUploadPath}`,
      resultUrl: `/${imgResultPath}`,
    });
    await prediction.save();

    res.status(201).json({
      id: convert.imgName,
      uploadUrl: `/${imgUploadPath}`,
      resultUrl: `/${imgResultPath}`,
      distanceObjects: distanceEachOthers,
    });
  } catch (error) {
    next(error);
  }
};

const getPredictById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const prediction = new Prediction();
    await prediction.getById(id);

    const predictionLabels = (await (new PredictionLabels().getAllByPredictionId(id))).predictionLabels;

    const distanceObjects = new DistanceObjects();
    await distanceObjects.getAllByPredictionId(id);
    prediction.distanceObjects =
      distanceObjects.transformToDistanceEachOthers(predictionLabels);

    res.json(prediction);
  } catch (error) {
    next(error);
  }
};

const deletePredictById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const prediction = new Prediction();
    await prediction.getById(id);
    await prediction.delete();

    ml.deletePrediction(id);

    res.json({
      message: "Prediction deleted",
    });
  } catch (error) {
    next(error);
  }
};

export default {
  checkModel,
  loadModel,
  getPredict,
  postPredict,
  getPredictById,
  deletePredictById,
};
