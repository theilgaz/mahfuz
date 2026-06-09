// @mahfuz/audio-engine: HTML5 Audio + word-level sync

import type {
  PlaybackState,
  PlaybackSpeed,
  RepeatMode,
  AudioSegment,
} from "@mahfuz/shared/types";

/** Per-verse audio data fed into the engine (legacy verse mode) */
export interface VerseAudioData {
  verseKey: string;
  url: string;
  segments: AudioSegment[]; // [wordPosition, startMs, endMs]
}

/** Chapter-level audio data from QDC API */
export interface ChapterAudioData {
  audioUrl: string;
  verseTimings: {
    verseKey: string;
    from: number; // ms, chapter-relative
    to: number;   // ms, chapter-relative
    segments: AudioSegment[]; // may be empty; chapter-relative timestamps
  }[];
}

/** Callbacks the engine fires to drive UI state */
export interface AudioEngineCallbacks {
  onPlaybackStateChange: (state: PlaybackState) => void;
  onTimeUpdate: (currentTime: number, duration: number) => void;
  onWordPositionChange: (position: number | null) => void;
  onVerseChange: (verseKey: string, index: number) => void;
  onVerseEnd: (verseKey: string, index: number) => void;
  onError: (error: Error) => void;
}

const AUDIO_CDN = "https://audio.qurancdn.com/";

