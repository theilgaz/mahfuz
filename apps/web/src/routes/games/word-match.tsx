/**
 * Kelime Eşleştirme — grid matching puzzle.
 * Türkçe anlamlar bir kartta, karışık Arapça kelimeler diğerinde;
 * eşleşen çiftler kaybolur, tahta temizlenir, yeni tura geçilir.
 */

import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback, useEffect, useMemo, useRef } from "react";
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
import { useQuranWordPool, type QuranWord } from "~/lib/quran-word-pool";
import { EMOJI_WORDS } from "~/lib/emoji-words";
import { SurahPickerScreen } from "~/components/SurahPickerScreen";

const GAME_ID = "word-match" as const;
const THEME = GAME_THEMES[GAME_ID];
const P = THEME.primary;
const PAIRS_PER_ROUND = 8;

export const Route = createFileRoute("/games/word-match")({
  component: WordMatchPage,
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
  | { kind: "tr"; pairIdx: number; meaning: string }
  | { kind: "arabic"; pairIdx: number; arabic: string };

interface RoundData {
  items: QuranWord[];
  cards: Card[];
}

function pickRandomItems(words: QuranWord[], count: number, usedIndices: Set<number>): { items: QuranWord[]; pickedIdx: number[] } {
  const available = words.map((_, i) => i).filter((i) => !usedIndices.has(i));
  const indexPool = available.length >= count ? available : words.map((_, i) => i);
  // Aynı meaning iki kez gelmesin
  const picked: number[] = [];
  const usedMeanings = new Set<string>();
  const order = shuffle(indexPool);
  for (const i of order) {
    const m = words[i].meaning;
    if (usedMeanings.has(m)) continue;
    picked.push(i);
    usedMeanings.add(m);
    if (picked.length === count) break;
  }
  return { items: picked.map((i) => words[i]), pickedIdx: picked };
}

function generateRound(words: QuranWord[], usedIndices: Set<number>): RoundData & { pickedIdx: number[] } {
  const { items, pickedIdx } = pickRandomItems(words, PAIRS_PER_ROUND, usedIndices);
  const trCards: Card[] = items.map((it, idx) => ({
    kind: "tr",
    pairIdx: idx,
    meaning: it.meaning,
  }));
  const arabicCards: Card[] = items.map((it, idx) => ({
    kind: "arabic",
    pairIdx: idx,
    arabic: it.arabic,
  }));
  const cards = shuffle([...trCards, ...arabicCards]);
  return { items, cards, pickedIdx };
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

function WordMatchPage() {
  const { t, locale } = useTranslation();
  const gt = t.wordMatchGame;
  const [screen, setScreen] = useState<"setup" | "game" | "gameover">("setup");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const timer = useGameTimer(difficulty);

  const { data: pool } = useQuranWordPool();

  // easy → emoji oyunundaki gibi seçili tahmin edilebilir kelimeler (taş, su, kitap...)
  // hard → quran-word-pool zor bucket'ı (nadir / çekimli formlar)
  const wordsFor = useCallback((diff: Difficulty): QuranWord[] => {
    if (diff === "easy") {
      return EMOJI_WORDS.map((e) => ({ arabic: e.arabic, meaning: locale === "en" ? e.en : e.tr }));
    }
    return pool ? pool.zor : [];
  }, [pool, locale]);

  const words = useMemo(() => wordsFor(difficulty), [wordsFor, difficulty]);

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

  const [usedIndices, setUsedIndices] = useState<Set<number>>(new Set());
  const [roundData, setRoundData] = useState<RoundData | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<Set<number>>(new Set());
  const [selectedCardIdx, setSelectedCardIdx] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<MatchFeedback | null>(null);

  const submittedRef = useRef(false);
  const sessionStart = useRef(Date.now());
  const matchStart = useRef(Date.now());
  const timerStartedRef = useRef(false);

  useEffect(() => {
    if (screen === "game" && !timerStartedRef.current && !timer.isExpired && roundData) {
      timer.start();
      timerStartedRef.current = true;
    }
  }, [screen, roundData]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const allMatched = roundData != null && matchedPairs.size === roundData.items.length;

  const handleTapCard = useCallback(
    (cardIdx: number) => {
      if (!roundData) return;
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

      // Aynı taraftan iki kart seçilirse sadece seçimi güncelle
      if (prevCard.kind === card.kind) {
        setSelectedCardIdx(cardIdx);
        matchStart.current = Date.now();
        return;
      }

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
    [selectedCardIdx, matchedPairs, timer.isExpired, allMatched, feedback, roundData, streak, difficulty], // eslint-disable-line react-hooks/exhaustive-deps
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
    if (timer.isExpired || !roundData || words.length === 0) {
      if (timer.isExpired) endGame();
      return;
    }
    // Şu turun kelime indekslerini dışlanan setine ekle
    const newUsed = new Set(usedIndices);
    const indexInWords = (item: QuranWord) => words.findIndex((w) => w.arabic === item.arabic && w.meaning === item.meaning);
    for (const it of roundData.items) {
      const i = indexInWords(it);
      if (i >= 0) newUsed.add(i);
    }
    setUsedIndices(newUsed);

    const next = generateRound(words, newUsed);
    setRoundData({ items: next.items, cards: next.cards });
    setMatchedPairs(new Set());
    setSelectedCardIdx(null);
    setFeedback(null);
    setLastDelta(null);
    setRound((r) => r + 1);
    matchStart.current = Date.now();
  }, [timer, endGame, usedIndices, roundData, words]);

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

  const handleRestart = useCallback((nextDifficulty?: Difficulty) => {
    const diff = nextDifficulty ?? difficulty;
    const fresh = new Set<number>();
    const sourceWords = wordsFor(diff);
    setUsedIndices(fresh);
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
    if (sourceWords.length > 0) {
      const r = generateRound(sourceWords, fresh);
      setRoundData({ items: r.items, cards: r.cards });
    } else {
      setRoundData(null);
    }
    setMatchedPairs(new Set());
    setSelectedCardIdx(null);
    setFeedback(null);
    setScreen("game");
    timer.reset();
  }, [difficulty, pool, timer]);

  if (screen === "setup") {
    return (
      <SurahPickerScreen
        gameImg={THEME.img}
        gameId={GAME_ID}
        difficultyOnly
        simpleDifficulty
        onStart={(_ids, _vf, diff) => {
          const next = diff ?? "easy";
          setDifficulty(next);
          handleRestart(next);
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
        leagueUp={leagueUp}
        onRestart={() => handleRestart(difficulty)}
        onSetup={() => setScreen("setup")}
      />
    );
  }

  if (!roundData) {
    return (
      <div className="max-w-lg mx-auto pb-24 px-4 pt-10 game-bg" style={gameBgStyle(THEME, GAME_ID)}>
        <div className="px-5 py-12 rounded-2xl border bg-[var(--color-surface)] text-center text-sm text-[var(--color-text-secondary)]">
          Kelime havuzu yükleniyor…
        </div>
      </div>
    );
  }

  const pairsLeft = roundData.items.length - matchedPairs.size;

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

        <div className="grid grid-cols-4 gap-2 mb-5">
          {roundData.cards.map((card, cardIdx) => {
            const isMatched = matchedPairs.has(card.pairIdx);
            const isFeedback = feedback?.cardA === cardIdx || feedback?.cardB === cardIdx;
            const isSelected = selectedCardIdx === cardIdx;
            const { style: cardStyle, extraClass } = resolveCardStyle(
              isMatched,
              isFeedback ? feedback!.correct : null,
              isSelected,
            );

            if (card.kind === "tr") {
              return (
                <button
                  key={cardIdx}
                  onClick={() => handleTapCard(cardIdx)}
                  disabled={isMatched}
                  className={`flex items-center justify-center px-2 py-3 rounded-xl border transition-all min-h-[64px] ${extraClass}`}
                  style={cardStyle}
                >
                  <span className="text-xs sm:text-sm font-medium text-[var(--color-text-primary)] text-center leading-tight">
                    {card.meaning}
                  </span>
                </button>
              );
            }

            return (
              <button
                key={cardIdx}
                onClick={() => handleTapCard(cardIdx)}
                disabled={isMatched}
                className={`flex items-center justify-center px-2 py-3 rounded-xl border transition-all min-h-[64px] ${extraClass}`}
                style={cardStyle}
              >
                <span
                  className="text-base sm:text-lg font-bold text-[var(--color-text-primary)]"
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
              <span className="game-star-spin">{"✓"}</span>
              {gt.matched} {lastDelta !== null && formatDelta(lastDelta)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
