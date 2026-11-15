# Routes HTTP

Toutes les routes sont préfixées par `/api`.

## Configuration

### `GET /api/config`

Retourne le modèle Ollama configuré.

```json
{
  "model": "gemma4:e4b"
}
```

## Profils

### `GET /api/profile`

Retourne le profil par défaut.

### `PUT /api/profile`

Remplace le profil par défaut. Le corps doit être un objet JSON.

Réponses :

- `200` : profil enregistré ;
- `400` : profil invalide.

### `GET /api/profiles`

Retourne la liste des profils enregistrés.

### `POST /api/profiles`

Crée un profil à partir d'un objet JSON.

Réponses :

- `201` : identifiant et profil créés ;
- `400` : profil invalide.

### `PUT /api/profiles/:id`

Met à jour le profil identifié par `:id`. Le corps doit être un objet JSON.

Réponses :

- `200` : identifiant et profil mis à jour ;
- `400` : profil invalide.

### `DELETE /api/profiles/:id`

Supprime le profil identifié par `:id`.

Réponses :

- `204` : profil supprimé ;
- `409` : profil inexistant ou utilisé par une session.

## Sessions

### `GET /api/sessions/latest`

Retourne la dernière session, son profil associé et ses messages. Si aucune session n'existe, les champs d'identifiant et de profil valent `null` et `messages` est un tableau vide.

### `GET /api/sessions`

Retourne la liste des sessions enregistrées.

### `GET /api/sessions/:id`

Retourne le détail de la session identifiée par `:id`.

Réponses :

- `200` : session trouvée ;
- `404` : session introuvable.

### `DELETE /api/sessions/:id`

Supprime la session identifiée par `:id`.

Réponse : `204`.

## Conversation

### `POST /api/chat`

Envoie un historique de messages, une longueur de réponse et un profil au serveur. La réponse est un flux NDJSON contenant des événements `token`, `done` ou `error`.

```json
{
  "messages": [
    { "role": "user", "content": "Bonjour" }
  ],
  "length": "normal",
  "profile": {}
}
```

Le serveur filtre l'historique, limite les champs du profil et borne les paramètres techniques avant de les transmettre à Ollama.
