/**
 * Meclis modunda Sûre Tanıma — ayet metni gösterilir, oyuncu doğru
 * sûreyi seçer. Süre dolana kadar art arda yeni soru gelir.
 */

import { useEffect, useRef, useState } from "react";
import { getVerseGuessQuestion } from "~/lib/game-service";
import { OPTION_COUNT } from "~/lib/game-scoring";
import type { MeclisGameState } from "./MeclisGamePlay";

interface Question {
  ayahId: number;
  verseText: string;
  verseNum: number;
  correctSurahId: number;
  correctSurahName: string;
  options: { id: number; name: string; arabic: string }[];
}

export function MeclisSurahGuess({ difficulty, scoreCorrect, scoreWrong, finished }: MeclisGameState) {
  const [q, setQ] = useState<Question | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const usedRef = useRef<number[]>([]);
  const questionStartRef = useRef(Date.now());
  const optionCount = OPTION_COUNT[difficulty];

  const loadNext = async () => {
    setPicked(null);
    setQ(null);
    try {
      const next = await getVerseGuessQuestion({
        data: { excludeAyahIds: usedRef.current, optionCount },
      });
      if (next) {
        usedRef.current.push(next.ayahId);
        setQ(next as Question);
        questionStartRef.current = Date.now();
      }
    } catch {
      /* empty */
    }
  };

  useEffect(() => {
    loadNext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePick = (id: number) => {
    if (finished || picked || !q) return;
    setPicked(id);
    const ok = id === q.correctSurahId;
    const answerTime = Date.now() - questionStartRef.current;
    if (ok) scoreCorrect(answerTime);
    else scoreWrong();
    setTimeout(() => {
      if (!finished) loadNext();
    }, 800);
  };

  if (!q) {
    return <div className="px-5 py-10 rounded-2xl border bg-[var(--color-surface)] text-center text-sm text-[var(--color-text-secondary)]">Soru hazırlanıyor…</div>;
  }

  return (
    <div className="px-5 py-6 rounded-2xl border bg-[var(--color-surface)]">
      <div className="text-[11px] uppercase tracking-wider text-[var(--color-text-secondary)] mb-3 text-center">
        Bu ayet hangi sûreden?
      </div>
      <p className="text-xl leading-loose text-center mb-5" dir="rtl" lang="ar" style={{ fontFamily: "var(--font-arabic)" }}>
        {q.verseText}
      </p>

      <div className="grid grid-cols-2 gap-2">
        {q.options.map((opt) => {
          const isPick = picked === opt.id;
          const isAnswer = picked != null && opt.id === q.correctSurahId;
          let style: React.CSSProperties = {};
          if (picked != null) {
            if (isAnswer) style = { borderColor: "rgba(34,197,94,0.6)", background: "rgba(34,197,94,0.10)" };
            else if (isPick) style = { borderColor: "rgba(239,68,68,0.6)", background: "rgba(239,68,68,0.10)" };
            else style = { opacity: 0.4 };
          }
          return (
            <button
              key={opt.id}
              onClick={() => handlePick(opt.id)}
              disabled={picked != null}
              className="px-3 py-3 rounded-xl border border-[var(--color-border)] text-sm font-medium transition-all flex flex-col items-center gap-0.5"
              style={style}
            >
              <span>{opt.name}</span>
              <span className="text-xs text-[var(--color-text-secondary)]" dir="rtl" lang="ar" style={{ fontFamily: "var(--font-arabic)" }}>
                {opt.arabic}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
