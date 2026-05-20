/**
 * AudioProvider — AudioEngine'i oluşturur ve store'a bağlar.
 * Root layout'ta render edilir.
 */

import { useEffect, useRef } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { AudioEngine } from "@mahfuz/audio-engine";
import { useAudioStore } from "~/stores/audio.store";
import { useSettingsStore } from "~/stores/settings.store";
import { fetchChapterAudioForSlug } from "~/lib/audio-service";
import { SURAH_NAMES_TR } from "~/lib/surah-names-tr";
import { surahSlug } from "~/lib/surah-slugs";

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

  // ── Auto-continue to next surah on end ──────────────────
  const navigate = useNavigate();
  const routerState = useRouterState();
  const playbackState = useAudioStore((s) => s.playbackState);
  const autoPlayNextSurah = useSettingsStore((s) => s.autoPlayNextSurah);
  const autoContinuedForRef = useRef<number | null>(null);

  useEffect(() => {
    if (playbackState !== "ended") {
      // Reset guard when leaving "ended" so the next end can trigger again
      if (playbackState === "playing" || playbackState === "loading") {
        autoContinuedForRef.current = null;
      }
      return;
    }
    if (!autoPlayNextSurah) return;

    const { chapterId } = useAudioStore.getState();
    const currentReciter = useSettingsStore.getState().reciterSlug;
    if (!chapterId || chapterId >= 114) return;
    if (autoContinuedForRef.current === chapterId) return;
    autoContinuedForRef.current = chapterId;

    const nextId = chapterId + 1;
    const oldSlug = surahSlug(chapterId);
    const currentPath = routerState.location.pathname;
    const isOnOldSurahPage = currentPath === `/surah/${oldSlug}`;

    fetchChapterAudioForSlug(currentReciter, nextId).then((audioData) => {
      if (!audioData) return;
      const latest = useAudioStore.getState();
      // Bail if user started something else in the meantime
      if (latest.chapterId !== chapterId && latest.chapterId !== null) return;
      latest.playSurah(nextId, SURAH_NAMES_TR[nextId] ?? `Sure ${nextId}`, audioData);
      if (isOnOldSurahPage) {
        navigate({ to: "/surah/$surahSlug", params: { surahSlug: surahSlug(nextId) }, search: { ayah: undefined } });
      }
    });
  }, [playbackState, autoPlayNextSurah, navigate, routerState.location.pathname]);

  return null;
}
