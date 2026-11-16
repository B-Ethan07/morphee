import fs from "node:fs";
import path from "node:path";
import pdf from "pdf-parse";

/**
 * Parses a file and extracts its text content based on the file extension.
 * @param {string} filePath - The absolute path to the file.
 * @returns {Promise<string>} - The extracted text content.
 */
export async function parseFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const fileBuffer = fs.readFileSync(filePath);

  switch (ext) {
    case ".pdf":
      const data = await pdf(fileBuffer);
      return data.text;
    case ".md":
    case ".txt":
    case ".js":
    case ".ts":
    case ".json":
    case ".html":
    case ".css":
    case ".vue":
      return fileBuffer.toString("utf8");
    default:
      throw new Error(`Unsupported file type: ${ext}`);
  }
}

/**
 * Splits text into overlapping chunks.
 * @param {string} text - The text to chunk.
 * @param {number} chunkSize - Maximum characters per chunk.
 * @param {number} overlap - Number of overlapping characters between chunks.
 * @returns {string[]} - Array of text chunks.
 */
export function chunkText(text, chunkSize = 1000, overlap = 200) {
  const chunks = [];
  let i = 0;

  while (i < text.length) {
    const chunk = text.substring(i, i + chunkSize);
    chunks.push(chunk);
    i += chunkSize - overlap;

    // Safety break to prevent infinite loop if overlap >= chunkSize
    if (chunkSize <= overlap) break;
  }

  return chunks;
}
