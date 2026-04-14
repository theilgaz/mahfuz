/**
 * Qaida sinav route'u - /qaida/exam/:stepId
 * Step 1: Elifba sinavina yonlendirir
 * Step 2: Hareke sinavi (fetha, kesra, damme) - 10 soru, %80 gecme
 * Step 3-10: Yakin zamanda
 */

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo, useCallback } from "react";
import { useQaidaStore } from "~/stores/qaida.store";
import { useTranslation } from "~/hooks/useTranslation";
import { playCorrect, playWrong } from "~/lib/quiz-sounds";
import { shuffle } from "~/lib/kids-constants";

export const Route = createFileRoute("/qaida/exam/$stepId")({
  component: QaidaExamPage,
});

const PASS_THRESHOLD = 0.8; // %80

// ── Step 2: Hareke sinav verileri ───────────────────────

type HarekeType = "fetha" | "kesra" | "damme";

interface HarekeQuestion {
  display: string;
  correct: HarekeType;
  options: HarekeType[];
}

const HAREKE_POOL: { letter: string; hareke: HarekeType; display: string }[] = [
  // Fetha
  { letter: "\u0628", hareke: "fetha", display: "\u0628\u064E" },
  { letter: "\u062A", hareke: "fetha", display: "\u062A\u064E" },
  { letter: "\u062C", hareke: "fetha", display: "\u062C\u064E" },
  { letter: "\u062F", hareke: "fetha", display: "\u062F\u064E" },
  { letter: "\u0631", hareke: "fetha", display: "\u0631\u064E" },
  { letter: "\u0633", hareke: "fetha", display: "\u0633\u064E" },
  { letter: "\u0639", hareke: "fetha", display: "\u0639\u064E" },
  { letter: "\u0641", hareke: "fetha", display: "\u0641\u064E" },
  { letter: "\u0643", hareke: "fetha", display: "\u0643\u064E" },
  { letter: "\u0644", hareke: "fetha", display: "\u0644\u064E" },
  { letter: "\u0645", hareke: "fetha", display: "\u0645\u064E" },
  { letter: "\u0646", hareke: "fetha", display: "\u0646\u064E" },
  // Kesra
  { letter: "\u0628", hareke: "kesra", display: "\u0628\u0650" },
  { letter: "\u062A", hareke: "kesra", display: "\u062A\u0650" },
  { letter: "\u062C", hareke: "kesra", display: "\u062C\u0650" },
  { letter: "\u062F", hareke: "kesra", display: "\u062F\u0650" },
  { letter: "\u0633", hareke: "kesra", display: "\u0633\u0650" },
  { letter: "\u0639", hareke: "kesra", display: "\u0639\u0650" },
  { letter: "\u0641", hareke: "kesra", display: "\u0641\u0650" },
  { letter: "\u0643", hareke: "kesra", display: "\u0643\u0650" },
  { letter: "\u0644", hareke: "kesra", display: "\u0644\u0650" },
  { letter: "\u0645", hareke: "kesra", display: "\u0645\u0650" },
  { letter: "\u0646", hareke: "kesra", display: "\u0646\u0650" },
  { letter: "\u0647", hareke: "kesra", display: "\u0647\u0650" },
  // Damme
  { letter: "\u0628", hareke: "damme", display: "\u0628\u064F" },
  { letter: "\u062A", hareke: "damme", display: "\u062A\u064F" },
  { letter: "\u062C", hareke: "damme", display: "\u062C\u064F" },
  { letter: "\u062F", hareke: "damme", display: "\u062F\u064F" },
  { letter: "\u0633", hareke: "damme", display: "\u0633\u064F" },
  { letter: "\u0639", hareke: "damme", display: "\u0639\u064F" },
  { letter: "\u0641", hareke: "damme", display: "\u0641\u064F" },
  { letter: "\u0643", hareke: "damme", display: "\u0643\u064F" },
  { letter: "\u0644", hareke: "damme", display: "\u0644\u064F" },
  { letter: "\u0645", hareke: "damme", display: "\u0645\u064F" },
  { letter: "\u0646", hareke: "damme", display: "\u0646\u064F" },
  { letter: "\u0647", hareke: "damme", display: "\u0647\u064F" },
];

const ALL_TYPES: HarekeType[] = ["fetha", "kesra", "damme"];

function buildHarekeQuestions(count: number): HarekeQuestion[] {
  const shuffled = shuffle(HAREKE_POOL).slice(0, count);
  return shuffled.map((q) => ({
    display: q.display,
    correct: q.hareke,
    options: shuffle([...ALL_TYPES]),
  }));
}

function useHarekeLabel(type: HarekeType): string {
  const { t } = useTranslation();
  const map: Record<HarekeType, string> = {
    fetha: t.hub.qaidaFetha,
    kesra: t.hub.qaidaKesra,
    damme: t.hub.qaidaDamme,
  };
  return map[type];
}

// ── Component ───────────────────────────────────────────

function QaidaExamPage() {
  const { stepId } = Route.useParams();
  const step = parseInt(stepId, 10);
  const navigate = useNavigate();

  // Step 1: Elifba sinavina yonlendir
  if (step === 1) {
    navigate({ to: "/alifba/exam" });
    return null;
  }

  // Step 3-10: Placeholder
  if (step > 2) {
    return <PlaceholderExam step={step} />;
  }

  // Step 2: Hareke sinavi
  return <HarekeExam />;
}

