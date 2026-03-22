import { Link } from "@tanstack/react-router";
import { useTranslation } from "~/hooks/useTranslation";
import { resolveNestedKey } from "~/lib/i18n-utils";
import type { SideQuest } from "@mahfuz/shared/types";
import type { QuestProgressEntry } from "@mahfuz/db";

interface LibraryTrackCardProps {
  quest: SideQuest;
  progress?: QuestProgressEntry;
}

const LETTER_CHARS: Record<number, string> = { 2: "ب", 3: "ت", 4: "ث" };

export function LibraryTrackCard({ quest, progress }: LibraryTrackCardProps) {
  const { t } = useTranslation();
  const totalWords = quest.wordBank.length;
  const learnedWords = progress?.wordsCorrect.length || 0;
  const progressPct = totalWords > 0 ? Math.round((learnedWords / totalWords) * 100) : 0;
  const isComplete = learnedWords >= totalWords && totalWords > 0;

  const familyDisplay = quest.letterIds.map((id) => LETTER_CHARS[id] || "").join("");
  const title = resolveNestedKey(t.learn as Record<string, any>, quest.titleKey) || quest.titleKey;
  const description = resolveNestedKey(t.learn as Record<string, any>, quest.descriptionKey) || quest.descriptionKey;

  return (
    <Link to="/learn/quest/$questId" params={{ questId: quest.id }}>
      <div
        className={`group relative flex flex-col rounded-2xl transition-all ${
          isComplete
            ? "bg-primary-50/50 dark:bg-primary-950/20"
            : "bg-[var(--theme-bg-primary)] shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elevated)] hover:-translate-y-0.5"
        }`}
      >
        <div className="flex flex-1 flex-col p-4">
          {/* Arabic letter badge */}
          <div className="mb-3 flex items-center gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                isComplete
                  ? "bg-primary-500 text-white"
                  : "bg-primary-600/10 text-primary-700 dark:text-primary-400"
              }`}
            >
              {isComplete ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span
                  className="arabic-text text-[16px] font-bold"
                  dir="rtl"
                  style={{ letterSpacing: "0.1em" }}
                >
                  {familyDisplay}
                </span>
              )}
            </div>
          </div>

          {/* Title + description */}
          <h3 className="text-[15px] font-semibold leading-snug text-[var(--theme-text)]">
            {title}
          </h3>
          <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-[var(--theme-text-tertiary)]">
            {description}
          </p>

          {/* Stats row */}
          {progress && progress.sessionsCompleted > 0 && (
            <div className="mt-2 flex items-center gap-3 text-[11px] text-[var(--theme-text-quaternary)]">
              <span>
                {progress.sessionsCompleted} {t.learn.quests.sessions}
              </span>
              {progress.bestSessionScore > 0 && (
                <span>
                  {t.learn.quests.bestScore}: %{progress.bestSessionScore}
                </span>
              )}
            </div>
          )}

          {/* Progress area */}
          <div className="mt-auto pt-3">
            <div className="mb-1.5 flex items-center justify-between text-[11px]">
              <span className="text-[var(--theme-text-quaternary)]">
                {learnedWords}/{totalWords} {t.learn.quests.wordsLearned}
              </span>
              {progressPct > 0 && (
                <span className="font-medium text-[var(--theme-text-tertiary)]">
                  %{progressPct}
                </span>
              )}
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[var(--theme-bg)]">
              <div
                className={`h-full rounded-full transition-all ${isComplete ? "bg-primary-500" : "bg-primary-600"}`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
