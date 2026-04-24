/**
 * Kelime Tahmini -- Quran Wordle.
 * Türkçe anlam ipucu verilir, gizli Arapça kelimeyi 6 denemede tahmin et.
 * Günlük mod (tarih seed) + serbest mod.
 */

import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback, useEffect, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { GAME_THEMES, gameBgStyle } from "~/lib/game-themes";
import { WORD_PAIRS, getLocalizedPair } from "~/lib/word-pairs";
import { useTranslation } from "~/hooks/useTranslation";
import { submitScore } from "~/lib/score-service";
import { GameMiniLeaderboard } from "~/components/GameMiniLeaderboard";

const THEME = GAME_THEMES["kelime-tahmini"];
const P = THEME.primary;
const MAX_GUESSES = 6;

export const Route = createFileRoute("/games/kelime-tahmini")({
  component: KelimeTahminiPage,
});

// ── Arabic letter utils ────────────────────────────────────

/** Strip tashkeel (diacritics) from Arabic text, keep only base consonants + alef variants. */
function stripTashkeel(s: string): string {
  // Remove: fathah, dammah, kasrah, sukun, shaddah, tanween, maddah, superscript alef, etc.
  return s.replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED]/g, "");
}

/** Get visible Arabic letters (no diacritics, no tatweel). */
function getLetters(arabic: string): string[] {
  const stripped = stripTashkeel(arabic).replace(/\u0640/g, ""); // remove tatweel
  return [...stripped];
}

// Arabic keyboard layout (3 rows)
const KB_ROWS = [
  ["ض", "ص", "ث", "ق", "ف", "غ", "ع", "ه", "خ", "ح", "ج"],
  ["ش", "س", "ي", "ب", "ل", "ا", "ت", "ن", "م", "ك"],
  ["ئ", "ء", "ؤ", "ر", "ى", "ة", "و", "ز", "ظ", "ط", "ذ", "د"],
];

// All 28 Arabic letters + extra forms for normalization
const ALEF_VARIANTS = new Set(["أ", "إ", "آ", "ٱ"]);

function normalizeAlef(ch: string): string {
  return ALEF_VARIANTS.has(ch) ? "ا" : ch;
}

// ── Daily seed ─────────────────────────────────────────────

function getDayNumber(): number {
  const epoch = new Date("2026-04-15").getTime(); // launch date
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.floor((today - epoch) / 86_400_000) + 1;
}

function seededIndex(day: number): number {
  // Simple hash for deterministic daily word
  let h = day * 2654435761;
  h = ((h >>> 16) ^ h) * 0x45d9f3b;
  h = ((h >>> 16) ^ h) * 0x45d9f3b;
  h = (h >>> 16) ^ h;
  return Math.abs(h) % WORD_PAIRS.length;
}

// ── Tile evaluation ────────────────────────────────────────

type LetterStatus = "correct" | "present" | "absent";

interface EvalResult {
  letter: string;
  status: LetterStatus;
}

function evaluateGuess(guess: string[], target: string[]): EvalResult[] {
  const result: EvalResult[] = guess.map((l) => ({ letter: l, status: "absent" as LetterStatus }));
  const targetCopy = [...target];

  // First pass: exact matches
  for (let i = 0; i < guess.length; i++) {
    if (normalizeAlef(guess[i]) === normalizeAlef(targetCopy[i])) {
      result[i].status = "correct";
      targetCopy[i] = ""; // consumed
    }
  }

  // Second pass: present but wrong position
  for (let i = 0; i < guess.length; i++) {
    if (result[i].status === "correct") continue;
    const idx = targetCopy.findIndex((t) => t && normalizeAlef(t) === normalizeAlef(guess[i]));
    if (idx !== -1) {
      result[i].status = "present";
      targetCopy[idx] = ""; // consumed
    }
  }

  return result;
}

// ── LocalStorage persistence ───────────────────────────────

const STORAGE_KEY = "mahfuz-kelime-tahmini";

interface StoredStats {
  played: number;
  wins: number;
  currentStreak: number;
  maxStreak: number;
  distribution: number[]; // index 0-5 = guess 1-6
}

function loadStats(): StoredStats {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}-stats`);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { played: 0, wins: 0, currentStreak: 0, maxStreak: 0, distribution: [0, 0, 0, 0, 0, 0] };
}

function saveStats(stats: StoredStats) {
  localStorage.setItem(`${STORAGE_KEY}-stats`, JSON.stringify(stats));
}

interface DailyState {
  day: number;
  guesses: string[][]; // each guess = array of letters
  finished: boolean;
  won: boolean;
}

function loadDaily(day: number): DailyState | null {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}-daily-${day}`);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function saveDaily(state: DailyState) {
  localStorage.setItem(`${STORAGE_KEY}-daily-${state.day}`, JSON.stringify(state));
}

