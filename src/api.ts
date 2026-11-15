import type { Profile, SavedProfile, SessionSummary } from "./types";

const JSON_HEADERS = { "Content-Type": "application/json" };

/** Tous les appels HTTP vers le serveur Express, au même endroit. */
export const api = {
    async getConfig(): Promise<{ model: string }> {
        const res = await fetch("/api/config");
        return (await res.json()) as { model: string };
    },

    async getModels(): Promise<string[]> {
        const res = await fetch("/api/models");
        if (!res.ok) return [];
        const data = (await res.json()) as { models?: string[] };
        return data.models ?? [];
    },

    async getProfiles(): Promise<SavedProfile[]> {
        const res = await fetch("/api/profiles");
        return (await res.json()) as SavedProfile[];
    },

    async createProfile(profile: Profile): Promise<{ id: string; profile: Profile } | null> {
        const res = await fetch("/api/profiles", {
            method: "POST",
            headers: JSON_HEADERS,
            body: JSON.stringify(profile),
        });
        return res.ok ? ((await res.json()) as { id: string; profile: Profile }) : null;
    },

    async updateProfile(id: string, profile: Profile): Promise<void> {
        try {
            await fetch(`/api/profiles/${id}`, {
                method: "PUT",
                headers: JSON_HEADERS,
                body: JSON.stringify(profile),
            });
        } catch {
            // Serveur éteint : la sauvegarde sera retentée à la prochaine modification.
        }
    },

    async deleteProfile(id: string): Promise<boolean> {
        const res = await fetch(`/api/profiles/${id}`, { method: "DELETE" });
        return res.ok;
    },

    async getSessions(): Promise<SessionSummary[] | null> {
        const res = await fetch("/api/sessions");
        return res.ok ? ((await res.json()) as SessionSummary[]) : null;
    },

    async deleteSession(id: string): Promise<void> {
        await fetch(`/api/sessions/${id}`, { method: "DELETE" });
    },
};
