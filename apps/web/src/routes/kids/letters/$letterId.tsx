import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { useTranslation } from "~/hooks/useTranslation";
import { ARABIC_LETTERS, REWARDS } from "~/lib/kids-constants";
import { useKidsSound } from "~/lib/kids-sounds";
import { useKidsProgressStore } from "~/stores/useKidsProgressStore";
import { useKidsStore } from "~/stores/useKidsStore";
import { LetterMeet } from "~/components/kids/LetterMeet";
import { LetterTrace } from "~/components/kids/LetterTrace";
import { SoundMatch } from "~/components/kids/SoundMatch";
import { LetterHunt } from "~/components/kids/LetterHunt";
import { LetterQuiz } from "~/components/kids/LetterQuiz";
import { CelebrationOverlay } from "~/components/kids/CelebrationOverlay";

export const Route = createFileRoute("/kids/letters/$letterId")({
  component: LetterDetail,
});

type Tab = "meet" | "trace" | "soundMatch" | "letterHunt" | "quiz";

const TABS: Tab[] = ["meet", "trace", "soundMatch", "letterHunt", "quiz"];

const TAB_LABELS: Record<Tab, string> = {
  meet: "1",
  trace: "2",
  soundMatch: "3",
  letterHunt: "4",
  quiz: "5",
};

