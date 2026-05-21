/**
 * Hıfz durumu store'u — kullanıcının hangi ayetleri ezbere bildiği.
 *
 * Sure bazında ayet numaraları dizisi tutulur.
 * Tüm ayetler seçiliyse sure "tam ezber" kabul edilir.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

/** Sure başına ayet sayıları (1-114) */
export const SURAH_VERSE_COUNTS: Record<number, number> = {
  1: 7, 2: 286, 3: 200, 4: 176, 5: 120, 6: 165, 7: 206, 8: 75, 9: 129, 10: 109,
  11: 123, 12: 111, 13: 43, 14: 52, 15: 99, 16: 128, 17: 111, 18: 110, 19: 98, 20: 135,
  21: 112, 22: 78, 23: 118, 24: 64, 25: 77, 26: 227, 27: 93, 28: 88, 29: 69, 30: 60,
  31: 34, 32: 30, 33: 73, 34: 54, 35: 45, 36: 83, 37: 182, 38: 88, 39: 75, 40: 85,
  41: 54, 42: 53, 43: 89, 44: 59, 45: 37, 46: 35, 47: 38, 48: 29, 49: 18, 50: 45,
  51: 60, 52: 49, 53: 62, 54: 55, 55: 78, 56: 96, 57: 29, 58: 22, 59: 24, 60: 13,
  61: 14, 62: 11, 63: 11, 64: 18, 65: 12, 66: 12, 67: 30, 68: 52, 69: 52, 70: 44,
  71: 28, 72: 28, 73: 20, 74: 56, 75: 40, 76: 31, 77: 50, 78: 40, 79: 46, 80: 42,
  81: 29, 82: 19, 83: 36, 84: 25, 85: 22, 86: 17, 87: 19, 88: 26, 89: 30, 90: 20,
  91: 15, 92: 21, 93: 11, 94: 8, 95: 8, 96: 19, 97: 5, 98: 8, 99: 8, 100: 11,
  101: 11, 102: 8, 103: 3, 104: 9, 105: 5, 106: 4, 107: 7, 108: 3, 109: 6, 110: 3,
  111: 5, 112: 4, 113: 5, 114: 6,
};

export const TOTAL_VERSES = 6236;

interface HifzState {
  /** Sure ID → ezberlenen ayet numaraları (sıralı) */
  memorized: Record<number, number[]>;
}

interface HifzActions {
  toggleVerse: (surahId: number, verseNum: number) => void;
  addRange: (surahId: number, from: number, to: number) => void;
  removeRange: (surahId: number, from: number, to: number) => void;
  toggleAllVerses: (surahId: number) => void;
  reset: () => void;
}

/** Store dışı saf yardımcı — component'te useMemo ile kullan */
export function computeHifzStats(memorized: Record<number, number[]>) {
  let totalVerses = 0;
  let completeSurahs = 0;
  let activeSurahs = 0;

  for (const [id, verses] of Object.entries(memorized)) {
    if (!verses || verses.length === 0) continue;
    totalVerses += verses.length;
    activeSurahs++;
    if (verses.length === (SURAH_VERSE_COUNTS[Number(id)] ?? 0)) completeSurahs++;
  }

  const percentage = Math.round((totalVerses / TOTAL_VERSES) * 1000) / 10;
  return { totalVerses, completeSurahs, activeSurahs, percentage };
}

export const useHifzStore = create<HifzState & HifzActions>()(
  persist(
    (set) => ({
      memorized: {},

      toggleVerse: (surahId, verseNum) =>
        set((s) => {
          const current = s.memorized[surahId] ?? [];
          const has = current.includes(verseNum);
          const next = has
            ? current.filter((v) => v !== verseNum)
            : [...current, verseNum].sort((a, b) => a - b);
          const updated = { ...s.memorized };
          if (next.length === 0) delete updated[surahId];
          else updated[surahId] = next;
          return { memorized: updated };
        }),

      addRange: (surahId, from, to) =>
        set((s) => {
          const current = new Set(s.memorized[surahId] ?? []);
          for (let i = from; i <= to; i++) current.add(i);
          return {
            memorized: {
              ...s.memorized,
              [surahId]: [...current].sort((a, b) => a - b),
            },
          };
        }),

      removeRange: (surahId, from, to) =>
        set((s) => {
          const current = (s.memorized[surahId] ?? []).filter(
            (v) => v < from || v > to,
          );
          const updated = { ...s.memorized };
          if (current.length === 0) delete updated[surahId];
          else updated[surahId] = current;
          return { memorized: updated };
        }),

      toggleAllVerses: (surahId) =>
        set((s) => {
          const total = SURAH_VERSE_COUNTS[surahId] ?? 0;
          const current = s.memorized[surahId] ?? [];
          const updated = { ...s.memorized };
          if (current.length === total) {
            delete updated[surahId];
          } else {
            updated[surahId] = Array.from({ length: total }, (_, i) => i + 1);
          }
          return { memorized: updated };
        }),

      reset: () => set({ memorized: {} }),
    }),
    {
      name: "mahfuz-hifz-status",
      version: 2,
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as Record<string, unknown>;
        if (version < 2) {
          // v1: memorizedSurahs: Record<number, boolean>
          // v2: memorized: Record<number, number[]>
          const old = state.memorizedSurahs as Record<number, boolean> | undefined;
          const memorized: Record<number, number[]> = {};
          if (old) {
            for (const [id, val] of Object.entries(old)) {
              if (val) {
                const total = SURAH_VERSE_COUNTS[Number(id)] ?? 0;
                memorized[Number(id)] = Array.from({ length: total }, (_, i) => i + 1);
              }
            }
          }
          return { memorized };
        }
        return state as unknown as HifzState;
      },
    },
  ),
);
