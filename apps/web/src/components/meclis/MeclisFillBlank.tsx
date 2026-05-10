/**
 * Meclis modunda Kelime Doldurma — sürekli yeni soru çeker, oyuncu
 * süre dolana kadar art arda cevap verir. Sonuç finishMeclisRound'a
 * meclis-game-play tarafından gönderilir.
 */

import { useEffect, useRef, useState } from "react";
import { getRandomVerseForGame } from "~/lib/game-service";
import { OPTION_COUNT } from "~/lib/game-scoring";
import type { MeclisGameState } from "./MeclisGamePlay";

interface Verse {
  ayahId: number;
  surahId: number;
  surahName: string;
  verseNum: number;
  words: string[];
  blankIndex: number;
  correctWord: string;
  options: string[];
}

export function MeclisFillBlank({ difficulty, scoreCorrect, scoreWrong, finished, surahIds }: MeclisGameState) {
  const [verse, setVerse] = useState<Verse | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const usedRef = useRef<number[]>([]);
  const questionStartRef = useRef(Date.now());
  const optionCount = OPTION_COUNT[difficulty];

  const loadNext = async () => {
    setPicked(null);
    setIsCorrect(null);
    setVerse(null);
    try {
      const v = await getRandomVerseForGame({
        data: { surahIds: surahIds.length > 0 ? surahIds : undefined, excludeAyahIds: usedRef.current, optionCount },
      });
      if (v) {
        usedRef.current.push(v.ayahId);
        setVerse(v as Verse);
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

  const handlePick = (word: string) => {
    if (finished || picked || !verse) return;
    setPicked(word);
    const ok = word === verse.correctWord;
    setIsCorrect(ok);
    const answerTime = Date.now() - questionStartRef.current;
    if (ok) scoreCorrect(answerTime);
    else scoreWrong();
    setTimeout(() => {
      if (!finished) loadNext();
    }, 700);
  };

  if (!verse) {
    return <div className="px-5 py-10 rounded-2xl border bg-[var(--color-surface)] text-center text-sm text-[var(--color-text-secondary)]">Soru hazırlanıyor…</div>;
  }

  return (
    <div className="px-5 py-6 rounded-2xl border bg-[var(--color-surface)]">
      <div className="text-[11px] uppercase tracking-wider text-[var(--color-text-secondary)] mb-3 text-center">
        {verse.surahName} {verse.verseNum}
      </div>
      <p className="text-2xl leading-loose text-center mb-4" dir="rtl" lang="ar" style={{ fontFamily: "var(--font-arabic)" }}>
        {verse.words.map((w, i) => (
          <span key={i}>
            {i === verse.blankIndex ? (
              <span className="inline-block px-3 mx-1 rounded-md border-b-2 border-dashed border-[var(--mu-accent)] text-[var(--mu-accent)]">
                {picked ? picked : "_____"}
              </span>
            ) : (
              <span> {w} </span>
            )}
          </span>
        ))}
      </p>

      <div className="grid grid-cols-2 gap-2">
        {verse.options.map((opt) => {
          const isPick = picked === opt;
          const isAnswer = picked && opt === verse.correctWord;
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
              className="px-3 py-3 rounded-xl border border-[var(--color-border)] text-base font-bold transition-all"
              dir="rtl"
              lang="ar"
              style={{ fontFamily: "var(--font-arabic)", ...style }}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
