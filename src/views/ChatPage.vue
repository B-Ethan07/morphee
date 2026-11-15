<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from "vue";
import ChatInput from "../components/ChatInput.vue";
import ChatMessage from "../components/ChatMessage.vue";
import type { Message, Profile, SavedProfile } from "../types";

const props = defineProps<{
    messages: Message[];
    loading: boolean;
    profiles: SavedProfile[];
    profileId: string;
    models: string[];
    model: string;
}>();
const emit = defineEmits<{
    send: [text: string];
    stop: [];
    reset: [];
    "select-profile": [id: string];
    "select-model": [model: string];
}>();
const profile = defineModel<Profile>("profile", { required: true });

const list = ref<HTMLElement | null>(null);
let stick = true;
const suggestions = [
    "Explique la différence entre let, const et var en JavaScript",
    "Donne-moi 3 idées de projets d'IA pour mon portfolio",
    "Comment fonctionne le RAG, en simple ?",
];

function ask(text: string) {
    stick = true;
    emit("send", text);
}

function onScroll() {
    const el = list.value;
    if (el) stick = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
}

watch(
    () => props.messages,
    () => nextTick(() => {
        if (stick && list.value) list.value.scrollTop = list.value.scrollHeight;
    }),
    { deep: true },
);

onMounted(() => {
    if (list.value) list.value.scrollTop = list.value.scrollHeight;
});
</script>

<template>
    <div class="chat-page">
        <header>
            <div class="conversation-title">
                <div>
                    <p class="eyebrow">Conversation</p>
                    <h2>{{ profile.name }}</h2>
                </div>
                <span class="badge">{{ profile.mode }}</span>
            </div>
            <button class="btn ghost" :disabled="loading || !messages.length" @click="emit('reset')">Nouvelle
                conversation</button>
        </header>

        <main ref="list" @scroll="onScroll">
            <div v-if="!messages.length" class="empty">
                <h1>Comment puis-je vous aider ?</h1>
                <p>Le profil actif est appliqué à chaque nouvelle réponse.</p>
                <div class="suggestions"><button v-for="suggestion in suggestions" :key="suggestion" class="chip"
                        @click="ask(suggestion)">{{ suggestion }}</button></div>
            </div>
            <ChatMessage v-for="(message, index) in messages" :key="index" :message="message"
                :is-last="index === messages.length - 1 && !loading" @continue="ask('Continue.')" />
        </main>

        <ChatInput v-model:length="profile.length" :loading="loading" :profiles="props.profiles"
            :profile-id="props.profileId" :models="props.models" :model="props.model" @send="ask"
            @stop="emit('stop')" @select-profile="emit('select-profile', $event)"
            @select-model="emit('select-model', $event)" />
    </div>
</template>

<style scoped>
.chat-page {
    max-width: 860px;
    height: 100%;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
}

header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    padding: 18px 20px;
    border-bottom: 1px solid rgba(69, 59, 114, .55);
    background: rgba(11, 11, 26, .3);
}

.conversation-title {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
}

.eyebrow {
    margin: 0;
    color: var(--accent);
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: .08em;
}

h2 {
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 1.05rem;
}

.badge {
    padding: 3px 8px;
    border-radius: 999px;
    background: var(--panel-2);
    color: var(--muted);
    font-size: 12px;
}

main {
    flex: 1;
    overflow-y: auto;
    padding: 24px 20px;
    display: flex;
    flex-direction: column;
    gap: 18px;
}

.empty {
    margin: auto;
    max-width: 500px;
    text-align: center;
}

.empty h1 {
    margin: 0 0 5px;
    font-size: 1.5rem;
    letter-spacing: -.03em;
}

.empty p {
    margin: 0 0 20px;
    color: var(--muted);
}

.suggestions {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.chip {
    padding: 10px 14px;
    text-align: left;
    background: var(--panel);
    color: var(--text);
    border: 1px solid var(--border);
}

.chip:hover {
    border-color: var(--accent);
}

@media (max-width: 600px) {
    header {
        align-items: flex-start;
        padding: 14px;
    }

    main {
        padding: 20px 14px;
    }

    header .btn {
        padding: 7px 9px;
        font-size: 12px;
    }
}
</style>
