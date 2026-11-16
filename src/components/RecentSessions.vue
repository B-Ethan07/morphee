<script setup lang="ts">
import { computed } from "vue";
import { faClockRotateLeft, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import type { SessionSummary } from "../types";

const MAX_RECENT = 12;
const MAX_TITLE_WORDS = 3;

const props = defineProps<{
    sessions: SessionSummary[];
    activeSessionId: string | null;
    showAllActive: boolean;
}>();

const emit = defineEmits<{
    open: [id: string];
    delete: [id: string];
    "show-all": [];
}>();

// Les plus récentes d'abord, limitées pour ne pas allonger la barre latérale.
const recent = computed(() =>
    [...props.sessions]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, MAX_RECENT),
);

function getShortTitle(title: string): string {
    const words = title.trim().split(/\s+/);

    return words.length > MAX_TITLE_WORDS
        ? `${words.slice(0, MAX_TITLE_WORDS).join(" ")}…`
        : title;
}
</script>

<template>
    <section class="recent" aria-labelledby="recent-title">
        <h3 id="recent-title">Récent</h3>

        <p v-if="!sessions.length" class="recent-empty">Aucune conversation</p>

        <template v-else>
            <ul>
                <li v-for="session in recent" :key="session.id" :class="{ active: session.id === activeSessionId }">
                    <button class="recent-open" type="button" :title="session.title"
                        @click="emit('open', session.id)">{{ getShortTitle(session.title) }}</button>
                    <button class="recent-delete" type="button" title="Supprimer la conversation"
                        :aria-label="`Supprimer « ${session.title} »`" @click.stop="emit('delete', session.id)">
                        <FontAwesomeIcon :icon="faTrash" />
                    </button>
                </li>
            </ul>

            <button class="show-all" :class="{ active: showAllActive }" type="button" @click="emit('show-all')">
                <FontAwesomeIcon :icon="faClockRotateLeft" fixed-width />
                <span>Voir tout l'historique</span>
            </button>
        </template>
    </section>
</template>

<style scoped>
.recent {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 0;
    margin-top: 22px;
}

h3 {
    margin: 0 0 8px;
    padding: 0 10px;
    color: var(--muted);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: .08em;
    text-transform: uppercase;
}

.recent-empty {
    margin: 0;
    padding: 0 10px;
    color: var(--muted);
    font-size: 12px;
}

ul {
    display: grid;
    flex: 0 1 auto;
    align-content: start;
    gap: 2px;
    min-height: 0;
    margin: 0;
    padding: 0;
    overflow-y: auto;
    list-style: none;
}

li {
    display: flex;
    align-items: center;
    border-radius: 8px;
}

li:hover,
li:focus-within,
li.active {
    background: var(--panel-2);
}

.recent-open {
    flex: 1;
    min-width: 0;
    padding: 8px 10px;
    overflow: hidden;
    border: 0;
    background: transparent;
    color: var(--muted);
    font-size: 13px;
    text-align: left;
    text-overflow: ellipsis;
    white-space: nowrap;
}

li:hover .recent-open,
li.active .recent-open {
    color: var(--text);
}

.recent-delete {
    flex: none;
    width: 28px;
    height: 28px;
    margin-right: 4px;
    padding: 0;
    border: 0;
    border-radius: 6px;
    background: transparent;
    color: var(--muted);
    font-size: 12px;
    opacity: 0;
}

li:hover .recent-delete,
li:focus-within .recent-delete {
    opacity: 1;
}

.recent-delete:hover {
    color: var(--text);
}

@media (hover: none) {
    .recent-delete {
        opacity: 1;
    }
}

.show-all {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 8px;
    padding: 8px 10px;
    border: 0;
    border-radius: 8px;
    background: transparent;
    color: var(--muted);
    font-size: 12px;
    text-align: left;
}

.show-all:hover,
.show-all.active {
    background: var(--panel-2);
    color: var(--text);
}

@media (max-width: 650px) {
    .recent {
        display: none;
    }
}
</style>
