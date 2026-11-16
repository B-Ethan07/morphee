import { ref } from "vue";
import { api } from "../routes/api";
import type { SessionSummary } from "../types";

/** Liste des conversations enregistrées (historique). */
export function useSessions() {
  const sessions = ref<SessionSummary[]>([]);

  async function refreshSessions() {
    const list = await api.getSessions();
    if (list) sessions.value = list;
  }

  async function deleteSession(id: string) {
    await api.deleteSession(id);
  }

  return { sessions, refreshSessions, deleteSession };
}
