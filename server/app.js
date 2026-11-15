import express from "express";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import apiRoutes from "./routes.js";
import { errorHandler, jsonBody, notFound } from "./middleware/http.js";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export function createApp() {
  const app = express();

  app.use(jsonBody);
  app.use(express.static(resolve(rootDir, "dist")));
  app.use("/api", apiRoutes);
  app.use("/api", notFound);
  app.use(errorHandler);

  return app;
}
