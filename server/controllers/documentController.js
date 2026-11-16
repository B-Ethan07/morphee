import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { randomUUID } from "node:crypto";
import { db } from "../database.js";
import { parseFile, chunkText } from "../services/documentService.js";
import { generateEmbeddings } from "../services/vectorService.js";

// Configure multer for local storage
const storage = multer.memoryStorage();
export const uploadDocumentMiddleware = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

export async function uploadDocument(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: "Aucun fichier téléchargé." });
  }

  try {
    const file = req.file;
    const fileName = `${randomUUID()}-${path.basename(file.originalname)}`;
    const uploadPath = path.join(process.env.DATA_DIR ?? "data", "uploads", fileName);

    // Ensure upload directory exists
    const uploadDir = path.dirname(uploadPath);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Save file to disk
    fs.writeFileSync(uploadPath, file.buffer);

    // Create document record
    const documentId = randomUUID();
    db.prepare(
      `INSERT INTO documents (id, name, path, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`
    ).run(documentId, file.originalname, uploadPath, "pending", new Date().toISOString(), new Date().toISOString());

    // Trigger background indexing
    // In a real app, this should be a background job (e.g., BullMQ)
    // For now, we'll do it in the same request but it's not ideal for large files
    void parseFile(uploadPath).then(async (text) => {
      const chunks = chunkText(text);
      if (chunks.length === 0) throw new Error("Le document est vide.");
      await generateEmbeddings(documentId, chunks);
      db.prepare(`UPDATE documents SET status = 'indexed', updated_at = ? WHERE id = ?`).run(new Date().toISOString(), documentId);
    }).catch(err => {
      console.error("Error indexing document:", err);
      db.prepare(`UPDATE documents SET status = 'error', updated_at = ? WHERE id = ?`).run(new Date().toISOString(), documentId);
    });

    return res.status(201).json({ id: documentId, name: file.originalname, status: "indexing" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erreur lors du téléchargement du document." });
  }
}
