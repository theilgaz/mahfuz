import { useState, useCallback, useEffect } from "react";
import { learnAudioPlayer, buildWordAudioUrl, prefetchAudioUrls } from "~/lib/learn-audio";
import type { AudioRef, Stage } from "@mahfuz/shared/types";

export function useLearnAudio() {
  const [isPlaying, setIsPlaying] = useState(false);

  const playAudioRef = useCallback(async (audioRef: AudioRef) => {
    const url = buildWordAudioUrl(audioRef.verseKey, audioRef.wordPosition);
    setIsPlaying(true);
    try {
      await learnAudioPlayer.playWordAudio(url);
    } catch {
      // Silently fail, audio is supplementary
    } finally {
      setIsPlaying(false);
    }
  }, []);

  const playUrl = useCallback(async (url: string) => {
    setIsPlaying(true);
    try {
      await learnAudioPlayer.playWordAudio(url);
    } catch {
      // Silently fail
    } finally {
      setIsPlaying(false);
    }
  }, []);

  const stop = useCallback(() => {
    learnAudioPlayer.stop();
    setIsPlaying(false);
  }, []);

  return { isPlaying, playAudioRef, playUrl, stop };
}

/** Pre-fetch audio for all exercises in a stage when entering it */
export function useStagePrefetch(stage: Stage | undefined) {
  useEffect(() => {
    if (!stage) return;
    const urls: string[] = [];
    for (const lesson of stage.lessons) {
      for (const exercise of lesson.exercises) {
        if (exercise.audioRef) {
          urls.push(buildWordAudioUrl(exercise.audioRef.verseKey, exercise.audioRef.wordPosition));
        }
      }
      for (const block of lesson.contentBlocks) {
        if (block.type === "audio_example" && block.data.audioRef) {
          urls.push(buildWordAudioUrl(block.data.audioRef.verseKey, block.data.audioRef.wordPosition));
        }
      }
    }
    if (urls.length > 0) {
      prefetchAudioUrls(urls);
    }
  }, [stage?.id]);
}
