<script setup lang="ts">
import type { SessionSummary } from "../types";

defineProps<{
    sessions: SessionSummary[];
    currentSessionId: string | null;
}>();

const emit = defineEmits<{
    open: [id: string];
    delete: [id: string];
}>();

function formatDate(value: string) {
    return new Intl.DateTimeFormat("fr-FR", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value));
}
</script>

<template>
    <section class="history-page">
        <header class="page-heading">
            <div>
                <p class="eyebrow">Conversations</p>
                <h2>Historique</h2>
                <p>Retrouvez vos anciennes conversations et reprenez le fil où vous l'avez laissé.</p>
            </div>
        </header>

        <div v-if="!sessions.length" class="empty-history">
            <h3>Aucune conversation enregistrée</h3>
            <p>Votre prochaine conversation apparaîtra ici.</p>
        </div>

        <div v-else class="session-list">
            <article v-for="session in sessions" :key="session.id"
                :class="['session-item', { active: session.id === currentSessionId }]">
                <button class="session-open" type="button" @click="emit('open', session.id)">
                    <strong>{{ session.title }}</strong>
                    <small>Profil : {{ session.profileName }} · {{ formatDate(session.updatedAt) }}</small>
                </button>
                <button class="session-delete" type="button" title="Supprimer la conversation"
                    @click="emit('delete', session.id)">Supprimer</button>
            </article>
        </div>
    </section>
</template>

<style scoped>
.history-page {
    max-width: 980px;
    height: 100%;
    overflow-y: auto;
    margin: 0 auto;
    padding: 28px 20px 48px;
}

.page-heading {
    margin-bottom: 22px;
}

.eyebrow {
    margin: 0 0 4px;
    color: var(--accent);
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: .08em;
}

h2,
h3 {
    margin: 0;
}

.page-heading h2 {
    font-size: 1.5rem;
}

.page-heading p:last-child,
.empty-history p {
    margin: 6px 0 0;
    color: var(--muted);
}

.empty-history {
    padding: 36px 20px;
    border: 1px dashed var(--border);
    border-radius: 12px;
    text-align: center;
}

.session-list {
    display: grid;
    gap: 10px;
}

.session-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    border: 1px solid var(--border);
    border-radius: 10px;
    background: var(--panel);
}

.session-item.active {
    border-color: var(--accent);
}

.session-open {
    display: grid;
    flex: 1;
    gap: 4px;
    min-width: 0;
    padding: 0;
    background: transparent;
    color: var(--text);
    text-align: left;
}

.session-open strong {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.session-open small {
    color: var(--muted);
    font-size: 12px;
}

.session-delete {
    flex: none;
    padding: 7px 10px;
    border: 1px solid var(--border);
    border-radius: 7px;
    background: transparent;
    color: var(--muted);
}

.session-delete:hover {
    border-color: var(--accent);
    color: var(--text);
}

@media (max-width: 600px) {
    .history-page {
        padding: 20px 14px 36px;
    }

    .session-item {
        align-items: stretch;
        flex-direction: column;
    }

    .session-delete {
        align-self: flex-start;
    }
}
</style>
