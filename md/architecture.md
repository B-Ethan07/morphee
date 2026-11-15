# Architecture

Morphée est organisé en deux parties : une interface Vue 3 servie par Vite et une API Express qui dialogue avec Ollama et persiste les profils et les sessions.

## Arborescence principale

```text
src/
  App.vue                         Shell et navigation
  profile.ts                      Valeurs par défaut et migration du profil
  views/
    ChatPage.vue                  Page conversation
    HistoryPage.vue               Historique des sessions
    ProfilePage.vue               Page configuration du profil
  components/
    ChatInput.vue                 Saisie et longueur de réponse
    ChatMessage.vue               Affichage Markdown des messages
  composables/
    useChat.ts                    Historique et streaming
  utils/
    markdown.ts                   Conversion du Markdown pour l'affichage

server.js                         Entrée Express
server/
  config.js                       Configuration et constantes
  database.js                     Persistance SQLite des profils et sessions
  routes.js                       Déclaration des routes API
  controllers/chatController.js   Streaming des réponses depuis Ollama
  services/promptBuilder.js       Validation et construction du prompt
  middleware/http.js              JSON, erreurs et routes inconnues
```

## Flux principal

1. Vite sert l'interface Vue et redirige les appels `/api` vers Express en développement.
2. L'interface envoie le profil actif et l'historique utile à `POST /api/chat`.
3. Express valide les données, construit le prompt et transmet la génération à Ollama.
4. La réponse est renvoyée en NDJSON au fil du streaming, puis la session est persistée.
5. Les profils et les sessions sont gérés par `database.js` et exposés par les routes dédiées.

Pour le détail du contrat HTTP, voir [routes.md](routes.md).
