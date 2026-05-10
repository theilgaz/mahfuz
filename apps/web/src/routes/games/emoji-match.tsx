/**
 * Emoji Eslestirme -- grid matching puzzle.
 * Emojiler solda, karisik Arapca kelimeler sagda.
 * Eslesen ciftler kaybolur, tahtayi temizle, yeni tura gec.
 */

import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback, useEffect, useRef } from "react";
import { submitScore } from "~/lib/score-service";
import type { League } from "~/lib/league";
import { useTranslation } from "~/hooks/useTranslation";
import { useGameTimer } from "~/hooks/useGameTimer";
import { GameScoreBar } from "~/components/GameScoreBar";
import { GameOverCard } from "~/components/GameOverCard";
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

type Card =
  | { kind: "emoji"; pairIdx: number; emoji: string; meaning: string }
  | { kind: "arabic"; pairIdx: number; arabic: string };

interface RoundData {
  items: PickedItem[];
  cards: Card[];
}

function generateRound(usedIndices: Set<number>): RoundData {
  const items = pickRandomItems(PAIRS_PER_ROUND, usedIndices);
  const emojiCards: Card[] = items.map((picked, idx) => ({
    kind: "emoji",
    pairIdx: idx,
    emoji: picked.item.emoji,
    meaning: "",
  }));
  const arabicCards: Card[] = items.map((picked, idx) => ({
    kind: "arabic",
    pairIdx: idx,
    arabic: picked.item.arabic,
  }));
  const cards = shuffle([...emojiCards, ...arabicCards]);
  return { items, cards };
}

