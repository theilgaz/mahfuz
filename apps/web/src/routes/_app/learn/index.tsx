import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { CURRICULUM } from "@mahfuz/shared/data/learn/curriculum";
import { SIDE_QUESTS } from "@mahfuz/shared/data/learn/quests";
import { useLearnDashboard, useStageUnlockStatus } from "~/hooks/useLearn";
import { useQuestDashboard } from "~/hooks/useQuest";
import { StageCard, ProgressMap, QuestCard } from "~/components/learn";
import { SegmentedControl } from "~/components/ui/SegmentedControl";
import { useTranslation } from "~/hooks/useTranslation";

export const Route = createFileRoute("/_app/learn/")({
  component: LearnDashboard,
});

type LearnTab = "main" | "quests";

function LearnDashboard() {
  const { t } = useTranslation();
  const userId = "anonymous";
  const { stageProgress, totalSevapPoint, isLoading } = useLearnDashboard(userId);
  const { unlockedStages } = useStageUnlockStatus(userId);
  const { quests, progressMap: questProgressMap } = useQuestDashboard(userId);
  const [tab, setTab] = useState<LearnTab>("main");

  // Quest aggregate stats
  const questStats = useMemo(() => {
    let wordsLearned = 0;
    let totalWords = 0;
    let sessions = 0;
    for (const quest of SIDE_QUESTS) {
      totalWords += quest.wordBank.length;
      const p = questProgressMap.get(quest.id);
      if (p) {
        wordsLearned += p.wordsCorrect.length;
        sessions += p.sessionsCompleted;
      }
    }
    return { wordsLearned, totalWords, sessions };
  }, [questProgressMap]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--theme-text)]">
          {t.learn.title}
        </h1>
        <p className="mt-1 text-[14px] text-[var(--theme-text-secondary)]">
          {t.learn.subtitle}
        </p>
      </div>

      {/* Stats bar — dynamic based on active tab */}
      <div className="mb-6 flex items-center gap-4 rounded-2xl bg-[var(--theme-bg-primary)] p-4 shadow-[var(--shadow-card)]">
        {tab === "main" ? (
          <>
            <div className="flex-1 text-center">
              <p className="text-xl font-bold text-primary-600">{totalSevapPoint}</p>
              <p className="text-[11px] text-[var(--theme-text-tertiary)]">{t.learn.pointLabel}</p>
            </div>
            <div className="h-8 w-px bg-[var(--theme-border)]" />
            <div className="flex-1 text-center">
              <p className="text-xl font-bold text-[var(--theme-text)]">
                {CURRICULUM.reduce((sum, s) => {
                  const sp = stageProgress.get(s.id);
                  return sum + (sp?.completed || 0);
                }, 0)}
              </p>
              <p className="text-[11px] text-[var(--theme-text-tertiary)]">{t.learn.completedLessons}</p>
            </div>
            <div className="h-8 w-px bg-[var(--theme-border)]" />
            <div className="flex-1 text-center">
              <p className="text-xl font-bold text-[var(--theme-text)]">{CURRICULUM.length}</p>
              <p className="text-[11px] text-[var(--theme-text-tertiary)]">{t.learn.totalStages}</p>
            </div>
          </>
        ) : (
          <>
            <div className="flex-1 text-center">
              <p className="text-xl font-bold text-amber-500">{questStats.wordsLearned}</p>
              <p className="text-[11px] text-[var(--theme-text-tertiary)]">{t.learn.quests.wordsLearnedLabel}</p>
            </div>
            <div className="h-8 w-px bg-[var(--theme-border)]" />
            <div className="flex-1 text-center">
              <p className="text-xl font-bold text-[var(--theme-text)]">{questStats.totalWords}</p>
              <p className="text-[11px] text-[var(--theme-text-tertiary)]">{t.learn.quests.totalWords}</p>
            </div>
            <div className="h-8 w-px bg-[var(--theme-border)]" />
            <div className="flex-1 text-center">
              <p className="text-xl font-bold text-[var(--theme-text)]">{questStats.sessions}</p>
              <p className="text-[11px] text-[var(--theme-text-tertiary)]">{t.learn.quests.sessionsLabel}</p>
            </div>
          </>
        )}
      </div>

      {/* Segment Control */}
      <div className="mb-6">
        <SegmentedControl<LearnTab>
          options={[
            { value: "main", label: t.learn.mainQuest.sectionTitle },
            { value: "quests", label: t.learn.quests.sectionTitle },
          ]}
          value={tab}
          onChange={setTab}
          stretch
        />
      </div>

      {/* Tab content */}
      {tab === "main" ? (
        <>
          {/* Progress Map */}
          {!isLoading && (
            <div className="mb-6">
              <ProgressMap
                stages={CURRICULUM.map((stage) => ({
                  id: stage.id,
                  titleKey: stage.titleKey,
                  lessonCount: stage.lessons.length,
                  completedCount: stageProgress.get(stage.id)?.completed || 0,
                }))}
                unlockedStages={unlockedStages}
              />
            </div>
          )}

          {/* Stage list */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
            </div>
          ) : (
            <div className="space-y-3">
              {CURRICULUM.map((stage) => {
                const sp = stageProgress.get(stage.id);
                return (
                  <StageCard
                    key={stage.id}
                    stageId={stage.id}
                    titleKey={stage.titleKey}
                    descriptionKey={stage.descriptionKey}
                    lessonCount={stage.lessons.length}
                    completedCount={sp?.completed || 0}
                    isUnlocked={unlockedStages.has(stage.id)}
                  />
                );
              })}
            </div>
          )}
        </>
      ) : (
        <>
          {/* Side Quests description */}
          <p className="mb-4 text-[13px] text-[var(--theme-text-secondary)]">
            {t.learn.quests.sectionDesc}
          </p>
          <div className="space-y-3">
            {quests.map((quest) => (
              <QuestCard
                key={quest.id}
                quest={quest}
                progress={questProgressMap.get(quest.id)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
