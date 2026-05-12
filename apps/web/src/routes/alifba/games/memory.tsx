/**
 * Hafiza Oyunu — /alifba/games/memory
 * 8 çiftten oluşan (16 kart) eşleştirme oyunu.
 * Çocuklara yönelik renkli tasarım.
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ARABIC_LETTERS } from "~/lib/kids-constants";
import { playCorrect, playWrong } from "~/lib/quiz-sounds";
import { useTranslation } from "~/hooks/useTranslation";
import { useAlifbaStore } from "~/stores/alifba.store";
import { staticHead } from "~/lib/seo";

export const Route = createFileRoute("/alifba/games/memory")({
  head: () => staticHead("alifba-games-memory"),
  component: MemoryGamePage,
});

// Each pair gets a distinct pastel color
const PAIR_COLORS = [
  { bg: "#FDE68A", border: "#F59E0B", text: "#92400E" }, // amber
  { bg: "#A7F3D0", border: "#10B981", text: "#065F46" }, // emerald
  { bg: "#BFDBFE", border: "#3B82F6", text: "#1E3A8A" }, // blue
  { bg: "#FCA5A5", border: "#EF4444", text: "#7F1D1D" }, // red
  { bg: "#C4B5FD", border: "#8B5CF6", text: "#4C1D95" }, // violet
  { bg: "#FBCFE8", border: "#EC4899", text: "#831843" }, // pink
  { bg: "#99F6E4", border: "#14B8A6", text: "#134E4A" }, // teal
  { bg: "#FED7AA", border: "#F97316", text: "#7C2D12" }, // orange
];

interface Card {
  uid: string;
  letterId: string;
  arabic: string;
  name: string;
  colorIndex: number;
}

function buildCards(): Card[] {
  const letters = [...ARABIC_LETTERS].sort(() => Math.random() - 0.5).slice(0, 8);
  const cards: Card[] = [];
  letters.forEach((l, i) => {
    cards.push({ uid: `${l.id}-a`, letterId: l.id, arabic: l.arabic, name: l.name, colorIndex: i });
    cards.push({ uid: `${l.id}-b`, letterId: l.id, arabic: l.arabic, name: l.name, colorIndex: i });
  });
  return cards.sort(() => Math.random() - 0.5);
}

function MemoryGamePage() {
  const { t } = useTranslation();
  const updateGameHighScore = useAlifbaStore((s) => s.updateGameHighScore);

  const [cards, setCards] = useState<Card[]>(buildCards);
  const [flipped, setFlipped] = useState<string[]>([]);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [moves, setMoves] = useState(0);
  const [done, setDone] = useState(false);
  const [locked, setLocked] = useState(false);
  const [lastMatchedPair, setLastMatchedPair] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  // Timer
  useEffect(() => {
    if (!done && moves > 0) {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
      return () => clearInterval(timerRef.current);
    }
    if (done) clearInterval(timerRef.current);
  }, [done, moves > 0]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const handleFlip = useCallback(
    (uid: string) => {
      if (locked || flipped.includes(uid) || matched.has(uid)) return;

      const newFlipped = [...flipped, uid];
      setFlipped(newFlipped);

      if (newFlipped.length === 2) {
        setMoves((m) => m + 1);
        setLocked(true);
        const [a, b] = newFlipped.map((id) => cards.find((c) => c.uid === id)!);
        if (a.letterId === b.letterId) {
          playCorrect();
          setLastMatchedPair(a.letterId);
          setTimeout(() => setLastMatchedPair(null), 600);
          const newMatched = new Set(matched);
          newMatched.add(a.uid);
          newMatched.add(b.uid);
          setMatched(newMatched);
          setFlipped([]);
          setLocked(false);
          if (newMatched.size === cards.length) {
            const score = Math.max(0, 200 - moves * 5);
            updateGameHighScore("memory", score);
            setDone(true);
          }
        } else {
          playWrong();
          setTimeout(() => {
            setFlipped([]);
            setLocked(false);
          }, 900);
        }
      }
    },
    [locked, flipped, matched, cards, moves, updateGameHighScore],
  );

  const restart = () => {
    setCards(buildCards());
    setFlipped([]);
    setMatched(new Set());
    setMoves(0);
    setDone(false);
    setLocked(false);
    setLastMatchedPair(null);
    setElapsed(0);
  };

  const pairs = matched.size / 2;
  const totalPairs = cards.length / 2;

  if (done) {
    const score = Math.max(0, 200 - moves * 5);
    const stars = moves <= 10 ? 3 : moves <= 14 ? 2 : 1;
    return (
      <div
        className="min-h-dvh flex flex-col items-center justify-center px-4"
        style={{ background: "linear-gradient(135deg, #FEF3C7 0%, #DBEAFE 50%, #E0E7FF 100%)" }}
      >
        <div className="bg-white rounded-3xl shadow-lg p-8 max-w-sm w-full text-center">
          {/* Stars */}
          <div className="flex justify-center gap-2 mb-4">
            {[1, 2, 3].map((s) => (
              <span
                key={s}
                className={`text-4xl transition-all ${s <= stars ? "scale-100" : "scale-75 opacity-20"}`}
                style={{ color: s <= stars ? "#F59E0B" : "#D1D5DB" }}
              >
                *
              </span>
            ))}
          </div>

          <h2 className="text-xl font-bold text-gray-800 mb-1">{t.alifba.quizComplete}</h2>
          <p className="text-sm text-gray-500 mb-4">
            {moves} {t.alifba.moves} / {formatTime(elapsed)}
          </p>

          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="text-center">
              <p className="text-2xl font-bold" style={{ color: "#10B981" }}>{score}</p>
              <p className="text-[10px] text-gray-400 uppercase">{t.alifba.score}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Link
              to="/alifba/games"
              className="flex-1 py-3 rounded-xl text-sm font-medium border-2 border-gray-200 text-gray-600"
            >
              {t.nav.back}
            </Link>
            <button
              onClick={restart}
              className="flex-1 py-3 rounded-xl text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg, #10B981, #3B82F6)" }}
            >
              {t.alifba.tryAgain}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-dvh px-4 pt-4 pb-24"
      style={{ background: "linear-gradient(180deg, #F0FDF4 0%, #EFF6FF 100%)" }}
    >
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <Link
            to="/alifba/games"
            className="w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center"
          >
            <svg width="18" height="18" fill="none" stroke="#6B7280" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M15 19l-7-7 7-7" />
            </svg>
          </Link>

          <div className="flex items-center gap-3">
            {/* Timer */}
            <span className="text-xs font-mono text-gray-400 tabular-nums">
              {formatTime(elapsed)}
            </span>

            {/* Pairs progress */}
            <div className="flex items-center gap-1.5 bg-white rounded-full px-3 py-1.5 shadow-sm">
              <div className="flex gap-0.5">
                {Array.from({ length: totalPairs }, (_, i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full transition-all duration-300"
                    style={{
                      backgroundColor: i < pairs ? "#10B981" : "#E5E7EB",
                      transform: i < pairs ? "scale(1.1)" : "scale(1)",
                    }}
                  />
                ))}
              </div>
              <span className="text-xs font-semibold text-gray-600 ml-1">{pairs}/{totalPairs}</span>
            </div>

            {/* Moves */}
            <span className="text-xs text-gray-400">{moves}</span>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-4 gap-2.5">
          {cards.map((card) => {
            const isFlipped = flipped.includes(card.uid) || matched.has(card.uid);
            const isMatched = matched.has(card.uid);
            const justMatched = lastMatchedPair === card.letterId;
            const color = PAIR_COLORS[card.colorIndex];

            return (
              <button
                key={card.uid}
                onClick={() => handleFlip(card.uid)}
                className={`aspect-square rounded-2xl flex flex-col items-center justify-center transition-all duration-200 ${
                  justMatched ? "scale-110" : "active:scale-95"
                }`}
                style={
                  isMatched
                    ? {
                        backgroundColor: color.bg,
                        border: `2px solid ${color.border}`,
                        boxShadow: justMatched ? `0 0 16px ${color.border}40` : "none",
                      }
                    : isFlipped
                      ? {
                          backgroundColor: color.bg,
                          border: `2px solid ${color.border}`,
                          boxShadow: `0 4px 12px ${color.border}25`,
                        }
                      : {
                          backgroundColor: "#fff",
                          border: "2px solid #E5E7EB",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                        }
                }
              >
                {isFlipped ? (
                  <>
                    <span
                      className="text-3xl leading-none mb-0.5"
                      style={{ fontFamily: "var(--font-arabic)", color: color.text }}
                    >
                      {card.arabic}
                    </span>
                    <span className="text-[9px] font-medium" style={{ color: color.text, opacity: 0.7 }}>
                      {card.name}
                    </span>
                  </>
                ) : (
                  <span className="text-2xl" style={{ color: "#D1D5DB" }}>
                    ?
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Restart */}
        <div className="flex justify-center mt-5">
          <button
            onClick={restart}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            {t.alifba.tryAgain}
          </button>
        </div>
      </div>
    </div>
  );
}
