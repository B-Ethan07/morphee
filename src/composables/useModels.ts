import { ref } from "vue";
import { api } from "../api";

/** Modèle Ollama sélectionné et liste des modèles disponibles. */
export function useModels() {
    const model = ref("");
    const models = ref<string[]>([]);

    async function loadModels() {
        const config = await api.getConfig();
        model.value = config.model;
        models.value = await api.getModels();
        if (!models.value.includes(model.value)) models.value.unshift(model.value);
    }

    function selectModel(value: string) {
        if (value) model.value = value;
    }

    return { model, models, loadModels, selectModel };
}