type MatchFeedback = {
  cardA: number;
  cardB: number;
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
  const [screen, setScreen] = useState<"game" | "gameover">("game");
  const difficulty: Difficulty = "easy";
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
  const [leagueUp, setLeagueUp] = useState<{ from: League; to: League } | null>(null);

  const [usedGlobalIndices, setUsedGlobalIndices] = useState<Set<number>>(new Set());
  const [roundData, setRoundData] = useState<RoundData>(() => generateRound(new Set()));
  const [matchedPairs, setMatchedPairs] = useState<Set<number>>(new Set());
  const [selectedCardIdx, setSelectedCardIdx] = useState<number | null>(null);
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

  const allMatched = matchedPairs.size === PAIRS_PER_ROUND;

  const handleTapCard = useCallback(
    (cardIdx: number) => {
      const card = roundData.cards[cardIdx];
      if (matchedPairs.has(card.pairIdx) || timer.isExpired || allMatched) return;
      if (feedback) return;

      if (selectedCardIdx === null) {
        setSelectedCardIdx(cardIdx);
        matchStart.current = Date.now();
        return;
      }

      if (selectedCardIdx === cardIdx) {
        setSelectedCardIdx(null);
        return;
      }

      const prevCard = roundData.cards[selectedCardIdx];

      // Must select one emoji and one arabic - same kind is just re-select
      if (prevCard.kind === card.kind) {
        setSelectedCardIdx(cardIdx);
        matchStart.current = Date.now();
        return;
      }

      // Try match
      const isCorrect = prevCard.pairIdx === card.pairIdx;

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
        setMatchedPairs((prev) => new Set(prev).add(card.pairIdx));
      } else {
        const penalty = calcWrongPenalty(difficulty);
        timer.penalizeTime(WRONG_TIME_PENALTY_MS);
        setScore((s) => Math.max(0, s - penalty));
        setStreak(0);
        setWrongCount((c) => c + 1);
        setLastDelta(-penalty);
      }

      setFeedback({ cardA: selectedCardIdx, cardB: cardIdx, correct: isCorrect });
      setSelectedCardIdx(null);
    },
    [selectedCardIdx, matchedPairs, timer.isExpired, allMatched, feedback, roundData.cards, streak, difficulty], // eslint-disable-line react-hooks/exhaustive-deps
  );

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
          if (r?.leagueUp) setLeagueUp(r.leagueUp);
        })
        .catch(() => {});
    }
    setScreen("gameover");
  }, [score, difficulty, correctCount, wrongCount, bestStreak, timer]);

  const nextRound = useCallback(() => {
    if (timer.isExpired) { endGame(); return; }

    const newUsed = new Set(usedGlobalIndices);
    for (const picked of roundData.items) {
      newUsed.add(picked.globalIdx);
    }
    setUsedGlobalIndices(newUsed);

    setRoundData(generateRound(newUsed));
    setMatchedPairs(new Set());
    setSelectedCardIdx(null);
    setFeedback(null);
    setLastDelta(null);
    setRound((r) => r + 1);
    matchStart.current = Date.now();
  }, [timer, endGame, usedGlobalIndices, roundData]);

  const AUTO_ADVANCE_MS = 1000;
  useEffect(() => {
    if (!allMatched) return;
    const id = setTimeout(() => nextRound(), AUTO_ADVANCE_MS);
    return () => clearTimeout(id);
  }, [allMatched, nextRound]);

  useEffect(() => {
    if (!allMatched) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); nextRound(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [allMatched, nextRound]);

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
    setLeagueUp(null);
    submittedRef.current = false;
    sessionStart.current = Date.now();
    matchStart.current = Date.now();
    timerStartedRef.current = false;
    setRoundData(generateRound(fresh));
    setMatchedPairs(new Set());
    setSelectedCardIdx(null);
    setFeedback(null);
    setScreen("game");
    timer.reset();
  };

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
        leagueUp={leagueUp}
        onRestart={handleRestart}
      />
    );
  }

  const pairsLeft = PAIRS_PER_ROUND - matchedPairs.size;

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
          onFinish={endGame}
        />

        <p className="text-xs text-center text-[var(--color-text-secondary)] mb-4">
          {gt.tapEmoji}
          {" - "}
          <span className="font-semibold" style={{ color: P }}>
            {gt.pairsLeft.replace("{count}", String(pairsLeft))}
          </span>
        </p>

        <div className="grid grid-cols-3 gap-2 mb-5">
          {roundData.cards.map((card, cardIdx) => {
            const isMatched = matchedPairs.has(card.pairIdx);
            const isFeedback = feedback?.cardA === cardIdx || feedback?.cardB === cardIdx;
            const isSelected = selectedCardIdx === cardIdx;
            const { style: cardStyle, extraClass } = resolveCardStyle(
              isMatched,
              isFeedback ? feedback!.correct : null,
              isSelected,
            );

            if (card.kind === "emoji") {
              return (
                <button
                  key={cardIdx}
                  onClick={() => handleTapCard(cardIdx)}
                  disabled={isMatched}
                  className={`flex flex-col items-center justify-center gap-1 px-2 py-3 rounded-xl border transition-all ${extraClass}`}
                  style={cardStyle}
                >
                  <span className="text-2xl">{card.emoji}</span>
                  <span className="text-[10px] text-[var(--color-text-secondary)] truncate max-w-full">
                    {getEmojiMeaning(roundData.items[card.pairIdx].item, locale)}
                  </span>
                </button>
              );
            }

            return (
              <button
                key={cardIdx}
                onClick={() => handleTapCard(cardIdx)}
                disabled={isMatched}
                className={`flex items-center justify-center px-2 py-3 rounded-xl border transition-all ${extraClass}`}
                style={cardStyle}
              >
                <span
                  className="text-lg font-bold text-[var(--color-text-primary)]"
                  dir="rtl"
                  lang="ar"
                  style={{ fontFamily: "var(--font-arabic)" }}
                >
                  {card.arabic}
                </span>
              </button>
            );
          })}
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
              className="relative overflow-hidden w-full py-3 rounded-xl text-white font-bold text-sm active:scale-95 transition-all"
              style={{
                background: `linear-gradient(135deg, ${P}, ${THEME.secondary})`,
                boxShadow: `0 2px 10px ${THEME.glow}`,
              }}
            >
              <span
                aria-hidden="true"
                className="absolute inset-0 origin-left"
                style={{ background: "rgba(255,255,255,0.22)", animation: `game-advance-fill ${AUTO_ADVANCE_MS}ms linear forwards` }}
              />
              <span className="relative">{gt.nextRound}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
