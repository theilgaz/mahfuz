/**
 * Recitation engine hook — wires microphone to RecitationEngine.
 * Buffers audio chunks and sends to ONNX worker for verse recognition.
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { RecitationEngine, type VerseMatch, type RecitationEngineState } from "@mahfuz/recitation-engine";
import { useMicrophone } from "./useMicrophone";

const BUFFER_SECONDS = 3; // Accumulate ~3s of audio before sending
const SAMPLE_RATE = 16000;
const BUFFER_SIZE = BUFFER_SECONDS * SAMPLE_RATE;

export function useRecitationEngine() {
  const engineRef = useRef<RecitationEngine | null>(null);
  const bufferRef = useRef<Float32Array[]>([]);
  const bufferLenRef = useRef(0);

  const [state, setState] = useState<RecitationEngineState>("idle");
  const [progress, setProgress] = useState(0);
  const [lastMatch, setLastMatch] = useState<VerseMatch | null>(null);
  const [lastTranscript, setLastTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Flush buffer to engine
  const flushBuffer = useCallback(() => {
    if (!engineRef.current || bufferRef.current.length === 0) return;

    const totalLen = bufferLenRef.current;
    const merged = new Float32Array(totalLen);
    let offset = 0;
    for (const chunk of bufferRef.current) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }

    bufferRef.current = [];
    bufferLenRef.current = 0;

    engineRef.current.feedAudio(merged);
  }, []);

  // Handle incoming audio chunks from microphone
  const onAudioChunk = useCallback((samples: Float32Array) => {
    bufferRef.current.push(samples);
    bufferLenRef.current += samples.length;

    if (bufferLenRef.current >= BUFFER_SIZE) {
      flushBuffer();
    }
  }, [flushBuffer]);

  const mic = useMicrophone({ onAudioChunk });

  // Initialize engine (downloads model if needed)
  const init = useCallback(async () => {
    if (engineRef.current) return;

    setError(null);
    const engine = new RecitationEngine({
      onStateChange: (s) => setState(s),
      onProgress: (p) => setProgress(p),
      onVerseMatch: (match, transcript) => {
        setLastMatch(match);
        setLastTranscript(transcript);
      },
      onError: (msg) => setError(msg),
    });

    engineRef.current = engine;
    await engine.init();
  }, []);

  // Start listening (init engine if needed, then start mic)
  const startListening = useCallback(async () => {
    setLastMatch(null);
    setLastTranscript("");
    setError(null);
    bufferRef.current = [];
    bufferLenRef.current = 0;

    if (!engineRef.current) {
      await init();
    }

    // Wait for engine to be ready
    if (engineRef.current?.state === "ready") {
      await mic.start();
    }
  }, [init, mic]);

  // Stop listening and flush remaining audio
  const stopListening = useCallback(() => {
    mic.stop();
    // Flush any remaining buffered audio
    if (bufferLenRef.current > SAMPLE_RATE) { // Only if > 1s of audio
      flushBuffer();
    } else {
      bufferRef.current = [];
      bufferLenRef.current = 0;
    }
  }, [mic, flushBuffer]);

  // Auto-start mic when engine becomes ready (if mic was requested before engine loaded)
  useEffect(() => {
    if (state === "ready" && !mic.isRecording && bufferRef.current.length === 0) {
      // Engine just became ready — user might be waiting
    }
  }, [state, mic.isRecording]);

  // Reset engine state
  const reset = useCallback(() => {
    engineRef.current?.reset();
    setLastMatch(null);
    setLastTranscript("");
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      engineRef.current?.destroy();
      engineRef.current = null;
    };
  }, []);

  return {
    init,
    startListening,
    stopListening,
    reset,
    state,
    progress,
    lastMatch,
    lastTranscript,
    error,
    isRecording: mic.isRecording,
    rmsLevel: mic.rmsLevel,
    micPermission: mic.permissionState,
    micError: mic.error,
  };
}
