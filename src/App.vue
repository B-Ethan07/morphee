<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import ChatPage from "./components/ChatPage.vue";
import ProfilePage from "./components/ProfilePage.vue";
import { useChat } from "./composables/useChat";
import { defaultProfile } from "./profile";
import type { Profile, SavedProfile } from "./types";

type Page = "chat" | "profile";

const { messages, loading, send, stop, reset } = useChat();
const page = ref<Page>("chat");
const model = ref("");
const profile = ref<Profile>({ ...defaultProfile });
const profiles = ref<SavedProfile[]>([]);
const profileId = ref("");
const profileLoaded = ref(false);

watch(
    profile,
    (value) => {
        if (profileLoaded.value) {
            if (!profileId.value) return;
            void fetch(`/api/profiles/${profileId.value}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(value),
            });
            const index = profiles.value.findIndex((item) => item.id === profileId.value);
            if (index >= 0) {
                profiles.value[index] = {
                    ...profiles.value[index],
                    name: value.name,
                    mode: value.mode,
                    profile: { ...value },
                    updatedAt: new Date().toISOString(),
                };
            }
        }
    },
    { deep: true },
);

function ask(text: string) {
    send(text, profile.value.length, { ...profile.value }, profileId.value);
    page.value = "chat";
}

function selectProfile(id: string) {
    const saved = profiles.value.find((item) => item.id === id);
    if (!saved || saved.id === profileId.value) return;
    reset();
    profileId.value = saved.id;
    profile.value = { ...saved.profile };
}

async function createProfile() {
    const newProfile: Profile = {
        ...defaultProfile,
        mode: "rp",
        name: "Nouveau profil RP",
        rpCharacter: "",
        rpScene: "",
        rpRelationship: "",
        rpRules: "",
    };
    const res = await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProfile),
    });
    if (!res.ok) return;
    const saved = (await res.json()) as { id: string; profile: Profile };
    profiles.value.unshift({
        id: saved.id,
        name: saved.profile.name,
        mode: saved.profile.mode,
        profile: saved.profile,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    });
    reset();
    profileId.value = saved.id;
    profile.value = { ...saved.profile };
}

async function removeProfile(id: string) {
    if (profiles.value.length <= 1) return;
    const res = await fetch(`/api/profiles/${id}`, { method: "DELETE" });
    if (!res.ok) return;
    profiles.value = profiles.value.filter((item) => item.id !== id);
    if (id === profileId.value) {
        const next = profiles.value[0];
        profileId.value = next.id;
        profile.value = { ...next.profile };
        reset();
    }
}

onMounted(async () => {
    try {
        const [configRes, profilesRes] = await Promise.all([
            fetch("/api/config"),
            fetch("/api/profiles"),
        ]);
        model.value = (await configRes.json()).model;
        profiles.value = (await profilesRes.json()) as SavedProfile[];
        if (!profiles.value.length) await createProfile();
        else {
            const saved = profiles.value[0];
            profileId.value = saved.id;
            profile.value = { ...saved.profile };
        }
    } catch {
        // Serveur éteint : le modèle reste masqué.
    } finally {
        profileLoaded.value = true;
    }
});
</script>

<template>
    <div class="app-shell">
        <aside class="sidebar">
            <div class="brand"><span class="brand-mark">✦</span>
                <div><strong>Morphée</strong><small>Atelier LLM</small></div>
            </div>
            <nav aria-label="Navigation principale">
                <button :class="{ active: page === 'chat' }" @click="page = 'chat'"><span>◌</span> Conversation</button>
                <button :class="{ active: page === 'profile' }" @click="page = 'profile'"><span>◈</span> Profil du
                    LLM</button>
            </nav>
            <div class="sidebar-footer"><span class="status-dot"></span><span>{{ model || "Serveur local" }}</span>
            </div>
        </aside>

        <div class="workspace">
            <ChatPage v-if="page === 'chat'" v-model:profile="profile" :messages="messages" :loading="loading"
                @send="ask" @stop="stop" @reset="reset" />
            <ProfilePage v-else v-model="profile" :loading="loading" :profiles="profiles"
                :profile-id="profileId" @select-profile="selectProfile" @new-profile="createProfile"
                @delete-profile="removeProfile" />
        </div>
    </div>
</template>

<style scoped>
.app-shell {
    display: flex;
    height: 100%;
}

.sidebar {
    width: 220px;
    flex: none;
    display: flex;
    flex-direction: column;
    padding: 22px 14px;
    border-right: 1px solid var(--border);
    background: var(--panel);
}

.brand {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 8px 26px;
}

.brand-mark {
    display: grid;
    width: 30px;
    height: 30px;
    place-items: center;
    border-radius: 9px;
    background: var(--accent);
    color: #fff;
}

.brand strong,
.brand small {
    display: block;
}

.brand strong {
    font-size: 14px;
}

.brand small {
    color: var(--muted);
    font-size: 11px;
}

nav {
    display: grid;
    gap: 5px;
}

nav button {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px;
    background: transparent;
    color: var(--muted);
    text-align: left;
}

nav button span {
    width: 18px;
    color: var(--muted);
    text-align: center;
}

nav button:hover,
nav button.active {
    background: var(--panel-2);
    color: var(--text);
}

nav button.active span {
    color: var(--accent);
}

.sidebar-footer {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: auto;
    padding: 10px 8px;
    color: var(--muted);
    font-size: 11px;
}

.status-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #64c27b;
}

.workspace {
    min-width: 0;
    flex: 1;
    height: 100%;
}

@media (max-width: 650px) {
    .sidebar {
        width: 58px;
        padding: 14px 8px;
    }

    .brand {
        justify-content: center;
        padding: 0 0 22px;
    }

    .brand>div,
    nav button:not(.active) {
        display: none;
    }

    nav button {
        justify-content: center;
        padding: 10px 4px;
    }

    nav button span {
        width: auto;
    }

    .sidebar-footer {
        justify-content: center;
        padding: 10px 0;
    }

    .sidebar-footer span:last-child {
        display: none;
    }
}
</style>
