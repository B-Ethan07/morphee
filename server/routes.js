import { Router } from "express";
import { MODEL } from "./config.js";
import { chatController } from "./controllers/chatController.js";

const router = Router();

router.get("/config", (_req, res) => res.json({ model: MODEL }));
router.post("/chat", chatController);

export default router;
