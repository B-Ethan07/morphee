import express from "express";

export const jsonBody = express.json({ limit: "1mb" });

export function notFound(_req, res) {
  res.status(404).json({ error: "Route introuvable." });
}

export function errorHandler(error, _req, res, _next) {
  console.error(error);
  if (res.headersSent) return;
  res.status(500).json({ error: "Erreur interne du serveur." });
}
