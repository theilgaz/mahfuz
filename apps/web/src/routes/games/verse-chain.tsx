/**
 * Ayet Zinciri — son kelimeyi gör, devamını bul.
 * Bir ayetin ardından hangi ayet gelir? 4 seçenekten doğruyu bul.
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { STATIC_QUESTIONS } from "~/lib/verse-chain-data";
import type { ChainQuestion } from "~/lib/verse-chain-data";

export const Route = createFileRoute("/games/verse-chain")({
  component: VerseChainPage,
});

type GameState = "playing" | "correct" | "wrong" | "gameover";

function VerseChainGame() {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [state, setState] = useState<GameState>("playing");
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lives, setLives] = useState(3);
  const [chainLength, setChainLength] = useState(0);
  const [revealedSurahs, setRevealedSurahs] = useState<Set<number>>(new Set());

  const question = STATIC_QUESTIONS[questionIndex % STATIC_QUESTIONS.length];

  const handleAnswer = (idx: number) => {
    if (state !== "playing") return;
    setSelected(idx);

    const isCorrect = question.options[idx].isCorrect;

    if (isCorrect) {
      setState("correct");
      const bonus = streak >= 2 ? 20 : 0;
      setScore((s) => s + 10 + bonus);
      setStreak((s) => s + 1);
      setChainLength((c) => c + 1);

      setTimeout(() => {
        setQuestionIndex((i) => i + 1);
        setState("playing");
        setSelected(null);
        setRevealedSurahs(new Set());
      }, 1200);
    } else {
      setState("wrong");
      setStreak(0);
      const newLives = lives - 1;
      setLives(newLives);

      if (newLives <= 0) {
        setTimeout(() => setState("gameover"), 1200);
      } else {
        setTimeout(() => {
          setState("playing");
          setSelected(null);
          setRevealedSurahs(new Set());
        }, 1500);
      }
    }
  };

  const handleRestart = () => {
    setQuestionIndex(0);
    setState("playing");
    setSelected(null);
    setScore(0);
    setStreak(0);
    setLives(3);
    setChainLength(0);
    setRevealedSurahs(new Set());
  };

  // Game Over
  if (state === "gameover") {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center">
        <div className="text-5xl mb-4">🔗</div>
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">Oyun Bitti!</h2>
        <p className="text-[var(--color-text-secondary)] mb-6">
          Zincir uzunluğu:{" "}
          <strong className="text-[var(--color-text-primary)]">{chainLength}</strong> halka ·{" "}
          <strong className="text-[var(--color-text-primary)]">{score}</strong> puan
        </p>
        <button
          onClick={handleRestart}
          className="px-8 py-3 rounded-2xl bg-[var(--color-accent)] text-white font-semibold text-sm hover:opacity-90 transition-all"
        >
          Tekrar Oyna
        </button>
        <div className="mt-4">
          <Link
            to="/games"
            className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-accent)]"
          >
            Oyunlara dön
          </Link>
        </div>
      </div>
    );
  }

  const { currentVerse, options } = question;
  const verseWords = currentVerse.textUthmani.trim().split(/\s+/);
  const lastWord = verseWords.pop();
  const restWords = verseWords.join(" ");

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <Link
          to="/games"
          className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-[var(--color-text-primary)]">Ayet Zinciri</h1>
          <p className="text-xs text-[var(--color-text-secondary)]">Hangi ayet devam ediyor?</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-base font-bold text-[var(--color-accent)]">{score}</p>
            {streak >= 2 && (
              <p className="text-[10px] text-orange-500 font-medium">{streak}× zincir!</p>
            )}
          </div>
          <div className="flex gap-0.5">
            {Array.from({ length: 3 }, (_, i) => (
              <span key={i} className={`text-base ${i < lives ? "opacity-100" : "opacity-20"}`}>
                ❤️
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Zincir sayacı */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex gap-1">
          {Array.from({ length: Math.min(chainLength, 8) }, (_, i) => (
            <div key={i} className="w-2 h-2 rounded-full bg-[var(--color-accent)]" />
          ))}
          {chainLength > 8 && (
            <span className="text-xs text-[var(--color-accent)] font-medium">+{chainLength - 8}</span>
          )}
        </div>
        <span className="text-xs text-[var(--color-text-secondary)]">
          {chainLength === 0 ? "Zinciri başlat" : `${chainLength} halka`}
        </span>
      </div>

      {/* Mevcut ayet */}
      <div className="px-5 py-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] mb-4">
        <p className="text-xs text-[var(--color-text-secondary)] mb-2">
          {currentVerse.surahName} · {currentVerse.verseKey.split(":")[1]}. Ayet
        </p>
        <p
          className="text-xl text-right leading-loose text-[var(--color-text-primary)] mb-3"
          dir="rtl"
          lang="ar"
          style={{ fontFamily: "var(--font-arabic)" }}
        >
          {restWords}{" "}
          <span className="text-[var(--color-accent)] font-medium bg-[var(--color-accent)]/10 px-1 rounded">
            {lastWord}
          </span>
        </p>
        <div className="flex items-center gap-2 pt-2 border-t border-[var(--color-border)]">
          <span className="text-xs text-[var(--color-text-secondary)]">Son kelime:</span>
          <span
            className="text-base text-[var(--color-accent)] font-medium"
            dir="rtl"
            lang="ar"
            style={{ fontFamily: "var(--font-arabic)" }}
          >
            {currentVerse.lastWordArabic}
          </span>
          <svg
            className="w-4 h-4 text-[var(--color-text-secondary)] rotate-180 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-xs text-[var(--color-text-secondary)]">devam eden ayet hangisi?</span>
        </div>
      </div>

      {/* Seçenekler */}
      <div className="space-y-2 mb-4">
        {options.map((opt, idx) => {
          let borderClass = "border-[var(--color-border)]";
          let bgClass = "bg-[var(--color-surface)]";
          let labelColor = "text-[var(--color-text-secondary)]";

          if (selected === idx) {
            if (state === "correct" || opt.isCorrect) {
              borderClass = "border-green-400";
              bgClass = "bg-green-50";
              labelColor = "text-green-700";
            } else if (state === "wrong") {
              borderClass = "border-red-400";
              bgClass = "bg-red-50";
              labelColor = "text-red-600";
            }
          } else if (state !== "playing" && opt.isCorrect) {
            borderClass = "border-green-300";
            bgClass = "bg-green-50/50";
          }

          return (
            <button
              key={idx}
              onClick={() => handleAnswer(idx)}
              disabled={state !== "playing"}
              className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${borderClass} ${bgClass} ${
                state === "playing"
                  ? "hover:border-[var(--color-accent)]/60 cursor-pointer"
                  : "cursor-default"
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                {/* Sure adı — gizli, tıklayınca açılır */}
                {state !== "playing" || revealedSurahs.has(idx) ? (
                  <span className={`text-xs font-medium ${labelColor}`}>{opt.surahName}</span>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setRevealedSurahs((prev) => new Set(prev).add(idx));
                    }}
                    className="text-xs px-2 py-0.5 rounded bg-[var(--color-border)] text-transparent select-none hover:opacity-70 transition-opacity"
                    aria-label="Sure adını göster"
                    style={{ filter: "blur(3px)" }}
                  >
                    {opt.surahName}
                  </button>
                )}
                {selected === idx && state === "correct" && (
                  <span className="text-green-600 text-xs font-medium">
                    ✓ Doğru! {streak >= 2 ? "+30" : "+10"}
                  </span>
                )}
                {selected === idx && state === "wrong" && !opt.isCorrect && (
                  <span className="text-red-500 text-xs">✗ Yanlış</span>
                )}
                {state !== "playing" && opt.isCorrect && selected !== idx && (
                  <span className="text-green-500 text-xs">✓ Doğru cevap</span>
                )}
              </div>
              <p
                className="text-base text-right leading-loose text-[var(--color-text-primary)]"
                dir="rtl"
                lang="ar"
                style={{ fontFamily: "var(--font-arabic)" }}
              >
                {opt.firstWords}
              </p>
            </button>
          );
        })}
      </div>

      {state === "playing" && (
        <p className="text-center text-xs text-[var(--color-text-secondary)]">
          Vurgulanan son kelimeden sonra hangi ayet gelir?
        </p>
      )}
    </div>
  );
}

function VerseChainPage() {
  return <VerseChainGame />;
}
