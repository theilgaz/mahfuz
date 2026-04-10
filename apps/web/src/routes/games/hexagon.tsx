/**
 * Kelime Dizme — Ayetteki boş kelimeyi karışık harflerden sıraya tıklayarak tamamla.
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { submitScore } from "~/lib/score-service";
import { useTranslation } from "~/hooks/useTranslation";

export const Route = createFileRoute("/games/hexagon")({
  component: HexagonPage,
});

// ── Bulmaca Verisi ────────────────────────────────────────

interface WordPuzzle {
  id: number;
  label: string;
  ayahBefore: string;
  ayahAfter: string;
  targetWord: string;
  meaning: string;
  difficulty: "easy" | "medium" | "hard";
}

const PUZZLES: WordPuzzle[] = [
  {
    id: 1,
    label: "الفاتحة · ١",
    ayahBefore: "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ",
    ayahAfter: "",
    targetWord: "الرحيم",
    meaning: "çok merhametli",
    difficulty: "easy",
  },
  {
    id: 2,
    label: "الفاتحة · ٢",
    ayahBefore: "",
    ayahAfter: "لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ",
    targetWord: "الحمد",
    meaning: "hamd, övgü",
    difficulty: "easy",
  },
  {
    id: 3,
    label: "الإخلاص · ١",
    ayahBefore: "قُلْ هُوَ ٱللَّهُ",
    ayahAfter: "",
    targetWord: "احد",
    meaning: "bir, tek",
    difficulty: "easy",
  },
  {
    id: 4,
    label: "الفاتحة · ٤",
    ayahBefore: "مَٰلِكِ يَوْمِ",
    ayahAfter: "",
    targetWord: "الدين",
    meaning: "din, hesap günü",
    difficulty: "easy",
  },
  {
    id: 5,
    label: "آية الكرسي · ٢٥٥",
    ayahBefore: "ٱللَّهُ لَآ إِلَٰهَ إِلَّا هُوَ",
    ayahAfter: "ٱلْقَيُّومُ",
    targetWord: "الحي",
    meaning: "diri olan (el-Hayy)",
    difficulty: "medium",
  },
  {
    id: 6,
    label: "الناس · ١",
    ayahBefore: "قُلْ أَعُوذُ بِرَبِّ",
    ayahAfter: "",
    targetWord: "الناس",
    meaning: "insanlar",
    difficulty: "easy",
  },
  {
    id: 7,
    label: "البقرة · ٢٨٦",
    ayahBefore: "لَا يُكَلِّفُ ٱللَّهُ",
    ayahAfter: "إِلَّا وُسْعَهَا",
    targetWord: "نفسا",
    meaning: "bir nefsi",
    difficulty: "medium",
  },
  {
    id: 8,
    label: "الأنفال · ٢",
    ayahBefore: "إِنَّمَا ٱلْمُؤْمِنُونَ ٱلَّذِينَ إِذَا ذُكِرَ",
    ayahAfter: "وَجِلَتْ قُلُوبُهُمْ",
    targetWord: "الله",
    meaning: "Allah",
    difficulty: "easy",
  },
  {
    id: 9,
    label: "البقرة · ٢",
    ayahBefore: "ذَٰلِكَ ٱلْكِتَٰبُ لَا",
    ayahAfter: "فِيهِ هُدًى لِّلْمُتَّقِينَ",
    targetWord: "ريب",
    meaning: "şüphe",
    difficulty: "medium",
  },
  {
    id: 10,
    label: "الفتح · ٢٩",
    ayahBefore: "مُّحَمَّدٌ رَّسُولُ",
    ayahAfter: "وَٱلَّذِينَ مَعَهُۥٓ",
    targetWord: "الله",
    meaning: "Allah",
    difficulty: "easy",
  },
];

// ── Yardımcı ─────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const ARABIC_NUMS = "٠١٢٣٤٥٦٧٨٩";
const toAr = (n: number) => String(n).replace(/\d/g, (d) => ARABIC_NUMS[+d]);

// ── Oyun ──────────────────────────────────────────────────

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
  const [selected, setSelected] = useState<number[]>([]); // seçilen cell indeksleri (sırayla)
  const [shake, setShake] = useState(false);
  const [status, setStatus] = useState<"playing" | "success">("playing");
  const [totalScore, setTotalScore] = useState(0);
  const submittedRef = useRef(false);
  const sessionStart = useRef(Date.now());

  const selectedSet = new Set(selected);

  // Başarıda skoru kaydet
  useEffect(() => {
    if (status === "success" && !submittedRef.current) {
      const pts = totalScore + 10; // bu bulmaca için +10
      submittedRef.current = true;
      submitScore({ data: { gameId: "hexagon", score: pts, durationMs: Date.now() - sessionStart.current } }).catch(() => {});
    }
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  function autoCheck(next: number[]) {
    if (next.length !== n) return;
    const word = next.map((i) => cells[i]).join("");
    if (word === puzzle.targetWord) {
      setTotalScore((s) => s + 10);
      setStatus("success");
    } else {
      setShake(true);
      setTimeout(() => {
        setShake(false);
        setSelected([]);
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
    <div className={`max-w-md mx-auto px-4 py-6 pb-24 flex flex-col items-center${shake ? " animate-[shake_0.3s_ease]" : ""}`}>

      {/* Başlık */}
      <div className="w-full flex items-center gap-3 mb-5">
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1">
          <h1 className="text-base font-bold text-[var(--color-text-primary)]">{t.hexagonGame.title}</h1>
          <p className="text-xs text-[var(--color-text-secondary)]">{t.hexagonGame.gameSubtitle}</p>
        </div>
        <span
          className="text-sm text-[var(--color-text-secondary)]"
          dir="rtl"
          lang="ar"
          style={{ fontFamily: "var(--font-arabic)" }}
        >
          {puzzle.label}
        </span>
      </div>

      {/* Ayet */}
      <div
        className="w-full px-5 py-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] mb-6 text-center leading-loose"
        dir="rtl"
        lang="ar"
      >
        {puzzle.ayahBefore && (
          <span className="text-xl text-[var(--color-text-primary)]" style={{ fontFamily: "var(--font-arabic)" }}>
            {puzzle.ayahBefore}{" "}
          </span>
        )}
        <span className="inline-flex flex-row-reverse gap-1 items-center align-middle mx-1">
          {letters.map((_, i) => (
            <span
              key={i}
              className={`w-2 h-2 rounded-full transition-colors duration-300 ${isSuccess ? "bg-green-500" : "bg-[var(--color-accent)]/40"}`}
            />
          ))}
        </span>
        {puzzle.ayahAfter && (
          <span className="text-xl text-[var(--color-text-primary)]" style={{ fontFamily: "var(--font-arabic)" }}>
            {" "}{puzzle.ayahAfter}
          </span>
        )}
      </div>

      {/* Cevap slotları (üst) */}
      <div className="flex flex-row-reverse gap-2 mb-6 flex-wrap justify-center">
        {letters.map((_, i) => {
          const cellIdx = selected[i];
          const letter = cellIdx !== undefined ? cells[cellIdx] : null;
          return (
            <button
              key={i}
              onClick={() => letter && handleSlotClick(i)}
              disabled={!letter || !isSuccess}
              className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center text-2xl font-medium transition-all duration-150 ${
                letter
                  ? isSuccess
                    ? "border-green-500 bg-green-50 text-green-700"
                    : "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-text-primary)] active:scale-95 cursor-pointer"
                  : "border-dashed border-[var(--color-border)] bg-transparent"
              }`}
              dir="rtl"
              lang="ar"
              style={{ fontFamily: "var(--font-arabic)" }}
            >
              {letter ?? ""}
            </button>
          );
        })}
      </div>

      {/* Başarı */}
      {isSuccess && (
        <div className="mb-6 px-5 py-4 rounded-2xl bg-green-50 border border-green-200 text-center w-full">
          <p className="text-green-700 font-semibold text-sm">{t.hexagonGame.correct}</p>
          <p
            className="text-3xl text-green-800 my-1 leading-loose"
            dir="rtl"
            lang="ar"
            style={{ fontFamily: "var(--font-arabic)" }}
          >
            {puzzle.targetWord}
          </p>
          <p className="text-xs text-green-600">{puzzle.meaning}</p>
        </div>
      )}

      {/* Harf kutuları (alt) */}
      {!isSuccess && (
        <div className="flex flex-row-reverse gap-2 flex-wrap justify-center mb-6">
          {cells.map((letter, idx) => {
            const isSel = selectedSet.has(idx);
            return (
              <button
                key={idx}
                onClick={() => handleCellClick(idx)}
                className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center text-2xl font-medium transition-all duration-150 active:scale-95 ${
                  isSel
                    ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white opacity-40 cursor-pointer"
                    : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:border-[var(--color-accent)]/60 cursor-pointer"
                }`}
                dir="rtl"
                lang="ar"
                style={{ fontFamily: "var(--font-arabic)" }}
              >
                {letter}
              </button>
            );
          })}
        </div>
      )}

      {/* Butonlar */}
      {!isSuccess ? (
        <button
          onClick={() => setSelected([])}
          disabled={selected.length === 0}
          className="px-6 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm font-medium text-[var(--color-text-secondary)] disabled:opacity-40 hover:border-[var(--color-accent)]/50 transition-all"
        >
          {t.hexagonGame.clear}
        </button>
      ) : (
        <div className="flex gap-3">
          <button
            onClick={onBack}
            className="px-5 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm font-medium text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]/50 transition-all"
          >
            {t.hexagonGame.backToList}
          </button>
          {onNext && (
            <button
              onClick={onNext}
              className="px-6 py-2.5 rounded-xl bg-[var(--color-accent)] text-white text-sm font-semibold hover:opacity-90 transition-all"
            >
              {t.hexagonGame.next}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Bulmaca Listesi ───────────────────────────────────────

function PuzzleSelect({ onSelect }: { onSelect: (p: WordPuzzle, idx: number) => void }) {
  const { t } = useTranslation();
  return (
    <div className="max-w-md mx-auto px-4 py-6 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <Link
          to="/games"
          className="p-1.5 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)]">{t.hexagonGame.title}</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">{t.hexagonGame.listSubtitle}</p>
        </div>
      </div>

      <div className="space-y-2">
        {PUZZLES.map((puzzle, idx) => (
          <button
            key={puzzle.id}
            onClick={() => onSelect(puzzle, idx)}
            className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)]/50 hover:shadow-sm transition-all text-left"
          >
            <div className="w-12 h-12 flex flex-col items-center justify-center rounded-xl bg-amber-50 border border-amber-200 shrink-0">
              <span className="text-lg font-bold text-amber-700" style={{ fontFamily: "var(--font-arabic)" }}>
                {toAr([...puzzle.targetWord].length)}
              </span>
              <span className="text-[9px] text-amber-600">{t.hexagonGame.letterUnit}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span
                  className="text-base font-semibold text-[var(--color-text-primary)]"
                  dir="rtl"
                  lang="ar"
                  style={{ fontFamily: "var(--font-arabic)" }}
                >
                  {puzzle.targetWord}
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                  puzzle.difficulty === "easy" ? "bg-green-100 text-green-700" :
                  puzzle.difficulty === "medium" ? "bg-yellow-100 text-yellow-700" :
                  "bg-red-100 text-red-700"
                }`}>
                  {puzzle.difficulty === "easy" ? t.hexagonGame.diffEasy : puzzle.difficulty === "medium" ? t.hexagonGame.diffMedium : t.hexagonGame.diffHard}
                </span>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)]">{puzzle.meaning}</p>
              <p
                className="text-xs text-[var(--color-text-secondary)] mt-0.5 opacity-70"
                dir="rtl"
                lang="ar"
                style={{ fontFamily: "var(--font-arabic)" }}
              >
                {puzzle.label}
              </p>
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

// ── Sayfa ─────────────────────────────────────────────────

function HexagonPage() {
  const [active, setActive] = useState<{ puzzle: WordPuzzle; idx: number } | null>(null);

  if (!active) {
    return <PuzzleSelect onSelect={(puzzle, idx) => setActive({ puzzle, idx })} />;
  }

  const nextPuzzle = PUZZLES[active.idx + 1];

  return (
    <WordGame
      puzzle={active.puzzle}
      onBack={() => setActive(null)}
      onNext={nextPuzzle ? () => setActive({ puzzle: nextPuzzle, idx: active.idx + 1 }) : undefined}
    />
  );
}
