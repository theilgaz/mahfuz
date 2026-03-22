import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import type { Verse } from "@mahfuz/shared/types";
import { useTranslation } from "~/hooks/useTranslation";
import type { MemorizeSource, ModeResult, VerseResult, WordResult } from "~/stores/useMemorizationStore";

// Fallback Arabic words for distractor generation
const FALLBACK_WORDS = [
  "\u0671\u0644\u0644\u0651\u064E\u0647\u0650",
  "\u0671\u0644\u0631\u0651\u064E\u062D\u0652\u0645\u064E\u0640\u0670\u0646\u0650",
  "\u0671\u0644\u0631\u0651\u064E\u062D\u0650\u064A\u0645\u0650",
  "\u0671\u0644\u0652\u062D\u064E\u0645\u0652\u062F\u064F",
  "\u0631\u064E\u0628\u0651\u0650",
  "\u0671\u0644\u0652\u0639\u064E\u0640\u0670\u0644\u064E\u0645\u0650\u064A\u0646\u064E",
  "\u0645\u064E\u0640\u0670\u0644\u0650\u0643\u0650",
  "\u064A\u064E\u0648\u0652\u0645\u0650",
  "\u0671\u0644\u062F\u0651\u0650\u064A\u0646\u0650",
  "\u0625\u0650\u064A\u0651\u064E\u0627\u0643\u064E",
  "\u0646\u064E\u0639\u0652\u0628\u064F\u062F\u064F",
  "\u0646\u064E\u0633\u0652\u062A\u064E\u0639\u0650\u064A\u0646\u064F",
  "\u0671\u0647\u0652\u062F\u0650\u0646\u064E\u0627",
  "\u0671\u0644\u0635\u0651\u0650\u0631\u064E\u200C\u0670\u0637\u064E",
  "\u0671\u0644\u0652\u0645\u064F\u0633\u0652\u062A\u064E\u0642\u0650\u064A\u0645\u064E",
  "\u0639\u064E\u0644\u064E\u064A\u0652\u0647\u0650\u0645\u0652",
  "\u0623\u064E\u0646\u0639\u064E\u0645\u0652\u062A\u064E",
  "\u0648\u064E\u0644\u064E\u0627",
  "\u0671\u0644\u0636\u0651\u064E\u0627\u0644\u0651\u0650\u064A\u0646\u064E",
  "\u0623\u064E\u0639\u064F\u0648\u0630\u064F",
];

// Seeded PRNG (mulberry32) — deterministic blanks from surahId
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface BlankSlot {
  flatIdx: number;
  verseIdx: number;
  wordIdx: number;
  verseKey: string;
  wordPosition: number;
  correctWord: string;
  options: string[];
}

interface WordMeta {
  verseIdx: number;
  wordIdx: number;
  verseKey: string;
  wordPosition: number;
  text: string;
}

interface TestModeProps {
  source: MemorizeSource;
  verses: Verse[];
  onVerseChange: (index: number) => void;
  onComplete: (result: ModeResult) => void;
}

