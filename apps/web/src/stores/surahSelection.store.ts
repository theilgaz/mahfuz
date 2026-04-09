/**
 * Oyun sure seçimi — tüm sure bazlı oyunlarda paylaşılan seçim.
 * localStorage'a kaydedilir, oyunlar arası kalıcıdır.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SurahSelectionState {
  selectedSurahIds: number[];
}

interface SurahSelectionActions {
  setSelectedSurahIds: (ids: number[]) => void;
}

export const useSurahSelectionStore = create<SurahSelectionState & SurahSelectionActions>()(
  persist(
    (set) => ({
      selectedSurahIds: [],
      setSelectedSurahIds: (ids) => set({ selectedSurahIds: ids }),
    }),
    { name: "mahfuz-game-surah-selection" }
  )
);
