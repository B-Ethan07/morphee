import { randomUUID } from "node:crypto";
import { db } from "../database.js";

const OLLAMA_EMBEDDING_URL =
  process.env.OLLAMA_EMBEDDING_URL || "http://localhost:11434/api/embeddings";
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || "nomic-embed-text";

/**
 * Generates embeddings for a set of text chunks using Ollama.
 * @param {string[]} chunks - Array of text chunks.
 * @returns {Promise<number>}
 */
export async function generateEmbeddings(documentId, chunks) {
  let inserted = 0;
  for (const chunk of chunks) {
    const response = await fetch(OLLAMA_EMBEDDING_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        prompt: chunk,
      }),
    });
    if (!response.ok) {
      throw new Error(`Ollama embeddings a répondu ${response.status}.`);
    }
    const data = await response.json();
    if (!Array.isArray(data.embedding)) {
      throw new Error("Ollama n'a pas renvoyé un embedding valide.");
    }
    if (documentId) {
      db.prepare(
        `INSERT INTO document_chunks (id, document_id, content, embedding)
         VALUES (?, ?, ?, ?)`,
      ).run(randomUUID(), documentId, chunk, JSON.stringify(data.embedding));
      inserted += 1;
    }
  }
  return inserted;
}

export async function generateQueryEmbedding(text) {
  const response = await fetch(OLLAMA_EMBEDDING_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: EMBEDDING_MODEL, prompt: text }),
  });
  if (!response.ok) {
    throw new Error(`Ollama embeddings a répondu ${response.status}.`);
  }
  const data = await response.json();
  if (!Array.isArray(data.embedding)) {
    throw new Error("Ollama n'a pas renvoyé un embedding valide.");
  }
  return data.embedding;
}

/**
 * Performs a simple vector similarity search (placeholder for actual vector search logic).
 * In a production environment, this would use a vector database or a specialized extension like sqlite-vec.
 * @param {number[]} queryEmbedding - The embedding of the user's query.
 * @param {number} topK - Number of relevant chunks to return.
 * @returns {Promise<Array>} - Array of relevant chunks.
 */
export async function searchRelevantChunks(queryEmbedding, topK = 5) {
  if (!Array.isArray(queryEmbedding) || queryEmbedding.length === 0) return [];
  const chunks = db
    .prepare("SELECT content, embedding FROM document_chunks")
    .all();
  const magnitude = (values) =>
    Math.sqrt(values.reduce((sum, value) => sum + value * value, 0));
  const queryMagnitude = magnitude(queryEmbedding);
  if (!queryMagnitude) return [];

  return chunks
    .map((chunk) => {
      const embedding = JSON.parse(chunk.embedding);
      const denominator = queryMagnitude * magnitude(embedding);
      const score =
        denominator === 0
          ? 0
          : embedding.reduce(
              (sum, value, index) => sum + value * (queryEmbedding[index] ?? 0),
              0,
            ) / denominator;
      return { content: chunk.content, score };
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, topK);
}
