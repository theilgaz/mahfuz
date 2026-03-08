import { create } from "zustand";
import type { ExerciseAttempt } from "@mahfuz/shared/types";

interface LearnStoreState {
  // Session state
  phase: "idle" | "lesson" | "exercise" | "results" | "practice" | "quest";
  currentLessonId: string | null;
  currentExerciseIndex: number;
  attempts: ExerciseAttempt[];
  sessionSevapPoint: number;

  // Quest state
  currentQuestId: string | null;
  questExerciseCount: number;

  // Actions
  startLesson: (lessonId: string) => void;
  recordAttempt: (attempt: ExerciseAttempt) => void;
  nextExercise: () => void;
  finishLesson: () => void;
  resetSession: () => void;
  startPractice: () => void;
  finishPractice: () => void;
  setPhase: (phase: LearnStoreState["phase"]) => void;
  addSevapPoint: (amount: number) => void;
  startQuest: (questId: string, exerciseCount: number) => void;
  finishQuest: () => void;
}

export const useLearnStore = create<LearnStoreState>()((set) => ({
  phase: "idle",
  currentLessonId: null,
  currentExerciseIndex: 0,
  attempts: [],
  sessionSevapPoint: 0,
  currentQuestId: null,
  questExerciseCount: 0,

  startLesson: (lessonId) =>
    set({
      phase: "lesson",
      currentLessonId: lessonId,
      currentExerciseIndex: 0,
      attempts: [],
      sessionSevapPoint: 0,
    }),

  recordAttempt: (attempt) =>
    set((state) => ({
      attempts: [...state.attempts, attempt],
      sessionSevapPoint: state.sessionSevapPoint + (attempt.isCorrect ? 5 : 0),
    })),

  nextExercise: () =>
    set((state) => ({
      currentExerciseIndex: state.currentExerciseIndex + 1,
    })),

  finishLesson: () =>
    set({ phase: "results" }),

  resetSession: () =>
    set({
      phase: "idle",
      currentLessonId: null,
      currentExerciseIndex: 0,
      attempts: [],
      sessionSevapPoint: 0,
    }),

  startPractice: () =>
    set({
      phase: "practice",
      currentExerciseIndex: 0,
      attempts: [],
      sessionSevapPoint: 0,
    }),

  finishPractice: () =>
    set({ phase: "results" }),

  setPhase: (phase) => set({ phase }),

  addSevapPoint: (amount) =>
    set((state) => ({ sessionSevapPoint: state.sessionSevapPoint + amount })),

  startQuest: (questId, exerciseCount) =>
    set({
      phase: "quest",
      currentQuestId: questId,
      questExerciseCount: exerciseCount,
      currentExerciseIndex: 0,
      attempts: [],
      sessionSevapPoint: 0,
    }),

  finishQuest: () =>
    set({ phase: "results" }),
}));
