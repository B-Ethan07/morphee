import { OLLAMA_URL, MODEL } from "../config/config.js";
import { chunkText, parseBuffer } from "../services/documentService.js";
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
  hasDocumentChunks,
  saveProfile,
} from "../config/database.js";
import {
  generateQueryEmbedding,
  searchRelevantChunks,
} from "../services/vectorService.js";

export async function chatController(req, res) {
  const body = req.body ?? {};
  let requestProfile = body.profile ?? {};
  if (typeof requestProfile === "string") {
    try {
      requestProfile = JSON.parse(requestProfile);
    } catch {
      return res.status(400).json({ error: "Profil invalide." });
    }
  }
  const {
    sessionId: requestedSessionId,
    profileId,
    message,
    model = MODEL,
    length = "normal",
  } = body;
  const selectedModel =
    typeof model === "string" && model.trim() ? model.trim() : MODEL;
  if (typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ error: "Le champ 'message' est requis." });
  }

  const selectedProfile =
    typeof profileId === "string" && getProfileById(profileId)
      ? getProfileById(profileId)
      : requestProfile;
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
    let context = "";
    let sources = [];
    if (req.file) {
      const documentText = await parseBuffer(req.file.originalname, req.file.buffer);
      const chunks = chunkText(documentText);
      context = chunks.join("\n\n");
      sources = [req.file.originalname];
    } else if (hasDocumentChunks()) {
      const queryEmbedding = await generateQueryEmbedding(message.trim());
      const chunks = await searchRelevantChunks(queryEmbedding, 5);
      context = chunks.map((chunk) => chunk.content).join("\n\n");
      sources = [...new Set(chunks.map((chunk) => chunk.name))];
    }
    const finalSystemMessage = context
      ? `${systemMessage}\n\nContexte documentaire:\n${context}\n\nUtilise ce contexte pour répondre. N'invente pas de faits absents du contexte.`
      : systemMessage;

    const upstream = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: selectedModel,
        messages: [{ role: "system", content: finalSystemMessage }, ...history],
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
    if (sources.length) send({ type: "sources", sources });
    const decoder = new TextDecoder();
    let buffer = "";
    let assistantContent = "";
    let responseModel = selectedModel;
    let promptTokens;
    let completionTokens;
    for await (const chunk of upstream.body) {
      buffer += decoder.decode(chunk, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop();
      for (const line of lines) {
        if (!line.trim()) continue;
        const data = JSON.parse(line);
        if (data.error) throw new Error(data.error);
        if (typeof data.model === "string") responseModel = data.model;
        if (data.message?.content) {
          assistantContent += data.message.content;
          send({ type: "token", content: data.message.content });
        }
        if (data.done) {
          promptTokens = data.prompt_eval_count;
          completionTokens = data.eval_count;
          send({
            type: "done",
            truncated: data.done_reason === "length",
            model: responseModel,
            promptTokens,
            completionTokens,
          });
        }
      }
    }
    if (assistantContent) {
      addMessage(sessionId, "assistant", assistantContent, {
        model: responseModel,
        promptTokens,
        completionTokens,
      });
    }
    return res.end();
  } catch (error) {
    if (error.name === "AbortError") return;
    const errorMessage =
      error.cause?.code === "ECONNREFUSED"
        ? "Ollama n'est pas lancé (http://localhost:11434)."
        : error.message;
    if (!res.headersSent) return res.status(500).json({ error: errorMessage });
    send({ type: "error", message: errorMessage });
    return res.end();
  }
}
