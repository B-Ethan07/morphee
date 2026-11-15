<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import AppSidebar from "./components/AppSidebar.vue";
import ChatPage from "./views/ChatPage.vue";
import HistoryPage from "./views/HistoryPage.vue";
import ProfilePage from "./views/ProfilePage.vue";
import { useChat } from "./composables/useChat";
import { useModels } from "./composables/useModels";
import { useProfiles } from "./composables/useProfiles";
import { useSessions } from "./composables/useSessions";
import type { Page } from "./navigation";

const { messages, loading, currentSessionId, send, stop, reset, loadSession } = useChat();
const { model, models, loadModels, selectModel } = useModels();
const { sessions, refreshSessions, deleteSession } = useSessions();
const {
    profile,
    profiles,
    profileId,
    loadProfiles,
    applyProfile,
    selectProfile,
    saveProfile,
    createProfile,
    removeProfile,
} = useProfiles(reset);

const page = ref<Page>("chat");
const conversationTitle = computed(() =>
    sessions.value.find((session) => session.id === currentSessionId.value)?.title
    ?? "Nouvelle conversation",
);

async function ask(text: string) {
    await send(text, profile.value.length, { ...profile.value }, profileId.value, model.value);
    await refreshSessions();
    page.value = "chat";
}

function newConversation() {
    reset();
    page.value = "chat";
}

async function openSession(id: string) {
    const loaded = await loadSession(id);
    if (!loaded) return;
    applyProfile(loaded.profileId, loaded.profile);
    page.value = "chat";
}

async function removeSession(id: string) {
    if (id === currentSessionId.value) reset();
    await deleteSession(id);
    await refreshSessions();
}

onMounted(async () => {
    // Chaque chargement est indépendant : si le serveur est éteint,
    // l'interface reste utilisable avec les valeurs par défaut.
    await Promise.allSettled([loadModels(), loadProfiles(), refreshSessions()]);
});
</script>

<template>
    <div class="app-shell">
        <AppSidebar :page="page" :model="model" :sessions="sessions" :current-session-id="currentSessionId"
            @navigate="page = $event" @new-chat="newConversation" @open-session="openSession"
            @delete-session="removeSession" />

        <div class="workspace">
            <ChatPage v-if="page === 'chat'" v-model:profile="profile" :messages="messages" :loading="loading"
                :profiles="profiles" :profile-id="profileId" :models="models" :model="model"
                :conversation-title="conversationTitle" @send="ask" @stop="stop" @reset="reset"
                @select-profile="selectProfile" @select-model="selectModel" />
            <HistoryPage v-else-if="page === 'history'" :sessions="sessions" :current-session-id="currentSessionId"
                @open="openSession" @delete="removeSession" />
            <ProfilePage v-else v-model="profile" :loading="loading" :profiles="profiles" :profile-id="profileId"
                @save-profile="saveProfile" @select-profile="selectProfile" @new-profile="createProfile"
                @delete-profile="removeProfile" />
        </div>
    </div>
</template>

<style scoped>
.app-shell {
    display: flex;
    height: 100%;
}

.workspace {
    min-width: 0;
    flex: 1;
    height: 100%;
    background: var(--bg);
}
</style>
