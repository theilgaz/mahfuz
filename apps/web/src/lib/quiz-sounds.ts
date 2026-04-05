/**
 * Web Audio API ile quiz geri bildirim sesleri.
 * Harici dosyaya gerek yok — tamamen programatik.
 */

let sharedCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  try {
    if (!sharedCtx || sharedCtx.state === "closed") {
      sharedCtx = new AudioContext();
    }
    if (sharedCtx.state === "suspended") {
      sharedCtx.resume();
    }
    return sharedCtx;
  } catch {
    return null;
  }
}

function playTone(
  ctx: AudioContext,
  freq: number,
  startOffset: number,
  duration: number,
  peakGain: number,
  type: OscillatorType = "sine",
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  // Soft high-shelf to reduce harshness
  const filter = ctx.createBiquadFilter();
  filter.type = "highshelf";
  filter.frequency.value = 3000;
  filter.gain.value = -6;

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc.type = type;
  osc.frequency.value = freq;

  const t = ctx.currentTime + startOffset;
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(peakGain, t + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

  osc.start(t);
  osc.stop(t + duration);
}

/** Doğru cevap: üç yükselen nota — E5 · G5 · B5 (major triad arpeggio) */
export function playCorrect() {
  const ctx = getCtx();
  if (!ctx) return;

  // E5 · G#5 · B5 — bright major chord feel
  const notes = [659.25, 830.61, 987.77];
  notes.forEach((freq, i) => {
    playTone(ctx, freq, i * 0.1, 0.28, 0.18, "sine");
  });
}

/** Yanlış cevap: yumuşak inen iki nota — A4 → E4 */
export function playWrong() {
  const ctx = getCtx();
  if (!ctx) return;

  // Two soft descending tones, triangle wave for warmth
  playTone(ctx, 440, 0, 0.22, 0.15, "triangle");
  playTone(ctx, 329.63, 0.14, 0.25, 0.12, "triangle");
}
