/**
 * NeMo-compatible mel spectrogram computation.
 * Ported from offline-tarteel, self-contained (no @huggingface/transformers dependency).
 *
 * Parameters: 16kHz, 80 mel bins, FFT=512, hop=160, win=400, preemphasis=0.97
 */

const SAMPLE_RATE = 16000;
const N_FFT = 512;
const HOP_LENGTH = 160;
const WIN_LENGTH = 400;
const N_MELS = 80;
const PREEMPH = 0.97;
const DITHER = 1e-5;
const LOG_GUARD = 1e-5;

// ── Hann window ────────────────────────────────────────

let _window: Float32Array | null = null;

function getWindow(): Float32Array {
  if (!_window) {
    _window = new Float32Array(WIN_LENGTH);
    for (let i = 0; i < WIN_LENGTH; i++) {
      _window[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / WIN_LENGTH));
    }
  }
  return _window;
}

// ── Mel filterbank (HTK scale, slaney norm) ────────────

let _melFilters: Float32Array[] | null = null;

function htkMel(freq: number): number {
  return 2595.0 * Math.log10(1.0 + freq / 700.0);
}

function htkMelInv(mel: number): number {
  return 700.0 * (10.0 ** (mel / 2595.0) - 1.0);
}

function getMelFilters(): Float32Array[] {
  if (_melFilters) return _melFilters;

  const numBins = N_FFT / 2 + 1; // 257
  const fMin = 0;
  const fMax = SAMPLE_RATE / 2; // 8000

  const melMin = htkMel(fMin);
  const melMax = htkMel(fMax);

  // N_MELS + 2 equally spaced points in mel scale
  const melPoints = new Float32Array(N_MELS + 2);
  for (let i = 0; i < N_MELS + 2; i++) {
    melPoints[i] = melMin + (i * (melMax - melMin)) / (N_MELS + 1);
  }

  // Convert back to Hz and then to FFT bin indices
  const freqPoints = melPoints.map(htkMelInv);
  const binPoints = freqPoints.map(
    (f) => Math.floor(((N_FFT + 1) * f) / SAMPLE_RATE)
  );

  _melFilters = [];
  for (let m = 0; m < N_MELS; m++) {
    const filter = new Float32Array(numBins);
    const left = binPoints[m];
    const center = binPoints[m + 1];
    const right = binPoints[m + 2];

    for (let k = left; k < center; k++) {
      if (k < numBins && center !== left) {
        filter[k] = (k - left) / (center - left);
      }
    }
    for (let k = center; k <= right; k++) {
      if (k < numBins && right !== center) {
        filter[k] = (right - k) / (right - center);
      }
    }

    // Slaney normalization: divide by mel bandwidth
    const melWidth = melPoints[m + 2] - melPoints[m];
    if (melWidth > 0) {
      for (let k = 0; k < numBins; k++) {
        filter[k] *= 2.0 / melWidth;
      }
    }

    _melFilters.push(filter);
  }

  return _melFilters;
}

// ── FFT (radix-2 Cooley-Tukey) ─────────────────────────

function fft(re: Float32Array, im: Float32Array): void {
  const n = re.length;
  // Bit-reversal permutation
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    while (j & bit) {
      j ^= bit;
      bit >>= 1;
    }
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  // Butterfly
  for (let len = 2; len <= n; len <<= 1) {
    const halfLen = len >> 1;
    const angle = (-2 * Math.PI) / len;
    const wRe = Math.cos(angle);
    const wIm = Math.sin(angle);
    for (let i = 0; i < n; i += len) {
      let curRe = 1, curIm = 0;
      for (let j = 0; j < halfLen; j++) {
        const tRe = curRe * re[i + j + halfLen] - curIm * im[i + j + halfLen];
        const tIm = curRe * im[i + j + halfLen] + curIm * re[i + j + halfLen];
        re[i + j + halfLen] = re[i + j] - tRe;
        im[i + j + halfLen] = im[i + j] - tIm;
        re[i + j] += tRe;
        im[i + j] += tIm;
        const newRe = curRe * wRe - curIm * wIm;
        curIm = curRe * wIm + curIm * wRe;
        curRe = newRe;
      }
    }
  }
}

// ── Main: compute mel spectrogram ──────────────────────

export function computeMelSpectrogram(
  audio: Float32Array,
): { features: Float32Array; timeFrames: number } {
  const win = getWindow();
  const melFilters = getMelFilters();
  const numBins = N_FFT / 2 + 1;

  // 1. Dither
  const dithered = new Float32Array(audio.length);
  for (let i = 0; i < audio.length; i++) {
    dithered[i] = audio[i] + DITHER * (Math.random() * 2 - 1);
  }

  // 2. Preemphasis
  for (let i = dithered.length - 1; i > 0; i--) {
    dithered[i] -= PREEMPH * dithered[i - 1];
  }

  // 3. STFT (center=false, no padding)
  const timeFrames = Math.max(0, Math.floor((dithered.length - WIN_LENGTH) / HOP_LENGTH) + 1);
  const powerSpec = new Float32Array(timeFrames * numBins);

  const fftRe = new Float32Array(N_FFT);
  const fftIm = new Float32Array(N_FFT);

  for (let t = 0; t < timeFrames; t++) {
    const start = t * HOP_LENGTH;
    // Windowed frame
    fftRe.fill(0);
    fftIm.fill(0);
    for (let i = 0; i < WIN_LENGTH; i++) {
      fftRe[i] = dithered[start + i] * win[i];
    }
    // FFT
    fft(fftRe, fftIm);
    // Power spectrum (one-sided)
    for (let k = 0; k < numBins; k++) {
      powerSpec[t * numBins + k] = fftRe[k] * fftRe[k] + fftIm[k] * fftIm[k];
    }
  }

  // 4. Mel filterbank application
  const melSpec = new Float32Array(N_MELS * timeFrames);
  for (let m = 0; m < N_MELS; m++) {
    const filter = melFilters[m];
    for (let t = 0; t < timeFrames; t++) {
      let sum = 0;
      for (let k = 0; k < numBins; k++) {
        sum += filter[k] * powerSpec[t * numBins + k];
      }
      melSpec[m * timeFrames + t] = sum;
    }
  }

  // 5. Log with guard
  for (let i = 0; i < melSpec.length; i++) {
    melSpec[i] = Math.log(Math.max(melSpec[i], 1e-10) + LOG_GUARD);
  }

  // 6. Per-feature normalization (mean/std per mel bin)
  for (let m = 0; m < N_MELS; m++) {
    let sum = 0;
    for (let t = 0; t < timeFrames; t++) {
      sum += melSpec[m * timeFrames + t];
    }
    const mean = sum / timeFrames;

    let sumSq = 0;
    for (let t = 0; t < timeFrames; t++) {
      const diff = melSpec[m * timeFrames + t] - mean;
      sumSq += diff * diff;
    }
    const std = Math.sqrt(sumSq / timeFrames) || 1e-10;

    for (let t = 0; t < timeFrames; t++) {
      melSpec[m * timeFrames + t] = (melSpec[m * timeFrames + t] - mean) / std;
    }
  }

  return { features: melSpec, timeFrames };
}
