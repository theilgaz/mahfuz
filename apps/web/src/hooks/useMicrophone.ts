/**
 * Microphone capture hook — 16kHz mono audio with RMS level.
 * Handles permission states and iOS Safari AudioContext restrictions.
 */

import { useState, useRef, useCallback, useEffect } from "react";

export type MicPermission = "prompt" | "granted" | "denied" | "unsupported";

interface UseMicrophoneOptions {
  /** Called with raw PCM chunks (~256ms at 16kHz) */
  onAudioChunk?: (samples: Float32Array) => void;
}

export function useMicrophone(options: UseMicrophoneOptions = {}) {
  const [isRecording, setIsRecording] = useState(false);
  const [permissionState, setPermissionState] = useState<MicPermission>("prompt");
  const [rmsLevel, setRmsLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const onChunkRef = useRef(options.onAudioChunk);
  onChunkRef.current = options.onAudioChunk;

  // Check initial permission state
  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setPermissionState("unsupported");
      return;
    }
    navigator.permissions?.query({ name: "microphone" as PermissionName })
      .then((result) => {
        setPermissionState(result.state === "granted" ? "granted" : result.state === "denied" ? "denied" : "prompt");
        result.onchange = () => {
          setPermissionState(result.state === "granted" ? "granted" : result.state === "denied" ? "denied" : "prompt");
        };
      })
      .catch(() => {
        // permissions.query not supported (iOS Safari) — stay as "prompt"
      });
  }, []);

  const start = useCallback(async () => {
    setError(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Your browser does not support microphone access.");
      setPermissionState("unsupported");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;
      setPermissionState("granted");

      // Create AudioContext (must be from user gesture on iOS)
      const ctx = new AudioContext({ sampleRate: 16000 });
      contextRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);

      // ScriptProcessorNode for raw PCM (works everywhere, no COOP/COEP needed)
      const processor = ctx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        const input = e.inputBuffer.getChannelData(0);
        const samples = new Float32Array(input);

        // RMS level for visualization
        let sum = 0;
        for (let i = 0; i < samples.length; i++) {
          sum += samples[i] * samples[i];
        }
        const rms = Math.sqrt(sum / samples.length);
        setRmsLevel(Math.min(1, rms * 5)); // Scale to 0-1

        onChunkRef.current?.(samples);
      };

      source.connect(processor);
      processor.connect(ctx.destination); // Required for onaudioprocess to fire

      setIsRecording(true);
    } catch (err) {
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        setPermissionState("denied");
        setError("Microphone access denied.");
      } else {
        setError(err instanceof Error ? err.message : "Microphone error");
      }
    }
  }, []);

  const stop = useCallback(() => {
    processorRef.current?.disconnect();
    processorRef.current = null;

    if (contextRef.current?.state !== "closed") {
      contextRef.current?.close();
    }
    contextRef.current = null;

    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    setIsRecording(false);
    setRmsLevel(0);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      processorRef.current?.disconnect();
      if (contextRef.current?.state !== "closed") {
        contextRef.current?.close();
      }
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return { start, stop, isRecording, permissionState, rmsLevel, error };
}
