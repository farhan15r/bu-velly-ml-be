import { Router } from "express";
import handler from "./handler.js";

const router = Router();

router.post("/users", handler.postUsers);

export default router;