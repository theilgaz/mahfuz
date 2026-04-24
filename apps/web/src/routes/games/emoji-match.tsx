/**
 * Emoji Eslestirme -- grid matching puzzle.
 * Emojiler solda, karisik Arapca kelimeler sagda.
 * Eslesen ciftler kaybolur, tahtayi temizle, yeni tura gec.
 */

import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback, useEffect, useRef } from "react";
import { submitScore } from "~/lib/score-service";
import { useTranslation } from "~/hooks/useTranslation";
import { useGameTimer } from "~/hooks/useGameTimer";
import { GameScoreBar } from "~/components/GameScoreBar";
import { GameOverCard } from "~/components/GameOverCard";
import { SurahPickerScreen } from "~/components/SurahPickerScreen";
import { GAME_THEMES, gameBgStyle } from "~/lib/game-themes";
import {
  calcCorrectPoints,
  calcWrongPenalty,
  calcTimeBonusMs,
  WRONG_TIME_PENALTY_MS,
  formatDelta,
  type Difficulty,
} from "~/lib/game-scoring";
import {
  pickRandomItems,
  getEmojiMeaning,
  type PickedItem,
} from "~/lib/emoji-words";

const GAME_ID = "emoji-match" as const;
const THEME = GAME_THEMES[GAME_ID];
const P = THEME.primary;
const PAIRS_PER_ROUND = 6;

export const Route = createFileRoute("/games/emoji-match")({
  component: EmojiMatchPage,
});

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface RoundData {
  items: PickedItem[];
  shuffledArabic: { arabic: string; idx: number }[];
}

function generateRound(usedIndices: Set<number>): RoundData {
  const items = pickRandomItems(PAIRS_PER_ROUND, usedIndices);
  const shuffledArabic = shuffle(
    items.map((picked, idx) => ({ arabic: picked.item.arabic, idx })),
  );
  return { items, shuffledArabic };
}

type Selection =
  | { type: "emoji"; idx: number }
  | { type: "arabic"; idx: number }
  | null;

type MatchFeedback = {
  emojiIdx: number;
  arabicIdx: number;
  correct: boolean;
};

function resolveCardStyle(
  isMatched: boolean,
  isFeedbackCorrect: boolean | null,
  isSelected: boolean,
): { style: React.CSSProperties; extraClass: string } {
  const base: React.CSSProperties = {
    borderColor: `${P}20`,
    backgroundColor: "var(--color-surface)",
  };

  if (isMatched) {
    return {
      style: { ...base, opacity: 0.2, pointerEvents: "none", borderColor: `${P}40`, backgroundColor: `${P}08` },
      extraClass: "",
    };
  }
  if (isFeedbackCorrect === true) {
    return {
      style: { ...base, borderColor: `${P}80`, backgroundColor: `${P}15` },
      extraClass: "game-bounce-in",
    };
  }
  if (isFeedbackCorrect === false) {
    return {
      style: { ...base, borderColor: "rgba(239,68,68,0.5)", backgroundColor: "rgba(220,38,38,0.12)" },
      extraClass: "game-shake",
    };
  }
  if (isSelected) {
    return {
      style: { ...base, borderColor: `${P}80`, backgroundColor: `${P}12`, boxShadow: `0 0 12px ${THEME.glow}` },
      extraClass: "",
    };
  }
  return { style: base, extraClass: "" };
}

