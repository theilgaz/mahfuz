/**
 * Ayet Zinciri -- Ayetin devamini bul.
 * Dinamik soru üretimi (DB'den), gerçek zincir mekaniği:
 * doğru cevaplarsan aynı surede sonraki ayetle devam eder.
 * Timer-based: sure doldugunda oyun biter.
 */

import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import { submitScore } from "~/lib/score-service";
import type { League } from "~/lib/league";
import { SurahPickerScreen } from "~/components/SurahPickerScreen";
import { GameScoreBar } from "~/components/GameScoreBar";
import { useTranslation } from "~/hooks/useTranslation";
import { useGameTimer } from "~/hooks/useGameTimer";
import { GameOverCard } from "~/components/GameOverCard";
import { GameVerseLabel } from "~/components/GameVerseLabel";
import { GAME_THEMES, gameBgStyle } from "~/lib/game-themes";
import { getSurahName } from "~/lib/surah-names-i18n";
import { useLocaleStore } from "~/stores/locale.store";
import { getVerseChainRounds, type ChainRound, type ChainVerse } from "~/lib/quran-service";
import {
  calcCorrectPoints,
  calcWrongPenalty,
  calcTimeBonusMs,
  WRONG_TIME_PENALTY_MS,
  formatDelta,
  OPTION_COUNT,
  type Difficulty,
} from "~/lib/game-scoring";

export const Route = createFileRoute("/games/verse-chain")({
  component: VerseChainPage,
});

const THEME = GAME_THEMES["verse-chain"];
const P = THEME.primary;

type GameState = "loading" | "playing" | "correct" | "wrong" | "gameover";
type Screen = "setup" | "game";

/** Shuffle array in place (Fisher-Yates) */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Get first N words of Arabic text */
function firstWords(text: string, n = 4): string {
  const words = text.trim().split(/\s+/);
  if (words.length <= n) return text.trim();
  return words.slice(0, n).join(" ") + "...";
}

/** Get last word of Arabic text */
function lastWord(text: string): string {
  const words = text.trim().split(/\s+/);
  return words[words.length - 1] ?? "";
}

/** Build shuffled options from a round */
function buildOptions(round: ChainRound, optionCount: number) {
  const distractors = shuffle([...round.distractors]).slice(0, optionCount - 1);
  const options = shuffle([
    { ...round.correct, isCorrect: true },
    ...distractors.map((d) => ({ ...d, isCorrect: false })),
  ]);
  return options;
}

