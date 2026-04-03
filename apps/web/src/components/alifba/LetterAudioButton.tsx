/**
 * Bir harfin sesini çalan buton.
 * /kids/audio/{id}.mp3 dosyasını kullanır.
 * Dosya yoksa sessizce başarısız olur.
 */

import { useState, useRef } from "react";
import { useTranslation } from "~/hooks/useTranslation";
import { ARABIC_LETTERS } from "~/lib/kids-constants";

interface LetterAudioButtonProps {
  letterId: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LetterAudioButton({
  letterId,
  size = "md",
  className = "",
}: LetterAudioButtonProps) {
  const { t } = useTranslation();
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const play = () => {
    if (playing) return;
    setPlaying(true);

    const audio = new Audio(`/kids/audio/${letterId}.mp3`);
    audioRef.current = audio;
    audio.onended = () => setPlaying(false);
    audio.onerror = () => {
      // Ses dosyası yoksa Web Speech API ile telaffuz et
      if ("speechSynthesis" in window) {
        const letter = ARABIC_LETTERS.find((l) => l.id === letterId);
        if (letter) {
          const utter = new SpeechSynthesisUtterance(letter.nameAr);
          utter.lang = "ar-SA";
          utter.onend = () => setPlaying(false);
          utter.onerror = () => setPlaying(false);
          speechSynthesis.speak(utter);
          return;
        }
      }
      setPlaying(false);
    };
    audio.play().catch(() => {});
  };

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-14 h-14",
  }[size];

  const iconSize = { sm: 16, md: 20, lg: 24 }[size];

  return (
    <button
      onClick={play}
      aria-label={t.alifba.listenLetter}
      disabled={playing}
      className={`${sizeClasses} rounded-full flex items-center justify-center transition-colors ${
        playing
          ? "bg-[var(--color-accent)]/20 text-[var(--color-accent)]"
          : "bg-[var(--color-surface)] hover:bg-[var(--color-accent)]/10 text-[var(--color-text-secondary)] hover:text-[var(--color-accent)]"
      } ${className}`}
    >
      {playing ? (
        /* sound wave animation */
        <svg width={iconSize} height={iconSize} viewBox="0 0 20 20" fill="currentColor">
          <rect x="2" y="7" width="2" height="6" rx="1" />
          <rect x="6" y="4" width="2" height="12" rx="1" opacity="0.7" />
          <rect x="10" y="6" width="2" height="8" rx="1" opacity="0.5" />
          <rect x="14" y="8" width="2" height="4" rx="1" opacity="0.3" />
          <rect x="18" y="9" width="2" height="2" rx="1" opacity="0.2" />
        </svg>
      ) : (
        <svg width={iconSize} height={iconSize} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="4,3 16,10 4,17" fill="currentColor" stroke="none" />
        </svg>
      )}
    </button>
  );
}
