/**
 * Meclis modunda "Karı Tahmini" — kısa bir ayetin tilavetini dinle,
 * doğru kâriyi seç. Audio ~5sn çalar, oyuncu 4 isim arasından seçer.
 *
 * Cevap ya da timeout sonrası yeni soru çekilir.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { getKariTahminiQuestion, type KariTahminiQuestion } from "~/lib/kari-tahmini-service";
import type { MeclisGameState } from "./MeclisGamePlay";

const PLAY_MS = 5_000;
const ROUND_TIMEOUT_MS = 15_000;

export function MeclisKariTahmini({ scoreCorrect, scoreWrong, finished }: MeclisGameState) {
  const [question, setQuestion] = useState<KariTahminiQuestion | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const roundStartedAtRef = useRef(Date.now());
  const questionStartRef = useRef(Date.now());

  const loadNext = useCallback(async () => {
    setQuestion(null);
    setPicked(null);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (playStopTimerRef.current) clearTimeout(playStopTimerRef.current);
    try {
      const q = await getKariTahminiQuestion({ data: { optionCount: 4 } });
      if (q) {
        setQuestion(q);
        roundStartedAtRef.current = Date.now();
        questionStartRef.current = Date.now();
      }
    } catch {
      /* empty */
    }
  }, []);

  useEffect(() => {
    loadNext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Round timeout: cevap verilmediyse otomatik yeni soru
  useEffect(() => {
    if (finished || !question || picked) return;
    const id = setTimeout(() => {
      // Yanlış cevap olarak işle, yeni soruya geç
      scoreWrong();
      setPicked("__TIMEOUT__");
      setTimeout(() => loadNext(), 1500);
    }, ROUND_TIMEOUT_MS);
    return () => clearTimeout(id);
  }, [finished, question, picked, scoreWrong, loadNext]);

  const handlePlay = useCallback(() => {
    if (!question || finished) return;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (playStopTimerRef.current) clearTimeout(playStopTimerRef.current);
    const audio = new Audio(question.audioUrl);
    audio.preload = "auto";
    audioRef.current = audio;
    setIsPlaying(true);
    audio
      .play()
      .then(() => {
        playStopTimerRef.current = setTimeout(() => {
          audio.pause();
          setIsPlaying(false);
        }, PLAY_MS);
      })
      .catch(() => setIsPlaying(false));
    audio.addEventListener("ended", () => setIsPlaying(false), { once: true });
  }, [question, finished]);

  // Question değişince audio durdurulsun
  useEffect(() => {
    return () => {
      if (audioRef.current) audioRef.current.pause();
      if (playStopTimerRef.current) clearTimeout(playStopTimerRef.current);
    };
  }, [question?.verseKey]);

  const handlePick = useCallback((slug: string) => {
    if (!question || picked || finished) return;
    setPicked(slug);
    const isCorrect = slug === question.correctSlug;
    const answerTimeMs = Date.now() - questionStartRef.current;
    if (isCorrect) scoreCorrect(answerTimeMs);
    else scoreWrong();
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
    setTimeout(() => {
      if (!finished) loadNext();
    }, 1500);
  }, [question, picked, finished, scoreCorrect, scoreWrong, loadNext]);

  if (!question) {
    return (
      <div className="px-5 py-10 rounded-2xl border bg-[var(--color-surface)] text-center text-sm text-[var(--color-text-secondary)]">
        Hazırlanıyor…
      </div>
    );
  }

  return (
    <div className="px-5 py-6 rounded-2xl border bg-[var(--color-surface)]">
      <div className="text-[11px] uppercase tracking-wider text-[var(--color-text-secondary)] mb-2 text-center">
        Kim okuyor?
      </div>
      <p className="text-xs text-center text-[var(--color-text-secondary)] mb-4">
        {question.surahName} <span className="font-mono">{question.verseKey}</span>
      </p>

      <div className="flex justify-center mb-5">
        <button
          onClick={handlePlay}
          disabled={!!picked}
          className="w-16 h-16 rounded-full bg-[var(--mu-accent)] text-white text-2xl flex items-center justify-center active:scale-95 transition-transform disabled:opacity-50"
          aria-label="Çal"
        >
          {isPlaying ? "■" : "▶"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {question.options.map((opt) => {
          const isPick = picked === opt.slug;
          const isAnswer = picked != null && opt.slug === question.correctSlug;
          let style: React.CSSProperties = {};
          if (picked) {
            if (isAnswer) style = { borderColor: "rgba(34,197,94,0.6)", background: "rgba(34,197,94,0.10)" };
            else if (isPick) style = { borderColor: "rgba(239,68,68,0.6)", background: "rgba(239,68,68,0.10)" };
            else style = { opacity: 0.4 };
          }
          return (
            <button
              key={opt.slug}
              onClick={() => handlePick(opt.slug)}
              disabled={!!picked}
              className="px-3 py-3 rounded-xl border border-[var(--color-border)] text-sm font-medium transition-all min-h-[56px]"
              style={style}
            >
              {opt.name}
            </button>
          );
        })}
      </div>

      {picked === "__TIMEOUT__" && (
        <p className="text-center text-xs text-[var(--color-text-secondary)] mt-4">
          Süre doldu — doğru cevap: <span className="font-bold">{question.options.find((o) => o.slug === question.correctSlug)?.name}</span>
        </p>
      )}
    </div>
  );
}
