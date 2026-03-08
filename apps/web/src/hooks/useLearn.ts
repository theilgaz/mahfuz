import { useState, useEffect, useCallback } from "react";
import { learnRepository } from "@mahfuz/db";
import type { LessonProgressEntry, LearnConceptEntry } from "@mahfuz/db";
import { CURRICULUM, getLessonById } from "@mahfuz/shared/data/learn/curriculum";
import type { Stage } from "@mahfuz/shared/types";
import { useLearnStore } from "~/stores/useLearnStore";
import { LEARN_SEVAP_POINT_VALUES } from "@mahfuz/shared/types";

/** Dashboard hook: stage progress, Sevap Point, overall stats */
export function useLearnDashboard(userId: string) {
  const [stageProgress, setStageProgress] = useState<
    Map<number, { total: number; completed: number }>
  >(new Map());
  const [totalSevapPoint, setTotalSevapPoint] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const [progressMap, sevapPoint] = await Promise.all([
        learnRepository.getStageCompletionMap(userId),
        learnRepository.getTotalSevapPointEarned(userId),
      ]);
      setStageProgress(progressMap);
      setTotalSevapPoint(sevapPoint);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { stageProgress, totalSevapPoint, isLoading, refresh };
}

/** Stage unlock status based on prerequisites */
export function useStageUnlockStatus(userId: string) {
  const [unlockedStages, setUnlockedStages] = useState<Set<number>>(new Set([1]));
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const completedLessons = await learnRepository.getCompletedLessons(userId);
      const completedByStage = new Map<number, number>();

      for (const lesson of completedLessons) {
        completedByStage.set(
          lesson.stageId,
          (completedByStage.get(lesson.stageId) || 0) + 1,
        );
      }

      const unlocked = new Set<number>();
      for (const stage of CURRICULUM) {
        if (stage.prerequisites.length === 0) {
          unlocked.add(stage.id);
          continue;
        }

        const allPrereqsMet = stage.prerequisites.every((prereqId) => {
          const prereqStage = CURRICULUM.find((s) => s.id === prereqId);
          if (!prereqStage) return false;
          const completed = completedByStage.get(prereqId) || 0;
          return completed >= prereqStage.lessons.length;
        });

        if (allPrereqsMet) unlocked.add(stage.id);
      }

      setUnlockedStages(unlocked);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { unlockedStages, isLoading, refresh };
}

/** Lesson session hook */
export function useLessonSession(lessonId: string, userId: string) {
  const store = useLearnStore();
  const [lessonData, setLessonData] = useState<ReturnType<typeof getLessonById>>(undefined);
  const [progress, setProgress] = useState<LessonProgressEntry | undefined>(undefined);

  useEffect(() => {
    const data = getLessonById(lessonId);
    setLessonData(data);
  }, [lessonId]);

  useEffect(() => {
    learnRepository.getLessonProgress(userId, lessonId).then(setProgress);
  }, [userId, lessonId]);

  const completeLesson = useCallback(async () => {
    if (!lessonData) return;

    // Use getState() to read the freshest store values (avoids stale closure after recordAttempt)
    const freshState = useLearnStore.getState();
    const correctCount = freshState.attempts.filter((a) => a.isCorrect).length;
    const totalExercises = lessonData.lesson.exercises.length;
    const score = totalExercises > 0 ? Math.round((correctCount / totalExercises) * 100) : 100;
    const isPerfect = score === 100;
    const isFirstCompletion = !progress || progress.status !== "completed";

    let sevapPointEarned = freshState.sessionSevapPoint;
    if (isFirstCompletion) {
      sevapPointEarned += LEARN_SEVAP_POINT_VALUES.lessonComplete;
    }
    if (isPerfect) {
      sevapPointEarned = sevapPointEarned * LEARN_SEVAP_POINT_VALUES.perfectMultiplier;
    }

    await learnRepository.upsertLessonProgress({
      id: `${userId}-${lessonId}`,
      userId,
      stageId: lessonData.stage.id,
      lessonId,
      status: "completed",
      score,
      sevapPointEarned,
      completedAt: Date.now(),
    });

    // Record concept mastery
    for (const attempt of freshState.attempts) {
      const exercise = lessonData.lesson.exercises.find(
        (e) => e.id === attempt.exerciseId,
      );
      if (!exercise) continue;
      for (const conceptId of lessonData.lesson.conceptIds) {
        await learnRepository.recordConceptResult(userId, conceptId, attempt.isCorrect);
      }
    }

    store.addSevapPoint(sevapPointEarned - freshState.sessionSevapPoint);
    store.finishLesson();

    return { score, sevapPointEarned, isPerfect, isFirstCompletion };
  }, [lessonData, userId, lessonId, store, progress]);

  return {
    lessonData,
    progress,
    completeLesson,
    phase: store.phase,
    currentExerciseIndex: store.currentExerciseIndex,
    attempts: store.attempts,
    sessionSevapPoint: store.sessionSevapPoint,
  };
}

/** Adaptive practice hook: SRS-based concept review */
export function useAdaptivePractice(userId: string) {
  const [dueConcepts, setDueConcepts] = useState<LearnConceptEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const concepts = await learnRepository.getConceptsDueForReview(userId);
      setDueConcepts(concepts);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { dueConcepts, isLoading, refresh };
}
