/**
 * Meclis modunda Kelime Anlamı — Arapça kelime gösterilir, oyuncu
 * Türkçe anlamını seçer. Havuz: bucket'lı quran-word-pool.json,
 * Normal/Zor zorluğa map edilir.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { OPTION_COUNT } from "~/lib/game-scoring";
import { useQuranWordPool, bucketForDifficulty, type QuranWord } from "~/lib/quran-word-pool";
import type { MeclisGameState } from "./MeclisGamePlay";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildQuestion(words: QuranWord[], usedIndices: Set<number>, optionCount: number) {
  const available = words.map((_, i) => i).filter((i) => !usedIndices.has(i));
  const indexPool = available.length > 0 ? available : words.map((_, i) => i);
  const idx = indexPool[Math.floor(Math.random() * indexPool.length)];
  const target = words[idx];
  const wrongs: string[] = [];
  const used = new Set([target.meaning]);
  const decoyOrder = shuffle(words.map((_, i) => i)).filter((i) => i !== idx);
  for (const j of decoyOrder) {
    const m = words[j].meaning;
    if (used.has(m)) continue;
    wrongs.push(m);
    used.add(m);
    if (wrongs.length === optionCount - 1) break;
  }
  const options = shuffle([target.meaning, ...wrongs]);
  return { arabic: target.arabic, meaning: target.meaning, options, idx };
}

export function MeclisWordMeaning({ difficulty, scoreCorrect, scoreWrong, finished }: MeclisGameState) {
  const { data: pool } = useQuranWordPool();
  const words = useMemo(() => (pool ? pool[bucketForDifficulty(difficulty)] : []), [pool, difficulty]);
  const optionCount = OPTION_COUNT[difficulty];
  const [usedIdx, setUsedIdx] = useState<Set<number>>(new Set());
  const [q, setQ] = useState<ReturnType<typeof buildQuestion> | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const questionStartRef = useRef(Date.now());

  useEffect(() => {
    if (words.length > 0 && !q) {
      const next = buildQuestion(words, new Set(), optionCount);
      setQ(next);
      questionStartRef.current = Date.now();
    }
  }, [words, q, optionCount]);

  const handlePick = (opt: string) => {
    if (finished || picked || !q) return;
    setPicked(opt);
    const ok = opt === q.meaning;
    const answerTime = Date.now() - questionStartRef.current;
    if (ok) scoreCorrect(answerTime);
    else scoreWrong();
    setTimeout(() => {
      if (finished) return;
      const nextUsed = new Set(usedIdx).add(q.idx);
      setUsedIdx(nextUsed);
      setQ(buildQuestion(words, nextUsed, optionCount));
      setPicked(null);
      questionStartRef.current = Date.now();
    }, 700);
  };

  if (!q) {
    return <div className="px-5 py-10 rounded-2xl border bg-[var(--color-surface)] text-center text-sm text-[var(--color-text-secondary)]">Havuz hazırlanıyor…</div>;
  }

  return (
    <div className="px-5 py-6 rounded-2xl border bg-[var(--color-surface)]">
      <div className="text-[11px] uppercase tracking-wider text-[var(--color-text-secondary)] mb-3 text-center">
        Bu kelimenin anlamı?
      </div>
      <p className="text-4xl text-center mb-5" dir="rtl" lang="ar" style={{ fontFamily: "var(--font-arabic)" }}>
        {q.arabic}
      </p>

      <div className="grid grid-cols-2 gap-2">
        {q.options.map((opt) => {
          const isPick = picked === opt;
          const isAnswer = picked && opt === q.meaning;
          let style: React.CSSProperties = {};
          if (picked) {
            if (isAnswer) style = { borderColor: "rgba(34,197,94,0.6)", background: "rgba(34,197,94,0.10)" };
            else if (isPick) style = { borderColor: "rgba(239,68,68,0.6)", background: "rgba(239,68,68,0.10)" };
            else style = { opacity: 0.4 };
          }
          return (
            <button
              key={opt}
              onClick={() => handlePick(opt)}
              disabled={!!picked}
              className="px-3 py-3 rounded-xl border border-[var(--color-border)] text-sm font-medium transition-all"
              style={style}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
