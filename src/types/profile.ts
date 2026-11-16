import type { Profile, ProfileMode } from "../types";

export const modes: { value: ProfileMode; label: string }[] = [
  { value: "rp", label: "Jeu de rôle" },
  { value: "development", label: "Développement" },
  { value: "questions", label: "Questions" },
];

export const defaultProfile: Profile = {
  name: "Assistant polyvalent",
  mode: "questions",
  persona: "Un assistant utile, clair et honnête.",
  context: "Réponds en français et adapte le niveau de détail à la question.",
  tone: "pédagogue",
  outputFormat: "markdown",
  includeCodeBlocks: true,
  includeIntroduction: false,
  includeConclusion: false,
  length: "normal",
  maxTokens: 600,
  language: "français",
  languageRule: "Réponds dans la langue de l'utilisateur.",
  uncertainty:
    "Dis que tu ne sais pas plutôt que d'inventer. Demande au maximum une précision si la question est ambiguë.",
  positiveRules: "Sois précis et signale tes hypothèses.",
  forbiddenRules: "N'invente pas de faits ni de sources.",
  scope: "",
  sources: "Distingue les faits, les opinions et les éléments spéculatifs.",
  userContext: "",
  fewShot: "",
  referenceDocuments: "",
  temperature: 0.7,
  numCtx: 4096,
  topP: 0.9,
  topK: 40,
  repeatPenalty: 1.1,
  think: false,
  seed: null,
  rpCharacter: "",
  rpScene: "",
  rpRelationship: "",
  rpRules:
    "Ne décide jamais à la place de l'utilisateur et ne sors pas du personnage.",
  developmentStack: "",
  developmentStyle: "Code d'abord, explication courte ensuite.",
  developmentConventions: "Évite les dépendances inutiles.",
  questionsStyle:
    "Donne des exemples et des analogies utiles; ajoute un résumé en tête si nécessaire.",
};

export function loadProfile(): Profile {
  try {
    const saved = JSON.parse(localStorage.getItem("chat-profile") ?? "null");
    if (saved && typeof saved === "object") {
      return {
        ...defaultProfile,
        ...Object.fromEntries(
          Object.keys(defaultProfile).map((key) => [
            key,
            saved[key] ?? defaultProfile[key as keyof Profile],
          ]),
        ),
        mode: modes.some((mode) => mode.value === saved.mode)
          ? saved.mode
          : defaultProfile.mode,
      } as Profile;
    }
  } catch {
    // Profil invalide : on repart sur les valeurs par défaut.
  }
  return { ...defaultProfile };
}
