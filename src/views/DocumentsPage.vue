<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { api, type DocumentSummary } from "../routes/api";

const documents = ref<DocumentSummary[]>([]);
const selectedFile = ref<File | null>(null);
const loading = ref(false);
const error = ref("");
let pollTimer: number | undefined;

async function loadDocuments() {
    try {
        documents.value = await api.getDocuments();
    } catch (reason) {
        error.value = reason instanceof Error ? reason.message : "Erreur de chargement.";
    }
}

function chooseFile(event: Event) {
    selectedFile.value = (event.target as HTMLInputElement).files?.[0] ?? null;
}

async function upload() {
    if (!selectedFile.value || loading.value) return;
    loading.value = true;
    error.value = "";
    try {
        await api.uploadDocument(selectedFile.value);
        selectedFile.value = null;
        await loadDocuments();
    } catch (reason) {
        error.value = reason instanceof Error ? reason.message : "Échec de l'import.";
    } finally {
        loading.value = false;
    }
}

function statusLabel(status: DocumentSummary["status"]) {
    return status === "indexed" ? "Indexé" : status === "pending" ? "Indexation..." : "Erreur";
}

onMounted(async () => {
    await loadDocuments();
    pollTimer = window.setInterval(() => {
        if (documents.value.some((document) => document.status === "pending")) void loadDocuments();
    }, 2000);
});

onUnmounted(() => {
    if (pollTimer) window.clearInterval(pollTimer);
});
</script>

<template>
    <main class="documents-page">
        <header>
            <h1>Documents</h1>
            <p>Importez des fichiers locaux pour les utiliser comme contexte de réponse.</p>
        </header>
        <section class="upload-panel">
            <input type="file" accept=".pdf,.md,.txt,.js,.ts,.json,.html,.css,.vue" @change="chooseFile">
            <button class="btn" :disabled="!selectedFile || loading" @click="upload">
                {{ loading ? "Import..." : "Importer" }}
            </button>
            <progress v-if="loading" max="1" value="0.5" aria-label="Import en cours"></progress>
        </section>
        <p v-if="error" class="error">{{ error }}</p>
        <section class="document-list" aria-live="polite">
            <p v-if="!documents.length" class="empty">Aucun document importé.</p>
            <article v-for="document in documents" :key="document.id" class="document">
                <strong>{{ document.name }}</strong>
                <span :class="['status', document.status]">{{ statusLabel(document.status) }}</span>
            </article>
        </section>
    </main>
</template>

<style scoped>
.documents-page {
    max-width: 860px;
    height: 100%;
    margin: 0 auto;
    padding: 28px 20px;
    overflow-y: auto;
}

header {
    border-bottom: 1px solid var(--border);
    margin-bottom: 20px;
}

h1 {
    margin: 0;
    font-size: 1.4rem;
}

header p,
.empty {
    color: var(--muted);
}

.upload-panel {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
    padding: 16px;
    background: var(--panel);
    border-radius: 10px;
}

progress {
    width: 100%;
    accent-color: var(--accent);
}

.document-list {
    display: grid;
    gap: 8px;
    margin-top: 18px;
}

.document {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 14px;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--panel);
}

.status {
    color: var(--muted);
    font-size: .85rem;
}

.status.indexed {
    color: var(--ok);
}

.status.error,
.error {
    color: var(--error);
}
</style>