function EmojiMatchPage() {
  const { t, locale } = useTranslation();
  const gt = t.emojiMatchGame;
  const [screen, setScreen] = useState<"setup" | "game" | "gameover">("setup");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const timer = useGameTimer(difficulty);

  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [lastDelta, setLastDelta] = useState<number | null>(null);
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const [newAchievements, setNewAchievements] = useState<string[]>([]);

  const [usedGlobalIndices, setUsedGlobalIndices] = useState<Set<number>>(new Set());
  const [roundData, setRoundData] = useState<RoundData>(() => generateRound(new Set()));
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [selection, setSelection] = useState<Selection>(null);
  const [feedback, setFeedback] = useState<MatchFeedback | null>(null);

  const submittedRef = useRef(false);
  const sessionStart = useRef(Date.now());
  const matchStart = useRef(Date.now());
  const timerStartedRef = useRef(false);

  useEffect(() => {
    if (screen === "game" && !timerStartedRef.current && !timer.isExpired) {
      timer.start();
      timerStartedRef.current = true;
    }
  }, [screen]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (timer.isExpired && screen === "game") {
      endGame();
    }
  }, [timer.isExpired]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!feedback) return;
    const id = setTimeout(() => setFeedback(null), 600);
    return () => clearTimeout(id);
  }, [feedback]);

  const allMatched = matched.size === PAIRS_PER_ROUND;

  const handleTapEmoji = useCallback(
    (idx: number) => {
      if (matched.has(idx) || timer.isExpired || allMatched) return;
      if (feedback) return;

      if (selection?.type === "arabic") {
        tryMatch(idx, selection.idx);
      } else {
        setSelection({ type: "emoji", idx });
        matchStart.current = Date.now();
      }
    },
    [selection, matched, timer.isExpired, allMatched, feedback], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const handleTapArabic = useCallback(
    (idx: number) => {
      if (matched.has(idx) || timer.isExpired || allMatched) return;
      if (feedback) return;

      if (selection?.type === "emoji") {
        tryMatch(selection.idx, idx);
      } else {
        setSelection({ type: "arabic", idx });
        matchStart.current = Date.now();
      }
    },
    [selection, matched, timer.isExpired, allMatched, feedback], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const tryMatch = (emojiIdx: number, arabicIdx: number) => {
    const arabicEntry = roundData.shuffledArabic[arabicIdx];
    const isCorrect = arabicEntry.idx === emojiIdx;

    if (isCorrect) {
      const answerTime = Date.now() - matchStart.current;
      const newStreak = streak + 1;
      const pts = calcCorrectPoints(difficulty, answerTime, newStreak);
      const timeBonus = calcTimeBonusMs(answerTime);
      if (timeBonus > 0) timer.addTime(timeBonus);
      setScore((s) => s + pts);
      setStreak(newStreak);
      setBestStreak((b) => Math.max(b, newStreak));
      setCorrectCount((c) => c + 1);
      setLastDelta(pts);
      setMatched((prev) => new Set(prev).add(emojiIdx));
    } else {
      const penalty = calcWrongPenalty(difficulty);
      timer.penalizeTime(WRONG_TIME_PENALTY_MS);
      setScore((s) => Math.max(0, s - penalty));
      setStreak(0);
      setWrongCount((c) => c + 1);
      setLastDelta(-penalty);
    }

    setFeedback({ emojiIdx, arabicIdx, correct: isCorrect });
    setSelection(null);
  };

  const nextRound = () => {
    if (timer.isExpired) { endGame(); return; }

    const newUsed = new Set(usedGlobalIndices);
    for (const picked of roundData.items) {
      newUsed.add(picked.globalIdx);
    }
    setUsedGlobalIndices(newUsed);

    setRoundData(generateRound(newUsed));
    setMatched(new Set());
    setSelection(null);
    setFeedback(null);
    setLastDelta(null);
    setRound((r) => r + 1);
    matchStart.current = Date.now();
  };

  const endGame = useCallback(() => {
    timer.pause();
    if (!submittedRef.current && score > 0) {
      submittedRef.current = true;
      submitScore({
        data: {
          gameId: GAME_ID,
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
        })
        .catch(() => {});
    }
    setScreen("gameover");
  }, [score, difficulty, correctCount, wrongCount, bestStreak, timer]);

  const handleRestart = () => {
    const fresh = new Set<number>();
    setUsedGlobalIndices(fresh);
    setScore(0);
    setRound(1);
    setStreak(0);
    setBestStreak(0);
    setCorrectCount(0);
    setWrongCount(0);
    setLastDelta(null);
    setIsNewHighScore(false);
    setNewAchievements([]);
    submittedRef.current = false;
    sessionStart.current = Date.now();
    matchStart.current = Date.now();
    timerStartedRef.current = false;
    setRoundData(generateRound(fresh));
    setMatched(new Set());
    setSelection(null);
    setFeedback(null);
    setScreen("game");
    timer.reset();
  };

  if (screen === "setup") {
    return (
      <SurahPickerScreen
        gameImg={THEME.img}
        gameId={GAME_ID}
        difficultyOnly
        onStart={(_ids, _vf, diff) => {
          setDifficulty(diff ?? "medium");
          handleRestart();
        }}
      />
    );
  }

  if (screen === "gameover") {
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
        onRestart={handleRestart}
        onSetup={() => setScreen("setup")}
      />
    );
  }

  const pairsLeft = PAIRS_PER_ROUND - matched.size;

  return (
    <div
      className="max-w-lg mx-auto pb-24 game-bg"
      style={gameBgStyle(THEME, GAME_ID)}
    >
      <div className="px-4 pt-2">
        <GameScoreBar
          theme={THEME}
          timerDisplay={timer.display}
          timerProgress={timer.progress}
          score={score}
          streak={streak}
          lastDelta={lastDelta}
          round={round}
        />

        <p className="text-xs text-center text-[var(--color-text-secondary)] mb-4">
          {gt.tapEmoji}
          {" - "}
          <span className="font-semibold" style={{ color: P }}>
            {gt.pairsLeft.replace("{count}", String(pairsLeft))}
          </span>
        </p>

        <div className="grid grid-cols-2 gap-3 mb-5">
          {/* Emoji column */}
          <div className="flex flex-col gap-2">
            {roundData.items.map((picked, idx) => {
              const isMatched = matched.has(idx);
              const isFeedback = feedback?.emojiIdx === idx;
              const isSelected = selection?.type === "emoji" && selection.idx === idx;
              const { style: cardStyle, extraClass } = resolveCardStyle(
                isMatched,
                isFeedback ? feedback!.correct : null,
                isSelected,
              );

              return (
                <button
                  key={idx}
                  onClick={() => handleTapEmoji(idx)}
                  disabled={isMatched}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl border transition-all ${extraClass}`}
                  style={cardStyle}
                >
                  <span className="text-2xl">{picked.item.emoji}</span>
                  <span className="text-xs text-[var(--color-text-secondary)] truncate">
                    {getEmojiMeaning(picked.item, locale)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Arabic column */}
          <div className="flex flex-col gap-2">
            {roundData.shuffledArabic.map((entry, idx) => {
              const isMatched = matched.has(entry.idx);
              const isFeedback = feedback?.arabicIdx === idx;
              const isSelected = selection?.type === "arabic" && selection.idx === idx;
              const { style: cardStyle, extraClass } = resolveCardStyle(
                isMatched,
                isFeedback ? feedback!.correct : null,
                isSelected,
              );

              return (
                <button
                  key={idx}
                  onClick={() => handleTapArabic(idx)}
                  disabled={isMatched}
                  className={`flex items-center justify-center px-3 py-3 rounded-xl border transition-all ${extraClass}`}
                  style={cardStyle}
                >
                  <span
                    className="text-xl font-bold text-[var(--color-text-primary)]"
                    dir="rtl"
                    lang="ar"
                    style={{ fontFamily: "var(--font-arabic)" }}
                  >
                    {entry.arabic}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {feedback?.correct && (
          <div
            className="px-4 py-3 rounded-xl text-center border mb-3 game-slide-up"
            style={{
              backgroundColor: `${P}10`,
              borderColor: `${P}30`,
              boxShadow: `0 2px 12px ${THEME.glow}`,
            }}
          >
            <p
              className="text-sm font-semibold flex items-center justify-center gap-2"
              style={{ color: P }}
            >
              <span className="game-star-spin">{"\u2713"}</span>
              {gt.matched} {lastDelta !== null && formatDelta(lastDelta)}
            </p>
          </div>
        )}

        {feedback && !feedback.correct && (
          <div
            className="px-4 py-3 rounded-xl text-center border mb-3 game-slide-up"
            style={{
              backgroundColor: "rgba(220,38,38,0.10)",
              borderColor: "rgba(239,68,68,0.3)",
            }}
          >
            <p
              className="text-sm font-semibold flex items-center justify-center gap-2"
              style={{ color: "#f87171" }}
            >
              <span>{"\u2717"}</span>
              {gt.wrong} {lastDelta !== null && formatDelta(lastDelta)}
            </p>
          </div>
        )}

        {allMatched && (
          <div className="text-center game-slide-up">
            <div
              className="px-4 py-3 rounded-xl border mb-3"
              style={{ backgroundColor: `${P}10`, borderColor: `${P}30` }}
            >
              <p className="text-sm font-bold" style={{ color: P }}>
                {gt.roundComplete}
              </p>
            </div>
            <button
              onClick={nextRound}
              className="w-full py-3 rounded-xl text-white font-bold text-sm active:scale-95 transition-all"
              style={{
                background: `linear-gradient(135deg, ${P}, ${THEME.secondary})`,
                boxShadow: `0 2px 10px ${THEME.glow}`,
              }}
            >
              {gt.nextRound}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
