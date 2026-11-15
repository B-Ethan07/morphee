<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { Length, SavedProfile } from "../types";

const props = defineProps<{
    loading: boolean;
    profiles: SavedProfile[];
    profileId: string;
    models: string[];
    model: string;
}>();
const emit = defineEmits<{
    send: [text: string];
    stop: [];
    "select-profile": [id: string];
    "select-model": [model: string];
}>();
const length = defineModel<Length>("length", { required: true });

const text = ref("");
const el = ref<HTMLTextAreaElement | null>(null);
const menu = ref<HTMLElement | null>(null);
const open = ref(false);

const options: { value: Length; label: string }[] = [
    { value: "minimal", label: "Très courte" },
    { value: "short", label: "Courte" },
    { value: "normal", label: "Normale" },
    { value: "long", label: "Détaillée" },
];

const currentProfileName = computed(
    () => props.profiles.find((p) => p.id === props.profileId)?.name ?? "Réglages",
);

// La zone de saisie grandit avec le texte (jusqu'à 200 px)
function resize() {
    if (!el.value) return;
    el.value.style.height = "auto";
    el.value.style.height = Math.min(el.value.scrollHeight, 200) + "px";
}

function submit() {
    const value = text.value.trim();
    if (!value || props.loading) return;
    emit("send", value);
    text.value = "";
    open.value = false;
    nextTick(resize);
}

// Entrée envoie, sauf pendant une composition IME (accents, clavier asiatique...)
function onEnter(e: KeyboardEvent) {
    if (e.isComposing) return;
    e.preventDefault();
    submit();
}

// Ferme le menu au clic extérieur ou sur Échap
function onPointerDown(e: PointerEvent) {
    if (open.value && menu.value && !menu.value.contains(e.target as Node)) open.value = false;
}
function onKey(e: KeyboardEvent) {
    if (e.key === "Escape") open.value = false;
}
onMounted(() => {
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
});
onBeforeUnmount(() => {
    document.removeEventListener("pointerdown", onPointerDown);
    document.removeEventListener("keydown", onKey);
});

// Remet le curseur dans la zone de saisie quand la réponse est terminée
watch(
    () => props.loading,
    (isLoading) => {
        if (!isLoading) nextTick(() => el.value?.focus());
    },
);
</script>

<template>
    <div class="chat-input">
        <form class="input" @submit.prevent="submit">
            <textarea ref="el" v-model="text" rows="1" placeholder="Écrivez votre message..." @input="resize"
                @keydown.enter.exact="onEnter"></textarea>

            <div class="bar">
                <div ref="menu" class="tools">
                    <button type="button" class="tool" :class="{ open }" :aria-expanded="open"
                        aria-label="Réglages de la conversation" @click="open = !open">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"
                            stroke-width="2" stroke-linecap="round" aria-hidden="true">
                            <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" />
                            <circle cx="16" cy="6" r="2" />
                            <circle cx="10" cy="12" r="2" />
                            <circle cx="18" cy="18" r="2" />
                        </svg>
                        <span class="tool-label">{{ currentProfileName }}</span>
                    </button>

                    <div v-if="open" class="popover" role="dialog" aria-label="Réglages">
                        <label class="field">
                            <span>Profil</span>
                            <select :value="props.profileId"
                                @change="emit('select-profile', ($event.target as HTMLSelectElement).value)">
                                <option v-for="profile in props.profiles" :key="profile.id" :value="profile.id">
                                    {{ profile.name }}
                                </option>
                            </select>
                        </label>

                        <label v-if="props.models.length" class="field">
                            <span>Modèle</span>
                            <select :value="props.model"
                                @change="emit('select-model', ($event.target as HTMLSelectElement).value)">
                                <option v-for="m in props.models" :key="m" :value="m">{{ m }}</option>
                            </select>
                        </label>

                        <div class="field">
                            <span>Longueur des réponses</span>
                            <div class="seg" role="group" aria-label="Longueur des réponses">
                                <button v-for="o in options" :key="o.value" type="button"
                                    :class="{ active: length === o.value }" @click="length = o.value">
                                    {{ o.label }}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <button v-if="!loading" class="send" type="submit" :disabled="!text.trim()" aria-label="Envoyer">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4"
                        stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M12 19V5M5 12l7-7 7 7" />
                    </svg>
                </button>
                <button v-else class="send stop" type="button" aria-label="Arrêter la réponse" @click="emit('stop')">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
                        <rect x="5" y="5" width="14" height="14" rx="2" />
                    </svg>
                </button>
            </div>
        </form>

        <p class="hint">Entrée pour envoyer · Maj+Entrée : nouvelle ligne</p>
    </div>
</template>

<style scoped>
.chat-input {
    margin: 0 12px 10px;
}

.input {
    padding: 12px 12px 10px 16px;
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: 24px;
    transition: border-color .15s;
}

.input:focus-within {
    border-color: var(--accent);
}

textarea {
    display: block;
    width: 100%;
    min-height: 28px;
    max-height: 200px;
    padding: 2px 4px 2px 0;
    resize: none;
    border: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    line-height: 1.5;
}

textarea:focus-visible {
    outline: none;
}

.bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-top: 8px;
}

.tools {
    position: relative;
    min-width: 0;
}

.tool {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    max-width: 100%;
    padding: 6px 10px;
    border: 1px solid var(--border);
    border-radius: 999px;
    background: transparent;
    color: var(--muted);
    font-size: 12px;
    cursor: pointer;
}

.tool:hover,
.tool.open {
    background: var(--panel-2);
    color: var(--text);
}

.tool-label {
    overflow: hidden;
    max-width: 150px;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.popover {
    position: absolute;
    left: 0;
    bottom: calc(100% + 10px);
    z-index: 10;
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: min(320px, calc(100vw - 48px));
    padding: 14px;
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: 14px;
    box-shadow: 0 12px 32px rgba(0, 0, 0, .35);
}

.field {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.field>span {
    color: var(--muted);
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: .06em;
}

.field select {
    width: 100%;
    padding: 6px 8px;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--bg);
    color: var(--text);
    font: inherit;
    font-size: 13px;
}

.seg {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
}

.seg button {
    padding: 5px 10px;
    border: 1px solid var(--border);
    border-radius: 999px;
    background: transparent;
    color: var(--muted);
    font-size: 12px;
    white-space: nowrap;
    cursor: pointer;
}

.seg button.active {
    background: var(--accent);
    border-color: var(--accent);
    color: #fff;
}

.send {
    flex: none;
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: var(--accent);
    color: #fff;
    cursor: pointer;
    transition: opacity .15s, transform .1s;
}

.send:hover:not(:disabled) {
    transform: scale(1.06);
}

.send:disabled {
    opacity: .35;
    cursor: not-allowed;
}

.send.stop {
    background: var(--text);
    color: var(--bg);
}

.hint {
    margin: 6px 0 0;
    text-align: center;
    font-size: 11px;
    color: var(--muted);
}

@media (max-width: 600px) {
    .hint {
        display: none;
    }

    .tool-label {
        max-width: 110px;
    }
}
</style>
