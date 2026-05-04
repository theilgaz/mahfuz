import { createFileRoute } from "@tanstack/react-router";
import { db } from "~/db";
import { ayahs, surahs } from "~/db/quran-schema";
import { eq, asc } from "drizzle-orm";
import { splitWords } from "~/lib/split-words";

/**
 * GET /api/v1/games/question?type=fill-blank
 * Returns a random verse with words split, one blanked, and 4 options.
 */
export const Route = createFileRoute("/api/v1/games/question")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const url = new URL(request.url);
        const type = url.searchParams.get("type") || "fill-blank";

        if (type !== "fill-blank") {
          return new Response(
            JSON.stringify({ error: "Unsupported question type" }),
            { status: 400, headers: { "Content-Type": "application/json" } },
          );
        }

        // Pick a random verse (from first 30 surahs for manageable word count)
        const TOTAL_VERSES = 6236;
        const randomOffset = Math.floor(Math.random() * Math.min(TOTAL_VERSES, 3000));

        const [verse] = await db
          .select({
            surahId: ayahs.surahId,
            ayahNumber: ayahs.ayahNumber,
            textUthmani: ayahs.textUthmani,
            nameArabic: surahs.nameArabic,
            nameSimple: surahs.nameSimple,
          })
          .from(ayahs)
          .innerJoin(surahs, eq(surahs.id, ayahs.surahId))
          .orderBy(asc(ayahs.id))
          .limit(1)
          .offset(randomOffset);

        if (!verse) {
          return new Response(JSON.stringify(null), {
            headers: { "Content-Type": "application/json" },
          });
        }

        // Split words from uthmani text (secavend-aware)
        const words = splitWords(verse.textUthmani);

        // Need at least 3 words for a meaningful blank
        if (words.length < 3) {
          // Retry with next verse (joined query includes surah data)
          const [fallback] = await db
            .select({
              surahId: ayahs.surahId,
              ayahNumber: ayahs.ayahNumber,
              textUthmani: ayahs.textUthmani,
              nameArabic: surahs.nameArabic,
              nameSimple: surahs.nameSimple,
            })
            .from(ayahs)
            .innerJoin(surahs, eq(surahs.id, ayahs.surahId))
            .orderBy(asc(ayahs.id))
            .limit(1)
            .offset((randomOffset + 1) % TOTAL_VERSES);

          if (!fallback) {
            return new Response(JSON.stringify(null), {
              headers: { "Content-Type": "application/json" },
            });
          }

          const fbWords = splitWords(fallback.textUthmani);

          return buildQuestion(fallback, fallback, fbWords);
        }

        return buildQuestion(verse, verse, words);
      },
    },
  },
});

function buildQuestion(
  verse: { surahId: number; ayahNumber: number; textUthmani: string },
  surah: { nameArabic: string; nameSimple: string } | undefined,
  words: string[],
) {
  // Pick a random word index to blank (avoid first word for bismillah surahs)
  const blankIndex = Math.floor(Math.random() * (words.length - 1)) + (words.length > 2 ? 1 : 0);
  const correctWord = words[blankIndex]!;

  // Build distractors from other words in the verse + some shuffled
  const distractors: string[] = [];
  const otherWords = words.filter((_, i) => i !== blankIndex && _ !== correctWord);

  // Shuffle and pick up to 3
  const shuffled = otherWords.sort(() => Math.random() - 0.5);
  for (const w of shuffled) {
    if (distractors.length >= 3) break;
    if (!distractors.includes(w)) distractors.push(w);
  }

  // If we don't have enough distractors, add some Arabic filler words
  const fillerWords = [
    "\u0627\u0644\u0644\u0647", "\u0627\u0644\u0631\u062d\u0645\u0646",
    "\u0627\u0644\u0631\u062d\u064a\u0645", "\u0627\u0644\u062d\u0645\u062f",
    "\u0631\u0628", "\u0627\u0644\u0639\u0644\u0645\u064a\u0646",
    "\u0645\u0644\u0643", "\u064a\u0648\u0645",
  ];
  while (distractors.length < 3) {
    const filler = fillerWords[Math.floor(Math.random() * fillerWords.length)]!;
    if (filler !== correctWord && !distractors.includes(filler)) {
      distractors.push(filler);
    }
  }

  // Build options (correct + 3 distractors), shuffled
  const options = [correctWord, ...distractors.slice(0, 3)].sort(
    () => Math.random() - 0.5,
  );

  // Build display text with blank
  const displayWords = [...words];
  displayWords[blankIndex] = "___";

  const result = {
    verseKey: `${verse.surahId}:${verse.ayahNumber}`,
    surahName: surah?.nameArabic ?? "",
    surahNameSimple: surah?.nameSimple ?? "",
    displayText: displayWords.join(" "),
    correctWord,
    correctIndex: options.indexOf(correctWord),
    options,
    blankIndex,
  };

  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" },
  });
}
