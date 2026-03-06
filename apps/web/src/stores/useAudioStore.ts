import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  PlaybackState,
  PlaybackSpeed,
  RepeatMode,
} from "@mahfuz/shared/types";
import { DEFAULT_RECITER_ID } from "@mahfuz/shared/constants";
import type { AudioEngine, VerseAudioData } from "@mahfuz/audio-engine";

interface AudioStoreState {
  // Playback state
  playbackState: PlaybackState;
  currentVerseKey: string | null;
  currentWordPosition: number | null;
  currentTime: number;
  duration: number;

  // Context
  chapterId: number | null;
  chapterName: string | null;
  verseKeys: string[];
  versePageMap: Record<string, number>; // verseKey -> pageNumber

  // Preferences (persisted)
  reciterId: number;
  speed: PlaybackSpeed;
  volume: number;
  isMuted: boolean;
  repeatMode: RepeatMode;

  // UI
  isVisible: boolean;
  isExpanded: boolean;

  // Engine ref (not persisted)
  engine: AudioEngine | null;

  // Actions
  setEngine: (engine: AudioEngine | null) => void;
  playSurah: (
    chapterId: number,
    chapterName: string,
    audioData: VerseAudioData[],
    versePageMap?: Record<string, number>,
  ) => void;
  playVerse: (
    chapterId: number,
    chapterName: string,
    verseKey: string,
    audioData: VerseAudioData[],
    versePageMap?: Record<string, number>,
  ) => void;
  play: () => void;
  pause: () => void;
  togglePlayPause: () => void;
  stop: () => void;
  nextVerse: () => void;
  prevVerse: () => void;
  seekTo: (timeMs: number) => void;
  setReciter: (reciterId: number) => void;
  setSpeed: (speed: PlaybackSpeed) => void;
  setRepeatMode: (mode: RepeatMode) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setExpanded: (expanded: boolean) => void;

  // Internal callbacks (called by AudioProvider)
  _onPlaybackStateChange: (state: PlaybackState) => void;
  _onTimeUpdate: (currentTime: number, duration: number) => void;
  _onWordPositionChange: (position: number | null) => void;
  _onVerseChange: (verseKey: string, index: number) => void;
  _onVerseEnd: (verseKey: string, index: number) => void;
}

export const useAudioStore = create<AudioStoreState>()(
  persist(
    (set, get) => ({
      // Defaults
      playbackState: "idle",
      currentVerseKey: null,
      currentWordPosition: null,
      currentTime: 0,
      duration: 0,
      chapterId: null,
      chapterName: null,
      verseKeys: [],
      versePageMap: {},
      reciterId: DEFAULT_RECITER_ID,
      speed: 1,
      volume: 1,
      isMuted: false,
      repeatMode: "none",
      isVisible: false,
      isExpanded: false,
      engine: null,

      setEngine: (engine) => set({ engine }),

      playSurah: (chapterId, chapterName, audioData, versePageMap = {}) => {
        const { engine, speed, volume, isMuted, repeatMode } = get();
        if (!engine || audioData.length === 0) return;
        engine.loadPlaylist(audioData);
        engine.setSpeed(speed);
        engine.setVolume(volume);
        engine.setMuted(isMuted);
        engine.setRepeatMode(repeatMode);
        set({
          chapterId,
          chapterName,
          verseKeys: audioData.map((d) => d.verseKey),
          versePageMap,
          isVisible: true,
          isExpanded: false,
        });
        engine.play(0);
      },

      playVerse: (chapterId, chapterName, verseKey, audioData, versePageMap = {}) => {
        const { engine, speed, volume, isMuted, repeatMode } = get();
        if (!engine || audioData.length === 0) return;
        // Find index before loadPlaylist (which calls stop and resets state)
        // Normalize: trim whitespace, compare loosely
        const startIndex = audioData.findIndex(
          (d) => d.verseKey.trim() === verseKey.trim(),
        );
        engine.loadPlaylist(audioData);
        engine.setSpeed(speed);
        engine.setVolume(volume);
        engine.setMuted(isMuted);
        engine.setRepeatMode(repeatMode);
        set({
          chapterId,
          chapterName,
          verseKeys: audioData.map((d) => d.verseKey),
          versePageMap,
          isVisible: true,
          isExpanded: false,
        });
        engine.play(startIndex >= 0 ? startIndex : 0);
      },

      play: () => get().engine?.play(),
      pause: () => get().engine?.pause(),

      togglePlayPause: () => {
        const { playbackState, engine } = get();
        if (!engine) return;
        if (playbackState === "playing") {
          engine.pause();
        } else {
          engine.play();
        }
      },

      stop: () => {
        get().engine?.stop();
        set({ isVisible: false, isExpanded: false });
      },

      nextVerse: () => get().engine?.nextVerse(),
      prevVerse: () => get().engine?.prevVerse(),
      seekTo: (timeMs) => get().engine?.seekTo(timeMs),

      setReciter: (reciterId) => set({ reciterId }),

      setSpeed: (speed) => {
        get().engine?.setSpeed(speed);
        set({ speed });
      },

      setRepeatMode: (mode) => {
        get().engine?.setRepeatMode(mode);
        set({ repeatMode: mode });
      },

      setVolume: (volume) => {
        get().engine?.setVolume(volume);
        set({ volume });
      },

      toggleMute: () => {
        const next = !get().isMuted;
        get().engine?.setMuted(next);
        set({ isMuted: next });
      },

      setExpanded: (expanded) => set({ isExpanded: expanded }),

      // Callbacks
      _onPlaybackStateChange: (playbackState) => set({ playbackState }),
      _onTimeUpdate: (currentTime, duration) =>
        set({ currentTime, duration }),
      _onWordPositionChange: (currentWordPosition) =>
        set({ currentWordPosition }),
      _onVerseChange: (verseKey) => set({ currentVerseKey: verseKey }),
      _onVerseEnd: () => {},
    }),
    {
      name: "mahfuz-audio",
      partialize: (state) => ({
        reciterId: state.reciterId,
        speed: state.speed,
        volume: state.volume,
        isMuted: state.isMuted,
      }),
    },
  ),
);
