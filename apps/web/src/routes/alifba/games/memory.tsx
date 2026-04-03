/**
 * Hafıza Oyunu — /alifba/games/memory
 * 8 çiftten oluşan (16 kart) eşleştirme oyunu. Süre yok, çift sayısını takip et.
 */

import { useState, useCallback } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ARABIC_LETTERS } from "~/lib/kids-constants";
import { useTranslation } from "~/hooks/useTranslation";
import { useAlifbaStore } from "~/stores/alifba.store";

export const Route = createFileRoute("/alifba/games/memory")({
  component: MemoryGamePage,
});

interface Card {
  uid: string; // letterId + "-a" or "-b"
  letterId: string;
  arabic: string;
  name: string;
}

function buildCards(): Card[] {
  const letters = [...ARABIC_LETTERS].sort(() => Math.random() - 0.5).slice(0, 8);
  const cards: Card[] = [];
  letters.forEach((l) => {
    cards.push({ uid: `${l.id}-a`, letterId: l.id, arabic: l.arabic, name: l.name });
    cards.push({ uid: `${l.id}-b`, letterId: l.id, arabic: l.arabic, name: l.name });
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
  };

  const pairs = matched.size / 2;
  const totalPairs = cards.length / 2;

  if (done) {
    const score = Math.max(0, 200 - moves * 5);
    return (
      <div className="max-w-lg mx-auto px-4 py-6 pb-24 flex flex-col items-center gap-4">
        <span className="text-5xl">🎉</span>
        <h2 className="text-lg font-semibold">{t.alifba.quizComplete}</h2>
        <p className="text-sm text-[var(--color-text-secondary)]">{moves} hamle · {t.alifba.score}: {score}</p>
        <div className="flex gap-3">
          <Link to="/alifba/games" className="px-4 py-2.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-sm">
            {t.nav.back}
          </Link>
          <button onClick={restart} className="px-4 py-2.5 rounded-xl bg-[var(--color-accent)] text-white text-sm">
            {t.alifba.tryAgain}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24">
      <div className="flex items-center justify-between mb-4">
        <Link to="/alifba/games" className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] flex items-center gap-1 transition-colors">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M10 4L6 8l4 4" />
          </svg>
          {t.nav.back}
        </Link>
        <span className="text-xs text-[var(--color-text-secondary)]">
          {t.alifba.pairs}: {pairs}/{totalPairs} · {moves} hamle
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {cards.map((card) => {
          const isFlipped = flipped.includes(card.uid) || matched.has(card.uid);
          const isMatched = matched.has(card.uid);
          return (
            <button
              key={card.uid}
              onClick={() => handleFlip(card.uid)}
              className={`aspect-square rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                isMatched
                  ? "bg-[var(--color-accent)]/10 border-[var(--color-accent)]/40"
                  : isFlipped
                    ? "bg-[var(--color-surface)] border-[var(--color-accent)]/50"
                    : "bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-accent)]/50 active:scale-95"
              }`}
            >
              {isFlipped ? (
                <>
                  <span className="text-2xl leading-none" style={{ fontFamily: "var(--font-arabic)" }}>{card.arabic}</span>
                  <span className="text-[9px] text-[var(--color-text-secondary)]">{card.name}</span>
                </>
              ) : (
                <span className="text-xl text-[var(--color-text-secondary)]/30">؟</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
