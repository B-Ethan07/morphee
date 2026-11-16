<script setup lang="ts">
import { modes } from "../types/profile";
import type { Profile, SavedProfile } from "../types";

const props = defineProps<{
    loading: boolean;
    profiles: SavedProfile[];
    profileId: string;
}>();
const emit = defineEmits<{
    "save-profile": [];
    "select-profile": [id: string];
    "new-profile": [];
    "delete-profile": [id: string];
}>();
const profile = defineModel<Profile>({ required: true });
</script>

<template>
    <section class="profile-page">
        <div class="page-heading">
            <div>
                <p class="eyebrow">Configuration</p>
                <h2>Profil du LLM</h2>
                <p>Définissez le rôle, le style, les garde-fous et les paramètres transmis à chaque nouvelle réponse.
                </p>
            </div>
            <span class="mode-label">{{modes.find((mode) => mode.value === profile.mode)?.label}}</span>
        </div>

        <div class="profile-actions">
            <label>Profil enregistré<select :value="props.profileId"
                    @change="emit('select-profile', ($event.target as HTMLSelectElement).value)">
                    <option v-for="saved in props.profiles" :key="saved.id" :value="saved.id">
                        {{ saved.name }} · {{modes.find((mode) => mode.value === saved.mode)?.label}}
                    </option>
                </select></label>
            <button type="button" @click="emit('save-profile')">Enregistrer</button>
            <button type="button" @click="emit('new-profile')">Nouveau profil</button>
            <button type="button" :disabled="props.profiles.length <= 1"
                @click="emit('delete-profile', props.profileId)">Supprimer</button>
        </div>

        <fieldset>
            <legend>Identité et mode</legend>
            <div class="form-grid">
                <label>Nom du profil<input v-model="profile.name" maxlength="80"
                        placeholder="Ex. Mentor Python" /></label>
                <label>Mode<select v-model="profile.mode">
                        <option v-for="mode in modes" :key="mode.value" :value="mode.value">{{ mode.label }}</option>
                    </select></label>
                <label class="wide">Qui le LLM représente<textarea v-model="profile.persona" rows="2" maxlength="1000"
                        placeholder="Ex. Tu es un développeur senior..." /></label>
                <label class="wide">Contexte spécifique<textarea v-model="profile.context" rows="3" maxlength="2000"
                        placeholder="Règles, projet, ton, connaissances à privilégier..." /></label>
            </div>
        </fieldset>

        <fieldset>
            <legend>Réponse</legend>
            <div class="form-grid">
                <label>Ton / registre<select v-model="profile.tone">
                        <option>tutoiement</option>
                        <option>vouvoiement</option>
                        <option>formel</option>
                        <option>décontracté</option>
                        <option>pédagogue</option>
                        <option>direct</option>
                    </select></label>
                <label>Longueur par défaut<select v-model="profile.length">
                        <option value="minimal">Très courte</option>
                        <option value="short">Courte</option>
                        <option value="normal">Normale</option>
                        <option value="long">Détaillée</option>
                    </select></label>
                <label>Tokens maximum<input v-model.number="profile.maxTokens" type="number" min="1" max="8192"
                        step="50" /></label>
                <label>Format de sortie<select v-model="profile.outputFormat">
                        <option value="markdown">Markdown</option>
                        <option value="plain">Texte brut</option>
                        <option value="list">Liste</option>
                        <option value="table">Tableau</option>
                        <option value="json">JSON</option>
                    </select></label>
                <div class="checks wide"><label><input v-model="profile.includeCodeBlocks" type="checkbox" /> Blocs de
                        code</label><label><input v-model="profile.includeIntroduction" type="checkbox" />
                        Introduction</label><label><input v-model="profile.includeConclusion" type="checkbox" />
                        Conclusion</label></div>
                <label>Langue<input v-model="profile.language" maxlength="80" placeholder="Ex. français" /></label>
                <label>Règle de bascule<textarea v-model="profile.languageRule" rows="2" /></label>
                <label class="wide">Incertitude<textarea v-model="profile.uncertainty" rows="2" /></label>
            </div>
        </fieldset>

        <fieldset>
            <legend>Contraintes et périmètre</legend>
            <div class="form-grid">
                <label>À faire, une règle par ligne<textarea v-model="profile.positiveRules" rows="3" /></label>
                <label>Interdits, une règle par ligne<textarea v-model="profile.forbiddenRules" rows="3" /></label>
                <label>Sujets / périmètre<textarea v-model="profile.scope" rows="2"
                        placeholder="Vide = pas de restriction" /></label>
                <label>Sources et spéculation<textarea v-model="profile.sources" rows="2" /></label>
                <label>Contexte utilisateur<textarea v-model="profile.userContext" rows="2"
                        placeholder="Métier, objectif, préférences..." /></label>
                <label>Exemples question/réponse<textarea v-model="profile.fewShot" rows="3"
                        placeholder="Question: ...\nRéponse: ..." /></label>
                <label class="wide">Documents de référence<textarea v-model="profile.referenceDocuments" rows="4"
                        placeholder="Texte de référence à prendre en compte..." /></label>
            </div>
        </fieldset>

        <fieldset v-if="profile.mode === 'rp'">
            <legend>Paramètres jeu de rôle</legend>
            <div class="form-grid">
                <label>Personnage<textarea v-model="profile.rpCharacter" rows="2" /></label>
                <label>Scène<textarea v-model="profile.rpScene" rows="2" /></label>
                <label>Relation avec l'utilisateur<textarea v-model="profile.rpRelationship" rows="2" /></label>
                <label>Règles du rôle<textarea v-model="profile.rpRules" rows="2" /></label>
            </div>
        </fieldset>

        <fieldset v-else-if="profile.mode === 'development'">
            <legend>Paramètres développement</legend>
            <div class="form-grid">
                <label>Langage / version / framework<textarea v-model="profile.developmentStack" rows="2" /></label>
                <label>Style de code<textarea v-model="profile.developmentStyle" rows="2" /></label>
                <label class="wide">Conventions et éléments à éviter<textarea v-model="profile.developmentConventions"
                        rows="2" /></label>
            </div>
        </fieldset>

        <fieldset v-else-if="profile.mode === 'questions'">
            <legend>Paramètres questions / savoir</legend>
            <label>Style pédagogique<textarea v-model="profile.questionsStyle" rows="2" /></label>
        </fieldset>

        <fieldset>
            <legend>Paramètres techniques</legend>
            <div class="form-grid">
                <label>Température<input v-model.number="profile.temperature" type="number" min="0" max="2"
                        step="0.1" /></label>
                <label>Taille du contexte<input v-model.number="profile.numCtx" type="number" min="256" max="131072"
                        step="256" /></label>
                <label>Top-p<input v-model.number="profile.topP" type="number" min="0" max="1" step="0.05" /></label>
                <label>Top-k<input v-model.number="profile.topK" type="number" min="0" max="200" /></label>
                <label>Pénalité répétition<input v-model.number="profile.repeatPenalty" type="number" min="0" max="2"
                        step="0.05" /></label>
                <label>Seed<input v-model.number="profile.seed" type="number" placeholder="Aléatoire" /></label>
                <label class="check-single"><input v-model="profile.think" type="checkbox" /> Activer la réflexion du
                    modèle</label>
            </div>
        </fieldset>
    </section>
