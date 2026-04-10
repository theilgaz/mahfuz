/**
 * Elifba öğrenme modülü store'u.
 *
 * Her harf için: görüldü (seen), sesli quiz skoru, form quiz skoru, çizim tamamlandı.
 * Genel: günlük streak, toplam çalışma süresi, oyun yüksek skorları.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

/** Tek bir harf için ilerleme durumu */
export interface LetterProgress {
  seen: boolean;
  /** 0-100: sesli quiz doğruluk oranı (son sınav) */
  voiceScore: number | null;
  /** 0-100: form quiz doğruluk oranı (son sınav) */
  formScore: number | null;
  tracingDone: boolean;
}

/** Karışık sınav sonucu */
export interface ExamResult {
  score: number; // 0-28
  total: number; // 28
  date: number; // timestamp
}

/** Mini oyun türleri */
export type MiniGame = "memory" | "speed" | "fill" | "word";

interface AlifbaState {
  /** Harf ID → ilerleme (alif, ba, ta, ...) */
  progress: Record<string, LetterProgress>;
  /** Son tamamlanan sınavlar (max 10) */
  examHistory: ExamResult[];
  /** Oyun yüksek skorları */
  gameHighScores: Record<MiniGame, number>;
  /** Toplam çalışılan gün sayısı */
  totalDays: number;
  /** Son çalışma tarihi (YYYY-MM-DD) */
  lastStudyDate: string | null;
  /** Güncel streak (gün) */
  streak: number;
}

interface AlifbaActions {
  markSeen: (letterId: string) => void;
  setVoiceScore: (letterId: string, score: number) => void;
  setFormScore: (letterId: string, score: number) => void;
  markTracingDone: (letterId: string) => void;
  addExamResult: (result: Omit<ExamResult, "date">) => void;
  updateGameHighScore: (game: MiniGame, score: number) => void;
  touchStreak: () => void;
  reset: () => void;
}

const DEFAULT_LETTER_PROGRESS: LetterProgress = {
  seen: false,
  voiceScore: null,
  formScore: null,
  tracingDone: false,
};

const INITIAL_STATE: AlifbaState = {
  progress: {},
  examHistory: [],
  gameHighScores: { memory: 0, speed: 0, fill: 0, word: 0 },
  totalDays: 0,
  lastStudyDate: null,
  streak: 0,
};

/** Store dışı saf yardımcı */
export function computeAlifbaStats(state: AlifbaState) {
  const letters = Object.values(state.progress);
  const seen = letters.filter((l) => l.seen).length;
  const mastered = letters.filter((l) => l.seen && l.tracingDone).length;
  const bestExam = state.examHistory.length
    ? Math.max(...state.examHistory.map((e) => e.score))
    : null;
  return { seen, mastered, bestExam, streak: state.streak };
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export const useAlifbaStore = create<AlifbaState & AlifbaActions>()(
  persist(
    (set) => ({
      ...INITIAL_STATE,

      markSeen: (letterId) =>
        set((s) => ({
          progress: {
            ...s.progress,
            [letterId]: {
              ...(s.progress[letterId] ?? DEFAULT_LETTER_PROGRESS),
              seen: true,
            },
          },
        })),

      setVoiceScore: (letterId, score) =>
        set((s) => ({
          progress: {
            ...s.progress,
            [letterId]: {
              ...(s.progress[letterId] ?? DEFAULT_LETTER_PROGRESS),
              voiceScore: score,
            },
          },
        })),

      setFormScore: (letterId, score) =>
        set((s) => ({
          progress: {
            ...s.progress,
            [letterId]: {
              ...(s.progress[letterId] ?? DEFAULT_LETTER_PROGRESS),
              formScore: score,
            },
          },
        })),

      markTracingDone: (letterId) =>
        set((s) => ({
          progress: {
            ...s.progress,
            [letterId]: {
              ...(s.progress[letterId] ?? DEFAULT_LETTER_PROGRESS),
              tracingDone: true,
            },
          },
        })),

      addExamResult: (result) =>
        set((s) => ({
          examHistory: [
            { ...result, date: Date.now() },
            ...s.examHistory,
          ].slice(0, 10),
        })),

      updateGameHighScore: (game, score) =>
        set((s) => ({
          gameHighScores: {
            ...s.gameHighScores,
            [game]: Math.max(s.gameHighScores[game] ?? 0, score),
          },
        })),

      touchStreak: () =>
        set((s) => {
          const today = todayStr();
          if (s.lastStudyDate === today) return {};
          const yesterday = new Date(Date.now() - 86400000)
            .toISOString()
            .slice(0, 10);
          const streak =
            s.lastStudyDate === yesterday ? s.streak + 1 : 1;
          return {
            lastStudyDate: today,
            streak,
            totalDays: s.totalDays + 1,
          };
        }),

      reset: () => set(INITIAL_STATE),
    }),
    {
      name: "mahfuz-alifba",
      version: 1,
    },
  ),
);
