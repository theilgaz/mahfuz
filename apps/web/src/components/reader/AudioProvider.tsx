/**
 * AudioProvider — AudioEngine'i oluşturur ve store'a bağlar.
 * Root layout'ta render edilir.
 */

import { useEffect, useRef } from "react";
import { AudioEngine } from "@mahfuz/audio-engine";
import { useAudioStore } from "~/stores/audio.store";
import { useSettingsStore } from "~/stores/settings.store";
import { fetchChapterAudioForSlug } from "~/lib/audio-service";

export function AudioProvider() {
  const initEngine = useAudioStore((s) => s.initEngine);
  const destroyEngine = useAudioStore((s) => s.destroyEngine);
  const onPlaybackStateChange = useAudioStore((s) => s._onPlaybackStateChange);
  const onTimeUpdate = useAudioStore((s) => s._onTimeUpdate);
  const onWordPositionChange = useAudioStore((s) => s._onWordPositionChange);
  const onVerseChange = useAudioStore((s) => s._onVerseChange);
  const onVerseEnd = useAudioStore((s) => s._onVerseEnd);

  useEffect(() => {
    const engine = new AudioEngine({
      onPlaybackStateChange,
      onTimeUpdate,
      onWordPositionChange,
      onVerseChange,
      onVerseEnd,
      onError: (err) => console.error("[AudioEngine]", err),
    });

    initEngine(engine);

    return () => {
      destroyEngine();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Reciter change while playing: reload audio ──────────
  const reciterSlug = useSettingsStore((s) => s.reciterSlug);
  const prevReciterRef = useRef(reciterSlug);

  useEffect(() => {
    if (prevReciterRef.current === reciterSlug) return;
    prevReciterRef.current = reciterSlug;

    const { engine, chapterId, chapterName, currentVerseKey, playbackState } =
      useAudioStore.getState();
    if (!engine || !chapterId || !chapterName) return;
    if (playbackState !== "playing" && playbackState !== "paused") return;

    const resumeVerseKey = currentVerseKey ?? undefined;

    fetchChapterAudioForSlug(reciterSlug, chapterId).then((audioData) => {
      if (!audioData) return;
      // Re-check state -- user might have stopped while fetching
      const current = useAudioStore.getState();
      if (current.chapterId !== chapterId) return;
      current.playSurah(chapterId, chapterName, audioData, resumeVerseKey);
    });
  }, [reciterSlug]);

  return null;
}
