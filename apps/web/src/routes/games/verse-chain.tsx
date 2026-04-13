/**
 * Ayet Zinciri — son kelimeyi gör, devamını bul.
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { STATIC_QUESTIONS } from "~/lib/verse-chain-data";
import type { ChainQuestion } from "~/lib/verse-chain-data";
import { submitScore } from "~/lib/score-service";
import { SurahPickerScreen } from "~/components/SurahPickerScreen";
import { GameHeader } from "~/components/GameHeader";
import { GAME_THEMES } from "~/lib/game-themes";

export const Route = createFileRoute("/games/verse-chain")({
  component: VerseChainPage,
});

const THEME = GAME_THEMES["verse-chain"];
const P = THEME.primary; // "#C9A84C" — gold

type GameState = "playing" | "correct" | "wrong" | "gameover";
type Screen = "setup" | "game";

function filterQuestions(surahIds: number[]): ChainQuestion[] {
  if (surahIds.length === 0) return STATIC_QUESTIONS;
  const idSet = new Set(surahIds);
  const filtered = STATIC_QUESTIONS.filter((q) => {
    const surahId = parseInt(q.currentVerse.verseKey.split(":")[0], 10);
    return idSet.has(surahId);
  });
  return filtered.length > 0 ? filtered : STATIC_QUESTIONS;
}

function VerseChainGame({ surahIds, onSetup }: { surahIds: number[]; onSetup: () => void }) {
  const questions = filterQuestions(surahIds);

  const [questionIndex, setQuestionIndex] = useState(0);
  const [state, setState] = useState<GameState>("playing");
  const submittedRef = useRef(false);
  const sessionStart = useRef(Date.now());
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lives, setLives] = useState(3);
  const [chainLength, setChainLength] = useState(0);
  const [revealedSurahs, setRevealedSurahs] = useState<Set<number>>(new Set());

  const question = questions[questionIndex % questions.length];

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

  useEffect(() => {
    if (state === "gameover" && score > 0 && !submittedRef.current) {
      submittedRef.current = true;
      submitScore({ data: { gameId: "verse-chain", score, durationMs: Date.now() - sessionStart.current } }).catch(() => {});
    }
  }, [state, score]);

  if (state === "gameover") {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center">
        <div
          className="w-16 h-16 rounded flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: `${THEME.bg}30` }}
        >
          <svg className="w-8 h-8" fill="none" stroke={THEME.bg} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">Oyun Bitti!</h2>
        <p className="text-[var(--color-text-secondary)] mb-6">
          Zincir uzunluğu:{" "}
          <strong className="text-[var(--color-text-primary)]">{chainLength}</strong> halka ·{" "}
          <strong style={{ color: P }}>{score}</strong> puan
        </p>
        <button
          onClick={handleRestart}
          className="px-8 py-3 rounded text-white font-semibold text-sm hover:opacity-90 transition-all"
          style={{ backgroundColor: P }}
        >
          Tekrar Oyna
        </button>
        <div className="mt-4">
          <button onClick={onSetup} className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-accent)]">
            Sure seçimini değiştir
          </button>
        </div>
        <div className="mt-2">
          <Link to="/games" className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-accent)]">
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
    <div className="max-w-lg mx-auto pb-24">
      {/* Colored header */}
      <GameHeader
        img={THEME.img}
        bg={THEME.bg}
        isDark={THEME.isDark}
        title="Ayet Zinciri"
        onBack={onSetup}
        right={
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-bold tabular-nums">{score}</p>
              {streak >= 2 && (
                <p className="text-[10px] font-medium" style={{ color: P }}>{streak}× zincir!</p>
              )}
            </div>
            <div className="flex gap-0.5 items-center">
              {Array.from({ length: 3 }, (_, i) => (
                <svg key={i} className={`w-3.5 h-3.5 ${i < lives ? "opacity-100" : "opacity-20"}`} viewBox="0 0 24 24" fill="#ef4444" stroke="none">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              ))}
            </div>
          </div>
        }
      />

      <div className="px-4 pt-2">
        {/* Zincir sayacı */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex gap-1">
            {Array.from({ length: Math.min(chainLength, 8) }, (_, i) => (
              <div key={i} className="w-2 h-2 rounded-full" style={{ backgroundColor: P }} />
            ))}
            {chainLength > 8 && (
              <span className="text-xs font-medium" style={{ color: P }}>+{chainLength - 8}</span>
            )}
          </div>
          <span className="text-xs text-[var(--color-text-secondary)]">
            {chainLength === 0 ? "Zinciri başlat" : `${chainLength} halka`}
          </span>
        </div>

        {/* Mevcut ayet */}
        <div className="px-5 py-4 rounded border border-[var(--color-border)] bg-[var(--color-surface)] mb-4">
          <p className="text-xs text-[var(--color-text-secondary)] mb-2">
            {currentVerse.surahName} · {currentVerse.verseKey.split(":")[1]}. Ayet
          </p>
          <p
            className="text-xl text-right leading-loose text-[var(--color-text-primary)] mb-3"
            dir="rtl" lang="ar"
            style={{ fontFamily: "var(--font-arabic)" }}
          >
            {restWords}{" "}
            <span
              className="font-medium px-1 rounded"
              style={{ color: P, backgroundColor: `${P}18` }}
            >
              {lastWord}
            </span>
          </p>
          <div className="flex items-center gap-2 pt-2 border-t border-[var(--color-border)]">
            <span className="text-xs text-[var(--color-text-secondary)]">Son kelime:</span>
            <span
              className="text-base font-medium"
              dir="rtl" lang="ar"
              style={{ fontFamily: "var(--font-arabic)", color: P }}
            >
              {currentVerse.lastWordArabic}
            </span>
            <svg className="w-4 h-4 text-[var(--color-text-secondary)] rotate-180 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            let borderStyle: React.CSSProperties = {};
            let bgStyle: React.CSSProperties = {};

            if (selected === idx) {
              if (state === "correct" || opt.isCorrect) {
                borderClass = "border-2";
                borderStyle = { borderColor: `${P}80` };
                bgStyle = { backgroundColor: `${P}15` };
                labelColor = "";
              } else if (state === "wrong") {
                borderClass = "border-red-400";
                bgClass = "bg-red-50";
                labelColor = "text-red-600";
              }
            } else if (state !== "playing" && opt.isCorrect) {
              borderClass = "border-2";
              borderStyle = { borderColor: `${P}50` };
              bgStyle = { backgroundColor: `${P}0a` };
            }

            return (
              <button
                key={idx}
                onClick={() => handleAnswer(idx)}
                disabled={state !== "playing"}
                style={{ ...borderStyle, ...bgStyle }}
                className={`w-full text-left px-4 py-3 rounded border-2 transition-all ${borderClass} ${bgClass} ${
                  state === "playing" ? "cursor-pointer" : "cursor-default"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  {state !== "playing" || revealedSurahs.has(idx) ? (
                    <span className={`text-xs font-medium ${labelColor}`} style={selected === idx && (state === "correct" || opt.isCorrect) ? { color: P } : {}}>
                      {opt.surahName}
                    </span>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); setRevealedSurahs((prev) => new Set(prev).add(idx)); }}
                      className="text-xs px-2 py-0.5 rounded bg-[var(--color-border)] text-transparent select-none hover:opacity-70 transition-opacity"
                      aria-label="Sure adını göster"
                      style={{ filter: "blur(3px)" }}
                    >
                      {opt.surahName}
                    </button>
                  )}
                  {selected === idx && state === "correct" && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium" style={{ color: P }}>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                      Doğru! {streak >= 2 ? "+30" : "+10"}
                    </span>
                  )}
                  {selected === idx && state === "wrong" && !opt.isCorrect && (
                    <span className="inline-flex items-center gap-1 text-red-500 text-xs">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                      Yanlış
                    </span>
                  )}
                  {state !== "playing" && opt.isCorrect && selected !== idx && (
                    <span className="inline-flex items-center gap-1 text-xs" style={{ color: P }}>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                      Doğru cevap
                    </span>
                  )}
                </div>
                <p
                  className="text-base text-right leading-loose text-[var(--color-text-primary)]"
                  dir="rtl" lang="ar"
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
    </div>
  );
}

function VerseChainPage() {
  const [screen, setScreen] = useState<Screen>("setup");
  const [surahIds, setSurahIds] = useState<number[]>([]);

  if (screen === "setup") {
    return <SurahPickerScreen gameTitle="Ayet Zinciri" onStart={(ids) => { setSurahIds(ids); setScreen("game"); }} />;
  }
  return <VerseChainGame surahIds={surahIds} onSetup={() => setScreen("setup")} />;
}
