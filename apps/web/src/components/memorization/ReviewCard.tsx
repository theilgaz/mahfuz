import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { MemorizationCard, QualityGrade } from "@mahfuz/shared/types";
import { verseByKeyQueryOptions } from "~/hooks/useVerses";
import { useTranslation } from "~/hooks/useTranslation";
import { Button } from "~/components/ui/Button";

const GRADE_COLORS: Record<QualityGrade, string> = {
  0: "bg-red-500 hover:bg-red-600",
  1: "bg-red-400 hover:bg-red-500",
  2: "bg-orange-400 hover:bg-orange-500",
  3: "bg-yellow-500 hover:bg-yellow-600",
  4: "bg-blue-500 hover:bg-blue-600",
  5: "bg-emerald-500 hover:bg-emerald-600",
};

const SIMPLE_GRADE_CONFIGS: { grade: QualityGrade; color: string }[] = [
  { grade: 1, color: "bg-red-500 hover:bg-red-600" },
  { grade: 3, color: "bg-orange-400 hover:bg-orange-500" },
  { grade: 5, color: "bg-emerald-500 hover:bg-emerald-600" },
];

interface ReviewCardProps {
  card: MemorizationCard;
  revealedWords: number;
  totalWords: number;
  onRevealNext: () => void;
  onRevealAll: () => void;
  onGrade: (grade: QualityGrade) => void;
  onSetRevealState: (revealed: number, total: number) => void;
}

