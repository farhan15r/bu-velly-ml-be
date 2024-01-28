import { Router } from "express";
import handler from "./handler.js";
import multer from "multer";
import authMiddleware from "../../middleware/authMiddleware.js";

const upload = multer();
const router = Router();

router.get("/", handler.checkModel);
router.get("/load-model", handler.loadModel);

router.get("/predict", handler.getPredict);
router.get("/predict/:id", handler.getPredictById);
router.post("/predict", [
  authMiddleware,
  upload.array("image"),
  handler.postPredict,
]);
router.delete("/predict/:id", [authMiddleware, handler.deletePredictById]);

export default router;
