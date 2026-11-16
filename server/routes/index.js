import { Router } from "express";
import { MODEL, OLLAMA_URL } from "../config/config.js";
import {
  listDocuments,
  uploadDocument,
  uploadDocumentMiddleware,
} from "../controllers/documentController.js";
import { chatController } from "../controllers/chatController.js";
import {
  deleteProfile,
  deleteSession,
  getLatestSession,
  getMessages,
  getProfile,
  getProfileById,
  getSessionDetails,
  listSessions,
  listProfiles,
  saveProfile,
} from "../config/database.js";

const router = Router();

router.get("/config", (_req, res) => res.json({ model: MODEL }));
router.get("/models", async (_req, res) => {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`);
    if (!response.ok) {
      const errorText = await response.text();
      return res.status(502).json({ error: `Ollama a répondu : ${errorText}` });
    }
    const data = await response.json();
    const models = Array.isArray(data.models)
      ? data.models
          .map((model) => (typeof model?.name === "string" ? model.name : ""))
          .filter(Boolean)
      : [];
    return res.json({ models });
  } catch (error) {
    const message =
      error.cause?.code === "ECONNREFUSED"
        ? "Ollama n'est pas lancé (http://localhost:11434)."
        : error.message;
    return res.status(502).json({ error: message });
  }
});
router.get("/profile", (_req, res) => res.json(getProfile()));
router.get("/profiles", (_req, res) => res.json(listProfiles()));
router.post("/profiles", (req, res) => {
  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({ error: "Profil invalide." });
  }
  const id = saveProfile(req.body);
  return res.status(201).json({ id, profile: req.body });
});
router.put("/profiles/:id", (req, res) => {
  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({ error: "Profil invalide." });
  }
  const id = saveProfile(req.body, req.params.id);
  return res.json({ id, profile: req.body });
});
router.delete("/profiles/:id", (req, res) => {
  if (!deleteProfile(req.params.id)) {
    return res.status(409).json({
      error: "Ce profil est utilisé par une session ou n'existe pas.",
    });
  }
  return res.status(204).end();
});
router.put("/profile", (req, res) => {
  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({ error: "Profil invalide." });
  }
  saveProfile(req.body, "default");
  return res.json(req.body);
});
router.get("/sessions/latest", (_req, res) => {
  const session = getLatestSession();
  return res.json({
    sessionId: session?.id ?? null,
    profileId: session?.profileId ?? null,
    profile: session ? JSON.parse(session.profileSnapshot) : null,
    messages: session ? getMessages(session.id) : [],
  });
});
router.get("/sessions", (_req, res) => res.json(listSessions()));
router.get("/sessions/:id", (req, res) => {
  const session = getSessionDetails(req.params.id);
  if (!session) return res.status(404).json({ error: "Session introuvable." });
  return res.json(session);
});
router.delete("/sessions/:id", (req, res) => {
  deleteSession(req.params.id);
  return res.status(204).end();
});
router.post("/chat", uploadDocumentMiddleware.single("document"), chatController);
router.get("/documents", listDocuments);
router.post(
  "/documents/upload",
  uploadDocumentMiddleware.single("file"),
  uploadDocument,
);

export default router;
