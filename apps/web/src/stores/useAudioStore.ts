import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  PlaybackState,
  PlaybackSpeed,
  RepeatMode,
} from "@mahfuz/shared/types";
import { DEFAULT_RECITER_ID, TOTAL_CHAPTERS } from "@mahfuz/shared/constants";
import type { AudioEngine, ChapterAudioData } from "@mahfuz/audio-engine";
import { usePlaylistStore } from "./usePlaylistStore";

export type { PlaybackState, PlaybackSpeed, RepeatMode };

/** Callback to fetch audio for a given chapter. Set from a React hook with queryClient access. */
export type FetchChapterAudioFn = (
  reciterId: number,
  chapterId: number,
) => Promise<{ audioData: ChapterAudioData; chapterName: string }>;

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

  // Preferences (persisted)
  reciterId: number;
  speed: PlaybackSpeed;
  volume: number;
  isMuted: boolean;
  repeatMode: RepeatMode;
  autoContinue: boolean;
  featuredReciterIds: number[];

  // UI
  isVisible: boolean;
  isExpanded: boolean;

  // Engine ref (not persisted)
  engine: AudioEngine | null;

  // Auto-continue fetch ref (not persisted, set from React hook)
  _fetchChapterAudioFn: FetchChapterAudioFn | null;

  // Actions
  setEngine: (engine: AudioEngine | null) => void;
  playSurah: (
    chapterId: number,
    chapterName: string,
    audioData: ChapterAudioData,
  ) => void;
  playVerse: (
    chapterId: number,
    chapterName: string,
    verseKey: string,
    audioData: ChapterAudioData,
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
  setAutoContinue: (enabled: boolean) => void;
  toggleFeaturedReciter: (reciterId: number) => void;
  setExpanded: (expanded: boolean) => void;
  _setFetchChapterAudioFn: (fn: FetchChapterAudioFn | null) => void;

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
      reciterId: DEFAULT_RECITER_ID,
      speed: 1,
      volume: 1,
      isMuted: false,
      repeatMode: "none",
      autoContinue: true,
      featuredReciterIds: [7, 129, 170, 134], // Alafasy + Al-Banna + Khalid Al-Jalil + Fatih Seferagic
      isVisible: false,
      isExpanded: false,
      engine: null,
      _fetchChapterAudioFn: null,

      setEngine: (engine) => set({ engine }),

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
          isExpanded: false,
        });
        engine.play(0);
      },

      playVerse: (chapterId, chapterName, verseKey, audioData) => {
        const { engine, speed, volume, isMuted, repeatMode } = get();
        if (!engine) return;
        const startIndex = audioData.verseTimings.findIndex(
          (t) => t.verseKey.trim() === verseKey.trim(),
        );
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
          isExpanded: false,
        });
        engine.play(startIndex >= 0 ? startIndex : 0);
      },

      play: () => {
        get().engine?.play();
        // Resume playlist if it was paused
        const ps = usePlaylistStore.getState();
        if (ps.isActive && ps._userPaused) {
          ps.resumePlaylist();
        }
      },
      pause: () => {
        get().engine?.pause();
        // Pause playlist to prevent auto-advance
        const ps = usePlaylistStore.getState();
        if (ps.isActive) {
          ps.pausePlaylist();
        }
      },

      togglePlayPause: () => {
        const { playbackState, engine } = get();
        if (!engine) return;
        if (playbackState === "playing" || playbackState === "loading") {
          engine.pause();
          // Pause playlist to prevent auto-advance
          const ps = usePlaylistStore.getState();
          if (ps.isActive) {
            ps.pausePlaylist();
          }
        } else {
          engine.play();
          // Resume playlist if it was paused
          const ps = usePlaylistStore.getState();
          if (ps.isActive && ps._userPaused) {
            ps.resumePlaylist();
          }
        }
      },

      stop: () => {
        get().engine?.stop();
        set({ isVisible: false, isExpanded: false });
        usePlaylistStore.getState().stopPlaylist();
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

      setAutoContinue: (enabled) => set({ autoContinue: enabled }),
      toggleFeaturedReciter: (id) =>
        set((s) => ({
          featuredReciterIds: s.featuredReciterIds.includes(id)
            ? s.featuredReciterIds.filter((r) => r !== id)
            : [...s.featuredReciterIds, id],
        })),

      setExpanded: (expanded) => set({ isExpanded: expanded }),

      _setFetchChapterAudioFn: (fn) => set({ _fetchChapterAudioFn: fn }),

      // Callbacks
      _onPlaybackStateChange: (playbackState) => {
        set({ playbackState });
        if (playbackState === "ended") {
          // First, let playlist store handle it if a playlist is active
          const playlistState = usePlaylistStore.getState();
          if (playlistState.isActive) {
            playlistState._handlePlaybackEnded();
            return;
          }

          // Auto-continue to next surah if enabled
          const { autoContinue, chapterId, reciterId, _fetchChapterAudioFn, playSurah } = get();
          if (
            autoContinue &&
            chapterId !== null &&
            chapterId < TOTAL_CHAPTERS &&
            _fetchChapterAudioFn
          ) {
            const nextChapterId = chapterId + 1;
            _fetchChapterAudioFn(reciterId, nextChapterId)
              .then(({ audioData, chapterName }) => {
                // Verify we're still in ended state (user didn't start something else)
                if (get().playbackState === "ended" || get().playbackState === "idle") {
                  playSurah(nextChapterId, chapterName, audioData);
                }
              })
              .catch((err) => {
                console.error("[AudioStore] Auto-continue failed:", err);
              });
          }
        }
      },
      _onTimeUpdate: (currentTime, duration) =>
        set({ currentTime, duration }),
      _onWordPositionChange: (currentWordPosition) =>
        set({ currentWordPosition }),
      _onVerseChange: (verseKey) => set({ currentVerseKey: verseKey }),
      _onVerseEnd: (verseKey) => {
        usePlaylistStore.getState()._handleVerseEnd(verseKey);
      },
    }),
    {
      name: "mahfuz-audio",
      partialize: (state) => ({
        reciterId: state.reciterId,
        speed: state.speed,
        volume: state.volume,
        isMuted: state.isMuted,
        autoContinue: state.autoContinue,
        featuredReciterIds: state.featuredReciterIds,
      }),
    },
  ),
);
