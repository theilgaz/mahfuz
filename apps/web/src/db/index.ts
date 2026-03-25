import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as authSchema from "./schema";
import * as quranSchema from "./quran-schema";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:./local.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client, {
  schema: { ...authSchema, ...quranSchema },
});

export type Database = typeof db;

export * from "./schema";
export * from "./quran-schema";
