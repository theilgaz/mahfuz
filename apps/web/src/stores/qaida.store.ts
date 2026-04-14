/**
 * Qaida ilerleme store'u.
 * Tamamlanan adimlar, ders ilerleme ve sinav sonuclari.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CURRICULUM } from "@mahfuz/shared/data/learn/curriculum";

interface LessonProgress {
  score: number;
  completedAt: number;
}

interface QaidaState {
  completedSteps: number[];
  lessonProgress: Record<string, LessonProgress>;
}

interface QaidaActions {
  completeStep: (stepId: number) => void;
  completeLesson: (lessonId: string, stageId: number, score: number) => void;
  isLessonCompleted: (lessonId: string) => boolean;
  getCompletedLessonsSet: () => Set<string>;
  reset: () => void;
}

/** Stage'in tum dersleri tamamlanmissa ilgili step'i bul ve tamamla */
function findStepForStage(stageId: number): number | undefined {
  // STEP_TO_STAGE mapping (ayni qaida-helpers'daki)
  const map: Record<number, number> = { 1: 1, 3: 2, 7: 3, 8: 4, 9: 5, 6: 6, 2: 7, 10: 8, 11: 9, 12: 10 };
  return map[stageId];
}

export const useQaidaStore = create<QaidaState & QaidaActions>()(
  persist(
    (set, get) => ({
      completedSteps: [],
      lessonProgress: {},

      completeStep: (stepId) =>
        set((s) => ({
          completedSteps: s.completedSteps.includes(stepId)
            ? s.completedSteps
            : [...s.completedSteps, stepId],
        })),

      completeLesson: (lessonId, stageId, score) =>
        set((s) => {
          const newProgress = {
            ...s.lessonProgress,
            [lessonId]: { score, completedAt: Date.now() },
          };

          // Stage'in tum dersleri tamamlandi mi kontrol et
          const stage = CURRICULUM.find((st) => st.id === stageId);
          let newCompletedSteps = s.completedSteps;

          if (stage) {
            const allDone = stage.lessons.every((l) => newProgress[l.id]);
            if (allDone) {
              const stepId = findStepForStage(stageId);
              if (stepId && !s.completedSteps.includes(stepId)) {
                newCompletedSteps = [...s.completedSteps, stepId];
              }
            }
          }

          return {
            lessonProgress: newProgress,
            completedSteps: newCompletedSteps,
          };
        }),

      isLessonCompleted: (lessonId) => !!get().lessonProgress[lessonId],

      getCompletedLessonsSet: () => new Set(Object.keys(get().lessonProgress)),

      reset: () => set({ completedSteps: [], lessonProgress: {} }),
    }),
    {
      name: "mahfuz-qaida",
      version: 2,
      migrate: (persisted, version) => {
        if (version < 2) {
          const old = persisted as { completedSteps?: number[] };
          return {
            completedSteps: old.completedSteps ?? [],
            lessonProgress: {},
          };
        }
        return persisted as QaidaState;
      },
    },
  ),
);