function LetterDetail() {
  const { letterId } = Route.useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const sound = useKidsSound();

  const letter = ARABIC_LETTERS.find((l) => l.id === letterId);

  const markLetterTraced = useKidsProgressStore((s) => s.markLetterTraced);
  const markLetterMatched = useKidsProgressStore((s) => s.markLetterMatched);
  const markLetterQuizzed = useKidsProgressStore((s) => s.markLetterQuizzed);
  const completeLetter = useKidsProgressStore((s) => s.completeLetter);
  const addStars = useKidsStore((s) => s.addStars);

  const [activeTab, setActiveTab] = useState<Tab>("meet");
  const [celebration, setCelebration] = useState<"confetti" | "stars" | null>(null);
  const [completed, setCompleted] = useState(false);
  const [earnedStars, setEarnedStars] = useState(0);

  const advanceToNext = useCallback(
    (from: Tab) => {
      const idx = TABS.indexOf(from);
      if (idx < TABS.length - 1) {
        setActiveTab(TABS[idx + 1]);
        sound.tap();
      }
    },
    [sound],
  );

  // Tab completion handlers
  const handleMeetComplete = useCallback(() => advanceToNext("meet"), [advanceToNext]);

  const handleTraceComplete = useCallback(() => {
    if (!letter) return;
    markLetterTraced(letter.id);
    setCelebration("stars");
    setTimeout(() => {
      setCelebration(null);
      advanceToNext("trace");
    }, 1500);
  }, [letter, markLetterTraced, advanceToNext]);

  const handleSoundMatchComplete = useCallback(() => {
    if (!letter) return;
    markLetterMatched(letter.id);
    setCelebration("stars");
    setTimeout(() => {
      setCelebration(null);
      advanceToNext("soundMatch");
    }, 1500);
  }, [letter, markLetterMatched, advanceToNext]);

  const handleLetterHuntComplete = useCallback(() => {
    setCelebration("stars");
    setTimeout(() => {
      setCelebration(null);
      advanceToNext("letterHunt");
    }, 1500);
  }, [advanceToNext]);

  const handleQuizComplete = useCallback(
    (correctCount: number, total: number) => {
      if (!letter) return;
      markLetterQuizzed(letter.id);

      // Calculate stars: base reward + bonus for perfect
      const stars = REWARDS.learnLetter + (correctCount === total ? 2 : 0);
      setEarnedStars(stars);
      completeLetter(letter.id, stars);
      addStars(stars);

      sound.levelUp();
      setCelebration("confetti");
      setCompleted(true);
    },
    [letter, markLetterQuizzed, completeLetter, addStars, sound],
  );

  if (!letter) {
    return (
      <div className="flex flex-col items-center gap-4 py-20">
        <p className="text-gray-500">{t.kids.letters.notFound}</p>
        <Link to="/kids/letters" className="text-blue-500 underline">
          {t.kids.common.back}
        </Link>
      </div>
    );
  }

  // Find next letter for "Sonraki Harf" button
  const nextLetter = ARABIC_LETTERS.find((l) => l.order === letter.order + 1);

  return (
    <div className="relative mx-auto max-w-lg px-4 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 py-3 backdrop-blur-sm" style={{ background: "linear-gradient(to bottom, rgba(255,247,237,0.95), rgba(255,247,237,0.8))" }}>
        <Link
          to="/kids/letters"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm active:scale-95"
        >
          <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </Link>
        <div className="flex-1 text-center" dir="rtl">
          <span className="font-arabic text-2xl text-gray-800">{letter.arabic}</span>
          <span className="mr-2 text-[14px] font-bold text-gray-500" dir="ltr">{letter.name}</span>
        </div>
        <div className="w-10" /> {/* Spacer for symmetry */}
      </div>

      {/* Tab progress bar */}
      <div className="my-4 flex items-center justify-center gap-1">
        {TABS.map((tab, i) => {
          const isActive = tab === activeTab;
          const isPast = TABS.indexOf(activeTab) > i;
          const isCompleted = completed;

          return (
            <button
              key={tab}
              onClick={() => {
                // Allow going back to completed tabs
                if (isPast || isActive) setActiveTab(tab);
              }}
              className={`flex h-9 w-9 items-center justify-center rounded-full text-[13px] font-bold transition-all ${
                isCompleted || isPast
                  ? "bg-emerald-400 text-white"
                  : isActive
                    ? "bg-blue-500 text-white scale-110 shadow-md"
                    : "bg-gray-200 text-gray-400"
              }`}
            >
              {isCompleted || isPast ? "✓" : TAB_LABELS[tab]}
            </button>
          );
        })}
      </div>

      {/* Tab label */}
      <div className="mb-2 text-center">
        <span className="text-[12px] font-medium text-gray-400">
          {activeTab === "meet" && t.kids.letters.meet}
          {activeTab === "trace" && t.kids.letters.trace}
          {activeTab === "soundMatch" && t.kids.letters.soundMatch}
          {activeTab === "letterHunt" && t.kids.letters.letterHunt}
          {activeTab === "quiz" && t.kids.letters.quiz}
        </span>
      </div>

      {/* Content */}
      {!completed && (
        <>
          {activeTab === "meet" && <LetterMeet letter={letter} onComplete={handleMeetComplete} />}
          {activeTab === "trace" && <LetterTrace letter={letter} onComplete={handleTraceComplete} />}
          {activeTab === "soundMatch" && <SoundMatch letter={letter} onComplete={handleSoundMatchComplete} />}
          {activeTab === "letterHunt" && <LetterHunt letter={letter} onComplete={handleLetterHuntComplete} />}
          {activeTab === "quiz" && <LetterQuiz letter={letter} onComplete={handleQuizComplete} />}
        </>
      )}

      {/* Completion screen */}
      {completed && (
        <div className="flex flex-col items-center gap-5 py-10">
          <div className="flex h-32 w-32 items-center justify-center rounded-full bg-emerald-100 shadow-lg">
            <span className="font-arabic text-[80px] leading-none text-emerald-600" dir="rtl">
              {letter.arabic}
            </span>
          </div>

          <h2 className="text-2xl font-bold text-emerald-700">{t.kids.letters.completed}</h2>

          <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-5 py-3">
            <span className="text-2xl">⭐</span>
            <span className="text-lg font-bold text-amber-600">
              +{earnedStars} {t.kids.letters.starsEarned}
            </span>
          </div>

          <div className="flex flex-col gap-3 pt-4">
            {nextLetter ? (
              <button
                onClick={() => {
                  navigate({ to: "/kids/letters/$letterId", params: { letterId: nextLetter.id } });
                  // Reset state for next letter
                  setActiveTab("meet");
                  setCompleted(false);
                  setCelebration(null);
                  setEarnedStars(0);
                }}
                className="rounded-2xl bg-blue-500 px-8 py-3.5 text-[15px] font-bold text-white shadow-md active:scale-95"
              >
                {t.kids.letters.nextLetter} →
              </button>
            ) : (
              <p className="text-center text-[14px] font-semibold text-emerald-600">
                {t.kids.letters.allCompleted}
              </p>
            )}

            <Link
              to="/kids/letters"
              className="rounded-2xl border border-gray-200 px-8 py-3.5 text-center text-[15px] font-semibold text-gray-500 active:scale-95"
            >
              {t.kids.common.back}
            </Link>
          </div>
        </div>
      )}

      {/* Celebration overlay */}
      <CelebrationOverlay
        type={celebration ?? "stars"}
        visible={celebration !== null}
        onComplete={() => setCelebration(null)}
      />
    </div>
  );
}
