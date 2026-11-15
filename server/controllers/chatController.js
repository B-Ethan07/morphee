import { OLLAMA_URL, MODEL } from "../config.js";
import {
  buildPromptProfile,
  sanitizeHistory,
} from "../services/promptBuilder.js";
import {
  addMessage,
  createSession,
  getRecentMessages,
  getSession,
  getProfileById,
  saveProfile,
} from "../database.js";

export async function chatController(req, res) {
  const {
    sessionId: requestedSessionId,
    profileId,
    message,
    model = MODEL,
    length = "normal",
    profile = {},
  } = req.body ?? {};
  if (typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ error: "Le champ 'message' est requis." });
  }

  const selectedProfile =
    typeof profileId === "string" && getProfileById(profileId)
      ? getProfileById(profileId)
      : profile;
  const savedProfileId = saveProfile(selectedProfile, profileId);
  const sessionId =
    typeof requestedSessionId === "string" && getSession(requestedSessionId)
      ? requestedSessionId
      : createSession(selectedProfile, savedProfileId, requestedSessionId);
  addMessage(sessionId, "user", message.trim());

  const { systemMessage, technical, think } = buildPromptProfile(
    selectedProfile,
    length,
  );
  const history = sanitizeHistory(getRecentMessages(sessionId));
  const controller = new AbortController();
  res.on("close", () => controller.abort());
  const send = (event) => res.write(JSON.stringify(event) + "\n");

  try {
    const upstream = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: typeof model === "string" && model.trim() ? model.trim() : MODEL,
        messages: [{ role: "system", content: systemMessage }, ...history],
        stream: true,
        think,
        keep_alive: "5m",
        options: technical,
      }),
      signal: controller.signal,
    });

    if (!upstream.ok) {
      const errorText = await upstream.text();
      return res.status(502).json({ error: `Ollama a répondu : ${errorText}` });
    }

    res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    const decoder = new TextDecoder();
    let buffer = "";
    let assistantContent = "";

    for await (const chunk of upstream.body) {
      buffer += decoder.decode(chunk, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop();
      for (const line of lines) {
        if (!line.trim()) continue;
        const data = JSON.parse(line);
        if (data.error) throw new Error(data.error);
        if (data.message?.content) {
          assistantContent += data.message.content;
          send({ type: "token", content: data.message.content });
        }
        if (data.done)
          send({ type: "done", truncated: data.done_reason === "length" });
      }
    }
    if (assistantContent) addMessage(sessionId, "assistant", assistantContent);
    res.end();
  } catch (error) {
    if (error.name === "AbortError") return;
    const message =
      error.cause?.code === "ECONNREFUSED"
        ? "Ollama n'est pas lancé (http://localhost:11434)."
        : error.message;
    if (!res.headersSent) return res.status(500).json({ error: message });
    send({ type: "error", message });
    res.end();
  }
}
