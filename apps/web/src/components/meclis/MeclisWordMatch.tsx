/**
 * Meclis modunda Kelime Eşleştirme — tek round Q&A pattern'ı yerine,
 * 8 Türkçe-Arapça kartı eşleştirme. Tüm pair'leri bulan sürekli yeni
 * kart üretir, süre dolana kadar bonus toplanır.
 *
 * Easy → quran-word-pool normal bucket; hard → zor bucket.
 * EMOJI_WORDS havuzu da normal mod için elverişli olduğundan
 * tercihen tahmin edilebilir kelimeler buradan alınır.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuranWordPool, bucketForDifficulty, type QuranWord } from "~/lib/quran-word-pool";
import { EMOJI_WORDS } from "~/lib/emoji-words";
import type { MeclisGameState } from "./MeclisGamePlay";

const PAIRS_PER_ROUND = 8;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Card =
  | { kind: "tr"; pairIdx: number; meaning: string }
  | { kind: "arabic"; pairIdx: number; arabic: string };

function buildRound(words: QuranWord[], usedIndices: Set<number>) {
  const available = words.map((_, i) => i).filter((i) => !usedIndices.has(i));
  const pool = available.length >= PAIRS_PER_ROUND ? available : words.map((_, i) => i);
  const picked: number[] = [];
  const usedMeanings = new Set<string>();
  for (const i of shuffle(pool)) {
    if (usedMeanings.has(words[i].meaning)) continue;
    picked.push(i);
    usedMeanings.add(words[i].meaning);
    if (picked.length === PAIRS_PER_ROUND) break;
  }
  const items = picked.map((i) => words[i]);
  const trCards: Card[] = items.map((it, idx) => ({ kind: "tr", pairIdx: idx, meaning: it.meaning }));
  const arCards: Card[] = items.map((it, idx) => ({ kind: "arabic", pairIdx: idx, arabic: it.arabic }));
  return { picked, items, cards: shuffle([...trCards, ...arCards]) };
}

export function MeclisWordMatch({ difficulty, scoreCorrect, scoreWrong, finished }: MeclisGameState) {
  const { data: pool } = useQuranWordPool();

  const words = useMemo<QuranWord[]>(() => {
    if (difficulty === "easy" || difficulty === "medium") {
      return EMOJI_WORDS.map((e) => ({ arabic: e.arabic, meaning: e.tr }));
    }
    return pool ? pool[bucketForDifficulty(difficulty)] : [];
  }, [pool, difficulty]);

  const [usedIndices, setUsedIndices] = useState<Set<number>>(new Set());
  const [roundData, setRoundData] = useState<ReturnType<typeof buildRound> | null>(null);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [selected, setSelected] = useState<number | null>(null);
  const matchStartRef = useRef(Date.now());

  useEffect(() => {
    if (words.length > 0 && !roundData) {
      const r = buildRound(words, new Set());
      setRoundData(r);
    }
  }, [words, roundData]);

  const allMatched = roundData != null && matched.size === roundData.items.length;

  // Yeni tur — tüm pair'leri eşleştirince
  useEffect(() => {
    if (!allMatched || finished || !roundData) return;
    const id = setTimeout(() => {
      const newUsed = new Set(usedIndices);
      for (const i of roundData.picked) newUsed.add(i);
      setUsedIndices(newUsed);
      setRoundData(buildRound(words, newUsed));
      setMatched(new Set());
      setSelected(null);
    }, 600);
    return () => clearTimeout(id);
  }, [allMatched, finished, roundData, words, usedIndices]);

  const handleTap = useCallback((cardIdx: number) => {
    if (finished || !roundData) return;
    const card = roundData.cards[cardIdx];
    if (matched.has(card.pairIdx)) return;

    if (selected === null) {
      setSelected(cardIdx);
      matchStartRef.current = Date.now();
      return;
    }
    if (selected === cardIdx) {
      setSelected(null);
      return;
    }
    const prev = roundData.cards[selected];
    if (prev.kind === card.kind) {
      setSelected(cardIdx);
      matchStartRef.current = Date.now();
      return;
    }
    const isCorrect = prev.pairIdx === card.pairIdx;
    if (isCorrect) {
      scoreCorrect(Date.now() - matchStartRef.current);
      setMatched((s) => new Set(s).add(card.pairIdx));
    } else {
      scoreWrong();
    }
    setSelected(null);
  }, [finished, roundData, matched, selected, scoreCorrect, scoreWrong]);

  if (!roundData) {
    return <div className="px-5 py-10 rounded-2xl border bg-[var(--color-surface)] text-center text-sm text-[var(--color-text-secondary)]">Hazırlanıyor…</div>;
  }

  return (
    <div className="grid grid-cols-4 gap-2">
      {roundData.cards.map((card, idx) => {
        const isMatched = matched.has(card.pairIdx);
        const isSelected = selected === idx;
        const style: React.CSSProperties = isMatched
          ? { opacity: 0.25, pointerEvents: "none", borderColor: "var(--color-border)" }
          : isSelected
          ? { borderColor: "var(--mu-accent)", backgroundColor: "color-mix(in oklab, var(--mu-accent), transparent 88%)" }
          : { borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" };

        return (
          <button
            key={idx}
            onClick={() => handleTap(idx)}
            disabled={isMatched}
            className="px-2 py-3 rounded-xl border transition-all min-h-[64px] flex items-center justify-center text-center"
            style={style}
          >
            {card.kind === "tr" ? (
              <span className="text-xs sm:text-sm font-medium text-[var(--color-text-primary)] leading-tight">{card.meaning}</span>
            ) : (
              <span className="text-base sm:text-lg font-bold text-[var(--color-text-primary)]" dir="rtl" lang="ar" style={{ fontFamily: "var(--font-arabic)" }}>
                {card.arabic}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
