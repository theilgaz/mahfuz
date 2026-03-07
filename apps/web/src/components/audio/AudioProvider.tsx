import { useEffect } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useAudioStore } from "~/stores/useAudioStore";

/**
 * Renderless component that initializes AudioEngine on mount
 * and connects its callbacks to the Zustand store.
 * Must be rendered client-side only.
 */
export function AudioProvider() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  
  const setEngine = useAudioStore((s) => s.setEngine);
  const onPlaybackStateChange = useAudioStore(
    (s) => s._onPlaybackStateChange,
  );
  const onTimeUpdate = useAudioStore((s) => s._onTimeUpdate);
  const onWordPositionChange = useAudioStore((s) => s._onWordPositionChange);
  const onVerseChange = useAudioStore((s) => s._onVerseChange);
  const onVerseEnd = useAudioStore((s) => s._onVerseEnd);
  const currentVerseKey = useAudioStore((s) => s.currentVerseKey);
  const versePageMap = useAudioStore((s) => s.versePageMap);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let destroyed = false;

    import("@mahfuz/audio-engine").then(({ AudioEngine }) => {
      if (destroyed) return;
      const engine = new AudioEngine({
        onPlaybackStateChange,
        onTimeUpdate,
        onWordPositionChange,
        onVerseChange,
        onVerseEnd,
        onError: (err) => console.error("[AudioEngine]", err),
      });
      setEngine(engine);
    });

    return () => {
      destroyed = true;
      const engine = useAudioStore.getState().engine;
      if (engine) {
        engine.destroy();
        setEngine(null);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Global space key → toggle play/pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      const { isVisible, togglePlayPause, prevVerse, nextVerse } =
        useAudioStore.getState();
      if (!isVisible) return;

      if (e.code === "Space") {
        e.preventDefault();
        togglePlayPause();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        prevVerse();
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        nextVerse();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Auto-navigate to verse's page during audio playback
  useEffect(() => {
    if (!currentVerseKey || Object.keys(versePageMap).length === 0) return;
    
    const versePage = versePageMap[currentVerseKey];
    if (!versePage) return;
    
    const pageMatch = pathname.match(/\/page\/(\d+)/);
    
    // If we're on a page route, check if we need to navigate to a different page
    if (pageMatch) {
      const currentPage = parseInt(pageMatch[1], 10);
      if (currentPage !== versePage) {
        navigate({ 
          to: "/page/$pageNumber", 
          params: { pageNumber: String(versePage) },
          replace: true 
        });
      }
    } 
    // If we're on any other route (juz, surah, etc.), navigate to the verse's page
    else if (!pathname.includes('/audio')) {
      // Small delay to allow verse to be read before scrolling
      const timer = setTimeout(() => {
        const verseElement = document.getElementById(`verse-${currentVerseKey}`);
        // Only navigate if the verse is not in the current view
        if (!verseElement) {
          navigate({ 
            to: "/page/$pageNumber", 
            params: { pageNumber: String(versePage) },
            replace: true 
          });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [currentVerseKey, versePageMap, pathname, navigate]);

  return null;
}
