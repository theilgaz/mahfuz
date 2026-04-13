/**
 * Qaida ilerleme store'u.
 * Tamamlanan adimlar ve sinav sonuclari.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface QaidaState {
  completedSteps: number[];
}

interface QaidaActions {
  completeStep: (stepId: number) => void;
  reset: () => void;
}

export const useQaidaStore = create<QaidaState & QaidaActions>()(
  persist(
    (set) => ({
      completedSteps: [],

      completeStep: (stepId) =>
        set((s) => ({
          completedSteps: s.completedSteps.includes(stepId)
            ? s.completedSteps
            : [...s.completedSteps, stepId],
        })),

      reset: () => set({ completedSteps: [] }),
    }),
    {
      name: "mahfuz-qaida",
      version: 1,
    },
  ),
);
