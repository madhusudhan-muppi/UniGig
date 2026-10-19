import fs from "node:fs";
import { defineConfig } from "drizzle-kit";

// data/ is gitignored, so it doesn't exist on a fresh clone; SQLite won't create it.
fs.mkdirSync("./data", { recursive: true });

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: "./data/unigig.db",
  },
});