// ── Components ─────────────────────────────────────────────

function KelimeTahminiPage() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<"menu" | "daily" | "free">("menu");

  if (mode === "menu") {
    return <MenuScreen t={t} onSelectMode={setMode} />;
  }

  return <GameScreen t={t} mode={mode} onBack={() => setMode("menu")} />;
}

function MenuScreen({ t, onSelectMode }: { t: any; onSelectMode: (m: "daily" | "free") => void }) {
  const day = getDayNumber();
  const dailySaved = loadDaily(day);
  const stats = loadStats();

  return (
    <div className="max-w-lg mx-auto px-4 py-8 pb-24 game-bg" style={gameBgStyle(THEME, "kelime-tahmini")}>
      {/* Title */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-1">
          {t.kelimeTahmini.daily}
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          {t.gamesHub.kelimeTahminiDesc}
        </p>
      </div>

      {/* Daily card */}
      <button
        onClick={() => onSelectMode("daily")}
        className="w-full p-5 rounded-2xl border text-left mb-3 transition-all hover:border-[var(--color-accent)]/50 active:scale-[0.98]"
        style={{ borderColor: `${P}30`, background: `linear-gradient(135deg, ${P}08, ${P}04)` }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold" style={{ color: P }}>
            {t.kelimeTahmini.dayNumber.replace("{day}", String(day))}
          </span>
          {dailySaved?.finished && (
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={dailySaved.won
                ? { backgroundColor: `${P}20`, color: P }
                : { backgroundColor: "rgba(220,38,38,0.15)", color: "#f87171" }
              }
            >
              {dailySaved.won ? t.kelimeTahmini.win : `${dailySaved.guesses.length}/6`}
            </span>
          )}
        </div>
        <p className="text-lg font-bold text-[var(--color-text-primary)]">
          {t.kelimeTahmini.daily}
        </p>
        <p className="text-xs text-[var(--color-text-secondary)] mt-1">
          {dailySaved?.finished
            ? t.kelimeTahmini.guessCount.replace("{count}", String(dailySaved.guesses.length))
            : `${dailySaved?.guesses.length ?? 0}/6`}
        </p>
      </button>

      {/* Free play */}
      <button
        onClick={() => onSelectMode("free")}
        className="w-full p-4 rounded-2xl border text-left mb-6 transition-all hover:border-[var(--color-accent)]/50 active:scale-[0.98] border-[var(--color-border)] bg-[var(--color-surface)]"
      >
        <p className="text-sm font-bold text-[var(--color-text-primary)]">
          {t.kelimeTahmini.freePlay}
        </p>
        <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
          {t.kelimeTahmini.nextWord}
        </p>
      </button>

      {/* Mini leaderboard */}
      <GameMiniLeaderboard gameId="kelime-tahmini" />

      {/* Stats */}
      {stats.played > 0 && (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <h3 className="text-sm font-bold text-[var(--color-text-primary)] mb-3">{t.kelimeTahmini.stats}</h3>
          <div className="grid grid-cols-4 gap-2 mb-4">
            <StatCell value={stats.played} label={t.kelimeTahmini.played} />
            <StatCell value={stats.played > 0 ? Math.round((stats.wins / stats.played) * 100) : 0} label={t.kelimeTahmini.winRate} />
            <StatCell value={stats.currentStreak} label={t.kelimeTahmini.currentStreak} />
            <StatCell value={stats.maxStreak} label={t.kelimeTahmini.maxStreak} />
          </div>
          <p className="text-xs text-[var(--color-text-secondary)] mb-2">{t.kelimeTahmini.guessDistribution}</p>
          {stats.distribution.map((count, i) => {
            const max = Math.max(1, ...stats.distribution);
            return (
              <div key={i} className="flex items-center gap-2 mb-1">
                <span className="text-xs w-3 text-[var(--color-text-secondary)] tabular-nums">{i + 1}</span>
                <div
                  className="h-5 rounded-sm flex items-center justify-end px-1.5 text-xs font-bold text-white tabular-nums min-w-[20px]"
                  style={{ width: `${Math.max(8, (count / max) * 100)}%`, backgroundColor: P }}
                >
                  {count}
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}

function StatCell({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <p className="text-xl font-extrabold text-[var(--color-text-primary)] tabular-nums">{value}</p>
      <p className="text-[10px] text-[var(--color-text-secondary)] leading-tight">{label}</p>
    </div>
  );
}

function GameScreen({ t, mode, onBack }: { t: any; mode: "daily" | "free"; onBack: () => void }) {
  const { locale } = useTranslation();
  const day = getDayNumber();

  // Pick word
  const wordIndex = useMemo(() => {
    if (mode === "daily") return seededIndex(day);
    return Math.floor(Math.random() * WORD_PAIRS.length);
  }, [mode, day]);

  const pair = WORD_PAIRS[wordIndex];
  const localizedMeaning = getLocalizedPair(pair, locale).meaning;
  const targetLetters = useMemo(() => getLetters(pair.arabic), [pair.arabic]);
  const letterCount = targetLetters.length;

  // Load previous daily state if exists
  const savedDaily = mode === "daily" ? loadDaily(day) : null;

  const [guesses, setGuesses] = useState<string[][]>(savedDaily?.guesses ?? []);

  // Locked (green) positions - memoized from guesses
  const locked = useMemo(() => {
    const arr: (string | null)[] = Array(letterCount).fill(null);
    for (const guess of guesses) {
      const result = evaluateGuess(guess, targetLetters);
      result.forEach(({ letter, status }, i) => {
        if (status === "correct") arr[i] = letter;
      });
    }
    return arr;
  }, [guesses, letterCount, targetLetters]);

  const [currentInput, setCurrentInput] = useState<(string | null)[]>(() => {
    const arr: (string | null)[] = Array(letterCount).fill(null);
    for (const guess of (savedDaily?.guesses ?? [])) {
      const result = evaluateGuess(guess, targetLetters);
      result.forEach(({ letter, status }, i) => {
        if (status === "correct") arr[i] = letter;
      });
    }
    return arr;
  });
  const [finished, setFinished] = useState(savedDaily?.finished ?? false);
  const [won, setWon] = useState(savedDaily?.won ?? false);
  const [shakeRow, setShakeRow] = useState(false);
  const [revealRow, setRevealRow] = useState(-1);
  const [copied, setCopied] = useState(false);

  // Keyboard letter statuses
  const keyStatuses = useMemo(() => {
    const map = new Map<string, LetterStatus>();
    for (const guess of guesses) {
      const result = evaluateGuess(guess, targetLetters);
      result.forEach(({ letter, status }) => {
        const norm = normalizeAlef(letter);
        const current = map.get(norm);
        if (!current || status === "correct" || (status === "present" && current === "absent")) {
          map.set(norm, status);
        }
      });
    }
    return map;
  }, [guesses, targetLetters]);

  const handleKey = useCallback((letter: string) => {
    if (finished) return;
    setCurrentInput((prev) => {
      const next = Array.from({ length: letterCount }, (_, i) => prev[i] ?? null);
      const emptyIdx = next.findIndex((l, i) => locked[i] === null && l === null);
      if (emptyIdx === -1) return prev;
      next[emptyIdx] = letter;
      return next;
    });
  }, [finished, locked, letterCount]);

  const handleBackspace = useCallback(() => {
    if (finished) return;
    setCurrentInput((prev) => {
      const next = [...prev];
      for (let i = next.length - 1; i >= 0; i--) {
        if (locked[i] !== null) continue;
        if (next[i] !== null) {
          next[i] = null;
          return next;
        }
      }
      return prev;
    });
  }, [finished, locked]);

  const handleSubmit = useCallback(() => {
    // Check all slots are filled
    const allFilled = currentInput.length === letterCount && currentInput.every((l) => l !== null && l !== undefined);
    if (finished || !allFilled) {
      if (!allFilled) {
        setShakeRow(true);
        setTimeout(() => setShakeRow(false), 500);
      }
      return;
    }

    const guessLetters = currentInput as string[];
    const newGuesses = [...guesses, guessLetters];
    setGuesses(newGuesses);
    setRevealRow(newGuesses.length - 1);

    // Pre-fill next row with newly locked (correct) letters
    const nextLocked: (string | null)[] = Array(letterCount).fill(null);
    for (const g of newGuesses) {
      evaluateGuess(g, targetLetters).forEach(({ letter, status }, i) => {
        if (status === "correct") nextLocked[i] = letter;
      });
    }
    setCurrentInput(nextLocked);

    const isCorrect = guessLetters.every((l, i) =>
      normalizeAlef(l) === normalizeAlef(targetLetters[i])
    );
    const isLastGuess = newGuesses.length >= MAX_GUESSES;

    if (isCorrect || isLastGuess) {
      setTimeout(() => {
        setFinished(true);
        setWon(isCorrect);

        // Update stats
        const stats = loadStats();
        stats.played++;
        if (isCorrect) {
          stats.wins++;
          stats.currentStreak++;
          stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak);
          stats.distribution[newGuesses.length - 1]++;
        } else {
          stats.currentStreak = 0;
        }
        saveStats(stats);

        // Save daily state
        if (mode === "daily") {
          saveDaily({ day, guesses: newGuesses, finished: true, won: isCorrect });
        }

        // Submit score for leaderboard
        const score = isCorrect ? (MAX_GUESSES - newGuesses.length + 1) * 10 : 0;
        if (score > 0) {
          submitScore({ data: { gameId: "kelime-tahmini", score, correctCount: isCorrect ? 1 : 0, wrongCount: newGuesses.length - (isCorrect ? 1 : 0) } }).catch(() => {});
        }
      }, letterCount * 300 + 400); // wait for flip animation
    } else if (mode === "daily") {
      saveDaily({ day, guesses: newGuesses, finished: false, won: false });
    }

    setTimeout(() => setRevealRow(-1), letterCount * 300 + 200);
  }, [finished, currentInput, letterCount, guesses, targetLetters, mode, day]);

  // Share result
  const handleShare = useCallback(() => {
    const lines = guesses.map((guess) => {
      const result = evaluateGuess(guess, targetLetters);
      return result.map(({ status }) =>
        status === "correct" ? "\uD83D\uDFE9" : status === "present" ? "\uD83D\uDFE8" : "\u2B1C"
      ).join("");
    });
    const dayLabel = mode === "daily" ? `#${day}` : "";
    const text = `Kelime Tahmini ${dayLabel} ${won ? guesses.length : "X"}/${MAX_GUESSES}\n\n${lines.join("\n")}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }, [guesses, targetLetters, mode, day, won]);

  const handleNextWord = useCallback(() => {
    // Free play: reset with new word
    window.location.reload();
  }, []);

  return (
    <div className="max-w-lg mx-auto px-2 flex flex-col overflow-hidden game-bg" style={{ ...gameBgStyle(THEME, "kelime-tahmini"), height: "calc(100dvh - 44px - 56px)" }}>
      {/* Day indicator + Hint */}
      <div className="text-center py-3">
        {mode === "daily" && (
          <span className="text-xs font-medium mr-2" style={{ color: P }}>
            {t.kelimeTahmini.dayNumber.replace("{day}", String(day))}
          </span>
        )}
        <span className="text-xs text-[var(--color-text-secondary)]">{t.kelimeTahmini.hint} </span>
        <span className="text-sm font-bold text-[var(--color-text-primary)]">{localizedMeaning}</span>
        <span className="text-xs text-[var(--color-text-secondary)] ml-2">({letterCount} harf)</span>
      </div>

      {/* Grid */}
      <div className="flex flex-col items-center gap-1 flex-1 justify-center" dir="rtl">
        {Array.from({ length: MAX_GUESSES }).map((_, rowIdx) => {
          const isGuessed = rowIdx < guesses.length;
          const isCurrent = rowIdx === guesses.length && !finished;
          const letters = isGuessed ? guesses[rowIdx] : isCurrent ? currentInput : [];
          const result = isGuessed ? evaluateGuess(guesses[rowIdx], targetLetters) : null;
          const isRevealing = revealRow === rowIdx;
          const isShaking = isCurrent && shakeRow;

          return (
            <div
              key={rowIdx}
              className={`flex gap-1 ${isShaking ? "animate-[game-shake_0.4s_ease]" : ""}`}
            >
              {Array.from({ length: letterCount }).map((_, colIdx) => {
                const letter = letters[colIdx] ?? "";
                const status = result?.[colIdx]?.status;
                const delay = isRevealing ? colIdx * 300 : 0;
                const isLocked = isCurrent && locked[colIdx] !== null;

                let bg = "var(--color-surface)";
                let border = "var(--color-border)";
                let textColor = "var(--color-text-primary)";

                if (status === "correct") {
                  bg = "#22c55e";
                  border = "#22c55e";
                  textColor = "white";
                } else if (status === "present") {
                  bg = "#eab308";
                  border = "#eab308";
                  textColor = "white";
                } else if (status === "absent") {
                  bg = "var(--color-border)";
                  border = "var(--color-border)";
                  textColor = "var(--color-text-secondary)";
                } else if (isLocked) {
                  bg = "rgba(34,197,94,0.15)";
                  border = "#22c55e";
                  textColor = "#22c55e";
                } else if (letter) {
                  border = P;
                }

                return (
                  <div
                    key={colIdx}
                    className="w-11 h-11 flex items-center justify-center rounded-lg border-2 text-lg font-bold transition-all"
                    style={{
                      backgroundColor: bg,
                      borderColor: border,
                      color: textColor,
                      fontFamily: "var(--font-arabic)",
                      animationDelay: isRevealing ? `${delay}ms` : undefined,
                      animation: isRevealing ? `game-cell-flip 0.5s ease ${delay}ms` : undefined,
                    }}
                  >
                    {letter}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Win/Lose message */}
      {finished && (
        <div className="text-center py-3 game-slide-up">
          {won ? (
            <div className="px-4 py-2.5 rounded-xl border mb-2" style={{ backgroundColor: `${P}10`, borderColor: `${P}30` }}>
              <p className="text-sm font-bold" style={{ color: P }}>
                {t.kelimeTahmini.win} {t.kelimeTahmini.guessCount.replace("{count}", String(guesses.length))}
              </p>
            </div>
          ) : (
            <div className="px-4 py-2.5 rounded-xl border mb-2" style={{ backgroundColor: "rgba(220,38,38,0.10)", borderColor: "rgba(239,68,68,0.3)" }}>
              <p className="text-sm font-semibold mb-1" style={{ color: "#f87171" }}>{t.kelimeTahmini.lose}</p>
              <p className="text-2xl font-bold text-[var(--color-text-primary)]" dir="rtl" style={{ fontFamily: "var(--font-arabic)" }}>
                {pair.arabic}
              </p>
            </div>
          )}

          <p className="text-xs text-[var(--color-text-secondary)] mb-3">
            {localizedMeaning}
          </p>

          <div className="flex gap-2 justify-center">
            <button
              onClick={handleShare}
              className="px-6 py-2.5 rounded-xl text-white font-bold text-sm active:scale-95 transition-all"
              style={{ backgroundColor: P }}
            >
              {copied ? t.kelimeTahmini.copied : t.kelimeTahmini.share}
            </button>
            {mode === "free" && (
              <button
                onClick={handleNextWord}
                className="px-6 py-2.5 rounded-xl border font-bold text-sm active:scale-95 transition-all border-[var(--color-border)] text-[var(--color-text-primary)]"
              >
                {t.kelimeTahmini.nextWord}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Arabic Keyboard - pinned to bottom */}
      {!finished && (
        <div className="flex flex-col items-center gap-1 pb-3 pt-2 shrink-0">
          {KB_ROWS.map((row, rowIdx) => (
            <div key={rowIdx} className="flex gap-[3px] w-full justify-center">
              {rowIdx === 2 && (
                <button
                  onClick={handleSubmit}
                  className="h-10 px-2 rounded-md text-[11px] font-bold text-white active:scale-95 transition-all shrink-0"
                  style={{ backgroundColor: P }}
                >
                  {t.kelimeTahmini.submit}
                </button>
              )}
              {row.map((letter) => {
                const norm = normalizeAlef(letter);
                const status = keyStatuses.get(norm);
                let kbBg = "var(--color-surface)";
                let kbText = "var(--color-text-primary)";
                let kbBorder = "var(--color-border)";

                if (status === "correct") {
                  kbBg = "#22c55e"; kbText = "white"; kbBorder = "#22c55e";
                } else if (status === "present") {
                  kbBg = "#eab308"; kbText = "white"; kbBorder = "#eab308";
                } else if (status === "absent") {
                  kbBg = "var(--color-border)"; kbText = "var(--color-text-secondary)"; kbBorder = "transparent";
                }

                return (
                  <button
                    key={letter}
                    onClick={() => handleKey(letter)}
                    className="flex-1 min-w-0 h-10 rounded-md border text-[15px] font-semibold active:scale-90 transition-all flex items-center justify-center"
                    style={{
                      backgroundColor: kbBg,
                      color: kbText,
                      borderColor: kbBorder,
                      fontFamily: "var(--font-arabic)",
                      maxWidth: "32px",
                    }}
                    dir="rtl"
                  >
                    {letter}
                  </button>
                );
              })}
              {rowIdx === 2 && (
                <button
                  onClick={handleBackspace}
                  className="h-10 px-2 rounded-md text-[11px] font-bold border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] active:scale-95 transition-all shrink-0"
                >
                  {t.kelimeTahmini.backspace}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
