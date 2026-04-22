/**
 * Calistiklarim store'u -- kullanicinin aktif olarak calistigi sureler.
 * Okuma gecmisi ve yer imlerinden otomatik beslenir,
 * kullanici manuel olarak ekleyip cikarabilir.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface StudiedState {
  /** Manuel eklenen sure ID'leri */
  surahIds: number[];
}

interface StudiedActions {
  addSurah: (id: number) => void;
  removeSurah: (id: number) => void;
  toggleSurah: (id: number) => void;
  setSurahs: (ids: number[]) => void;
}

export const useStudiedStore = create<StudiedState & StudiedActions>()(
  persist(
    (set) => ({
      surahIds: [],

      addSurah: (id) =>
        set((s) => ({
          surahIds: s.surahIds.includes(id)
            ? s.surahIds
            : [...s.surahIds, id].sort((a, b) => a - b),
        })),

      removeSurah: (id) =>
        set((s) => ({
          surahIds: s.surahIds.filter((sid) => sid !== id),
        })),

      toggleSurah: (id) =>
        set((s) => ({
          surahIds: s.surahIds.includes(id)
            ? s.surahIds.filter((sid) => sid !== id)
            : [...s.surahIds, id].sort((a, b) => a - b),
        })),

      setSurahs: (ids) =>
        set({ surahIds: [...new Set(ids)].sort((a, b) => a - b) }),
    }),
    { name: "mahfuz-studied-surahs" },
  ),
);
