/**
 * Hexagon Harf — bal peteği harflerden Kuran kelimesi oluştur.
 * Merkez harf zorunlu, diğerleri isteğe bağlı. Min 3 harf.
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { STATIC_PUZZLES, normalizeAr, isWordValid, hasCenterLetter, calcPoints } from "~/lib/hexagon-service";
import type { HexagonPuzzle, HexWord } from "~/lib/hexagon-service";

export const Route = createFileRoute("/games/hexagon")({
  component: HexagonPage,
});

// ── SVG Honeycomb ─────────────────────────────────────────

const HEX_R = 44; // iç yarıçap
const GAP = 4;
const HEX_STEP = HEX_R * 2 + GAP;

/** Altıgen merkezlerini hesapla: [merkez, 6 çevre] */
function hexCenters(): { x: number; y: number }[] {
  const cx = 150;
  const cy = 150;
  const angles = [270, 330, 30, 90, 150, 210]; // derece
  return [
    { x: cx, y: cy },
    ...angles.map((deg) => ({
      x: cx + HEX_STEP * Math.cos((deg * Math.PI) / 180),
      y: cy + HEX_STEP * Math.sin((deg * Math.PI) / 180),
    })),
  ];
}

function hexPath(cx: number, cy: number, r: number): string {
  const pts = Array.from({ length: 6 }, (_, i) => {
    const a = (60 * i - 30) * (Math.PI / 180);
    return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
  });
  return `M${pts.join("L")}Z`;
}

const CENTERS = hexCenters();

interface HexCellProps {
  cx: number;
  cy: number;
  letter: string;
  isCenter: boolean;
  isActive: boolean;
  onClick: () => void;
}

function HexCell({ cx, cy, letter, isCenter, isActive, onClick }: HexCellProps) {
  const fill = isCenter
    ? isActive ? "var(--color-accent)" : "#d97706"
    : isActive ? "var(--color-accent)" : "var(--color-surface)";

  return (
    <g onClick={onClick} style={{ cursor: "pointer" }}>
      <path
        d={hexPath(cx, cy, HEX_R - 2)}
        fill={fill}
        stroke="var(--color-border)"
        strokeWidth={isActive ? 2 : 1}
        style={{ transition: "fill 0.1s" }}
      />
      <text
        x={cx}
        y={cy + 7}
        textAnchor="middle"
        fontSize={22}
        fontFamily="var(--font-arabic)"
        fill={isCenter || isActive ? "white" : "var(--color-text-primary)"}
        style={{ pointerEvents: "none", userSelect: "none" }}
      >
        {letter}
      </text>
    </g>
  );
}

// ── Ana Oyun ──────────────────────────────────────────────

