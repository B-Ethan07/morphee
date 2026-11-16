import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { randomUUID } from "node:crypto";

const databasePath = resolve(process.env.DATA_DIR ?? "data", "chatbot.db");
mkdirSync(dirname(databasePath), { recursive: true });

export const db = new Database(databasePath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    mode TEXT NOT NULL,
    data TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    path TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS document_chunks (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL,
    content TEXT NOT NULL,
    embedding TEXT NOT NULL,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    profile_id TEXT NOT NULL,
    profile_snapshot TEXT NOT NULL,
    title TEXT NOT NULL,
    summary TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (profile_id) REFERENCES profiles(id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    model TEXT,
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    created_at TEXT NOT NULL,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_messages_session
  ON messages(session_id, id);

`);

const messageColumns = db
  .prepare("PRAGMA table_info(messages)")
  .all()
  .map((column) => column.name);
if (!messageColumns.includes("model")) {
  db.exec("ALTER TABLE messages ADD COLUMN model TEXT");
}
if (!messageColumns.includes("prompt_tokens")) {
  db.exec("ALTER TABLE messages ADD COLUMN prompt_tokens INTEGER");
}
if (!messageColumns.includes("completion_tokens")) {
  db.exec("ALTER TABLE messages ADD COLUMN completion_tokens INTEGER");
}

function now() {
  return new Date().toISOString();
}

function parseProfile(row) {
  return row ? JSON.parse(row.data) : null;
}

export function saveProfile(profile, requestedId) {
  const id = requestedId || randomUUID();
  const timestamp = now();
  db.prepare(
    `
    INSERT INTO profiles (id, name, mode, data, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      mode = excluded.mode,
      data = excluded.data,
      updated_at = excluded.updated_at
  `,
  ).run(
    id,
    typeof profile.name === "string" ? profile.name : "Assistant",
    typeof profile.mode === "string" ? profile.mode : "questions",
    JSON.stringify(profile),
    timestamp,
    timestamp,
  );
  return id;
}

export function getProfile() {
  return getProfileById("default");
}

export function getProfileById(id) {
  return parseProfile(
    db.prepare("SELECT data FROM profiles WHERE id = ?").get(id),
  );
}

export function listProfiles() {
  return db
    .prepare(
      `
      SELECT id, name, mode, data, created_at AS createdAt, updated_at AS updatedAt
      FROM profiles
      ORDER BY updated_at DESC
    `,
    )
    .all()
    .map((profile) => ({
      id: profile.id,
      name: profile.name,
      mode: profile.mode,
      profile: JSON.parse(profile.data),
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    }));
}

export function deleteProfile(id) {
  const usedBySession = db
    .prepare("SELECT 1 FROM sessions WHERE profile_id = ? LIMIT 1")
    .get(id);
  if (usedBySession) return false;
  return db.prepare("DELETE FROM profiles WHERE id = ?").run(id).changes > 0;
}

export function createSession(profile, profileId, requestedId) {
  const id = requestedId || randomUUID();
  const timestamp = now();
  const savedProfileId = profileId || saveProfile(profile);
  db.prepare(
    `
    INSERT INTO sessions
      (id, profile_id, profile_snapshot, title, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `,
  ).run(
    id,
    savedProfileId,
    JSON.stringify(profile),
    "Nouvelle conversation",
    timestamp,
    timestamp,
  );
  return id;
}

export function getLatestSession() {
  return (
    db
      .prepare(
        `
    SELECT id, title, profile_id AS profileId, profile_snapshot AS profileSnapshot
    FROM sessions
    ORDER BY updated_at DESC
    LIMIT 1
  `,
      )
      .get() ?? null
  );
}

export function listSessions() {
  return db
    .prepare(
      `
      SELECT sessions.id, sessions.title, sessions.profile_id AS profileId,
        profiles.name AS profileName, sessions.created_at AS createdAt,
        sessions.updated_at AS updatedAt
      FROM sessions
      JOIN profiles ON profiles.id = sessions.profile_id
      ORDER BY sessions.updated_at DESC
    `,
    )
    .all();
}

export function getSessionDetails(sessionId) {
  const session = db
    .prepare(
      `
      SELECT id, title, profile_id AS profileId,
        profile_snapshot AS profileSnapshot
      FROM sessions
      WHERE id = ?
    `,
    )
    .get(sessionId);
  if (!session) return null;
  return {
    ...session,
    profile: JSON.parse(session.profileSnapshot),
    messages: getMessages(sessionId),
  };
}

export function getSession(sessionId) {
  return (
    db.prepare("SELECT id FROM sessions WHERE id = ?").get(sessionId) ?? null
  );
}

export function getMessages(sessionId) {
  return db
    .prepare(
      `
    SELECT role, content, model, prompt_tokens AS promptTokens,
      completion_tokens AS completionTokens
    FROM messages
    WHERE session_id = ?
    ORDER BY id ASC
  `,
    )
    .all(sessionId);
}

export function getRecentMessages(sessionId, limit = 20) {
  return db
    .prepare(
      `
    SELECT role, content
    FROM (
      SELECT id, role, content
      FROM messages
      WHERE session_id = ?
      ORDER BY id DESC
      LIMIT ?
    )
    ORDER BY id ASC
  `,
    )
    .all(sessionId, limit);
}

export function addMessage(sessionId, role, content, metadata = {}) {
  const timestamp = now();
  db.prepare(
    `
    INSERT INTO messages
      (session_id, role, content, model, prompt_tokens, completion_tokens, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `,
  ).run(
    sessionId,
    role,
    content,
    metadata.model ?? null,
    metadata.promptTokens ?? null,
    metadata.completionTokens ?? null,
    timestamp,
  );
  db.prepare("UPDATE sessions SET updated_at = ? WHERE id = ?").run(
    timestamp,
    sessionId,
  );
  if (role === "user") {
    db.prepare(
      `
      UPDATE sessions
      SET title = CASE
        WHEN title = 'Nouvelle conversation' THEN ?
        ELSE title
      END
      WHERE id = ?
    `,
    ).run(content.slice(0, 80), sessionId);
  }
}

export function deleteSession(sessionId) {
  return (
    db.prepare("DELETE FROM sessions WHERE id = ?").run(sessionId).changes > 0
  );
}

export function listDocuments() {
  return db
    .prepare(
      `SELECT id, name, status, created_at AS createdAt, updated_at AS updatedAt
       FROM documents
       ORDER BY created_at DESC`,
    )
    .all();
}

export function hasDocumentChunks() {
  return Boolean(db.prepare("SELECT 1 FROM document_chunks LIMIT 1").get());
}