export function TestMode({ source, verses, onVerseChange, onComplete }: TestModeProps) {
  const { t } = useTranslation();

  // Stable verse keys — only recompute blanks when verse_keys actually change (not WBW enrichment)
  const verseKeysStr = useMemo(
    () => verses.map((v) => v.verse_key).join(","),
    [verses],
  );

  // Extract all words
  const allWords: WordMeta[] = useMemo(() => {
    const result: WordMeta[] = [];
    verses.forEach((verse, vIdx) => {
      const words = verse.words?.filter((w) => w.char_type_name === "word") || [];
      words.forEach((w, wIdx) => {
        result.push({
          verseIdx: vIdx,
          wordIdx: wIdx,
          verseKey: verse.verse_key,
          wordPosition: w.position,
          text: w.text_imlaei || w.text,
        });
      });
    });
    return result;
  }, [verses]);

  // Build a fast lookup: (verseIdx, wordIdx) → flatIdx
  const flatIdxMap = useMemo(() => {
    const m = new Map<string, number>();
    allWords.forEach((w, i) => m.set(`${w.verseIdx}:${w.wordIdx}`, i));
    return m;
  }, [allWords]);

  // Build blank slots — deterministic via seeded PRNG keyed on surahId + verse keys
  const blanks: BlankSlot[] = useMemo(() => {
    if (allWords.length === 0) return [];

    const rand = mulberry32(source.id * 31337 + allWords.length);
    const totalWords = allWords.length;
    const blankRatio = totalWords <= 20 ? 0.4 : 0.25;
    let blankCount = Math.max(1, Math.round(totalWords * blankRatio));
    blankCount = Math.min(blankCount, 40);

    // Ensure at least 1 blank per verse (if verse has >= 3 words)
    const verseWordCounts = new Map<number, number>();
    allWords.forEach((w) => {
      verseWordCounts.set(w.verseIdx, (verseWordCounts.get(w.verseIdx) || 0) + 1);
    });

    const mandatoryIndices = new Set<number>();
    for (const [vIdx, count] of verseWordCounts) {
      if (count >= 3) {
        const candidates = allWords
          .map((_, i) => i)
          .filter((i) => allWords[i].verseIdx === vIdx);
        const pick = candidates[Math.floor(rand() * candidates.length)];
        mandatoryIndices.add(pick);
      }
    }

    const selectedIndices = new Set(mandatoryIndices);
    const available = seededShuffle(
      allWords.map((_, i) => i).filter((i) => !selectedIndices.has(i)),
      rand,
    );
    let idx = 0;
    while (selectedIndices.size < blankCount && idx < available.length) {
      selectedIndices.add(available[idx]);
      idx++;
    }

    const sortedIndices = [...selectedIndices].sort((a, b) => a - b);

    return sortedIndices.map((flatIdx) => {
      const word = allWords[flatIdx];
      const correct = word.text;

      const sameVerse = allWords.filter(
        (w, i) => w.verseIdx === word.verseIdx && i !== flatIdx,
      );
      const neighborVerses = allWords.filter(
        (w, i) =>
          Math.abs(w.verseIdx - word.verseIdx) <= 2 &&
          w.verseIdx !== word.verseIdx &&
          i !== flatIdx,
      );

      const pool = [...sameVerse, ...neighborVerses].map((w) => w.text);
      const unique = [...new Set(pool)].filter((w) => w !== correct);

      while (unique.length < 4) {
        const fb = FALLBACK_WORDS[Math.floor(rand() * FALLBACK_WORDS.length)];
        if (fb !== correct && !unique.includes(fb)) unique.push(fb);
      }

      const distractors = seededShuffle(unique, rand).slice(0, 3);
      const options = seededShuffle([correct, ...distractors], rand);

      return {
        flatIdx,
        verseIdx: word.verseIdx,
        wordIdx: word.wordIdx,
        verseKey: word.verseKey,
        wordPosition: word.wordPosition,
        correctWord: correct,
        options,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verseKeysStr, source.id]); // stable key — won't recompute on WBW enrichment

  const [currentBlankIdx, setCurrentBlankIdx] = useState(0);
  const [answers, setAnswers] = useState<Map<number, { selected: string; correct: boolean }>>(new Map());
  const [pendingAdvance, setPendingAdvance] = useState(false);
  const wordResultsRef = useRef<WordResult[]>([]);
  const wordStartTime = useRef(Date.now());
  const blankRefs = useRef<Map<number, HTMLSpanElement>>(new Map());
  const currentBlankIdxRef = useRef(currentBlankIdx);
  currentBlankIdxRef.current = currentBlankIdx;

  const blankSet = useMemo(() => new Set(blanks.map((b) => b.flatIdx)), [blanks]);

  const currentBlank = blanks[currentBlankIdx];

  // Track verse changes
  useEffect(() => {
    if (currentBlank) {
      onVerseChange(currentBlank.verseIdx);
    }
  }, [currentBlank?.verseIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll to current blank
  useEffect(() => {
    if (blanks.length === 0) return;
    const el = blankRefs.current.get(blanks[currentBlankIdx]?.flatIdx);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [currentBlankIdx, blanks]);

  const handlePickOption = useCallback(
    (word: string) => {
      const blankIdx = currentBlankIdxRef.current;
      const blank = blanks[blankIdx];
      if (!blank) return;

      const isCorrect = word === blank.correctWord;
      setAnswers((prev) => {
        const next = new Map(prev);
        next.set(blank.flatIdx, { selected: word, correct: isCorrect });
        return next;
      });

      wordResultsRef.current.push({
        wordPosition: blank.wordPosition,
        verseKey: blank.verseKey,
        correct: isCorrect,
        mode: "test",
        timeMs: Date.now() - wordStartTime.current,
      });

      setPendingAdvance(true);

      const delay = isCorrect ? 500 : 1200;
      setTimeout(() => {
        wordStartTime.current = Date.now();
        const nextIdx = currentBlankIdxRef.current + 1;
        if (nextIdx < blanks.length) {
          setCurrentBlankIdx(nextIdx);
          setPendingAdvance(false);
        } else {
          // Build verse results from all answers
          setAnswers((finalAnswers) => {
            const verseMap = new Map<string, { correct: number; total: number }>();
            for (const b of blanks) {
              if (!verseMap.has(b.verseKey))
                verseMap.set(b.verseKey, { correct: 0, total: 0 });
              const v = verseMap.get(b.verseKey)!;
              v.total++;
              const ans = finalAnswers.get(b.flatIdx);
              if (ans?.correct) v.correct++;
            }

            const verseResults: VerseResult[] = [...verseMap.entries()].map(
              ([vk, stats]) => ({
                verseKey: vk,
                mode: "test" as const,
                wordsCorrect: stats.correct,
                wordsTotal: stats.total,
                timeMs: 0,
              }),
            );

            const totalCorrect = verseResults.reduce(
              (s, v) => s + v.wordsCorrect,
              0,
            );
            const totalWords = verseResults.reduce(
              (s, v) => s + v.wordsTotal,
              0,
            );

            onComplete({
              mode: "test",
              source,
              verseResults,
              totalCorrect,
              totalWords,
              completedAt: Date.now(),
            });

            return finalAnswers;
          });
        }
      }, delay);
    },
    [blanks, source, onComplete],
  );

  if (blanks.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  const answeredCount = answers.size;
  const totalBlanks = blanks.length;

  // Whether bottom panel is visible (options or feedback)
  const showBottomPanel =
    (currentBlank && !answers.has(currentBlank.flatIdx) && !pendingAdvance) ||
    (currentBlank && answers.has(currentBlank.flatIdx));

  return (
    <div className="flex flex-col" style={{ minHeight: "calc(100dvh - 200px)" }}>
      {/* Sub-progress */}
      <div className="px-4 pb-2 pt-1">
        <div className="flex items-center justify-between text-[12px] text-[var(--theme-text-tertiary)]">
          <span>{t.memorize.verification.quizTitle}</span>
          <span className="tabular-nums">
            {answeredCount} / {totalBlanks}
          </span>
        </div>
      </div>

      {/* Surah text with blanks */}
      <div
        className="flex-1 overflow-y-auto rounded-2xl bg-[var(--theme-bg-primary)] p-4 shadow-[var(--shadow-card)] sm:p-6"
        dir="rtl"
        style={{ paddingBottom: showBottomPanel ? "calc(280px + env(safe-area-inset-bottom, 0px))" : undefined }}
      >
        {verses.map((verse, vIdx) => {
          const words =
            verse.words?.filter((w) => w.char_type_name === "word") || [];
          return (
            <p
              key={verse.verse_key}
              className="arabic-text mb-3 leading-[2.6] text-[var(--theme-text)]"
              style={{ fontSize: "calc(1.65rem * 1.05)" }}
            >
              {words.map((w, wIdx) => {
                const flatIdx = flatIdxMap.get(`${vIdx}:${wIdx}`) ?? -1;
                const isBlank = blankSet.has(flatIdx);
                const answer = answers.get(flatIdx);

                if (!isBlank) {
                  return (
                    <span key={w.id} className="inline-block">
                      {w.text_imlaei || w.text}{" "}
                    </span>
                  );
                }

                const isCurrent =
                  currentBlank?.flatIdx === flatIdx && !answer;
                const isAnswered = answer !== undefined;

                let pillClass =
                  "inline-block rounded-lg px-1.5 py-0.5 mx-0.5 transition-all ";
                if (isAnswered) {
                  pillClass += answer.correct
                    ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30"
                    : "bg-red-500/15 border border-red-500/30";
                } else if (isCurrent) {
                  pillClass +=
                    "bg-primary-500/15 border-2 border-primary-500 text-primary-500 animate-pulse";
                } else {
                  pillClass +=
                    "bg-[var(--theme-hover-bg)] border border-dashed border-[var(--theme-text-quaternary)] text-[var(--theme-text-quaternary)]";
                }

                return (
                  <span
                    key={w.id}
                    ref={(el) => {
                      if (el) blankRefs.current.set(flatIdx, el);
                    }}
                    className={pillClass}
                  >
                    {isAnswered ? (
                      answer.correct ? (
                        <span className="text-emerald-500">{w.text_imlaei || w.text}</span>
                      ) : (
                        <span>
                          <span className="text-red-400 line-through">{answer.selected}</span>
                          <span className="mx-0.5 text-emerald-500">{w.text_imlaei || w.text}</span>
                        </span>
                      )
                    ) : (
                      "..."
                    )}{" "}
                  </span>
                );
              })}
              <span className="inline-block text-[0.65em] text-[var(--theme-text-quaternary)]">
                {" "}
                ﴿{verse.verse_number}﴾
              </span>
            </p>
          );
        })}
      </div>

      {/* MCQ options — fixed bottom panel */}
      {currentBlank && !answers.has(currentBlank.flatIdx) && !pendingAdvance && (
        <div
          className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--theme-border)] bg-[var(--theme-bg-primary)] px-4 pt-3 shadow-[0_-4px_24px_rgba(0,0,0,0.12)]"
          style={{ paddingBottom: "calc(68px + env(safe-area-inset-bottom, 0px))" }}
        >
          <p className="mb-2.5 text-center text-[12px] font-medium text-[var(--theme-text-tertiary)]">
            {t.memorize.verification.pickWord}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {currentBlank.options.map((word, idx) => (
              <button
                key={`${currentBlank.flatIdx}-${idx}`}
                onClick={() => handlePickOption(word)}
                className="arabic-text rounded-2xl border-2 border-[var(--theme-divider)] bg-[var(--theme-bg-primary)] px-4 py-4 text-center text-[22px] leading-snug text-[var(--theme-text)] transition-all hover:border-primary-400 hover:bg-primary-500/10 active:scale-[0.97] sm:text-[24px]"
              >
                {word}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Feedback flash — fixed bottom panel */}
      {currentBlank && answers.has(currentBlank.flatIdx) && (
        <div
          className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--theme-border)] bg-[var(--theme-bg-primary)] px-4 py-5 text-center shadow-[0_-4px_24px_rgba(0,0,0,0.12)]"
          style={{ paddingBottom: "calc(68px + env(safe-area-inset-bottom, 0px))" }}
        >
          {answers.get(currentBlank.flatIdx)!.correct ? (
            <p className="text-[17px] font-semibold text-emerald-600">
              {t.memorize.verification.correct}
            </p>
          ) : (
            <div>
              <p className="text-[17px] font-semibold text-red-500">
                {t.memorize.verification.wrong}
              </p>
              <p className="arabic-text mt-2 text-[24px] text-emerald-600">
                {currentBlank.correctWord}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
