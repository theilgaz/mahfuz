/**
 * Oyun bazında kalıcı tercihler (şu an sadece zorluk).
 * Anahtar: oyun ID'si (örn. "fill-blank"), değer: Difficulty.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Difficulty } from "~/lib/game-scoring";

interface GamePreferencesState {
  difficultyByGameId: Record<string, Difficulty>;
}

interface GamePreferencesActions {
  setDifficulty: (gameId: string, difficulty: Difficulty) => void;
  getDifficulty: (gameId: string) => Difficulty | undefined;
}

export const useGamePreferencesStore = create<GamePreferencesState & GamePreferencesActions>()(
  persist(
    (set, get) => ({
      difficultyByGameId: {},
      setDifficulty: (gameId, difficulty) =>
        set((s) => ({
          difficultyByGameId: { ...s.difficultyByGameId, [gameId]: difficulty },
        })),
      getDifficulty: (gameId) => get().difficultyByGameId[gameId],
    }),
    { name: "mahfuz-game-preferences" }
  )
);
