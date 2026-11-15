<script setup lang="ts">
import { nextTick, ref, watch } from "vue";
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

const options: { value: Length; label: string }[] = [
    { value: "minimal", label: "Très courte" },
    { value: "short", label: "Courte" },
    { value: "normal", label: "Normale" },
    { value: "long", label: "Détaillée" },
];

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
    nextTick(resize);
}

// Remet le curseur dans la zone de saisie quand la réponse est terminée
watch(
    () => props.loading,
    (isLoading) => {
        if (!isLoading) nextTick(() => el.value?.focus());
    },
);
</script>

<template>
    <form class="input" @submit.prevent="submit">
        <textarea ref="el" v-model="text" rows="1" placeholder="Écrivez votre message..." @input="resize"
            @keydown.enter.exact.prevent="submit"></textarea>

        <div class="bar">
            <label class="profile-select">Profil : <select :value="props.profileId"
                    @change="emit('select-profile', ($event.target as HTMLSelectElement).value)">
                    <option v-for="profile in props.profiles" :key="profile.id" :value="profile.id">
                        {{ profile.name }}
                    </option>
                </select></label>

            <label v-if="props.models.length" class="profile-select">Modèle : <select :value="props.model"
                    @change="emit('select-model', ($event.target as HTMLSelectElement).value)">
                    <option v-for="availableModel in props.models" :key="availableModel" :value="availableModel">
                        {{ availableModel }}
                    </option>
                </select></label>

            <div class="seg" role="group" aria-label="Longueur des réponses">
                <span class="label">Réponses :</span>
                <button v-for="o in options" :key="o.value" type="button" :class="{ active: length === o.value }"
                    @click="length = o.value">
                    {{ o.label }}
                </button>
            </div>

            <span class="hint">Entrée pour envoyer · Maj+Entrée : nouvelle ligne</span>

            <button v-if="!loading" class="btn" type="submit" :disabled="!text.trim()">Envoyer</button>
            <button v-else class="btn stop" type="button" @click="emit('stop')">Stop</button>
        </div>
    </form>
</template>

<style scoped>
.input {
    margin: 0 16px 16px;
    padding: 10px 12px;
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: 16px;
}

.input:focus-within {
    border-color: var(--accent);
}

textarea {
    display: block;
    width: 100%;
    resize: none;
    border: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    max-height: 200px;
}

textarea:focus-visible {
    outline: none;
}

.bar {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 8px;
    flex-wrap: wrap;
}

.seg {
    display: flex;
    align-items: center;
    gap: 4px;
}

.profile-select {
    display: flex;
    align-items: center;
    gap: 5px;
    color: var(--muted);
    font-size: 12px;
}

.profile-select select {
    max-width: 180px;
    padding: 4px 7px;
    border: 1px solid var(--border);
    border-radius: 6px;
    background: var(--bg);
    color: var(--text);
    font: inherit;
}

.label {
    font-size: 12px;
    color: var(--muted);
    margin-right: 4px;
}

.seg button {
    padding: 4px 10px;
    font-size: 12px;
    background: transparent;
    color: var(--muted);
}

.seg button.active {
    background: var(--panel-2);
    color: var(--text);
}

.hint {
    flex: 1;
    font-size: 12px;
    color: var(--muted);
    text-align: right;
}

@media (max-width: 600px) {
    .hint {
        display: none;
    }

    .bar {
        justify-content: space-between;
    }
}
</style>
