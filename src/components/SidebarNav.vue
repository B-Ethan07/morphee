<script setup lang="ts">
import { faFileLines, faMessage, faSliders } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import type { Page } from "../navigation";

defineProps<{ page: Page }>();

const emit = defineEmits<{ navigate: [page: Page] }>();

const items = [
    { page: "chat", label: "Conversation", icon: faMessage },
    { page: "profile", label: "Profil LLM", icon: faSliders },
    { page: "documents", label: "Documents", icon: faFileLines },
] as const;
</script>

<template>
    <nav aria-label="Navigation principale">
        <button v-for="item in items" :key="item.page" type="button" :title="item.label"
            :class="{ active: page === item.page }" @click="emit('navigate', item.page)">
            <FontAwesomeIcon :icon="item.icon" fixed-width class="nav-icon" />
            <span class="label">{{ item.label }}</span>
        </button>
    </nav>
</template>

<style scoped>
nav {
    display: grid;
    gap: 2px;
}

button {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 7px 8px;
    border: 0;
    border-radius: 7px;
    background: transparent;
    color: var(--muted);
    text-align: left;
}

button:hover,
button.active {
    background: var(--panel-2);
    color: var(--text);
}

button.active .nav-icon {
    color: var(--text);
}

@media (max-width: 650px) {
    button {
        justify-content: center;
        padding: 10px 4px;
    }

    .label {
        display: none;
    }
}
</style>
