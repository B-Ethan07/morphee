<script setup lang="ts">
import { computed, ref } from "vue";
import type { Message } from "../types";
import { renderMarkdown } from "../utils/markdown";

type ChatMessageData = Message & {
    model?: string;
    promptTokens?: number;
    completionTokens?: number;
};

const props = defineProps<{ message: ChatMessageData; isLast?: boolean }>();
const emit = defineEmits<{ continue: [] }>();

const isAssistant = computed(() => props.message.role === "assistant" && !props.message.error);
const html = computed(() => (isAssistant.value ? renderMarkdown(props.message.content) : ""));
const copied = ref(false);

// Délégation de clic pour les boutons "Copier" des blocs de code
async function onMarkdownClick(e: MouseEvent) {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>(".copy-btn");
    if (!btn) return;
    const code = btn.parentElement?.querySelector("code")?.innerText ?? "";
    await navigator.clipboard.writeText(code);
    btn.textContent = "Copié !";
    setTimeout(() => (btn.textContent = "Copier"), 1500);
}

async function copyAll() {
    await navigator.clipboard.writeText(props.message.content);
    copied.value = true;
    setTimeout(() => (copied.value = false), 1500);
}
</script>

<template>
    <div class="row" :class="message.role">
        <div class="avatar" aria-hidden="true">{{ message.role === "user" ? "Moi" : "IA" }}</div>

        <div class="content">
            <div class="bubble" :class="{ error: message.error }">
                <template v-if="isAssistant">
                    <div v-if="!message.content" class="typing" aria-label="Réponse en cours">
                        <span></span><span></span><span></span>
                    </div>
                    <div v-else class="markdown" v-html="html" @click="onMarkdownClick"></div>
                </template>
                <p v-else class="plain">{{ message.content }}</p>
            </div>

            <div v-if="isAssistant && message.content" class="message-footer">
                <div class="actions">
                    <button class="link" @click="copyAll">{{ copied ? "Copié !" : "Copier la réponse" }}</button>
                    <template v-if="message.truncated && isLast">
                        <span class="notice">Réponse tronquée (limite atteinte).</span>
                        <button class="link accent" @click="emit('continue')">Continuer</button>
                    </template>
                </div>
                <div v-if="message.model" class="benchmark-info">
                    {{ message.model }} · {{ message.completionTokens ?? "?" }} tokens générés
                    <span v-if="message.promptTokens != null">
                        · {{ message.promptTokens }} tokens de contexte
                    </span>
                </div>
            </div>
            <div v-if="isAssistant && message.sources?.length" class="sources">
                Sources : {{ message.sources.join(", ") }}
            </div>
        </div>
    </div>
</template>

<style scoped>
.row {
    display: flex;
    gap: 10px;
    align-items: flex-start;
}

.row.user {
    flex-direction: row-reverse;
}

.avatar {
    flex: none;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    font-size: 12px;
    font-weight: 600;
    background: var(--panel-2);
    color: var(--muted);
}

.user .avatar {
    background: var(--accent);
    color: #0b0b1a;
    box-shadow: 0 5px 16px rgba(124, 58, 237, .28);
}

.content {
    min-width: 0;
    max-width: min(85%, 680px);
}

.user .content {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
}

.bubble {
    padding: 10px 14px;
    border-radius: 14px;
    background: var(--panel);
}

.user .bubble {
    background: var(--accent);
    color: #0b0b1a;
    border-bottom-right-radius: 4px;
    box-shadow: 0 8px 22px rgba(124, 58, 237, .18);
}

.assistant .bubble {
    border-top-left-radius: 4px;
}

.bubble.error {
    background: var(--danger);
}

.plain {
    margin: 0;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
}

.message-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-top: 4px;
}

.actions {
    display: flex;
    flex: none;
    gap: 12px;
    align-items: center;
    padding-left: 4px;
    font-size: 12px;
}

.benchmark-info {
    min-width: 0;
    padding-right: 4px;
    color: var(--muted);
    font-size: 11px;
    opacity: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    text-align: right;
    transition: opacity .15s ease;
}

.content:hover .benchmark-info,
.content:focus-within .benchmark-info {
    opacity: 1;
}

.link {
    background: none;
    padding: 2px 0;
    color: var(--muted);
}

.link:hover {
    color: var(--text);
}

.link.accent {
    color: var(--accent);
}

.notice {
    color: var(--muted);
}

.sources {
    margin-top: 6px;
    padding-left: 4px;
    color: var(--muted);
    font-size: 12px;
}

/* Indicateur de frappe */
.typing {
    display: flex;
    gap: 4px;
    padding: 6px 2px;
}

.typing span {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--muted);
    animation: bounce 1.2s infinite ease-in-out;
}

.typing span:nth-child(2) {
    animation-delay: 0.15s;
}

.typing span:nth-child(3) {
    animation-delay: 0.3s;
}

@keyframes bounce {

    0%,
    80%,
    100% {
        opacity: 0.3;
        transform: translateY(0);
    }

    40% {
        opacity: 1;
        transform: translateY(-4px);
    }
}

/* Contenu Markdown */
.markdown {
    overflow-wrap: anywhere;
}

.markdown :deep(:first-child) {
    margin-top: 0;
}

.markdown :deep(:last-child) {
    margin-bottom: 0;
}

.markdown :deep(p) {
    margin: 0.6em 0;
}

.markdown :deep(h1),
.markdown :deep(h2),
.markdown :deep(h3) {
    margin: 1em 0 0.4em;
    line-height: 1.3;
}

.markdown :deep(h1) {
    font-size: 1.25em;
}

.markdown :deep(h2) {
    font-size: 1.15em;
}

.markdown :deep(h3) {
    font-size: 1.05em;
}

.markdown :deep(ul),
.markdown :deep(ol) {
    margin: 0.5em 0;
    padding-left: 1.4em;
}

.markdown :deep(li) {
    margin: 0.2em 0;
}

.markdown :deep(a) {
    color: var(--accent);
}

.markdown :deep(blockquote) {
    margin: 0.6em 0;
    padding-left: 12px;
    border-left: 3px solid var(--border);
    color: var(--muted);
}

.markdown :deep(hr) {
    border: 0;
    border-top: 1px solid var(--border);
    margin: 1em 0;
}

.markdown :deep(table) {
    border-collapse: collapse;
    margin: 0.8em 0;
    display: block;
    overflow-x: auto;
}

.markdown :deep(th),
.markdown :deep(td) {
    border: 1px solid var(--border);
    padding: 6px 10px;
    text-align: left;
}

.markdown :deep(th) {
    background: var(--panel-2);
}

.markdown :deep(code) {
    font-family: ui-monospace, "Cascadia Code", Consolas, monospace;
    font-size: 0.9em;
    background: var(--panel-2);
    padding: 0.15em 0.4em;
    border-radius: 6px;
}

.markdown :deep(pre) {
    position: relative;
    margin: 0.8em 0;
    padding: 14px;
    background: #0B0B1A;
    border: 1px solid var(--border);
    border-radius: 10px;
    overflow-x: auto;
}

.markdown :deep(pre code) {
    background: none;
    padding: 0;
    font-size: 13px;
}

.markdown :deep(.copy-btn) {
    position: absolute;
    top: 8px;
    right: 8px;
    padding: 3px 10px;
    font-size: 12px;
    background: var(--panel-2);
    color: var(--muted);
}

.markdown :deep(.copy-btn:hover) {
    color: var(--text);
}
</style>