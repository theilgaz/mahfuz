import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: [
    "./src/db/schema.ts",
    "./src/db/quran-schema.ts",
  ],
  out: "./drizzle",
  dialect: "turso",
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL || "file:./local.db",
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
});
