<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import ChatPage from "./components/ChatPage.vue";
import ProfilePage from "./components/ProfilePage.vue";
import { useChat } from "./composables/useChat";
import { loadProfile } from "./profile";
import type { Profile } from "./types";

type Page = "chat" | "profile";

const { messages, loading, send, stop, reset } = useChat();
const page = ref<Page>("chat");
const model = ref("");
const profile = ref<Profile>(loadProfile());

watch(profile, (value) => localStorage.setItem("chat-profile", JSON.stringify(value)), { deep: true });

function ask(text: string) {
    send(text, profile.value.length, { ...profile.value });
    page.value = "chat";
}

onMounted(async () => {
    try {
        const res = await fetch("/api/config");
        model.value = (await res.json()).model;
    } catch {
        // Serveur éteint : le modèle reste masqué.
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
            <ProfilePage v-else v-model="profile" :loading="loading" />
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
