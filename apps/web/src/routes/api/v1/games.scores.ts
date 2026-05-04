import { createFileRoute } from "@tanstack/react-router";
import { auth } from "~/lib/auth";
import { db } from "~/db";
import { gameScores } from "~/db/ikra-schema";
import { user } from "~/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";

/**
 * POST /api/v1/games/scores — Submit a game score (requires auth)
 * GET  /api/v1/games/scores — Get leaderboard (public)
 */
export const Route = createFileRoute("/api/v1/games/scores")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session?.user) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        const body = await request.json();
        const { gameId, score, correct, wrong, streak } = body;

        if (!gameId || typeof score !== "number") {
          return new Response(
            JSON.stringify({ error: "gameId and score are required" }),
            { status: 400, headers: { "Content-Type": "application/json" } },
          );
        }

        const id = randomUUID();
        const now = Date.now();

        await db.insert(gameScores).values({
          id,
          userId: session.user.id,
          gameId,
          score,
          metadata: JSON.stringify({ correct, wrong, streak }),
          createdAt: now,
        });

        // Calculate rank for this game
        const rankResult = await db
          .select({
            count: sql<number>`count(distinct ${gameScores.userId})`,
          })
          .from(gameScores)
          .where(eq(gameScores.gameId, gameId))
          .groupBy(gameScores.userId)
          .having(
            sql`max(${gameScores.score}) > ${score}`,
          );

        const rank = rankResult.length + 1;

        return new Response(JSON.stringify({ ok: true, rank }), {
          headers: { "Content-Type": "application/json" },
        });
      },

      GET: async ({ request }: { request: Request }) => {
        const url = new URL(request.url);
        const gameId = url.searchParams.get("gameId");
        const limit = Math.min(Number(url.searchParams.get("limit") || 10), 50);

        if (gameId) {
          // Per-game leaderboard: best score per user for this game
          const rows = await db
            .select({
              userId: gameScores.userId,
              name: user.name,
              score: sql<number>`max(${gameScores.score})`.as("best_score"),
              playCount: sql<number>`count(${gameScores.id})`.as("play_count"),
            })
            .from(gameScores)
            .innerJoin(user, eq(gameScores.userId, user.id))
            .where(eq(gameScores.gameId, gameId))
            .groupBy(gameScores.userId)
            .orderBy(desc(sql`best_score`))
            .limit(limit);

          return new Response(JSON.stringify(rows), {
            headers: { "Content-Type": "application/json" },
          });
        }

        // Global leaderboard: sum of best score per game per user
        const bestPerGame = db
          .select({
            userId: gameScores.userId,
            bestScore: sql<number>`max(${gameScores.score})`.as("best_score"),
            gamePlayCount: sql<number>`count(${gameScores.id})`.as("game_play_count"),
          })
          .from(gameScores)
          .groupBy(gameScores.userId, gameScores.gameId)
          .as("best_per_game");

        const rows = await db
          .select({
            userId: bestPerGame.userId,
            name: user.name,
            score: sql<number>`sum(${bestPerGame.bestScore})`.as("total_score"),
            playCount: sql<number>`sum(${bestPerGame.gamePlayCount})`.as("play_count"),
          })
          .from(bestPerGame)
          .innerJoin(user, eq(bestPerGame.userId, user.id))
          .groupBy(bestPerGame.userId)
          .orderBy(desc(sql`total_score`))
          .limit(limit);

        return new Response(JSON.stringify(rows), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
