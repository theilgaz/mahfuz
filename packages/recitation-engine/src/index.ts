/**
 * @mahfuz/recitation-engine — Quran verse recognition from audio.
 *
 * Uses ONNX Runtime Web in a Web Worker for non-blocking inference.
 * Model downloads once and is cached in IndexedDB for offline use.
 *
 * Usage:
 *   const engine = new RecitationEngine({
 *     onStateChange: (state) => console.log(state),
 *     onVerseMatch: (match) => console.log(match),
 *   });
 *   await engine.init();
 *   engine.feedAudio(float32Samples);
 *   engine.destroy();
 */

export type {
  VerseMatch,
  RecitationEngineState,
  RecitationEngineCallbacks,
} from "./lib/types";

export { isModelCached } from "./worker/model-cache";

import type {
  RecitationEngineState,
  RecitationEngineCallbacks,
  WorkerOutbound,
} from "./lib/types";

export class RecitationEngine {
  private worker: Worker | null = null;
  private callbacks: RecitationEngineCallbacks;
  private _state: RecitationEngineState = "idle";

  constructor(callbacks: RecitationEngineCallbacks) {
    this.callbacks = callbacks;
  }

  get state(): RecitationEngineState {
    return this._state;
  }

  /**
   * Initialize the engine: creates Web Worker, downloads model (if not cached),
   * loads ONNX session. Reports progress via callbacks.
   */
  async init(): Promise<void> {
    if (this.worker) return;

    this.setState("downloading");

    this.worker = new Worker(
      new URL("./worker/inference-worker.ts", import.meta.url),
      { type: "module" },
    );

    this.worker.onmessage = (e: MessageEvent<WorkerOutbound>) => {
      this.handleWorkerMessage(e.data);
    };

    this.worker.onerror = (e) => {
      this.setState("error");
      this.callbacks.onError?.(e.message || "Worker error");
    };

    this.worker.postMessage({ type: "init" });
  }

  /**
   * Feed audio samples to the engine for recognition.
   * Expects mono 16kHz Float32Array.
   */
  feedAudio(samples: Float32Array): void {
    if (!this.worker || this._state !== "ready") return;
    this.setState("listening");
    this.worker.postMessage({ type: "audio", samples }, [samples.buffer]);
  }

  /** Reset tracking state (e.g., when switching surahs). */
  reset(): void {
    this.worker?.postMessage({ type: "reset" });
  }

  /** Terminate the worker and clean up. */
  destroy(): void {
    this.worker?.terminate();
    this.worker = null;
    this.setState("idle");
  }

  private setState(state: RecitationEngineState) {
    this._state = state;
    this.callbacks.onStateChange?.(state);
  }

  private handleWorkerMessage(msg: WorkerOutbound) {
    switch (msg.type) {
      case "loading":
        this.setState("downloading");
        this.callbacks.onProgress?.(msg.percent);
        break;
      case "loading_status":
        this.setState("loading");
        break;
      case "ready":
        this.setState("ready");
        break;
      case "result":
        this.setState("ready");
        this.callbacks.onVerseMatch?.(msg.match, msg.transcript);
        break;
      case "error":
        this.setState("error");
        this.callbacks.onError?.(msg.message);
        break;
    }
  }
}