function HexagonGame({ puzzle }: { puzzle: HexagonPuzzle }) {
  const [current, setCurrent] = useState<string[]>([]);
  const [found, setFound] = useState<(HexWord & { word: string })[]>([]);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(null);
  const [activeLetters, setActiveLetters] = useState<Set<number>>(new Set());
  const [shake, setShake] = useState(false);

  const allLetters = [puzzle.centerLetter, ...puzzle.outerLetters];
  const allSet = new Set(allLetters);
  const currentWord = current.join("");

  const showFeedback = (msg: string, ok: boolean) => {
    setFeedback({ msg, ok });
    setTimeout(() => setFeedback(null), 1500);
  };

  const handleLetterClick = (letter: string, idx: number) => {
    setCurrent((prev) => [...prev, letter]);
    setActiveLetters((prev) => new Set([...prev, idx]));
  };

  const handleDelete = () => {
    if (current.length === 0) return;
    setCurrent((prev) => {
      const next = [...prev];
      next.pop();
      // En son eklenen harfin index'ini bul ve kaldır
      return next;
    });
    setActiveLetters(new Set());
  };

  const handleSubmit = () => {
    if (currentWord.length < 3) {
      setShake(true);
      setTimeout(() => setShake(false), 400);
      showFeedback("En az 3 harf gerekli", false);
      return;
    }

    const normalized = normalizeAr(currentWord);

    if (!hasCenterLetter(normalized, normalizeAr(puzzle.centerLetter))) {
      setShake(true);
      setTimeout(() => setShake(false), 400);
      showFeedback(`"${puzzle.centerLetter}" merkez harfi gerekli`, false);
      return;
    }

    if (!isWordValid(normalized, new Set(allLetters.map(normalizeAr)))) {
      setShake(true);
      setTimeout(() => setShake(false), 400);
      showFeedback("Geçersiz harf kullanıldı", false);
      return;
    }

    // Daha önce bulundu mu?
    if (found.some((f) => normalizeAr(f.word) === normalized)) {
      showFeedback("Bu kelimeyi zaten buldunuz!", false);
      setCurrent([]);
      setActiveLetters(new Set());
      return;
    }

    // Önceden tanımlı kelimede mi?
    const knownWord = puzzle.validWords.find((w) => normalizeAr(w.arabic) === normalized);
    if (knownWord) {
      const pts = calcPoints(normalized, new Set(allLetters.map(normalizeAr)));
      setFound((prev) => [...prev, { ...knownWord, word: currentWord, points: pts }]);
      setScore((s) => s + pts);
      showFeedback(`+${pts} puan! ${knownWord.meaning}`, true);
      setCurrent([]);
      setActiveLetters(new Set());
      return;
    }

    // Bilinmeyen — hata
    setShake(true);
    setTimeout(() => setShake(false), 400);
    showFeedback("Bu kelime listede yok", false);
    setCurrent([]);
    setActiveLetters(new Set());
  };

  const maxScore = puzzle.validWords.reduce((s, w) => s + w.points, 0);
  const progress = Math.min(100, (score / maxScore) * 100);

  return (
    <div className="max-w-md mx-auto px-4 py-6 pb-24 flex flex-col items-center">
      {/* Başlık */}
      <div className="w-full flex items-center gap-3 mb-4">
        <Link to="/games" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-[var(--color-text-primary)]">Hexagon Harf</h1>
          <p className="text-xs text-[var(--color-text-secondary)]">
            Merkez harf dahil Kuran kelimesi oluştur
          </p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-[var(--color-accent)]">{score}</p>
          <p className="text-[10px] text-[var(--color-text-secondary)]">/ {maxScore} puan</p>
        </div>
      </div>

      {/* Progress */}
      <div className="w-full h-1.5 bg-[var(--color-border)] rounded-full mb-5 overflow-hidden">
        <div
          className="h-full bg-[var(--color-accent)] rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Zorluk */}
      <div className="mb-3">
        <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
          puzzle.difficulty === "easy" ? "bg-green-100 text-green-700" :
          puzzle.difficulty === "medium" ? "bg-yellow-100 text-yellow-700" :
          "bg-red-100 text-red-700"
        }`}>
          {puzzle.difficulty === "easy" ? "Kolay" : puzzle.difficulty === "medium" ? "Orta" : "Zor"}
        </span>
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div className={`mb-3 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
          feedback.ok
            ? "bg-green-100 text-green-700 border border-green-200"
            : "bg-red-50 text-red-600 border border-red-200"
        }`}>
          {feedback.msg}
        </div>
      )}

      {/* Kelime alanı */}
      <div
        className={`mb-4 min-h-[48px] px-5 py-3 rounded-xl border-2 bg-[var(--color-surface)] text-center transition-all ${
          shake ? "animate-[shake_0.3s_ease]" : ""
        } ${currentWord.length > 0 ? "border-[var(--color-accent)]" : "border-[var(--color-border)]"}`}
        dir="rtl"
        lang="ar"
        style={{ fontFamily: "var(--font-arabic)", minWidth: "200px" }}
      >
        <span className={`text-2xl leading-loose ${currentWord.length > 0 ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-secondary)]"}`}>
          {currentWord || "..."}
        </span>
      </div>

      {/* Honeycomb SVG */}
      <svg width="300" height="300" viewBox="0 0 300 300" className="mb-4">
        {CENTERS.map((c, i) => (
          <HexCell
            key={i}
            cx={c.x}
            cy={c.y}
            letter={allLetters[i]}
            isCenter={i === 0}
            isActive={false}
            onClick={() => handleLetterClick(allLetters[i], i)}
          />
        ))}
      </svg>

      {/* Butonlar */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={handleDelete}
          disabled={current.length === 0}
          className="px-5 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm font-medium text-[var(--color-text-secondary)] disabled:opacity-40 hover:border-[var(--color-accent)]/50 transition-all"
        >
          Sil
        </button>
        <button
          onClick={() => { setCurrent([]); setActiveLetters(new Set()); }}
          disabled={current.length === 0}
          className="px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm font-medium text-[var(--color-text-secondary)] disabled:opacity-40 hover:border-[var(--color-accent)]/50 transition-all"
        >
          Temizle
        </button>
        <button
          onClick={handleSubmit}
          disabled={current.length < 3}
          className="flex-1 px-5 py-2.5 rounded-xl bg-[var(--color-accent)] text-white text-sm font-semibold disabled:opacity-40 hover:opacity-90 transition-all"
        >
          Gönder
        </button>
      </div>

      {/* Bulunan kelimeler */}
      {found.length > 0 && (
        <div className="w-full">
          <h3 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2">
            Bulunanlar ({found.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {found.map((w, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20"
              >
                <span
                  className="text-base text-[var(--color-text-primary)]"
                  dir="rtl"
                  lang="ar"
                  style={{ fontFamily: "var(--font-arabic)" }}
                >
                  {w.word}
                </span>
                <span className="text-[10px] text-[var(--color-text-secondary)]">
                  {w.meaning ? `— ${w.meaning}` : ""}
                </span>
                <span className="text-[10px] font-bold text-[var(--color-accent)]">+{w.points}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Bulmaca Seçici ────────────────────────────────────────

function HexagonPage() {
  const [selectedPuzzle, setSelectedPuzzle] = useState<HexagonPuzzle | null>(null);

  if (!selectedPuzzle) {
    return (
      <div className="max-w-md mx-auto px-4 py-6 pb-24">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/games" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Hexagon Harf</h1>
            <p className="text-sm text-[var(--color-text-secondary)]">Bulmaca seç</p>
          </div>
        </div>

        <div className="space-y-2">
          {STATIC_PUZZLES.map((puzzle) => (
            <button
              key={puzzle.id}
              onClick={() => setSelectedPuzzle(puzzle)}
              className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)]/50 hover:shadow-sm transition-all text-left"
            >
              <div
                className="text-2xl font-bold w-12 h-12 flex items-center justify-center rounded-xl bg-amber-100 text-amber-700"
                dir="rtl"
                lang="ar"
                style={{ fontFamily: "var(--font-arabic)" }}
              >
                {puzzle.centerLetter}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                    Bulmaca #{puzzle.id}
                  </p>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                    puzzle.difficulty === "easy" ? "bg-green-100 text-green-700" :
                    puzzle.difficulty === "medium" ? "bg-yellow-100 text-yellow-700" :
                    "bg-red-100 text-red-700"
                  }`}>
                    {puzzle.difficulty === "easy" ? "Kolay" : puzzle.difficulty === "medium" ? "Orta" : "Zor"}
                  </span>
                </div>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                  {puzzle.validWords.length} kelime ·{" "}
                  <span dir="rtl" lang="ar" style={{ fontFamily: "var(--font-arabic)" }}>
                    {puzzle.outerLetters.join(" ")}
                  </span>
                </p>
              </div>
              <svg className="w-4 h-4 text-[var(--color-text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return <HexagonGame puzzle={selectedPuzzle} />;
}
