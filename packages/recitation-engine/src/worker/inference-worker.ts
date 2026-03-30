/**
 * Web Worker entry point for Quran verse recognition.
 *
 * Pipeline: audio → mel spectrogram → ONNX inference → CTC decode → verse match
 */

import { loadModel } from "./model-cache";
import { computeMelSpectrogram } from "./mel";
import { CTCDecoder } from "./ctc-decode";
import { createSession, runInference } from "./session";
import { QuranDB } from "../lib/quran-db";
import type { WorkerInbound, WorkerOutbound, QuranVerse } from "../lib/types";

const MODEL_URL = "/models/fastconformer_ar_ctc_q8.onnx";
const VOCAB_URL = "/models/phoneme_vocab.json";
const QURAN_URL = "/models/quran_phonemes.json";

let decoder: CTCDecoder | null = null;
let db: QuranDB | null = null;
let lastMatch: [number, number] | null = null; // [surah, ayah] for continuation hints

function post(msg: WorkerOutbound) {
  self.postMessage(msg);
}

function transcribe(audio: Float32Array) {
  const { features, timeFrames } = computeMelSpectrogram(audio);
  const result = runInference(features, 80, timeFrames);
  return result;
}

async function init() {
  try {
    // Load vocabulary
    post({ type: "loading_status", message: "Loading vocabulary..." });
    const vocabRes = await fetch(VOCAB_URL);
    if (!vocabRes.ok) throw new Error(`Vocab fetch failed: ${vocabRes.status}`);
    const vocabJson = await vocabRes.json();
    decoder = new CTCDecoder(vocabJson);

    // Download/load ONNX model
    post({ type: "loading_status", message: "Downloading model..." });
    const modelBuffer = await loadModel(MODEL_URL, (loaded, total) => {
      post({
        type: "loading",
        percent: total ? Math.round((loaded / total) * 100) : 0,
      });
    });

    post({ type: "loading_status", message: "Creating inference session..." });
    await createSession(modelBuffer);

    // Load Quran phoneme data
    post({ type: "loading_status", message: "Loading Quran data..." });
    const quranRes = await fetch(QURAN_URL);
    if (!quranRes.ok) throw new Error(`Quran data fetch failed: ${quranRes.status}`);
    const quranData: QuranVerse[] = await quranRes.json();
    db = new QuranDB(quranData, decoder);

    post({ type: "ready" });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Worker init failed:", message);
    post({ type: "error", message });
  }
}

async function processAudio(samples: Float32Array) {
  if (!decoder || !db) return;

  try {
    // Run full pipeline
    const { logprobs, timeSteps, vocabSize } = await transcribe(samples);
    const ctcResult = decoder.decode(logprobs, timeSteps, vocabSize);

    // Match against Quran
    const match = db.matchVerse(ctcResult.text, 0.25, lastMatch);

    if (match) {
      lastMatch = [match.surah, match.ayah];
    }

    post({
      type: "result",
      match,
      transcript: ctcResult.text,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    post({ type: "error", message });
  }
}

self.onmessage = async (e: MessageEvent<WorkerInbound>) => {
  const msg = e.data;
  switch (msg.type) {
    case "init":
      await init();
      break;
    case "audio":
      await processAudio(msg.samples);
      break;
    case "reset":
      lastMatch = null;
      break;
  }
};
