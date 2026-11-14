import express from "express";
import { PORT } from "./server/config.js";
import apiRoutes from "./server/routes.js";
import { errorHandler, jsonBody, notFound } from "./server/middleware/http.js";

const app = express();

app.use(jsonBody);
app.use(express.static("dist"));
app.use("/api", apiRoutes);
app.use("/api", notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Morphee sur http://localhost:${PORT}`);
});
