/**
 * Shared types for recitation engine.
 */

export interface QuranVerse {
  surah: number;
  ayah: number;
  text_uthmani: string;
  phonemes: string;
  phonemes_joined: string;
  // Computed at runtime by QuranDB
  phoneme_tokens?: string[];
  phoneme_words?: string[];
  phonemes_joined_no_bsm?: string | null;
  phoneme_tokens_no_bsm?: string[] | null;
  phonemes_joined_ns?: string;
  phonemes_joined_no_bsm_ns?: string | null;
  phoneme_token_ids?: number[];
  phoneme_token_ids_no_bsm?: number[] | null;
  word_token_ends?: number[];
}

export interface VerseMatch {
  surah: number;
  ayah: number;
  ayahEnd?: number | null;
  text: string;
  phonemesJoined: string;
  score: number;
  rawScore: number;
  bonus: number;
}

export type RecitationEngineState =
  | "idle"
  | "downloading"
  | "loading"
  | "ready"
  | "listening"
  | "error";

/** Messages from main thread to worker */
export type WorkerInbound =
  | { type: "init" }
  | { type: "audio"; samples: Float32Array }
  | { type: "reset" };

/** Messages from worker to main thread */
export type WorkerOutbound =
  | { type: "loading"; percent: number }
  | { type: "loading_status"; message: string }
  | { type: "ready" }
  | { type: "result"; match: VerseMatch | null; transcript: string }
  | { type: "error"; message: string };

export interface RecitationEngineCallbacks {
  onStateChange?: (state: RecitationEngineState) => void;
  onProgress?: (percent: number) => void;
  onVerseMatch?: (match: VerseMatch | null, transcript: string) => void;
  onError?: (error: string) => void;
}
