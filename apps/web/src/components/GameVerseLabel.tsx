/**
 * Standardized verse label for all games.
 * Shows: ── SurahName · N. Ayet ──
 * Uses localized surah name via getSurahName.
 */
import { getSurahName } from "~/lib/surah-names-i18n";
import { useLocaleStore } from "~/stores/locale.store";

interface GameVerseLabelProps {
  surahId: number;
  ayahNumber: number;
  primary: string;
  /** Fallback name if getSurahName returns empty */
  fallbackName?: string;
}

export function GameVerseLabel({ surahId, ayahNumber, primary, fallbackName }: GameVerseLabelProps) {
  const locale = useLocaleStore((s) => s.locale);
  const name = getSurahName(surahId, locale) || fallbackName || "";
  const P = primary;

  return (
    <div className="flex items-center justify-center gap-3 mb-4">
      <span className="h-px flex-1 max-w-12" style={{ background: `linear-gradient(90deg, transparent, ${P}40)` }} />
      <p className="text-xs font-semibold tracking-wide" style={{ color: `${P}cc` }}>
        {name} &middot; {ayahNumber}. Ayet
      </p>
      <span className="h-px flex-1 max-w-12" style={{ background: `linear-gradient(270deg, transparent, ${P}40)` }} />
    </div>
  );
}
