import { Router } from "express";
import handler from "./handler.js";

const router = Router();

router.post("/auth", handler.postAuth);

export default router;