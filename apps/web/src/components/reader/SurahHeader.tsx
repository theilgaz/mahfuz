/**
 * Sure başlık bileşeni — besmele + play butonu dahil.
 * Sayfa görünümünde sure başında gösterilir.
 */

import { PlaySurahButton } from "./PlaySurahButton";
import { getSurahName } from "~/lib/surah-names-i18n";
import { useTranslation } from "~/hooks/useTranslation";

interface SurahHeaderProps {
  surahId?: number;
  nameArabic: string;
  nameSimple: string;
  showBismillah: boolean;
}

export function SurahHeader({ surahId, nameArabic, nameSimple, showBismillah }: SurahHeaderProps) {
  const { locale } = useTranslation();
  const label = (surahId ? getSurahName(surahId, locale) : "") || nameSimple;
  return (
    <div className="text-center py-6">
      {/* Sure adı + play butonu */}
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)]">
        {surahId && (
          <PlaySurahButton surahId={surahId} surahName={nameSimple} />
        )}
        <span className="text-xl" dir="rtl" style={{ fontFamily: "var(--font-arabic)" }}>
          {nameArabic}
        </span>
        <span className="text-sm text-[var(--color-text-secondary)]">{label}</span>
      </div>

      {/* Besmele */}
      {showBismillah && (
        <p
          className="mt-4 text-center text-[var(--color-text-primary)]"
          dir="rtl"
          style={{ fontFamily: "var(--font-arabic)", fontSize: "clamp(1.6rem, 4vw, 2.8rem)" }}
        >
          بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ
        </p>
      )}
    </div>
  );
}