</template>

<style scoped>
.profile-page {
    max-width: 980px;
    margin: 0 auto;
    padding: 28px 20px 48px;
    overflow-y: auto;
    height: 100%;
}

.page-heading {
    display: flex;
    justify-content: space-between;
    gap: 20px;
    margin-bottom: 22px;
}

.eyebrow {
    margin: 0 0 4px;
    color: var(--accent);
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: .08em;
}

h2 {
    margin: 0;
    font-size: 1.5rem;
}

.page-heading p:last-child {
    margin: 6px 0 0;
    color: var(--muted);
}

.mode-label {
    color: var(--accent);
    white-space: nowrap;
}

.profile-actions {
    display: flex;
    align-items: end;
    gap: 10px;
    margin-bottom: 18px;
}

.profile-actions label {
    flex: 1;
    max-width: 430px;
}

.profile-actions button {
    min-height: 36px;
    padding: 8px 12px;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--panel-2);
    color: var(--text);
    cursor: pointer;
}

.profile-actions button:disabled {
    cursor: not-allowed;
    opacity: .5;
}

fieldset {
    min-width: 0;
    margin: 0 0 14px;
    padding: 16px;
    border: 1px solid var(--border);
    border-radius: 12px;
    background: var(--panel);
}

legend {
    padding: 0 8px;
    color: var(--text);
    font-weight: 600;
}

.form-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
}

label {
    display: flex;
    flex-direction: column;
    gap: 5px;
    color: var(--muted);
    font-size: 12px;
}

.wide {
    grid-column: 1 / -1;
}

input,
select,
textarea {
    width: 100%;
    padding: 8px 10px;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--bg);
    color: var(--text);
    font: inherit;
    resize: vertical;
}

.checks {
    display: flex;
    align-items: end;
    gap: 14px;
    padding-bottom: 8px;
}

.checks label,
.check-single {
    flex-direction: row;
    align-items: center;
    white-space: nowrap;
}

@media (max-width: 650px) {
    .profile-page {
        padding: 20px 14px 36px;
    }

    .page-heading {
        flex-direction: column;
        gap: 6px;
    }

    .profile-actions {
        align-items: stretch;
        flex-direction: column;
    }

    .profile-actions label {
        max-width: none;
    }

    .form-grid {
        grid-template-columns: 1fr;
    }

    .wide {
        grid-column: auto;
    }

    .checks {
        flex-wrap: wrap;
        align-items: center;
    }
}
</style>
