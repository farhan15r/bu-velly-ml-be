import InvariantError from "../../exceptions/InvariantError.js";
import ML from "../../utils/ML.js";
import Convert from "../../utils/convert.js";
import Prediction from "./../../models/Prediction.js";

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
    // console.log(req.files);

    // throw new InvariantError("File must be uploaded");

    if (!ml.modelLoaded) throw new InvariantError("Model is not loaded");

    if (!req.files[0]) throw new InvariantError("File must be uploaded");

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

    ml.cleanUp(result.predictions);

    const prediction = new Prediction({
      id: convert.imgName,
      uploadUrl: `/${imgUploadPath}`,
      resultUrl: `/${imgResultPath}`,
    });
    await prediction.save();

    res.status(201).json({
      uploaded_image: `/${imgUploadPath}`,
      result_image: `/${imgResultPath}`,
    });
  } catch (error) {
    next(error);
  }
};

const getPredictById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const prediction = new Prediction();
    const predictions = await prediction.getById(id);
    res.json(predictions);
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
    res.json({
      message: "Prediction deleted",
    });
  } catch (error) {
    next(error);
  }
}

export default { checkModel, loadModel, getPredict, postPredict, getPredictById, deletePredictById };