function normalizeUrl(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return AUDIO_CDN + url.replace(/^\//, "");
}

export class AudioEngine {
  private audio: HTMLAudioElement;
  private preloadAudio: HTMLAudioElement;
  private callbacks: AudioEngineCallbacks;

  // Verse mode state
  private playlist: VerseAudioData[] = [];

  // Chapter mode state
  private _chapterMode = false;
  private _chapterTimings: ChapterAudioData["verseTimings"] = [];

  // Shared state
  private currentIndex = -1;
  private rafId: number | null = null;

  private _speed: PlaybackSpeed = 1;
  private _volume = 1;
  private _muted = false;
  private _repeatMode: RepeatMode = "none";
  private _repeatCount = 1;
  private _repeatCounter = 0;
  private _destroyed = false;

  constructor(callbacks: AudioEngineCallbacks) {
    this.callbacks = callbacks;
    this.audio = new Audio();
    this.preloadAudio = new Audio();
    this.preloadAudio.preload = "auto";
    this.preloadAudio.volume = 0;

    this.audio.addEventListener("ended", this.handleEnded);
    this.audio.addEventListener("error", this.handleError);
    this.audio.addEventListener("waiting", () =>
      this.callbacks.onPlaybackStateChange("loading"),
    );
    this.audio.addEventListener("canplay", () => {
      // Only fire if we were loading (not if paused)
      if (!this.audio.paused) {
        this.callbacks.onPlaybackStateChange("playing");
      }
    });
    
    // Log preload errors (don't propagate to UI)
    this.preloadAudio.addEventListener("error", () => {
      const error = this.preloadAudio.error;
      console.warn("[AudioEngine] Preload failed:", {
        code: error?.code,
        message: error?.message,
        url: this.preloadAudio.src
      });
    });
  }

  // --- Playlist (verse mode) ---

  loadPlaylist(verses: VerseAudioData[]): void {
    this.stop();
    this._chapterMode = false;
    this._chapterTimings = [];
    this.playlist = verses;
    this.currentIndex = -1;
    this._repeatCounter = 0;
  }

  // --- Chapter mode ---

  loadChapterAudio(data: ChapterAudioData): void {
    this.stop();
    this._chapterMode = true;
    this._chapterTimings = data.verseTimings;
    this.playlist = []; // clear verse playlist

    const url = normalizeUrl(data.audioUrl);
    
    // Validate URL
    if (!url || url === AUDIO_CDN) {
      console.error("[AudioEngine] Invalid or empty chapter audio URL:", data.audioUrl);
      this.callbacks.onError(new Error("Invalid chapter audio URL"));
      return;
    }

    console.log("[AudioEngine] Loading chapter audio:", url, "verses:", data.verseTimings.length);
    
    this.audio.src = url;
    this.audio.playbackRate = this._speed;
    this.audio.volume = this._volume;
    this.audio.muted = this._muted;
    this.audio.load();

    this.currentIndex = -1;
    this._repeatCounter = 0;
  }

  // --- Playback controls ---

  get totalVerses(): number {
    return this._chapterMode ? this._chapterTimings.length : this.playlist.length;
  }

  async play(startIndex?: number): Promise<void> {
    if (this._chapterMode) {
      // Allow playback even with no verse timings (audio still plays, just no verse sync)
      if (this.totalVerses === 0 && !this.audio.src) return;
      return this.playChapterMode(startIndex);
    }
    if (this.totalVerses === 0) return;
    return this.playVerseMode(startIndex);
  }

  private async playChapterMode(startIndex?: number): Promise<void> {
    // No verse timings — play raw audio from the beginning (no verse sync)
    if (this._chapterTimings.length === 0) {
      if (!this.audio.src) return;

      // If paused, just resume
      if (this.audio.paused && this.audio.currentTime > 0) {
        try {
          await this.audio.play();
          this.callbacks.onPlaybackStateChange("playing");
          this.startWordSync();
        } catch (err) {
          this.callbacks.onError(err instanceof Error ? err : new Error(String(err)));
        }
        return;
      }

      this.audio.currentTime = 0;
      try {
        this.callbacks.onPlaybackStateChange("loading");
        await this.audio.play();
        this.callbacks.onPlaybackStateChange("playing");
        this.startWordSync();
      } catch (err) {
        this.callbacks.onError(err instanceof Error ? err : new Error(String(err)));
      }
      return;
    }

    const idx = startIndex ?? (this.currentIndex >= 0 ? this.currentIndex : 0);

    // If resuming (no startIndex, same index, audio paused), just resume
    if (startIndex === undefined && idx === this.currentIndex && this.audio.paused && this.audio.src) {
      try {
        await this.audio.play();
        this.callbacks.onPlaybackStateChange("playing");
        this.startWordSync();
      } catch (err) {
        this.callbacks.onError(err instanceof Error ? err : new Error(String(err)));
      }
      return;
    }

    // Seek to verse start
    const timing = this._chapterTimings[idx];
    if (!timing) return;

    if (idx !== this.currentIndex) {
      this.currentIndex = idx;
      this.stopWordSync();
      this.callbacks.onWordPositionChange(null);
      this.callbacks.onVerseChange(timing.verseKey, idx);
      this.updateMediaSessionChapter(timing.verseKey);
    }

    this.audio.currentTime = timing.from / 1000;

    try {
      this.callbacks.onPlaybackStateChange("loading");
      await this.audio.play();
      this.callbacks.onPlaybackStateChange("playing");
      this.startWordSync();
    } catch (err) {
      this.callbacks.onError(err instanceof Error ? err : new Error(String(err)));
    }
  }

  private async playVerseMode(startIndex?: number): Promise<void> {
    if (this.playlist.length === 0) return;

    const idx = startIndex ?? (this.currentIndex >= 0 ? this.currentIndex : 0);

    // If resuming the same verse (no startIndex given), just resume
    if (startIndex === undefined && idx === this.currentIndex && this.audio.src) {
      try {
        await this.audio.play();
        this.callbacks.onPlaybackStateChange("playing");
        this.startWordSync();
      } catch (err) {
        this.callbacks.onError(
          err instanceof Error ? err : new Error(String(err)),
        );
      }
      return;
    }

    if (idx !== this.currentIndex) {
      await this.loadVerse(idx);
    }

    try {
      this.callbacks.onPlaybackStateChange("loading");
      await this.audio.play();
      this.callbacks.onPlaybackStateChange("playing");
      this.startWordSync();
    } catch (err) {
      this.callbacks.onError(
        err instanceof Error ? err : new Error(String(err)),
      );
    }
  }

  /** Play a specific verse by key (e.g. "101:11") */
  async playByKey(verseKey: string): Promise<void> {
    if (this._chapterMode) {
      const idx = this._chapterTimings.findIndex((t) => t.verseKey === verseKey);
      if (idx >= 0) await this.play(idx);
    } else {
      const idx = this.playlist.findIndex((v) => v.verseKey === verseKey);
      if (idx >= 0) await this.play(idx);
    }
  }

  pause(): void {
    this.audio.pause();
    this.stopWordSync();
    this.callbacks.onPlaybackStateChange("paused");
  }

  stop(): void {
    this.audio.pause();
    this.audio.currentTime = 0;
    this.audio.removeAttribute("src");
    this.stopWordSync();
    this.currentIndex = -1;
    this._repeatCounter = 0;
    this.callbacks.onPlaybackStateChange("idle");
    this.callbacks.onWordPositionChange(null);
    this.callbacks.onTimeUpdate(0, 0);
  }

  seekTo(timeMs: number): void {
    this.audio.currentTime = timeMs / 1000;
  }

  async nextVerse(): Promise<void> {
    if (this.currentIndex < this.totalVerses - 1) {
      this._repeatCounter = 0;
      await this.play(this.currentIndex + 1);
    }
  }

  async prevVerse(): Promise<void> {
    if (this._chapterMode) {
      // In chapter mode, check time relative to current verse start
      const timing = this._chapterTimings[this.currentIndex];
      const timeSinceVerseStart = timing
        ? this.audio.currentTime - timing.from / 1000
        : this.audio.currentTime;

      if (timeSinceVerseStart > 2 && this.currentIndex >= 0) {
        // Restart current verse
        this.audio.currentTime = timing.from / 1000;
        return;
      }
      if (this.currentIndex > 0) {
        this._repeatCounter = 0;
        await this.play(this.currentIndex - 1);
      } else if (this.currentIndex === 0 && timing) {
        this.audio.currentTime = timing.from / 1000;
      }
    } else {
      // Verse mode
      if (this.audio.currentTime > 2 && this.currentIndex >= 0) {
        this.audio.currentTime = 0;
        return;
      }
      if (this.currentIndex > 0) {
        this._repeatCounter = 0;
        await this.play(this.currentIndex - 1);
      } else if (this.currentIndex === 0) {
        this.audio.currentTime = 0;
      }
    }
  }

  // --- Settings ---

  setSpeed(speed: PlaybackSpeed): void {
    this._speed = speed;
    this.audio.playbackRate = speed;
  }

  setVolume(volume: number): void {
    this._volume = Math.max(0, Math.min(1, volume));
    this.audio.volume = this._volume;
  }

  setMuted(muted: boolean): void {
    this._muted = muted;
    this.audio.muted = muted;
  }

  setRepeatMode(mode: RepeatMode): void {
    this._repeatMode = mode;
    this._repeatCounter = 0;
  }

  setRepeatCount(count: number): void {
    this._repeatCount = Math.max(1, count);
    this._repeatCounter = 0;
  }

  get currentVerseKey(): string | null {
    if (this._chapterMode) {
      if (this.currentIndex >= 0 && this.currentIndex < this._chapterTimings.length) {
        return this._chapterTimings[this.currentIndex].verseKey;
      }
      return null;
    }
    if (this.currentIndex >= 0 && this.currentIndex < this.playlist.length) {
      return this.playlist[this.currentIndex].verseKey;
    }
    return null;
  }

  get currentVerseIndex(): number {
    return this.currentIndex;
  }

  // --- Internal (verse mode) ---

  private async loadVerse(index: number): Promise<void> {
    if (index < 0 || index >= this.playlist.length) return;

    this.currentIndex = index;
    const verse = this.playlist[index];
    const url = normalizeUrl(verse.url);

    // Validate URL
    if (!url || url === AUDIO_CDN) {
      console.error("[AudioEngine] Invalid or empty URL for verse:", verse.verseKey);
      this.callbacks.onError(new Error(`Invalid audio URL for verse ${verse.verseKey}`));
      return;
    }

    console.log("[AudioEngine] Loading verse:", verse.verseKey, "URL:", url);

    this.stopWordSync();
    this.callbacks.onWordPositionChange(null);
    this.callbacks.onVerseChange(verse.verseKey, index);

    this.audio.src = url;
    this.audio.playbackRate = this._speed;
    this.audio.volume = this._volume;
    this.audio.muted = this._muted;
    this.audio.load();

    // Preload next verse
    this.preloadNext(index + 1);

    // Update MediaSession
    this.updateMediaSession(verse);
  }

  private preloadNext(nextIndex: number): void {
    if (nextIndex < this.playlist.length) {
      const nextUrl = normalizeUrl(this.playlist[nextIndex].url);
      if (nextUrl && nextUrl !== AUDIO_CDN) {
        this.preloadAudio.src = nextUrl;
        this.preloadAudio.load();
      }
    }
  }

  private handleEnded = async (): Promise<void> => {
    if (this._chapterMode) {
      return this.handleChapterEnded();
    }
    return this.handleVerseEnded();
  };

  private async handleChapterEnded(): Promise<void> {
    // Chapter audio file ended → entire chapter is done
    this.stopWordSync();

    // Fire verseEnd for the last verse
    const idx = this.currentIndex;
    if (idx >= 0 && idx < this._chapterTimings.length) {
      this.callbacks.onVerseEnd(this._chapterTimings[idx].verseKey, idx);
    }

    if (this._repeatMode === "surah") {
      this._repeatCounter++;
      if (this._repeatCounter < this._repeatCount) {
        this.audio.currentTime = 0;
        this.currentIndex = 0;
        const first = this._chapterTimings[0];
        if (first) this.callbacks.onVerseChange(first.verseKey, 0);
        await this.audio.play();
        this.startWordSync();
        return;
      }
      this._repeatCounter = 0;
    }

    this.callbacks.onPlaybackStateChange("ended");
  }

  private async handleVerseEnded(): Promise<void> {
    const idx = this.currentIndex;
    if (idx < 0 || idx >= this.playlist.length) return;

    this.stopWordSync();
    this.callbacks.onVerseEnd(this.playlist[idx].verseKey, idx);

    // Handle repeat
    if (this._repeatMode === "verse") {
      this._repeatCounter++;
      if (this._repeatCounter < this._repeatCount) {
        this.audio.currentTime = 0;
        await this.audio.play();
        this.startWordSync();
        return;
      }
      this._repeatCounter = 0;
    }

    // Move to next verse
    if (idx < this.playlist.length - 1) {
      await this.play(idx + 1);
    } else if (this._repeatMode === "surah") {
      this._repeatCounter++;
      if (this._repeatCounter < this._repeatCount) {
        await this.play(0);
        return;
      }
      // Done repeating surah
      this._repeatCounter = 0;
      this.callbacks.onPlaybackStateChange("ended");
    } else {
      this.callbacks.onPlaybackStateChange("ended");
    }
  }

  private handleError = (): void => {
    const error = this.audio.error;
    const src = this.audio.src || "(no source)";
    
    // Map MediaError codes to readable messages
    let errorDetails = "Unknown error";
    if (error) {
      switch (error.code) {
        case MediaError.MEDIA_ERR_ABORTED:
          errorDetails = "Playback aborted";
          break;
        case MediaError.MEDIA_ERR_NETWORK:
          errorDetails = "Network error while loading";
          break;
        case MediaError.MEDIA_ERR_DECODE:
          errorDetails = "Decode error (corrupt or unsupported format)";
          break;
        case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
          errorDetails = "Source not supported or not found";
          break;
      }
      if (error.message) {
        errorDetails += `: ${error.message}`;
      }
    }
    
    const fullError = new Error(`MEDIA_ELEMENT_ERROR: ${errorDetails}\nURL: ${src}`);
    console.error("[AudioEngine]", fullError);
    console.error("[AudioEngine] MediaError details:", { 
      code: error?.code, 
      message: error?.message,
      url: src 
    });
    
    this.callbacks.onError(fullError);
    this.callbacks.onPlaybackStateChange("idle");
  };

  // --- Word-level sync via rAF ---

  private _lastWordPosition: number | null = null;
  private _lastTimeUpdateMs = 0;

  private startWordSync(): void {
    this.stopWordSync();
    this._lastWordPosition = null;
    this._lastTimeUpdateMs = 0;
    const tick = () => {
      if (this._destroyed) return;
      if (this._chapterMode) {
        this.syncChapter();
      } else {
        this.syncWord();
      }
      // Throttle onTimeUpdate to ~4fps (every 250ms) instead of 60fps
      const nowMs = this.audio.currentTime * 1000;
      if (Math.abs(nowMs - this._lastTimeUpdateMs) >= 250) {
        this._lastTimeUpdateMs = nowMs;
        this.callbacks.onTimeUpdate(
          nowMs,
          this.audio.duration * 1000 || 0,
        );
      }
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  private stopWordSync(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /** Chapter mode sync: detect verse changes + word highlighting */
  private syncChapter(): void {
    if (this.currentIndex < 0 || this._chapterTimings.length === 0) return;

    const timeMs = this.audio.currentTime * 1000;
    const currentTiming = this._chapterTimings[this.currentIndex];

    // Check if current time has passed the current verse's end
    if (timeMs >= currentTiming.to) {
      // Fire verse end
      this.callbacks.onVerseEnd(currentTiming.verseKey, this.currentIndex);

      // Handle verse repeat
      if (this._repeatMode === "verse") {
        this._repeatCounter++;
        if (this._repeatCounter < this._repeatCount) {
          this.audio.currentTime = currentTiming.from / 1000;
          return;
        }
        this._repeatCounter = 0;
      }

      // Move to next verse
      if (this.currentIndex < this._chapterTimings.length - 1) {
        this.currentIndex++;
        const next = this._chapterTimings[this.currentIndex];
        this.callbacks.onWordPositionChange(null);
        this.callbacks.onVerseChange(next.verseKey, this.currentIndex);
        this.updateMediaSessionChapter(next.verseKey);
      }
      // If last verse, let handleEnded deal with it when audio file ends
      return;
    }

    // Word-level sync within current verse — only fire when position changes
    if (currentTiming.segments && currentTiming.segments.length > 0) {
      const position = this.findWordPosition(currentTiming.segments, timeMs);
      if (position !== this._lastWordPosition) {
        this._lastWordPosition = position;
        this.callbacks.onWordPositionChange(position);
      }
    } else if (this._lastWordPosition !== null) {
      this._lastWordPosition = null;
      this.callbacks.onWordPositionChange(null);
    }
  }

  /** Verse mode sync */
  private syncWord(): void {
    if (this.currentIndex < 0) return;
    const verse = this.playlist[this.currentIndex];
    if (!verse.segments || verse.segments.length === 0) {
      if (this._lastWordPosition !== null) {
        this._lastWordPosition = null;
        this.callbacks.onWordPositionChange(null);
      }
      return;
    }

    const timeMs = this.audio.currentTime * 1000;
    const position = this.findWordPosition(verse.segments, timeMs);
    if (position !== this._lastWordPosition) {
      this._lastWordPosition = position;
      this.callbacks.onWordPositionChange(position);
    }
  }

  /** Binary search to find active word at given time */
  private findWordPosition(
    segments: AudioSegment[],
    timeMs: number,
  ): number | null {
    let lo = 0;
    let hi = segments.length - 1;
    let result: number | null = null;

    while (lo <= hi) {
      const mid = (lo + hi) >>> 1;
      const [wordPos, startMs, endMs] = segments[mid];
      if (timeMs >= startMs && timeMs < endMs) {
        return wordPos;
      }
      if (timeMs < startMs) {
        hi = mid - 1;
      } else {
        result = wordPos; // keep track of last passed segment
        lo = mid + 1;
      }
    }

    return result;
  }

  // --- MediaSession ---

  private updateMediaSession(verse: VerseAudioData): void {
    if (!("mediaSession" in navigator)) return;

    const isBismillah = verse.verseKey === "bismillah";
    const [surah, ayah] = verse.verseKey.split(":");
    navigator.mediaSession.metadata = new MediaMetadata({
      title: isBismillah ? "Bismillahirrahmanirrahim" : `Ayet ${ayah}`,
      artist: "Mahfuz",
      album: isBismillah ? "Kuran-ı Kerim" : `Sure ${surah}`,
    });

    navigator.mediaSession.setActionHandler("play", () => this.play());
    navigator.mediaSession.setActionHandler("pause", () => this.pause());
    navigator.mediaSession.setActionHandler("previoustrack", () =>
      this.prevVerse(),
    );
    navigator.mediaSession.setActionHandler("nexttrack", () =>
      this.nextVerse(),
    );
  }

  private updateMediaSessionChapter(verseKey: string): void {
    if (!("mediaSession" in navigator)) return;

    const isBismillah = verseKey === "bismillah";
    const [surah, ayah] = verseKey.split(":");
    navigator.mediaSession.metadata = new MediaMetadata({
      title: isBismillah ? "Bismillahirrahmanirrahim" : `Ayet ${ayah}`,
      artist: "Mahfuz",
      album: isBismillah ? "Kuran-ı Kerim" : `Sure ${surah}`,
    });

    navigator.mediaSession.setActionHandler("play", () => this.play());
    navigator.mediaSession.setActionHandler("pause", () => this.pause());
    navigator.mediaSession.setActionHandler("previoustrack", () =>
      this.prevVerse(),
    );
    navigator.mediaSession.setActionHandler("nexttrack", () =>
      this.nextVerse(),
    );
  }

  // --- Cleanup ---

  destroy(): void {
    this._destroyed = true;
    this.stop();
    this.audio.removeEventListener("ended", this.handleEnded);
    this.audio.removeEventListener("error", this.handleError);
    this.preloadAudio.removeAttribute("src");
    this.playlist = [];
    this._chapterTimings = [];
  }
}
