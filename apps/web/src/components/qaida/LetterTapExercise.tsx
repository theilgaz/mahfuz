/**
 * Harf seçme alıştırması.
 * Arapça kelimeyi harflere ayırır, kullanıcı hedef harekeli harflere dokunur.
 * "Sukünlü harfleri bul", "Şeddeli harfleri bul" gibi sorular için.
 */

import { useState, useCallback } from "react";
import { useTranslation } from "~/hooks/useTranslation";
import { playCorrect, playWrong } from "~/lib/quiz-sounds";

/** Unicode diacritic range: hareke, sukun, sedde, tenvin vb. */
const DIACRITIC_RE = /[\u064B-\u065F\u0670]/;
const SUKUN = "\u0652";   // ْ
const SHADDA = "\u0651";  // ّ

interface LetterGroup {
  base: string;       // temel harf
  diacritics: string;  // hareke/sukun/sedde
  full: string;        // base + diacritics
}

/** Arapça metni harf + hareke gruplarına ayır */
function parseArabicLetters(text: string): LetterGroup[] {
  const groups: LetterGroup[] = [];
  for (const char of text) {
    if (DIACRITIC_RE.test(char)) {
      // Önceki gruba hareke ekle
      if (groups.length > 0) {
        groups[groups.length - 1].diacritics += char;
        groups[groups.length - 1].full += char;
      }
    } else if (char.trim()) {
      groups.push({ base: char, diacritics: "", full: char });
    }
  }
  return groups;
}

type TargetType = "sukun" | "shadda";

function getTargetChar(type: TargetType): string {
  return type === "sukun" ? SUKUN : SHADDA;
}

interface LetterTapExerciseProps {
  arabicDisplay: string;
  targetType: TargetType;
  prompt: string;
  onComplete: (isCorrect: boolean) => void;
}

export function LetterTapExercise({ arabicDisplay, targetType, prompt, onComplete }: LetterTapExerciseProps) {
  const { t } = useTranslation();
  const letters = parseArabicLetters(arabicDisplay);
  const targetChar = getTargetChar(targetType);

  // Doğru cevaplar: hedef harekeyi içeren harflerin index'leri
  const correctIndices = new Set(
    letters
      .map((g, i) => (g.diacritics.includes(targetChar) ? i : -1))
      .filter((i) => i >= 0),
  );

  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [submitted, setSubmitted] = useState(false);

  const toggleLetter = useCallback(
    (idx: number) => {
      if (submitted) return;
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(idx)) next.delete(idx);
        else next.add(idx);
        return next;
      });
    },
    [submitted],
  );

  const handleSubmit = useCallback(() => {
    if (submitted) return;
    setSubmitted(true);

    // selected ve correctIndices ayni mi?
    const isCorrect =
      selected.size === correctIndices.size &&
      [...selected].every((i) => correctIndices.has(i));

    if (isCorrect) playCorrect();
    else playWrong();

    setTimeout(() => onComplete(isCorrect), 1200);
  }, [submitted, selected, correctIndices, onComplete]);

  return (
    <div>
      {/* Prompt */}
      <p className="text-sm text-[var(--color-text-secondary)] text-center mb-6">
        {prompt}
      </p>

      {/* Harfler */}
      <div className="flex flex-wrap justify-center gap-2 mb-6" dir="rtl">
        {letters.map((group, idx) => {
          const isSelected = selected.has(idx);
          const isTarget = correctIndices.has(idx);

          let borderColor = "var(--color-border)";
          let bgColor = "var(--color-surface)";
          let ringClass = "";

          if (submitted) {
            if (isTarget && isSelected) {
              // Dogru secilmis
              borderColor = "var(--color-accent)";
              bgColor = "rgba(16,185,129,0.08)";
            } else if (isTarget && !isSelected) {
              // Secilmesi gerekiyordu ama secilmedi
              borderColor = "#f87171";
              bgColor = "#fef2f2";
            } else if (!isTarget && isSelected) {
              // Yanlis secilmis
              borderColor = "#f87171";
              bgColor = "#fef2f2";
            }
          } else if (isSelected) {
            borderColor = "var(--color-accent)";
            bgColor = "rgba(16,185,129,0.06)";
            ringClass = "ring-2 ring-[var(--color-accent)]/30";
          }

          return (
            <button
              key={idx}
              onClick={() => toggleLetter(idx)}
              disabled={submitted}
              className={`w-14 h-16 rounded-xl border-2 flex items-center justify-center transition-all ${ringClass}`}
              style={{ borderColor, backgroundColor: bgColor }}
            >
              <span
                className="text-3xl leading-[1.6]"
                style={{ fontFamily: "var(--font-arabic)" }}
              >
                {group.full}
              </span>
            </button>
          );
        })}
      </div>

      {/* Sonuc */}
      {submitted && (
        <div className="text-center mb-4">
          {selected.size === correctIndices.size && [...selected].every((i) => correctIndices.has(i)) ? (
            <p className="text-sm font-semibold text-[var(--color-accent)]">{t.learn.correct}</p>
          ) : (
            <p className="text-sm font-semibold text-red-500">{t.learn.wrong}</p>
          )}
        </div>
      )}

      {/* Gönder butonu */}
      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={selected.size === 0}
          className="w-full py-3 rounded-xl text-white font-bold text-sm transition-all disabled:opacity-40 bg-[var(--color-accent)]"
        >
          Kontrol Et
        </button>
      )}
    </div>
  );
}
