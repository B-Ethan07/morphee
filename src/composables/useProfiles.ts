import { ref, watch } from "vue";
import { api } from "../routes/api";
import { defaultProfile } from "../types/profile";
import type { Profile, SavedProfile } from "../types";

function newRoleplayProfile(): Profile {
  return {
    ...defaultProfile,
    mode: "rp",
    name: "Nouveau profil RP",
    rpCharacter: "",
    rpScene: "",
    rpRelationship: "",
    rpRules: "",
  };
}

/**
 * Profils du LLM : profil actif, liste, création, suppression et
 * sauvegarde automatique.
 *
 * @param onSwitch appelé quand le profil actif change (par exemple pour
 *                 démarrer une nouvelle conversation).
 */
export function useProfiles(onSwitch: () => void) {
  const profile = ref<Profile>({ ...defaultProfile });
  const profiles = ref<SavedProfile[]>([]);
  const profileId = ref("");
  const loaded = ref(false);

  // Sauvegarde automatique du profil actif à chaque modification.
  watch(
    profile,
    (value) => {
      if (!loaded.value || !profileId.value) return;
      void api.updateProfile(profileId.value, value);
      const index = profiles.value.findIndex(
        (item) => item.id === profileId.value,
      );
      if (index >= 0) {
        profiles.value[index] = {
          ...profiles.value[index],
          name: value.name,
          mode: value.mode,
          profile: { ...value },
          updatedAt: new Date().toISOString(),
        };
      }
    },
    { deep: true },
  );

  /** Définit le profil actif sans toucher à la conversation en cours. */
  function applyProfile(id: string, value: Profile) {
    profileId.value = id;
    profile.value = { ...value };
  }

  async function loadProfiles() {
    try {
      profiles.value = await api.getProfiles();
      if (!profiles.value.length) await createProfile();
      else applyProfile(profiles.value[0].id, profiles.value[0].profile);
    } finally {
      loaded.value = true;
    }
  }

  function selectProfile(id: string) {
    const saved = profiles.value.find((item) => item.id === id);
    if (!saved || saved.id === profileId.value) return;
    onSwitch();
    applyProfile(saved.id, saved.profile);
  }

  async function saveProfile() {
    if (!profileId.value) return;
    await api.updateProfile(profileId.value, profile.value);
  }

  async function createProfile() {
    const saved = await api.createProfile(newRoleplayProfile());
    if (!saved) return;
    const now = new Date().toISOString();
    profiles.value.unshift({
      id: saved.id,
      name: saved.profile.name,
      mode: saved.profile.mode,
      profile: saved.profile,
      createdAt: now,
      updatedAt: now,
    });
    onSwitch();
    applyProfile(saved.id, saved.profile);
  }

  async function removeProfile(id: string) {
    if (profiles.value.length <= 1) return;
    if (!(await api.deleteProfile(id))) return;
    profiles.value = profiles.value.filter((item) => item.id !== id);
    if (id === profileId.value) {
      const next = profiles.value[0];
      applyProfile(next.id, next.profile);
      onSwitch();
    }
  }

  return {
    profile,
    profiles,
    profileId,
    loadProfiles,
    applyProfile,
    selectProfile,
    saveProfile,
    createProfile,
    removeProfile,
  };
}
