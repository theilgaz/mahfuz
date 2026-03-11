/** Simple audio player for learn module. Single word/letter playback. */
class LearnAudioPlayer {
  private audio: HTMLAudioElement | null = null;
  private _isPlaying = false;

  get isPlaying(): boolean {
    return this._isPlaying;
  }

  async playWordAudio(audioUrl: string): Promise<void> {
    // Stop any current playback
    this.stop();

    return new Promise<void>((resolve, reject) => {
      this.audio = new Audio(audioUrl);
      this.audio.playbackRate = 0.85; // Slower for learning
      this._isPlaying = true;

      this.audio.onended = () => {
        this._isPlaying = false;
        resolve();
      };

      this.audio.onerror = () => {
        this._isPlaying = false;
        reject(new Error("Audio playback failed"));
      };

      this.audio.play().catch((err) => {
        this._isPlaying = false;
        reject(err);
      });
    });
  }

  stop(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.audio = null;
    }
    this._isPlaying = false;
  }
}

export const learnAudioPlayer = new LearnAudioPlayer();

/** Build quran.com word audio URL */
export function buildWordAudioUrl(
  verseKey: string,
  wordPosition: number,
): string {
  const [chapter, verse] = verseKey.split(":");
  const paddedChapter = chapter.padStart(3, "0");
  const paddedVerse = verse.padStart(3, "0");
  const paddedWord = String(wordPosition).padStart(3, "0");
  return `https://audio.qurancdn.com/wbw/${paddedChapter}_${paddedVerse}_${paddedWord}.mp3`;
}

/** Play a short success chime using Web Audio API */
export function playSuccessChime(): void {
  if (typeof window === "undefined") return;
  try {
    const ctx = new AudioContext();
    const now = ctx.currentTime;

    // Two-note ascending chime (C5 → E5)
    const notes = [523.25, 659.25];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + i * 0.12);
      gain.gain.linearRampToValueAtTime(0.18, now + i * 0.12 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.3);
    });

    // Clean up context after sounds finish
    setTimeout(() => ctx.close(), 600);
  } catch {
    // Web Audio not available, skip silently
  }
}

/** Pre-fetch audio URLs into browser/service worker cache */
export function prefetchAudioUrls(urls: string[]): void {
  if (typeof window === "undefined") return;
  for (const url of urls) {
    // Use link preload for browser-level caching
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.as = "audio";
    link.href = url;
    document.head.appendChild(link);
  }
}