export function ReviewCard({
  card,
  revealedWords,
  totalWords,
  onRevealNext,
  onRevealAll,
  onGrade,
  onSetRevealState,
}: ReviewCardProps) {
  const { data: verseData, isLoading } = useQuery(
    verseByKeyQueryOptions(card.verseKey),
  );

  const { t } = useTranslation();
  const verse = verseData;
  const words = verse?.words?.filter((w: any) => w.char_type_name === "word") || [];
  const isFullyRevealed = revealedWords >= words.length && words.length > 0;

  // Set total word count when verse loads
  useEffect(() => {
    if (words.length > 0 && totalWords !== words.length) {
      onSetRevealState(revealedWords, words.length);
    }
  }, [words.length, totalWords, revealedWords, onSetRevealState]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (!verse) {
    return (
      <div className="rounded-2xl bg-[var(--theme-bg-primary)] p-8 text-center shadow-[var(--shadow-card)]">
        <p className="text-[var(--theme-text-tertiary)]">
          {t.memorize.review.verseLoadError}: {card.verseKey}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-[var(--theme-bg-primary)] p-6 shadow-[var(--shadow-card)] sm:p-8">
      {/* Verse key label + word count */}
      <div className="mb-4 text-center">
        <span className="text-[12px] tabular-nums text-[var(--theme-text-quaternary)]">
          {card.verseKey}
        </span>
        {words.length > 0 && !isFullyRevealed && (
          <p className="mt-1 text-[11px] tabular-nums text-[var(--theme-text-quaternary)]">
            {revealedWords} / {words.length} {t.memorize.review.wordCount}
          </p>
        )}
      </div>

      {/* Arabic text with progressive reveal */}
      <div className="mb-6" dir="rtl">
        <p className="arabic-text text-center leading-[2.6] text-[var(--theme-text)]" style={{ fontSize: "calc(1.65rem * 1.1)" }}>
          {words.map((w, i) => {
            const isRevealed = i < revealedWords;
            return (
              <span
                key={w.id}
                className={`inline-block transition-[filter,opacity] duration-500 ease-out ${
                  isRevealed
                    ? "opacity-100"
                    : "cursor-pointer select-none opacity-40"
                }`}
                style={{
                  filter: isRevealed ? "blur(0px)" : "blur(8px)",
                }}
                onClick={!isRevealed ? onRevealNext : undefined}
              >
                {w.text_uthmani}{" "}
              </span>
            );
          })}
        </p>
      </div>

      {/* Actions */}
      {!isFullyRevealed ? (
        <div className="flex flex-col items-center gap-3">
          <div className="flex gap-3">
            <Button onClick={onRevealNext} aria-label={t.memorize.review.nextWord}>
              {t.memorize.review.nextWord}
            </Button>
            <Button variant="ghost" onClick={onRevealAll} aria-label={t.memorize.review.revealAll}>
              {t.memorize.review.revealAll}
            </Button>
          </div>
          <button
            onClick={() => onGrade(5)}
            className="text-[13px] text-[var(--theme-text-tertiary)] transition-colors hover:text-emerald-600"
            aria-label={t.memorize.review.memorized}
          >
            {t.memorize.review.memorized}
          </button>
        </div>
      ) : (
        <>
          {/* Turkish translation (collapsible) */}
          {verse.translations && verse.translations.length > 0 && (
            <div className="mb-6 border-l-2 border-[var(--theme-divider)] py-1 pl-4">
              <p
                className="text-[14px] leading-[1.8] text-[var(--theme-text-secondary)]"
                dangerouslySetInnerHTML={{
                  __html: verse.translations[0].text,
                }}
              />
            </div>
          )}

          {/* Grade buttons */}
          <GradeButtons onGrade={onGrade} />
        </>
      )}
    </div>
  );
}

function GradeButtons({ onGrade }: { onGrade: (grade: QualityGrade) => void }) {
  const [showDetailed, setShowDetailed] = useState(false);
  const { t } = useTranslation();

  const DETAILED_GRADE_LABELS: Record<QualityGrade, string> = {
    0: t.memorize.review.detailedGrades.blackout,
    1: t.memorize.review.detailedGrades.veryHard,
    2: t.memorize.review.detailedGrades.hard,
    3: t.memorize.review.detailedGrades.medium,
    4: t.memorize.review.detailedGrades.easy,
    5: t.memorize.review.detailedGrades.veryEasy,
  };

  const SIMPLE_GRADES: { grade: QualityGrade; label: string; color: string }[] = [
    { grade: 1, label: t.memorize.review.grades.again, color: "bg-red-500 hover:bg-red-600" },
    { grade: 3, label: t.memorize.review.grades.hard, color: "bg-orange-400 hover:bg-orange-500" },
    { grade: 5, label: t.memorize.review.grades.easy, color: "bg-emerald-500 hover:bg-emerald-600" },
  ];

  return (
    <div className="mt-4">
      <p className="mb-3 text-center text-[13px] text-[var(--theme-text-tertiary)]">
        {t.memorize.review.gradePrompt}
      </p>
      {!showDetailed ? (
        <div className="grid grid-cols-3 gap-2">
          {SIMPLE_GRADES.map(({ grade, label, color }) => (
            <button
              key={grade}
              onClick={() => onGrade(grade)}
              aria-label={`${label} (${grade}/5)`}
              className={`rounded-xl px-2 py-3 text-[14px] font-medium text-white transition-all active:scale-[0.97] ${color}`}
            >
              {label}
            </button>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {([0, 1, 2, 3, 4, 5] as QualityGrade[]).map((grade) => (
            <button
              key={grade}
              onClick={() => onGrade(grade)}
              aria-label={`${DETAILED_GRADE_LABELS[grade]} (${grade}/5)`}
              className={`rounded-xl px-2 py-2.5 text-[13px] font-medium text-white transition-all active:scale-[0.97] ${GRADE_COLORS[grade]}`}
            >
              <span className="block text-[16px]">{grade}</span>
              <span className="block text-[11px] opacity-90">
                {DETAILED_GRADE_LABELS[grade]}
              </span>
            </button>
          ))}
        </div>
      )}
      <button
        onClick={() => setShowDetailed(!showDetailed)}
        className="mt-2 w-full text-center text-[12px] text-[var(--theme-text-quaternary)] hover:text-[var(--theme-text-tertiary)]"
      >
        {showDetailed ? t.memorize.review.simpleGrading : t.memorize.review.detailedGrading}
      </button>
    </div>
  );
}
