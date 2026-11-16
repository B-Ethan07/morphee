import axios from "axios";
import { db } from "./database.js"; // Assuming db is exported from database.js

const OLLAMA_EMBEDDING_URL =
  process.env.OLLAMA_EMBEDDING_URL || "http://localhost:11434/api/embeddings";
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || "nomic-embed-text";

/**
 * Generates embeddings for a set of text chunks using Ollama.
 * @param {string[]} chunks - Array of text chunks.
 * @returns {Promise<void>}
 */
export async function generateEmbeddings(documentId, chunks) {
  for (const chunk of chunks) {
    try {
      const response = await axios.post(OLLAMA_EMBEDDING_URL, {
        model: EMBEDDING_MODEL,
        prompt: chunk,
      });

      const embedding = response.data.embedding;

      db.prepare(
        `
        INSERT INTO document_chunks (document_id, content, embedding)
        VALUES (?, ?, ?)
        `,
      ).run(documentId, chunk, JSON.stringify(embedding));
    } catch (error) {
      console.error(`Error generating embedding for chunk: ${error.message}`);
    }
  }
}

/**
 * Performs a simple vector similarity search (placeholder for actual vector search logic).
 * In a production environment, this would use a vector database or a specialized extension like sqlite-vec.
 * @param {number[]} queryEmbedding - The embedding of the user's query.
 * @param {number} topK - Number of relevant chunks to return.
 * @returns {Promise<Array>} - Array of relevant chunks.
 */
export async function searchRelevantChunks(queryEmbedding, topK = 5) {
  // Placeholder: This is where you would implement the actual vector similarity search.
  // For now, it returns all chunks for the document.
  // This will be replaced with a proper vector search implementation in a later step.
  return db
    .prepare(
      `
    SELECT content FROM document_chunks 
    ORDER BY RANDOM() 
    LIMIT ?
  `,
    )
    .all(topK);
}
