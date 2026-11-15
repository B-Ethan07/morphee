<script setup lang="ts">
import { faMoon, faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import RecentSessions from "./RecentSessions.vue";
import SidebarNav from "./SidebarNav.vue";
import type { Page } from "../navigation";
import type { SessionSummary } from "../types";

defineProps<{
    page: Page;
    model: string;
    sessions: SessionSummary[];
    currentSessionId: string | null;
}>();

const emit = defineEmits<{
    navigate: [page: Page];
    "new-chat": [];
    "open-session": [id: string];
    "delete-session": [id: string];
}>();
</script>

<template>
    <aside class="sidebar">
        <div class="brand">
            <span class="brand-mark"><FontAwesomeIcon :icon="faMoon" /></span>
            <div><strong>Morphée</strong><small>Atelier LLM</small></div>
        </div>

        <button class="new-chat" type="button" title="Nouvelle conversation" @click="emit('new-chat')">
            <FontAwesomeIcon :icon="faPlus" fixed-width />
            <span class="label">Nouvelle conversation</span>
        </button>

        <SidebarNav :page="page" @navigate="emit('navigate', $event)" />

        <RecentSessions :sessions="sessions" :active-session-id="page === 'chat' ? currentSessionId : null"
            :show-all-active="page === 'history'" @open="emit('open-session', $event)"
            @delete="emit('delete-session', $event)" @show-all="emit('navigate', 'history')" />

        <div class="sidebar-footer">
            <span class="status-dot"></span>
            <span class="model-name">{{ model || "Serveur local" }}</span>
        </div>
    </aside>
</template>

<style scoped>
.sidebar {
    display: flex;
    flex: none;
    flex-direction: column;
    width: 240px;
    padding: 22px 14px;
    border-right: 1px solid var(--border);
    background: linear-gradient(180deg, rgba(26, 22, 53, .96), rgba(11, 11, 26, .92));
}

.brand {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 8px 22px;
}

.brand-mark {
    display: grid;
    width: 30px;
    height: 30px;
    place-items: center;
    border-radius: 9px;
    background: var(--accent);
    color: #fff;
    box-shadow: 0 0 22px rgba(124, 58, 237, .45);
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

.new-chat {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 14px;
    padding: 10px;
    border: 1px solid var(--border);
    border-radius: 10px;
    background: var(--panel-2);
    color: var(--text);
    text-align: left;
}

.new-chat:hover {
    border-color: var(--accent);
}

.sidebar-footer {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 12px;
    padding: 10px 8px 0;
    border-top: 1px solid var(--border);
    color: var(--muted);
    font-size: 11px;
}

.model-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.status-dot {
    flex: none;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #64c27b;
}

@media (max-width: 650px) {
    .sidebar {
        width: 58px;
        padding: 14px 8px;
    }

    .brand {
        justify-content: center;
        padding: 0 0 18px;
    }

    .brand>div,
    .new-chat .label,
    .model-name {
        display: none;
    }

    .new-chat {
        justify-content: center;
        padding: 10px 4px;
    }

    .sidebar-footer {
        justify-content: center;
    }
}
</style>
