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

function speakArabic(text: string, onEnd: () => void): void {
  if (!("speechSynthesis" in window)) { onEnd(); return; }

  speechSynthesis.cancel();

  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "ar-SA";
  utter.rate = 0.75;
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

  audio.onended = onEnd;
  audio.onerror = () => {
    // MP3 yok — Web Speech ile harfin kendisini oku
    speakArabic(arabic, onEnd);
  };

  audio.play().catch(() => {
    // Autoplay policy engeli — Web Speech dene
    speakArabic(arabic, onEnd);
  });

  return {
    stop: () => {
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
