/**
 * Harf sesi çalma yardımcısı.
 * 1. /kids/audio/{id}.mp3 varsa onu kullan.
 * 2. Yoksa Web Speech API ile Arapça harfi oku.
 *    - Önce sadece harfin kendisi (en kısa, en net telaffuz)
 *    - rate 0.75 — çocuklar için yavaş ve belirgin
 *    - Mevcut sesler arasından Arapça ses seçmeye çalış
 */

let arabicVoice: SpeechSynthesisVoice | null | undefined = undefined; // undefined = not yet resolved

function getArabicVoice(): SpeechSynthesisVoice | null {
  if (arabicVoice !== undefined) return arabicVoice;
  if (!("speechSynthesis" in window)) return (arabicVoice = null);

  const voices = speechSynthesis.getVoices();
  // Prefer ar-SA, then any ar-* voice
  arabicVoice =
    voices.find((v) => v.lang === "ar-SA") ??
    voices.find((v) => v.lang.startsWith("ar")) ??
    null;
  return arabicVoice;
}

export function speakArabic(text: string, onEnd: () => void, rate = 0.75): void {
  if (!("speechSynthesis" in window)) { onEnd(); return; }

  speechSynthesis.cancel();

  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "ar-SA";
  utter.rate = rate;
  utter.pitch = 1.05;

  const voice = getArabicVoice();
  if (voice) utter.voice = voice;

  utter.onend = onEnd;
  utter.onerror = onEnd;
  speechSynthesis.speak(utter);
}

export interface LetterAudioHandle {
  stop: () => void;
}

/**
 * Harfin sesini çalar. Döndürülen handle ile durdurulabilir.
 * @param arabic   Harfin Arapça karakteri (ل gibi)
 * @param id       Ses dosyası id'si (lam)
 * @param onEnd    Ses bitince çağrılır
 */
export function playLetterAudio(
  arabic: string,
  id: string,
  onEnd: () => void,
): LetterAudioHandle {
  const audio = new Audio(`/kids/audio/${id}.mp3`);
  let stopped = false;
  let audioStarted = false;

  const speak = () => {
    if (stopped || audioStarted) return;
    speakArabic(arabic, onEnd);
  };

  audio.onended = () => { if (!stopped) onEnd(); };
  audio.onerror = speak;
  audio.play().then(() => { audioStarted = true; }).catch(speak);

  return {
    stop: () => {
      stopped = true;
      audio.pause();
      if ("speechSynthesis" in window) speechSynthesis.cancel();
    },
  };
}

// Voices listesi async yükleniyor — bir kere prefetch et
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  speechSynthesis.addEventListener("voiceschanged", () => {
    arabicVoice = undefined; // reset so next call re-resolves
  });
}
