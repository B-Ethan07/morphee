import { createApp } from "./server/app.js";
import { PORT } from "./server/config.js";

const app = createApp();

app.listen(PORT, () => {
  console.log(`Morphee sur http://localhost:${PORT}`);
});
