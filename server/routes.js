import { Router } from "express";
import { MODEL } from "./config.js";
import { chatController } from "./controllers/chatController.js";
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
} from "./database.js";

const router = Router();

router.get("/config", (_req, res) => res.json({ model: MODEL }));
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
router.post("/chat", chatController);

export default router;
