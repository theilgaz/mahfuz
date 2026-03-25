/**
 * AudioProvider — AudioEngine'i oluşturur ve store'a bağlar.
 * Root layout'ta render edilir.
 */

import { useEffect } from "react";
import { AudioEngine } from "@mahfuz/audio-engine";
import { useAudioStore } from "~/stores/audio.store";

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

  return null;
}
