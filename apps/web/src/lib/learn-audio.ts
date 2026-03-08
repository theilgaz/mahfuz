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
