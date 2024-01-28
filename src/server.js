import express, { json } from "express";
import "dotenv/config";
import cors from "cors";
import predictRouter from "./api/predict/router.js";
import usersRouter from "./api/users/router.js";
import authRouter from "./api/auth/router.js";
import errorHandler from "./middleware/errorHandler.js";

export default function server() {
  const PORT = process.env.PORT || 3000;
  const HOST = process.env.HOST || "localhost";
  const PROTOCOL = process.env.PROTOCOL || "http";
  const BASE_URL = `${PROTOCOL}://${HOST}:${PORT}`;

  const app = express();

  app.use(`/public`, express.static("./public")); // from root directory

  app.use(cors());
  app.use(json());

  app.use(predictRouter);
  app.use(usersRouter);
  app.use(authRouter);

  app.all("*", (req, res) => {
    res.status(404).json({
      message: "Not found",
    });
  });

  app.use(errorHandler);

  app.listen(PORT, HOST, async () => {
    console.log(`server run on ${BASE_URL}`);

    const baseURL = `${BASE_URL}`;

    fetch(`${baseURL}/load-model?modelURL=${baseURL}/public/model-ml/model.json`);
  });
}
