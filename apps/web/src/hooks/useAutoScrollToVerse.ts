import { useEffect } from "react";
import { useAudioStore } from "~/stores/useAudioStore";

export function useAutoScrollToVerse() {
  const currentVerseKey = useAudioStore((s) => s.currentVerseKey);
  const playbackState = useAudioStore((s) => s.playbackState);

  useEffect(() => {
    if (!currentVerseKey || playbackState !== "playing") return;

    // Function to scroll to verse
    const scrollToVerse = () => {
      const el = document.getElementById(`verse-${currentVerseKey}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        return true;
      }
      return false;
    };

    // Try to scroll immediately
    if (scrollToVerse()) return;

    // If element not found, wait for it to be loaded (in case of page navigation)
    let attempts = 0;
    const maxAttempts = 10;
    const interval = setInterval(() => {
      attempts++;
      if (scrollToVerse() || attempts >= maxAttempts) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [currentVerseKey, playbackState]);
}
