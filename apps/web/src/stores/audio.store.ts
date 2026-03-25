/**
 * Audio store — AudioEngine'i yönetir.
 *
 * Engine referansı burada tutulur.
 * UI bileşenleri (AudioBar) bu store'dan okur.
 */

import { create } from "zustand";
import type { AudioEngine, ChapterAudioData } from "@mahfuz/audio-engine";
import type { PlaybackState, PlaybackSpeed, RepeatMode } from "@mahfuz/shared/types";

interface AudioState {
  engine: AudioEngine | null;
  playbackState: PlaybackState;
  currentVerseKey: string | null;
  currentTime: number;
  duration: number;
  wordPosition: number | null;
  speed: PlaybackSpeed;
  volume: number;
  isMuted: boolean;
  repeatMode: RepeatMode;

  // Aktif sure bilgisi
  chapterId: number | null;
  chapterName: string | null;
  verseKeys: string[];
  isVisible: boolean;
}

interface AudioActions {
  initEngine: (engine: AudioEngine) => void;
  destroyEngine: () => void;

  playSurah: (chapterId: number, chapterName: string, audioData: ChapterAudioData) => void;
  play: (startIndex?: number) => void;
  pause: () => void;
  togglePlayPause: () => void;
  stop: () => void;
  nextVerse: () => void;
  prevVerse: () => void;
  seekTo: (timeMs: number) => void;

  setSpeed: (speed: PlaybackSpeed) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setRepeatMode: (mode: RepeatMode) => void;

  // Callback'ler (engine tarafından çağrılır)
  _onPlaybackStateChange: (state: PlaybackState) => void;
  _onTimeUpdate: (currentTime: number, duration: number) => void;
  _onWordPositionChange: (position: number | null) => void;
  _onVerseChange: (verseKey: string, index: number) => void;
  _onVerseEnd: () => void;
}

export const useAudioStore = create<AudioState & AudioActions>()((set, get) => ({
  // Defaults
  engine: null,
  playbackState: "idle",
  currentVerseKey: null,
  currentTime: 0,
  duration: 0,
  wordPosition: null,
  speed: 1,
  volume: 1,
  isMuted: false,
  repeatMode: "none",
  chapterId: null,
  chapterName: null,
  verseKeys: [],
  isVisible: false,

  // ── Engine lifecycle ────────────────────────────────────

  initEngine: (engine) => set({ engine }),

  destroyEngine: () => {
    const { engine } = get();
    if (engine) {
      engine.destroy();
      set({ engine: null, playbackState: "idle", isVisible: false });
    }
  },

  // ── Playback ────────────────────────────────────────────

  playSurah: (chapterId, chapterName, audioData) => {
    const { engine, speed, volume, isMuted, repeatMode } = get();
    if (!engine) return;

    engine.loadChapterAudio(audioData);
    engine.setSpeed(speed);
    engine.setVolume(volume);
    engine.setMuted(isMuted);
    engine.setRepeatMode(repeatMode);

    set({
      chapterId,
      chapterName,
      verseKeys: audioData.verseTimings.map((t) => t.verseKey),
      isVisible: true,
    });

    engine.play(0);
  },

  play: (startIndex) => {
    get().engine?.play(startIndex);
  },

  pause: () => {
    get().engine?.pause();
  },

  togglePlayPause: () => {
    const { engine, playbackState } = get();
    if (!engine) return;
    if (playbackState === "playing") {
      engine.pause();
    } else {
      engine.play();
    }
  },

  stop: () => {
    get().engine?.stop();
    set({ isVisible: false });
  },

  nextVerse: () => {
    get().engine?.nextVerse();
  },

  prevVerse: () => {
    get().engine?.prevVerse();
  },

  seekTo: (timeMs) => {
    get().engine?.seekTo(timeMs);
  },

  // ── Settings ────────────────────────────────────────────

  setSpeed: (speed) => {
    get().engine?.setSpeed(speed);
    set({ speed });
  },

  setVolume: (volume) => {
    get().engine?.setVolume(volume);
    set({ volume });
  },

  toggleMute: () => {
    const newMuted = !get().isMuted;
    get().engine?.setMuted(newMuted);
    set({ isMuted: newMuted });
  },

  setRepeatMode: (mode) => {
    get().engine?.setRepeatMode(mode);
    set({ repeatMode: mode });
  },

  // ── Engine Callbacks ────────────────────────────────────

  _onPlaybackStateChange: (state) => set({ playbackState: state }),
  _onTimeUpdate: (currentTime, duration) => set({ currentTime, duration }),
  _onWordPositionChange: (position) => set({ wordPosition: position }),
  _onVerseChange: (verseKey) => set({ currentVerseKey: verseKey }),
  _onVerseEnd: () => {
    const { repeatMode, engine } = get();
    if (repeatMode === "verse") {
      // Aynı ayeti tekrarla
      engine?.seekTo(0);
      engine?.play();
    } else {
      // Sonraki ayete geç (surah repeat dahil engine halleder)
      engine?.nextVerse();
    }
  },
}));
