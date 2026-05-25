/**
 * Mobile audio engine using expo-av.
 * Same interface/callbacks as @mahfuz/audio-engine but for React Native.
 */

import { Audio, type AVPlaybackStatus } from "expo-av";
import type {
  PlaybackState,
  PlaybackSpeed,
  RepeatMode,
  AudioSegment,
} from "@mahfuz/shared/types";

export interface ChapterAudioData {
  audioUrl: string;
  verseTimings: {
    verseKey: string;
    from: number;
    to: number;
    segments: AudioSegment[];
  }[];
}

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

export class MobileAudioEngine {
  private sound: Audio.Sound | null = null;
  private callbacks: AudioEngineCallbacks;
  private chapterTimings: ChapterAudioData["verseTimings"] = [];
  private currentIndex = -1;
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private _speed: PlaybackSpeed = 1;
  private _repeatMode: RepeatMode = "none";
  private _repeatCount = 1;
  private _repeatCounter = 0;
  private _destroyed = false;
  private _lastWordPosition: number | null = null;

  constructor(callbacks: AudioEngineCallbacks) {
    this.callbacks = callbacks;
  }

  get totalVerses(): number {
    return this.chapterTimings.length;
  }

  get currentVerseKey(): string | null {
    if (this.currentIndex >= 0 && this.currentIndex < this.chapterTimings.length) {
      return this.chapterTimings[this.currentIndex].verseKey;
    }
    return null;
  }

  get currentVerseIndex(): number {
    return this.currentIndex;
  }

  async loadChapterAudio(data: ChapterAudioData): Promise<void> {
    await this.stop();
    this.chapterTimings = data.verseTimings;
    this.currentIndex = -1;
    this._repeatCounter = 0;

    const url = normalizeUrl(data.audioUrl);
    const { sound } = await Audio.Sound.createAsync(
      { uri: url },
      { shouldPlay: false, rate: this._speed, progressUpdateIntervalMillis: 250 },
      this.onPlaybackStatusUpdate,
    );
    this.sound = sound;
  }

  private onPlaybackStatusUpdate = (status: AVPlaybackStatus): void => {
    if (!status.isLoaded) {
      if (status.error) {
        this.callbacks.onError(new Error(status.error));
      }
      return;
    }

    if (status.didJustFinish) {
      this.handleEnded();
    }
  };

  async play(startIndex?: number): Promise<void> {
    if (!this.sound) return;

    const idx = startIndex ?? (this.currentIndex >= 0 ? this.currentIndex : 0);

    if (startIndex === undefined && idx === this.currentIndex) {
      // Resume
      try {
        await this.sound.playAsync();
        this.callbacks.onPlaybackStateChange("playing");
        this.startSync();
      } catch (err) {
        this.callbacks.onError(err instanceof Error ? err : new Error(String(err)));
      }
      return;
    }

    // Seek to verse start
    const timing = this.chapterTimings[idx];
    if (!timing && this.chapterTimings.length > 0) return;

    if (idx !== this.currentIndex) {
      this.currentIndex = idx;
      this.stopSync();
      this.callbacks.onWordPositionChange(null);
      if (timing) {
        this.callbacks.onVerseChange(timing.verseKey, idx);
      }
    }

    try {
      this.callbacks.onPlaybackStateChange("loading");
      if (timing) {
        await this.sound.setPositionAsync(timing.from);
      }
      await this.sound.playAsync();
      this.callbacks.onPlaybackStateChange("playing");
      this.startSync();
    } catch (err) {
      this.callbacks.onError(err instanceof Error ? err : new Error(String(err)));
    }
  }

  async playByKey(verseKey: string): Promise<void> {
    const idx = this.chapterTimings.findIndex((t) => t.verseKey === verseKey);
    if (idx >= 0) await this.play(idx);
  }

  async pause(): Promise<void> {
    if (!this.sound) return;
    await this.sound.pauseAsync();
    this.stopSync();
    this.callbacks.onPlaybackStateChange("paused");
  }

  async stop(): Promise<void> {
    this.stopSync();
    if (this.sound) {
      try {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
      } catch {}
      this.sound = null;
    }
    this.currentIndex = -1;
    this._repeatCounter = 0;
    this.callbacks.onPlaybackStateChange("idle");
    this.callbacks.onWordPositionChange(null);
    this.callbacks.onTimeUpdate(0, 0);
  }

  async seekTo(timeMs: number): Promise<void> {
    if (!this.sound) return;
    await this.sound.setPositionAsync(timeMs);
  }

  async nextVerse(): Promise<void> {
    if (this.currentIndex < this.totalVerses - 1) {
      this._repeatCounter = 0;
      await this.play(this.currentIndex + 1);
    }
  }

