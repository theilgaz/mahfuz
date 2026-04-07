/**
 * Ayet atlama diyalogu — sure içinde belirli bir ayete hızlıca gitmek için.
 */

import { useState, useRef, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { surahSlug } from "~/lib/surah-slugs";
import { useTranslation } from "~/hooks/useTranslation";

interface VerseJumpDialogProps {
  open: boolean;
  onClose: () => void;
  surahId: number;
  ayahCount: number;
}

export function VerseJumpDialog({ open, onClose, surahId, ayahCount }: VerseJumpDialogProps) {
  const [value, setValue] = useState("1");
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    if (open) {
      setValue("1");
      setTimeout(() => {
        inputRef.current?.select();
      }, 50);
    }
  }, [open]);

  if (!open) return null;

  const ayahNum = parseInt(value, 10);
  const isValid = !isNaN(ayahNum) && ayahNum >= 1 && ayahNum <= ayahCount;

  function handleGo() {
    if (!isValid) return;
    navigate({
      to: "/surah/$surahSlug",
      params: { surahSlug: surahSlug(surahId) },
      search: { ayah: ayahNum },
    });
    onClose();
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <div className="fixed top-1/3 left-1/2 -translate-x-1/2 z-50 w-72 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-2xl shadow-xl p-5">
        <h3 className="text-sm font-medium mb-3">{t.reader.verseJumpTitle}</h3>

        <div className="flex gap-2 mb-4">
          <input
            ref={inputRef}
            type="number"
            min={1}
            max={ayahCount}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGo()}
            className="flex-1 px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-sm text-center focus:outline-none focus:border-[var(--color-accent)]"
            placeholder={`1-${ayahCount}`}
          />
          <button
            onClick={handleGo}
            disabled={!isValid}
            className="px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white text-sm font-medium disabled:opacity-40 transition-opacity"
          >
            {t.common.go}
          </button>
        </div>

        {/* Hızlı erişim — eşit aralıklı 5 ayet */}
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: Math.min(5, ayahCount) }, (_, i) =>
            Math.round((i / Math.max(4, Math.min(4, ayahCount - 1))) * (ayahCount - 1)) + 1
          )
            .filter((v, i, arr) => arr.indexOf(v) === i)
            .map((v) => (
              <button
                key={v}
                onClick={() => {
                  navigate({
                    to: "/surah/$surahSlug",
                    params: { surahSlug: surahSlug(surahId) },
                    search: { ayah: v },
                  });
                  onClose();
                }}
                className="px-2.5 py-1 rounded-lg text-xs bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                {v}
              </button>
            ))}
        </div>
      </div>
    </>
  );
}
