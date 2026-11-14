import { Router } from "express";
import { MODEL } from "./config.js";
import { chatController } from "./controllers/chatController.js";
import {
	deleteSession,
	getLatestSession,
	getMessages,
	getProfile,
	saveProfile,
} from "./database.js";

const router = Router();

router.get("/config", (_req, res) => res.json({ model: MODEL }));
router.get("/profile", (_req, res) => res.json(getProfile()));
router.put("/profile", (req, res) => {
	if (!req.body || typeof req.body !== "object") {
		return res.status(400).json({ error: "Profil invalide." });
	}
	saveProfile(req.body);
	return res.json(req.body);
});
router.get("/sessions/latest", (_req, res) => {
	const session = getLatestSession();
	return res.json({
		sessionId: session?.id ?? null,
		messages: session ? getMessages(session.id) : [],
	});
});
router.delete("/sessions/:id", (req, res) => {
	deleteSession(req.params.id);
	return res.status(204).end();
});
router.post("/chat", chatController);

export default router;
