# Morphée

Morphée est un chatbot local avec Vue 3, Vite, Express et Ollama. L'application permet de discuter avec un modèle local et de configurer un profil de réponse détaillé : rôle, mode, ton, format, langue, garde-fous, exemples, documents de référence et paramètres de génération.

## Prérequis

- Node.js 20 ou plus récent
- npm
- Ollama installé et lancé
- Un modèle Ollama disponible localement

Par défaut, le serveur utilise le modèle `gemma4:e4b` sur `http://localhost:11434`.

## Installation

```powershell
npm install
ollama serve
ollama pull gemma4:e4b
```

Les commandes `ollama` sont à exécuter dans un terminal séparé si le service n'est pas déjà lancé.

## Développement

Lancer le serveur Express :

```powershell
npm run server
```

Dans un second terminal, lancer Vite :

```powershell
npm run dev
```

Ouvrir ensuite l'URL affichée par Vite, généralement `http://localhost:5173`.

Le serveur de développement Vite redirige automatiquement les appels `/api` vers Express sur le port `3000`.

## Configuration

Le serveur accepte les variables d'environnement suivantes :

| Variable | Défaut | Description |
| --- | --- | --- |
| `PORT` | `3000` | Port du serveur Express |
| `OLLAMA_URL` | `http://localhost:11434` | URL de l'API Ollama |
| `MODEL` | `gemma4:e4b` | Modèle utilisé pour les réponses |

Exemple PowerShell, sans écrire de valeur sensible dans le dépôt :

```powershell
$env:MODEL = "nom-du-modele-local"
$env:OLLAMA_URL = "http://localhost:11434"
npm run server
```

Les fichiers `.env` sont ignorés par Git. Le serveur utilise directement les variables d'environnement du processus; il ne charge pas automatiquement un fichier `.env`.

## Utilisation

La barre latérale donne accès à deux pages :

- **Conversation** : historique persistant, réponses en streaming, arrêt de génération, copie du Markdown et continuation des réponses tronquées. La barre de saisie liste les modèles Ollama installés et permet de choisir celui utilisé pour le prochain message.
- **Profil du LLM** : configuration persistante du profil actif.

Le profil est sauvegardé localement dans le navigateur. Il est envoyé avec chaque nouveau message et n'est pas ajouté à l'historique visible de la conversation.

## Paramètres du profil

Le profil permet notamment de régler :

- le nom, le rôle et le contexte spécifique;
- le ton, la langue et la règle de bascule linguistique;
- le format de sortie, les blocs de code, l'introduction et la conclusion;
- la longueur et le nombre maximal de tokens;
- les règles positives, interdits, périmètre et comportement face à l'incertitude;
- le contexte utilisateur, les exemples few-shot et les documents de référence;
- la température, la taille du contexte, top-p, top-k, pénalité de répétition, seed et réflexion.

Les documents et exemples sont délimités dans le prompt et présentés comme des références, pas comme des instructions système.

## Documentation technique

- [Architecture](md/architecture.md) : organisation du frontend, du serveur et flux principal.
- [Routes HTTP](md/routes.md) : détail des endpoints `/api`, des corps JSON et des réponses.

## Vérification

Construire l'application :

```powershell
npm run build
```

Le build exécute le contrôle TypeScript puis génère le dossier `dist/`.

## Production locale

Après le build :

```powershell
npm run build
npm run server
```

Express sert alors les fichiers générés depuis `dist/` et expose l'application sur `http://localhost:3000`.
