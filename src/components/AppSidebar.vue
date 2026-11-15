<script setup lang="ts">
import { faPlus } from "@fortawesome/free-solid-svg-icons";
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
            <img class="brand-mark" src="/morphee-logo.svg" alt="" width="15" height="15" />
            <strong>Morphée</strong>
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
    padding: 16px 12px;
    border-right: 1px solid var(--border);
    background: linear-gradient(180deg, var(--panel), var(--bg));
}

.brand {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 6px 16px;
}

.brand-mark {
    width: 25px;
    height: 25px;
}

.brand strong {
    font-size: 13px;
}

.new-chat {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
    padding: 8px;
    border-radius: 8px;
    background: transparent;
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
    background: #fbbf24;
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
