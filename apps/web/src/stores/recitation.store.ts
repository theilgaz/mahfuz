/**
 * Recitation state store — session-only (not persisted).
 */

import { create } from "zustand";
import type { VerseMatch, RecitationEngineState } from "@mahfuz/recitation-engine";

export type RecitationMode = "find-verse" | "verify" | "follow-along" | null;

interface RecitationState {
  engineState: RecitationEngineState;
  downloadProgress: number;
  lastMatch: VerseMatch | null;
  lastTranscript: string;
  matchHistory: VerseMatch[];
  rmsLevel: number;
  mode: RecitationMode;
  targetSurah: number | null;
  targetAyah: number | null;
  isBarVisible: boolean;
  error: string | null;
}

interface RecitationActions {
  setEngineState: (state: RecitationEngineState) => void;
  setDownloadProgress: (pct: number) => void;
  setMatch: (match: VerseMatch | null, transcript: string) => void;
  setRmsLevel: (level: number) => void;
  setMode: (mode: RecitationMode, target?: { surah?: number; ayah?: number }) => void;
  showBar: () => void;
  hideBar: () => void;
  dismissResult: () => void;
  setError: (error: string | null) => void;
}

export const useRecitationStore = create<RecitationState & RecitationActions>()(
  (set) => ({
    engineState: "idle",
    downloadProgress: 0,
    lastMatch: null,
    lastTranscript: "",
    matchHistory: [],
    rmsLevel: 0,
    mode: null,
    targetSurah: null,
    targetAyah: null,
    isBarVisible: false,
    error: null,

    setEngineState: (engineState) => set({ engineState }),
    setDownloadProgress: (downloadProgress) => set({ downloadProgress }),
    setMatch: (match, transcript) =>
      set((s) => ({
        lastMatch: match,
        lastTranscript: transcript,
        matchHistory: match ? [match, ...s.matchHistory].slice(0, 10) : s.matchHistory,
      })),
    setRmsLevel: (rmsLevel) => set({ rmsLevel }),
    setMode: (mode, target) =>
      set({
        mode,
        targetSurah: target?.surah ?? null,
        targetAyah: target?.ayah ?? null,
        lastMatch: null,
        lastTranscript: "",
      }),
    showBar: () => set({ isBarVisible: true }),
    hideBar: () => set({ isBarVisible: false, mode: null }),
    dismissResult: () => set({ lastMatch: null, lastTranscript: "" }),
    setError: (error) => set({ error }),
  }),
);
