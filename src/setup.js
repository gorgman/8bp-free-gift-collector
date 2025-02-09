import fs from "fs/promises";

import { logger } from "./logger.js";

await fs.rm("archive", { recursive: true });
const exampleReadme = await fs.readFile("README.example.md", "utf8");
await fs.writeFile("README.md", exampleReadme);
logger("success", "✅ Setup done. Enjoy!");
