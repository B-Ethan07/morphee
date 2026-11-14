import { ref, watch } from "vue";
import type { Length, Message, Profile, StreamEvent } from "../types";

const STORAGE_KEY = "chat-history";

function load(): Message[] {
  try {
    const saved: Message[] = JSON.parse(
      localStorage.getItem(STORAGE_KEY) ?? "[]",
    );
    return saved.filter((m) => m.content); // ignore les réponses vides (page fermée en plein streaming)
  } catch {
    return [];
  }
}

export function useChat() {
  const messages = ref<Message[]>(load());
  const loading = ref(false);
  let controller: AbortController | null = null;

  // Sauvegarde à la fin de chaque réponse, pas à chaque token
  watch(loading, (isLoading) => {
    if (!isLoading)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.value));
  });

  async function send(text: string, length: Length, profile: Profile) {
    text = text.trim();
    if (!text || loading.value) return;

    // Historique envoyé au serveur : sans erreurs ni réponses vides
    const history = messages.value
      .filter((m) => !m.error && m.content)
      .map(({ role, content }) => ({ role, content }));
    history.push({ role: "user", content: text });

    messages.value.push({ role: "user", content: text });
    messages.value.push({ role: "assistant", content: "" });
    // On récupère l'objet réactif pour que l'affichage suive le streaming
    const reply = messages.value[messages.value.length - 1];

    loading.value = true;
    controller = new AbortController();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, length, profile }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Erreur ${res.status}`);
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line) as StreamEvent;
          if (event.type === "token") reply.content += event.content;
          else if (event.type === "done") reply.truncated = event.truncated;
          else if (event.type === "error") throw new Error(event.message);
        }
      }
    } catch (err) {
      const error = err as Error;
      if (error.name === "AbortError") {
        // Arrêt volontaire : on retire la bulle si rien n'a été généré
        if (!reply.content) messages.value.pop();
      } else {
        reply.content = "Erreur : " + error.message;
        reply.error = true;
      }
    } finally {
      loading.value = false;
      controller = null;
    }
  }

  const stop = () => controller?.abort();

  function reset() {
    messages.value = [];
    localStorage.removeItem(STORAGE_KEY);
  }

  return { messages, loading, send, stop, reset };
}