  async prevVerse(): Promise<void> {
    if (!this.sound) return;
    const status = await this.sound.getStatusAsync();
    if (!status.isLoaded) return;

    const timing = this.chapterTimings[this.currentIndex];
    const timeSinceVerseStart = timing
      ? status.positionMillis - timing.from
      : status.positionMillis;

    if (timeSinceVerseStart > 2000 && this.currentIndex >= 0 && timing) {
      await this.sound.setPositionAsync(timing.from);
      return;
    }
    if (this.currentIndex > 0) {
      this._repeatCounter = 0;
      await this.play(this.currentIndex - 1);
    } else if (this.currentIndex === 0 && timing) {
      await this.sound.setPositionAsync(timing.from);
    }
  }

  async setSpeed(speed: PlaybackSpeed): Promise<void> {
    this._speed = speed;
    if (this.sound) {
      await this.sound.setRateAsync(speed, true);
    }
  }

  async setVolume(volume: number): Promise<void> {
    if (this.sound) {
      await this.sound.setVolumeAsync(Math.max(0, Math.min(1, volume)));
    }
  }

  setRepeatMode(mode: RepeatMode): void {
    this._repeatMode = mode;
    this._repeatCounter = 0;
  }

  setRepeatCount(count: number): void {
    this._repeatCount = Math.max(1, count);
    this._repeatCounter = 0;
  }

  // --- Sync loop ---

  private startSync(): void {
    this.stopSync();
    this._lastWordPosition = null;
    this.syncInterval = setInterval(() => this.syncTick(), 50);
  }

  private stopSync(): void {
    if (this.syncInterval !== null) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  private async syncTick(): Promise<void> {
    if (this._destroyed || !this.sound) return;

    const status = await this.sound.getStatusAsync();
    if (!status.isLoaded || !status.isPlaying) return;

    const timeMs = status.positionMillis;
    const durationMs = status.durationMillis ?? 0;

    this.callbacks.onTimeUpdate(timeMs, durationMs);

    if (this.chapterTimings.length === 0 || this.currentIndex < 0) return;

    const currentTiming = this.chapterTimings[this.currentIndex];

    // Check verse boundary
    if (timeMs >= currentTiming.to) {
      this.callbacks.onVerseEnd(currentTiming.verseKey, this.currentIndex);

      if (this._repeatMode === "verse") {
        this._repeatCounter++;
        if (this._repeatCounter < this._repeatCount) {
          await this.sound.setPositionAsync(currentTiming.from);
          return;
        }
        this._repeatCounter = 0;
      }

      if (this.currentIndex < this.chapterTimings.length - 1) {
        this.currentIndex++;
        const next = this.chapterTimings[this.currentIndex];
        this.callbacks.onWordPositionChange(null);
        this.callbacks.onVerseChange(next.verseKey, this.currentIndex);
      }
      return;
    }

    // Word-level sync
    if (currentTiming.segments?.length > 0) {
      const position = this.findWordPosition(currentTiming.segments, timeMs);
      if (position !== this._lastWordPosition) {
        this._lastWordPosition = position;
        this.callbacks.onWordPositionChange(position);
      }
    }
  }

  private findWordPosition(segments: AudioSegment[], timeMs: number): number | null {
    let lo = 0;
    let hi = segments.length - 1;
    let result: number | null = null;

    while (lo <= hi) {
      const mid = (lo + hi) >>> 1;
      const [wordPos, startMs, endMs] = segments[mid];
      if (timeMs >= startMs && timeMs < endMs) return wordPos;
      if (timeMs < startMs) hi = mid - 1;
      else { result = wordPos; lo = mid + 1; }
    }
    return result;
  }

  private async handleEnded(): Promise<void> {
    this.stopSync();
    const idx = this.currentIndex;
    if (idx >= 0 && idx < this.chapterTimings.length) {
      this.callbacks.onVerseEnd(this.chapterTimings[idx].verseKey, idx);
    }

    if (this._repeatMode === "surah") {
      this._repeatCounter++;
      if (this._repeatCounter < this._repeatCount) {
        await this.play(0);
        return;
      }
      this._repeatCounter = 0;
    }

    this.callbacks.onPlaybackStateChange("ended");
  }

  async destroy(): Promise<void> {
    this._destroyed = true;
    await this.stop();
    this.chapterTimings = [];
  }
}

/** Configure expo-av for background audio */
export async function configureAudioMode(): Promise<void> {
  await Audio.setAudioModeAsync({
    playsInSilentModeIOS: true,
    staysActiveInBackground: true,
    shouldDuckAndroid: true,
  });
}
