import { createFileRoute } from "@tanstack/react-router";
import { db } from "~/db";
import { surahs } from "~/db/quran-schema";
import { asc } from "drizzle-orm";

export const Route = createFileRoute("/api/v1/surahs")({
  server: {
    handlers: {
      GET: async () => {
        const rows = await db.select().from(surahs).orderBy(asc(surahs.id));
        return new Response(JSON.stringify(rows), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