function VerseChainGame({
  surahIds,
  difficulty,
  onSetup,
}: {
  surahIds: number[];
  difficulty: Difficulty;
  onSetup: () => void;
}) {
  const { t } = useTranslation();
  const locale = useLocaleStore((s) => s.locale);
  const optCount = OPTION_COUNT[difficulty];
  const timer = useGameTimer(difficulty);

  const [rounds, setRounds] = useState<ChainRound[]>([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [round, setRound] = useState(1);
  const [state, setState] = useState<GameState>("loading");
  const submittedRef = useRef(false);
  const sessionStart = useRef(Date.now());
  const questionStart = useRef(Date.now());
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [lastDelta, setLastDelta] = useState<number | null>(null);
  const [chainLength, setChainLength] = useState(0);
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const [newAchievements, setNewAchievements] = useState<string[]>([]);
  const [leagueUp, setLeagueUp] = useState<{ from: League; to: League } | null>(null);

  // Current options (shuffled)
  const [options, setOptions] = useState<(ChainVerse & { isCorrect: boolean })[]>([]);

  // Load rounds from server
  const loadRounds = useCallback(async () => {
    setState("loading");
    try {
      const data = await getVerseChainRounds({
        data: { surahIds: surahIds.length > 0 ? surahIds : undefined, count: 20 },
      });
      if (data.length > 0) {
        setRounds(data);
        setOptions(buildOptions(data[0], optCount));
        setState("playing");
        questionStart.current = Date.now();
      }
    } catch {
      setTimeout(() => loadRounds(), 1000);
    }
  }, [surahIds, optCount]);

  // Start timer when first question loads
  useEffect(() => {
    if (state === "playing" && round === 1 && !timer.isExpired) {
      timer.start();
    }
  }, [state === "playing" && round === 1]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadRounds();
  }, [loadRounds]);

  // Timer expired -> end game
  useEffect(() => {
    if (timer.isExpired && state !== "gameover") {
      setState("gameover");
    }
  }, [timer.isExpired]); // eslint-disable-line react-hooks/exhaustive-deps

  const currentRound = rounds[roundIndex];

  const endGame = useCallback(() => {
    timer.pause();
    setState("gameover");
  }, [timer]);

  const advanceToNext = useCallback(
    (nextIdx: number) => {
      if (nextIdx >= rounds.length) {
        loadRounds().then(() => {
          setRoundIndex(0);
        });
        return;
      }
      setRoundIndex(nextIdx);
      setOptions(buildOptions(rounds[nextIdx], optCount));
      setState("playing");
      setSelected(null);
      setLastDelta(null);
      setRound((r) => r + 1);
      questionStart.current = Date.now();
      timer.start();
    },
    [rounds, optCount, loadRounds, timer],
  );

  const handleAnswer = (idx: number) => {
    if (state !== "playing" || !currentRound || timer.isExpired) return;
    setSelected(idx);
    const isCorrect = options[idx].isCorrect;
    const answerTime = Date.now() - questionStart.current;
    timer.pause();

    if (isCorrect) {
      setState("correct");
      const newStreak = streak + 1;
      const pts = calcCorrectPoints(difficulty, answerTime, newStreak);
      const timeBonus = calcTimeBonusMs(answerTime);
      if (timeBonus > 0) timer.addTime(timeBonus);
      setScore((s) => s + pts);
      setStreak(newStreak);
      setBestStreak((b) => Math.max(b, newStreak));
      setCorrectCount((c) => c + 1);
      setChainLength((c) => c + 1);
      setLastDelta(pts);
      setTimeout(() => advanceToNext(roundIndex + 1), 1200);
    } else {
      setState("wrong");
      const penalty = calcWrongPenalty(difficulty);
      timer.penalizeTime(WRONG_TIME_PENALTY_MS);
      setScore((s) => Math.max(0, s - penalty));
      setStreak(0);
      setWrongCount((c) => c + 1);
      setChainLength(0);
      setLastDelta(-penalty);
      setTimeout(() => advanceToNext(roundIndex + 1), 1500);
    }
  };

  const handleRestart = () => {
    setRoundIndex(0);
    setRound(1);
    setState("loading");
    setSelected(null);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setCorrectCount(0);
    setWrongCount(0);
    setLastDelta(null);
    setChainLength(0);
    setIsNewHighScore(false);
    setNewAchievements([]);
    setLeagueUp(null);
    submittedRef.current = false;
    sessionStart.current = Date.now();
    timer.reset();
    loadRounds();
  };

  // Submit score on game over
  useEffect(() => {
    if (state === "gameover" && score > 0 && !submittedRef.current) {
      submittedRef.current = true;
      submitScore({
        data: {
          gameId: "verse-chain",
          score,
          durationMs: Date.now() - sessionStart.current,
          difficulty,
          correctCount,
          wrongCount,
          bestStreak,
        },
      })
        .then((r) => {
          if (r?.isNewHighScore) setIsNewHighScore(true);
          if (r?.newAchievements?.length) setNewAchievements(r.newAchievements);
          if (r?.leagueUp) setLeagueUp(r.leagueUp);
        })
        .catch(() => {});
    }
  }, [state, score, difficulty]);

  if (state === "gameover") {
    return (
      <GameOverCard
        theme={THEME}
        score={score}
        correctCount={correctCount}
        wrongCount={wrongCount}
        bestStreak={bestStreak}
        isNewHighScore={isNewHighScore}
        t={t}
        newAchievements={newAchievements}
        leagueUp={leagueUp}
        onRestart={handleRestart}
        onSetup={onSetup}
      />
    );
  }

  if (state === "loading" || !currentRound) {
    return (
      <div
        className="min-h-dvh flex items-center justify-center game-bg"
        style={gameBgStyle(THEME, "verse-chain")}
      >
        <div className="text-center">
          <div
            className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin mx-auto mb-3"
            style={{ borderColor: `${P} transparent ${P} ${P}` }}
          />
          <p className="text-sm" style={{ color: `${P}90` }}>
            {t.verseChainGame.loading}
          </p>
        </div>
      </div>
    );
  }

  const currentText = currentRound.current.textUthmani;
  const lastW = lastWord(currentText);
  const bodyWords = currentText.trim().split(/\s+/).slice(0, -1).join(" ");

  return (
    <div
      className="max-w-lg mx-auto min-h-dvh game-bg"
      style={gameBgStyle(THEME, "verse-chain")}
    >
      <div className="px-4 pt-2 pb-8">
        {/* Timer + Score bar */}
        <GameScoreBar
          theme={THEME}
          timerDisplay={timer.display}
          timerProgress={timer.progress}
          score={score}
          streak={streak}
          lastDelta={lastDelta}
          round={round}
        />

        {/* Chain indicator */}
        {chainLength > 0 && (
          <div className="flex items-center gap-2 mb-3">
            <div className="flex gap-1">
              {Array.from({ length: Math.min(chainLength, 10) }, (_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full game-chain-link"
                  style={{
                    backgroundColor: P,
                    animationDelay: `${i * 0.05}s`,
                    opacity: 0.5 + (i / Math.min(chainLength, 10)) * 0.5,
                  }}
                />
              ))}
            </div>
            <span className="text-[11px] font-medium" style={{ color: P }}>
              {t.verseChainGame.chainCount.replace("{count}", String(chainLength))}
            </span>
          </div>
        )}

        {/* Verse label */}
        <GameVerseLabel surahId={currentRound.current.surahId} ayahNumber={currentRound.current.ayahNumber} primary={P} fallbackName={currentRound.current.surahName} />

        {/* Current verse card */}
        <div
          className="rounded-2xl border bg-[var(--color-surface)] mb-4 overflow-hidden game-slide-up"
          style={{ borderColor: `${P}20` }}
        >
          {/* Verse text */}
          <div className="px-5 py-4">
            <p
              className="text-3xl text-right leading-[2.4] text-[var(--color-text-primary)]"
              dir="rtl"
              lang="ar"
              style={{ fontFamily: "var(--font-arabic)" }}
            >
              {bodyWords}{" "}
              <span
                className="font-semibold px-1.5 py-0.5 rounded-lg"
                style={{
                  color: P,
                  backgroundColor: `${P}15`,
                }}
              >
                {lastW}
              </span>
            </p>
          </div>

          {/* Prompt */}
          <div
            className="px-4 py-2.5 border-t flex items-center gap-2"
            style={{ borderColor: `${P}12` }}
          >
            <svg width="14" height="14" fill="none" stroke={P} strokeWidth="2" viewBox="0 0 24 24">
              <path d="M13 17l5-5-5-5M6 17l5-5-5-5" />
            </svg>
            <span className="text-xs text-[var(--color-text-secondary)]">
              {t.verseChainGame.whichVerseContinues}
            </span>
          </div>
        </div>

        {/* Options */}
        <div className="flex flex-col gap-2">
          {options.map((opt, idx) => {
            const isUnlocked = state !== "playing";
            const isSelected = selected === idx;
            const isRight = opt.isCorrect;

            let borderColor = `${P}15`;
            let bg = "var(--color-surface)";
            let extraClass = "";

            if (isSelected && state === "correct") {
              bg = `${P}10`;
              borderColor = `${P}50`;
              extraClass = "game-bounce-in";
            } else if (isSelected && state === "wrong") {
              bg = "rgba(220,38,38,0.08)";
              borderColor = "rgba(239,68,68,0.4)";
              extraClass = "game-shake";
            } else if (isUnlocked && isRight && !isSelected) {
              bg = `${P}06`;
              borderColor = `${P}30`;
            }

            return (
              <button
                key={idx}
                onClick={() => handleAnswer(idx)}
                disabled={state !== "playing"}
                className={`w-full text-right rounded-xl border px-4 py-3 transition-all ${extraClass}`}
                style={{ backgroundColor: bg, borderColor }}
              >
                <div className="flex items-center justify-between gap-3 mb-1">
                  <span className="text-[10px] text-[var(--color-text-secondary)]">
                    {isUnlocked ? `${getSurahName(opt.surahId, locale) || opt.surahName} - ${opt.ayahNumber}. Ayet` : ""}
                  </span>
                  {isSelected && state === "correct" && (
                    <span className="text-xs font-bold" style={{ color: P }}>
                      +{lastDelta}
                    </span>
                  )}
                  {isSelected && state === "wrong" && !isRight && (
                    <span className="text-xs font-bold text-red-400">
                      {lastDelta !== null && formatDelta(lastDelta)}
                    </span>
                  )}
                  {isUnlocked && isRight && !isSelected && (
                    <span className="text-[10px] font-medium" style={{ color: P }}>
                      {t.verseChainGame.correctAnswer}
                    </span>
                  )}
                </div>
                <p
                  className="text-2xl leading-[2.2] text-[var(--color-text-primary)]"
                  dir="rtl"
                  lang="ar"
                  style={{ fontFamily: "var(--font-arabic)" }}
                >
                  {firstWords(opt.textUthmani)}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function VerseChainPage() {
  const [screen, setScreen] = useState<Screen>("setup");
  const [surahIds, setSurahIds] = useState<number[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");

  if (screen === "setup") {
    return (
      <SurahPickerScreen
        gameImg={THEME.img}
        gameId="verse-chain"
        onStart={(ids, _vf, diff) => {
          setSurahIds(ids);
          setDifficulty(diff ?? "medium");
          setScreen("game");
        }}
      />
    );
  }
  return (
    <VerseChainGame
      surahIds={surahIds}
      difficulty={difficulty}
      onSetup={() => setScreen("setup")}
    />
  );
}
