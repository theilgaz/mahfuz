/**
 * Web Audio API ile quiz geri bildirim sesleri.
 * Harici dosyaya gerek yok — tamamen programatik.
 */

function getAudioContext(): AudioContext | null {
  try {
    return new AudioContext();
  } catch {
    return null;
  }
}

/** Doğru cevap: iki yükselen nota */
export function playCorrect() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const notes = [523.25, 783.99]; // C5 → G5
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = "sine";
    osc.frequency.value = freq;

    const start = ctx.currentTime + i * 0.12;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.25, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22);

    osc.start(start);
    osc.stop(start + 0.22);
  });
}

/** Yanlış cevap: kısa inen nota */
export function playWrong() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = "sine";
  osc.frequency.setValueAtTime(300, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(180, ctx.currentTime + 0.25);

  gain.gain.setValueAtTime(0.25, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.28);
}
