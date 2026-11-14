import { onMounted, ref } from "vue";
import type { Length, Message, Profile, StreamEvent } from "../types";

export function useChat() {
  const messages = ref<Message[]>([]);
  const loading = ref(false);
  const currentSessionId = ref<string | null>(null);
  let sessionId: string = crypto.randomUUID();
  let controller: AbortController | null = null;

  async function loadSession(id: string) {
    try {
      const res = await fetch(`/api/sessions/${id}`);
      if (!res.ok) return null;
      const data = (await res.json()) as {
        id: string;
        profileId: string;
        profile: Profile;
        messages: Message[];
      };
      sessionId = data.id;
      currentSessionId.value = data.id;
      messages.value = data.messages.filter((message) => message.content);
      return { profileId: data.profileId, profile: data.profile };
    } catch {
      return null;
    }
  }

  onMounted(async () => {
    try {
      const res = await fetch("/api/sessions/latest");
      if (!res.ok) return;
      const data = (await res.json()) as {
        sessionId: string | null;
        messages: Message[];
      };
      if (data.sessionId) {
        sessionId = data.sessionId;
        currentSessionId.value = data.sessionId;
        messages.value = data.messages.filter((message) => message.content);
      }
    } catch {
      // Serveur éteint : la conversation démarre vide.
    }
  });

  async function send(
    text: string,
    length: Length,
    profile: Profile,
    profileId: string,
  ) {
    text = text.trim();
    if (!text || loading.value) return;

    messages.value.push({ role: "user", content: text });
    messages.value.push({ role: "assistant", content: "" });
    // On récupère l'objet réactif pour que l'affichage suive le streaming
    const reply = messages.value[messages.value.length - 1];

    loading.value = true;
    currentSessionId.value = sessionId;
    controller = new AbortController();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          message: text,
          length,
          profileId,
          profile,
        }),
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
    if (currentSessionId.value) {
      void fetch(`/api/sessions/${currentSessionId.value}`, {
        method: "DELETE",
      });
    }
    sessionId = crypto.randomUUID();
    currentSessionId.value = null;
    messages.value = [];
  }

  return {
    messages,
    loading,
    currentSessionId,
    send,
    stop,
    reset,
    loadSession,
  };
}