function PlaceholderExam({ step }: { step: number }) {
  const { t } = useTranslation();
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 text-center">
      <div className="w-16 h-16 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-[var(--color-text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </div>
      <h1 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
        {t.hub.qaidaExamPlaceholderTitle.replace("{step}", String(step))}
      </h1>
      <p className="text-sm text-[var(--color-text-secondary)] mb-6">
        {t.hub.qaidaExamPlaceholderDesc}
      </p>
      <Link
        to="/qaida"
        className="inline-block px-5 py-2.5 rounded bg-[var(--color-accent)] text-white text-sm font-semibold"
      >
        {t.hub.qaidaExamBack}
      </Link>
    </div>
  );
}

function HarekeExam() {
  const TOTAL = 10;
  const { t } = useTranslation();
  const completeStep = useQaidaStore((s) => s.completeStep);

  const questions = useMemo(() => buildHarekeQuestions(TOTAL), []);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [finished, setFinished] = useState(false);

  const q = questions[current];

  const handleAnswer = useCallback(
    (value: string) => {
      if (selected) return;
      setSelected(value);

      const isCorrect = value === q.correct;
      if (isCorrect) {
        playCorrect();
        setScore((s) => s + 1);
      } else {
        playWrong();
      }

      setTimeout(() => {
        if (current + 1 >= TOTAL) {
          const finalScore = isCorrect ? score + 1 : score;
          if (finalScore / TOTAL >= PASS_THRESHOLD) {
            completeStep(2);
          }
          setFinished(true);
          setShowResult(true);
        } else {
          setCurrent((c) => c + 1);
          setSelected(null);
        }
      }, 800);
    },
    [selected, current, q, score, completeStep],
  );

  if (finished && showResult) {
    const passed = score / TOTAL >= PASS_THRESHOLD;
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 text-center">
        <div
          className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
            passed ? "bg-green-100 text-green-600" : "bg-red-100 text-red-500"
          }`}
        >
          {passed ? (
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </div>

        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
          {passed ? t.hub.qaidaExamCongrats : t.hub.qaidaExamTryAgain}
        </h1>
        <p className="text-lg font-semibold text-[var(--color-accent)] mb-1">
          {score} / {TOTAL}
        </p>
        <p className="text-sm text-[var(--color-text-secondary)] mb-6">
          {passed
            ? t.hub.qaidaExamPass
            : t.hub.qaidaExamFail.replace("{count}", String(Math.ceil(TOTAL * PASS_THRESHOLD)))}
        </p>

        <div className="flex gap-3 justify-center">
          <Link
            to="/qaida"
            className="px-5 py-2.5 rounded bg-[var(--color-accent)] text-white text-sm font-semibold"
          >
            {t.hub.qaidaExamBack}
          </Link>
          {!passed && (
            <button
              onClick={() => {
                setCurrent(0);
                setScore(0);
                setSelected(null);
                setShowResult(false);
                setFinished(false);
              }}
              className="px-5 py-2.5 rounded border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm font-semibold"
            >
              {t.hub.qaidaExamRetry}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
      {/* Progress */}
      <div className="flex items-center justify-end mb-4">
        <span className="text-xs font-medium text-[var(--color-text-secondary)] tabular-nums">
          {current + 1} / {TOTAL}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 rounded-full bg-[var(--color-border)] mb-8 overflow-hidden">
        <div
          className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-300"
          style={{ width: `${((current + 1) / TOTAL) * 100}%` }}
        />
      </div>

      {/* Soru */}
      <div className="text-center mb-10">
        <p className="text-sm text-[var(--color-text-secondary)] mb-4">{t.hub.qaidaExamQuestion}</p>
        <span
          className="leading-none"
          style={{ fontFamily: "var(--font-arabic)", fontSize: "8rem" }}
        >
          {q.display}
        </span>
      </div>

      {/* Secenekler */}
      <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
        {q.options.map((type) => (
          <OptionButton
            key={type}
            type={type}
            selected={selected}
            correct={q.correct}
            onSelect={handleAnswer}
          />
        ))}
      </div>

      {/* Skor */}
      <div className="mt-6 text-center">
        <span className="text-xs text-[var(--color-text-secondary)]">
          {t.hub.qaidaExamScore}: {score} / {current + (selected ? 1 : 0)}
        </span>
      </div>
    </div>
  );
}

function OptionButton({
  type,
  selected,
  correct,
  onSelect,
}: {
  type: HarekeType;
  selected: string | null;
  correct: HarekeType;
  onSelect: (v: string) => void;
}) {
  const label = useHarekeLabel(type);
  const isSelected = selected === type;
  const isCorrect = type === correct;

  let btnClass = "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)]/50";
  if (selected) {
    if (isCorrect) {
      btnClass = "border-green-400 bg-green-50 text-green-700";
    } else if (isSelected && !isCorrect) {
      btnClass = "border-red-400 bg-red-50 text-red-600";
    } else {
      btnClass = "border-[var(--color-border)] bg-[var(--color-surface)] opacity-50";
    }
  }

  return (
    <button
      onClick={() => onSelect(type)}
      disabled={!!selected}
      className={`flex flex-col items-center justify-center gap-1 px-3 py-4 rounded border text-center transition-all ${btnClass}`}
    >
      <span className="text-sm font-semibold">{label}</span>
      {selected && isCorrect && (
        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      )}
      {selected && isSelected && !isCorrect && (
        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
    </button>
  );
}
