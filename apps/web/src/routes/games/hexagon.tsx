/**
 * Kelime Dizme -- Ayetteki bos kelimeyi karisik harflerden siraya tiklayarak tamamla.
 * Bulmaca bazli zorluk, zaman bonusu, yanlis cezasi.
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { submitScore } from "~/lib/score-service";
import { useTranslation } from "~/hooks/useTranslation";
import { GAME_THEMES } from "~/lib/game-themes";
import {
  calcCorrectPoints,
  calcWrongPenalty,
  formatDelta,
  type Difficulty,
} from "~/lib/game-scoring";

const THEME = GAME_THEMES["hexagon"];
const P = THEME.primary;

export const Route = createFileRoute("/games/hexagon")({
  component: HexagonPage,
});

// -- Bulmaca Verisi --

interface WordPuzzle {
  id: number;
  label: string;
  ayahBefore: string;
  ayahAfter: string;
  targetWord: string;
  meaning: string;
  difficulty: Difficulty;
}

const PUZZLES: WordPuzzle[] = [
  { id: 1, label: "\u0627\u0644\u0641\u0627\u062A\u062D\u0629 \u00b7 \u0661", ayahBefore: "\u0628\u0650\u0633\u0652\u0645\u0650 \u0671\u0644\u0644\u0651\u064E\u0647\u0650 \u0671\u0644\u0631\u0651\u064E\u062D\u0652\u0645\u064E\u0670\u0646\u0650", ayahAfter: "", targetWord: "\u0627\u0644\u0631\u062D\u064A\u0645", meaning: "\u00e7ok merhametli", difficulty: "easy" },
  { id: 2, label: "\u0627\u0644\u0641\u0627\u062A\u062D\u0629 \u00b7 \u0662", ayahBefore: "", ayahAfter: "\u0644\u0650\u0644\u0651\u064E\u0647\u0650 \u0631\u064E\u0628\u0651\u0650 \u0671\u0644\u0652\u0639\u064E\u0670\u0644\u064E\u0645\u0650\u064A\u0646\u064E", targetWord: "\u0627\u0644\u062D\u0645\u062F", meaning: "hamd, \u00f6vg\u00fc", difficulty: "easy" },
  { id: 3, label: "\u0627\u0644\u0625\u062E\u0644\u0627\u0635 \u00b7 \u0661", ayahBefore: "\u0642\u064F\u0644\u0652 \u0647\u064F\u0648\u064E \u0671\u0644\u0644\u0651\u064E\u0647\u064F", ayahAfter: "", targetWord: "\u0627\u062D\u062F", meaning: "bir, tek", difficulty: "easy" },
  { id: 4, label: "\u0627\u0644\u0641\u0627\u062A\u062D\u0629 \u00b7 \u0664", ayahBefore: "\u0645\u064E\u0670\u0644\u0650\u0643\u0650 \u064A\u064E\u0648\u0652\u0645\u0650", ayahAfter: "", targetWord: "\u0627\u0644\u062F\u064A\u0646", meaning: "din, hesap g\u00fcn\u00fc", difficulty: "easy" },
  { id: 5, label: "\u0622\u064A\u0629 \u0627\u0644\u0643\u0631\u0633\u064A \u00b7 \u0662\u0665\u0665", ayahBefore: "\u0671\u0644\u0644\u0651\u064E\u0647\u064F \u0644\u064E\u0622 \u0625\u0650\u0644\u064E\u0670\u0647\u064E \u0625\u0650\u0644\u0651\u064E\u0627 \u0647\u064F\u0648\u064E", ayahAfter: "\u0671\u0644\u0652\u0642\u064E\u064A\u0651\u064F\u0648\u0645\u064F", targetWord: "\u0627\u0644\u062D\u064A", meaning: "diri olan (el-Hayy)", difficulty: "medium" },
  { id: 6, label: "\u0627\u0644\u0646\u0627\u0633 \u00b7 \u0661", ayahBefore: "\u0642\u064F\u0644\u0652 \u0623\u064E\u0639\u064F\u0648\u0630\u064F \u0628\u0650\u0631\u064E\u0628\u0651\u0650", ayahAfter: "", targetWord: "\u0627\u0644\u0646\u0627\u0633", meaning: "insanlar", difficulty: "easy" },
  { id: 7, label: "\u0627\u0644\u0628\u0642\u0631\u0629 \u00b7 \u0662\u0668\u0666", ayahBefore: "\u0644\u064E\u0627 \u064A\u064F\u0643\u064E\u0644\u0651\u0650\u0641\u064F \u0671\u0644\u0644\u0651\u064E\u0647\u064F", ayahAfter: "\u0625\u0650\u0644\u0651\u064E\u0627 \u0648\u064F\u0633\u0652\u0639\u064E\u0647\u064E\u0627", targetWord: "\u0646\u0641\u0633\u0627", meaning: "bir nefsi", difficulty: "medium" },
  { id: 8, label: "\u0627\u0644\u0623\u0646\u0641\u0627\u0644 \u00b7 \u0662", ayahBefore: "\u0625\u0650\u0646\u0651\u064E\u0645\u064E\u0627 \u0671\u0644\u0652\u0645\u064F\u0624\u0652\u0645\u0650\u0646\u064F\u0648\u0646\u064E \u0671\u0644\u0651\u064E\u0630\u0650\u064A\u0646\u064E \u0625\u0650\u0630\u064E\u0627 \u0630\u064F\u0643\u0650\u0631\u064E", ayahAfter: "\u0648\u064E\u062C\u0650\u0644\u064E\u062A\u0652 \u0642\u064F\u0644\u064F\u0648\u0628\u064F\u0647\u064F\u0645\u0652", targetWord: "\u0627\u0644\u0644\u0647", meaning: "Allah", difficulty: "easy" },
  { id: 9, label: "\u0627\u0644\u0628\u0642\u0631\u0629 \u00b7 \u0662", ayahBefore: "\u0630\u064E\u0670\u0644\u0650\u0643\u064E \u0671\u0644\u0652\u0643\u0650\u062A\u064E\u0670\u0628\u064F \u0644\u064E\u0627", ayahAfter: "\u0641\u0650\u064A\u0647\u0650 \u0647\u064F\u062F\u064B\u0649 \u0644\u0651\u0650\u0644\u0652\u0645\u064F\u062A\u0651\u064E\u0642\u0650\u064A\u0646\u064E", targetWord: "\u0631\u064A\u0628", meaning: "\u015f\u00fcphe", difficulty: "medium" },
  { id: 10, label: "\u0627\u0644\u0641\u062A\u062D \u00b7 \u0662\u0669", ayahBefore: "\u0645\u0651\u064F\u062D\u064E\u0645\u0651\u064E\u062F\u064C \u0631\u0651\u064E\u0633\u064F\u0648\u0644\u064F", ayahAfter: "\u0648\u064E\u0671\u0644\u0651\u064E\u0630\u0650\u064A\u0646\u064E \u0645\u064E\u0639\u064E\u0647\u064F\u06E5\u0653", targetWord: "\u0627\u0644\u0644\u0647", meaning: "Allah", difficulty: "easy" },
];

// -- Yardimci --

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const ARABIC_NUMS = "\u0660\u0661\u0662\u0663\u0664\u0665\u0666\u0667\u0668\u0669";
const toAr = (n: number) => String(n).replace(/\d/g, (d) => ARABIC_NUMS[+d]);

// -- Oyun --

function WordGame({
  puzzle,
  onBack,
  onNext,
}: {
  puzzle: WordPuzzle;
  onBack: () => void;
  onNext?: () => void;
}) {
  const { t } = useTranslation();
  const letters = [...puzzle.targetWord];
  const n = letters.length;

  const [cells] = useState<string[]>(() => shuffle(letters));
  const [selected, setSelected] = useState<number[]>([]);
  const [shake, setShake] = useState(false);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [status, setStatus] = useState<"playing" | "success">("playing");
  const [totalScore, setTotalScore] = useState(0);
  const [lastDelta, setLastDelta] = useState<number | null>(null);
  const submittedRef = useRef(false);
  const sessionStart = useRef(Date.now());
  const puzzleStart = useRef(Date.now());

  const selectedSet = new Set(selected);

  useEffect(() => {
    if (status === "success" && !submittedRef.current) {
      submittedRef.current = true;
      submitScore({ data: { gameId: "hexagon", score: totalScore, durationMs: Date.now() - sessionStart.current, difficulty: puzzle.difficulty } }).catch(() => {});
    }
  }, [status, totalScore]); // eslint-disable-line react-hooks/exhaustive-deps

  function autoCheck(next: number[]) {
    if (next.length !== n) return;
    const word = next.map((i) => cells[i]).join("");
    if (word === puzzle.targetWord) {
      const answerTime = Date.now() - puzzleStart.current;
      const pts = calcCorrectPoints(puzzle.difficulty, answerTime, 1);
      setTotalScore((s) => s + pts);
      setLastDelta(pts);
      setStatus("success");
    } else {
      const penalty = calcWrongPenalty(puzzle.difficulty);
      setTotalScore((s) => Math.max(0, s - penalty));
      setLastDelta(-penalty);
      setWrongAttempts((c) => c + 1);
      setShake(true);
      setTimeout(() => {
        setShake(false);
        setSelected([]);
        setLastDelta(null);
      }, 600);
    }
  }

  function handleCellClick(idx: number) {
    if (status !== "playing") return;
    if (selectedSet.has(idx)) {
      setSelected((prev) => prev.filter((i) => i !== idx));
    } else {
      const next = [...selected, idx];
      setSelected(next);
      autoCheck(next);
    }
  }

  function handleSlotClick(pos: number) {
    if (status !== "playing") return;
    setSelected((prev) => prev.filter((_, i) => i !== pos));
  }

  const isSuccess = status === "success";

  return (
    <div
      className={`max-w-md mx-auto pb-24 flex flex-col items-center game-bg${shake ? " game-shake" : ""}`}
      style={{ "--game-bg-gradient": `linear-gradient(180deg, ${THEME.bg}, ${THEME.surface})` } as React.CSSProperties}
    >
      {/* Score and puzzle label */}
      <div className="flex items-center justify-between px-5 pt-3 mb-3">
        <span className="game-score-badge" style={{ backgroundColor: `${P}25`, color: P }}>
          {totalScore}
        </span>
        <span className="text-xs opacity-80" dir="rtl" lang="ar" style={{ fontFamily: "var(--font-arabic)" }}>{puzzle.label}</span>
      </div>

      {/* Verse context */}
      <div
        className="w-full px-5 py-4 rounded-2xl bg-[var(--color-surface)] border mb-6 text-center leading-loose game-slide-up"
        dir="rtl" lang="ar"
        style={{ borderColor: `${P}25`, boxShadow: `0 4px 20px ${THEME.glow}` }}
      >
        {puzzle.ayahBefore && (
          <span className="text-xl text-[var(--color-text-primary)]" style={{ fontFamily: "var(--font-arabic)" }}>{puzzle.ayahBefore}{" "}</span>
        )}
        <span className="inline-flex flex-row-reverse gap-1.5 items-center align-middle mx-1">
          {letters.map((_, i) => (
            <span
              key={i}
              className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${!isSuccess ? "game-pulse-glow" : ""}`}
              style={{ backgroundColor: isSuccess ? P : `${P}50`, ["--glow-color" as string]: THEME.glow }}
            />
          ))}
        </span>
        {puzzle.ayahAfter && (
          <span className="text-xl text-[var(--color-text-primary)]" style={{ fontFamily: "var(--font-arabic)" }}>{" "}{puzzle.ayahAfter}</span>
        )}
      </div>

      {/* Answer slots */}
      <div className="flex flex-row-reverse gap-2 mb-6 flex-wrap justify-center">
        {letters.map((_, i) => {
          const cellIdx = selected[i];
          const letter = cellIdx !== undefined ? cells[cellIdx] : null;
          return (
            <button
              key={i}
              onClick={() => letter && handleSlotClick(i)}
              disabled={!letter || isSuccess}
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-medium transition-all duration-200"
              dir="rtl" lang="ar"
              style={{
                fontFamily: "var(--font-arabic)",
                ...(letter
                  ? isSuccess
                    ? { borderColor: P, backgroundColor: `${P}18`, color: P, border: `2px solid ${P}`, boxShadow: `0 0 12px ${THEME.glow}` }
                    : { border: `2px solid var(--color-accent)`, backgroundColor: "var(--color-surface)" }
                  : { border: "2px dashed var(--color-border)" }),
              }}
            >
              {letter ?? ""}
            </button>
          );
        })}
      </div>

      {/* Success feedback */}
      {isSuccess && (
        <div
          className="mb-6 px-5 py-4 rounded-2xl border text-center w-full game-bounce-in"
          style={{ backgroundColor: `${P}12`, borderColor: `${P}40`, boxShadow: `0 4px 20px ${THEME.glow}` }}
        >
          <p className="font-bold text-sm flex items-center justify-center gap-2" style={{ color: P }}>
            <span className="game-star-spin">{"\u2713"}</span>
            {t.hexagonGame.correct} {lastDelta !== null && formatDelta(lastDelta)}
          </p>
          <p className="text-3xl my-2 leading-loose" dir="rtl" lang="ar" style={{ fontFamily: "var(--font-arabic)", color: P }}>{puzzle.targetWord}</p>
          <p className="text-xs" style={{ color: `${P}cc` }}>{puzzle.meaning}</p>
          {wrongAttempts > 0 && (
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">{wrongAttempts} yanlis deneme</p>
          )}
        </div>
      )}

      {/* Letter tiles */}
      {!isSuccess && (
        <>
          <div className="flex flex-row-reverse gap-2.5 flex-wrap justify-center mb-6">
            {cells.map((letter, idx) => {
              const isSel = selectedSet.has(idx);
              return (
                <button
                  key={idx}
                  onClick={() => handleCellClick(idx)}
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-medium transition-all duration-150 active:scale-90"
                  dir="rtl" lang="ar"
                  style={{
                    fontFamily: "var(--font-arabic)",
                    ...(isSel
                      ? { backgroundColor: P, color: "white", border: `2px solid ${P}`, opacity: 0.4, boxShadow: `0 0 8px ${THEME.glow}` }
                      : { backgroundColor: "var(--color-surface)", color: "var(--color-text-primary)", border: `2px solid ${P}30` }),
                  }}
                >
                  {letter}
                </button>
              );
            })}
          </div>

          {lastDelta !== null && lastDelta < 0 && (
            <p className="text-xs text-red-500 font-bold mb-3 game-shake">{formatDelta(lastDelta)}</p>
          )}
        </>
      )}

      {/* Buttons */}
      {!isSuccess ? (
        <button
          onClick={() => setSelected([])}
          disabled={selected.length === 0}
          className="px-6 py-2.5 rounded-xl border text-sm font-medium transition-all active:scale-95 disabled:opacity-40"
          style={{ borderColor: `${P}30`, color: "var(--color-text-secondary)", backgroundColor: "var(--color-surface)" }}
        >
          {t.hexagonGame.clear}
        </button>
      ) : (
        <div className="flex gap-3">
          <button
            onClick={onBack}
            className="px-5 py-2.5 rounded-xl border text-sm font-medium transition-all active:scale-95"
            style={{ borderColor: `${P}30`, color: "var(--color-text-secondary)", backgroundColor: "var(--color-surface)" }}
          >
            {t.hexagonGame.backToList}
          </button>
          {onNext && (
            <button
              onClick={onNext}
              className="px-6 py-2.5 rounded-xl text-white text-sm font-bold transition-all active:scale-95"
              style={{ background: `linear-gradient(135deg, ${P}, ${THEME.secondary})`, boxShadow: `0 2px 10px ${THEME.glow}` }}
            >
              {t.hexagonGame.next}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// -- Bulmaca Listesi --

function PuzzleSelect({ onSelect }: { onSelect: (p: WordPuzzle, idx: number) => void }) {
  const { t } = useTranslation();
  return (
    <div className="max-w-md mx-auto pb-24 game-bg" style={{ "--game-bg-gradient": `linear-gradient(180deg, ${THEME.bg}, ${THEME.surface})` } as React.CSSProperties}>
      <div className="px-4 pt-2 mb-4">
        <p className="text-sm text-[var(--color-text-secondary)]">{t.hexagonGame.listSubtitle}</p>
      </div>

      <div className="flex flex-col gap-2.5 px-4">
        {PUZZLES.map((puzzle, idx) => (
          <button
            key={puzzle.id}
            onClick={() => onSelect(puzzle, idx)}
            className="game-option-card w-full flex items-center gap-4 text-left game-slide-up"
            style={{
              backgroundColor: "var(--color-surface)",
              borderColor: `${P}20`,
              animationDelay: `${idx * 0.05}s`,
            }}
          >
            <div
              className="w-12 h-12 flex flex-col items-center justify-center rounded-xl shrink-0"
              style={{ backgroundColor: `${P}15`, border: `1px solid ${P}30` }}
            >
              <span className="text-lg font-bold" style={{ fontFamily: "var(--font-arabic)", color: P }}>{toAr([...puzzle.targetWord].length)}</span>
              <span className="text-[9px]" style={{ color: `${P}99` }}>{t.hexagonGame.letterUnit}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-base font-semibold text-[var(--color-text-primary)]" dir="rtl" lang="ar" style={{ fontFamily: "var(--font-arabic)" }}>{puzzle.targetWord}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                  puzzle.difficulty === "easy" ? "bg-green-100 text-green-700" :
                  puzzle.difficulty === "medium" ? "bg-yellow-100 text-yellow-700" :
                  "bg-red-100 text-red-700"
                }`}>
                  {puzzle.difficulty === "easy" ? t.hexagonGame.diffEasy : puzzle.difficulty === "medium" ? t.hexagonGame.diffMedium : t.hexagonGame.diffHard}
                </span>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)]">{puzzle.meaning}</p>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 opacity-70" dir="rtl" lang="ar" style={{ fontFamily: "var(--font-arabic)" }}>{puzzle.label}</p>
            </div>
            <svg className="w-4 h-4 text-[var(--color-text-secondary)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}

// -- Sayfa --

function HexagonPage() {
  const [active, setActive] = useState<{ puzzle: WordPuzzle; idx: number } | null>(null);

  if (!active) {
    return <PuzzleSelect onSelect={(puzzle, idx) => setActive({ puzzle, idx })} />;
  }

  const nextPuzzle = PUZZLES[active.idx + 1];

  return (
    <WordGame
      key={active.idx}
      puzzle={active.puzzle}
      onBack={() => setActive(null)}
      onNext={nextPuzzle ? () => setActive({ puzzle: nextPuzzle, idx: active.idx + 1 }) : undefined}
    />
  );
}
