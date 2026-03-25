import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ReadingPosition {
  surahId: number;
  ayahNumber: number;
  pageNumber: number;
}

interface ReadingState {
  lastPosition: ReadingPosition | null;
}

interface ReadingActions {
  savePosition: (position: ReadingPosition) => void;
}

export const useReadingStore = create<ReadingState & ReadingActions>()(
  persist(
    (set) => ({
      lastPosition: null,
      savePosition: (position) => set({ lastPosition: position }),
    }),
    {
      name: "mahfuz-core-reading",
    },
  ),
);
