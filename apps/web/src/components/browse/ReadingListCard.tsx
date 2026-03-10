import { Link } from "@tanstack/react-router";
import type { ReadingListItem } from "~/stores/useReadingListStore";
import { useReadingListStore } from "~/stores/useReadingListStore";
import { formatRelativeTime } from "~/lib/format-relative-time";
import { useTranslation } from "~/hooks/useTranslation";
import { SURAH_NAMES_TR } from "~/lib/surah-names-tr";
import type { Chapter } from "@mahfuz/shared/types";

interface ReadingListCardProps {
  item: ReadingListItem;
  chapters: Chapter[];
}

export function ReadingListCard({ item, chapters }: ReadingListCardProps) {
  const removeItem = useReadingListStore((s) => s.removeItem);
  const { t, locale } = useTranslation();

  const typeLabels: Record<ReadingListItem["type"], string> = {
    surah: t.continueReading.surahLabel,
    juz: t.continueReading.juzLabel,
    page: t.continueReading.pageLabel,
  };

  const chapter = item.type === "surah" ? chapters.find((c) => c.id === item.id) : undefined;

  const surahName =
    locale === "tr"
      ? SURAH_NAMES_TR[item.id] ?? chapter?.translated_name.name
      : chapter?.translated_name.name;

  const label =
    item.type === "surah"
      ? surahName ?? `${t.continueReading.surahLabel} ${item.id}`
      : item.type === "juz"
        ? `${t.continueReading.juzLabel} ${item.id}`
        : `${t.continueReading.pageLabel} ${item.id}`;

  const arabicName = item.type === "surah" ? chapter?.name_arabic : undefined;

  const timeText = item.lastReadAt
    ? formatRelativeTime(item.lastReadAt, t.continueReading)
    : formatRelativeTime(item.addedAt, t.continueReading);

  const to =
    item.type === "surah"
      ? "/surah/$surahId"
      : item.type === "juz"
        ? "/juz/$juzId"
        : "/page/$pageNumber";

  const params =
    item.type === "surah"
      ? { surahId: String(item.id) }
      : item.type === "juz"
        ? { juzId: String(item.id) }
        : { pageNumber: String(item.id) };

  return (
    <div className="relative w-[156px] shrink-0 snap-start sm:w-[176px]">
      <Link
        to={to as "/surah/$surahId"}
        params={params}
        className="block overflow-hidden rounded-2xl bg-[var(--theme-bg-primary)] shadow-[var(--shadow-card)] transition-all active:scale-[0.96] active:shadow-none"
      >
        {/* Gradient accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-primary-600 to-primary-400" />

        <div className="px-3.5 pb-3.5 pt-3">
          {/* Top row: type badge + number */}
          <div className="flex items-center justify-between">
            <span className="inline-block rounded-md bg-primary-600/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary-600">
              {typeLabels[item.type]}
            </span>
            <span className="text-[20px] font-bold tabular-nums leading-none text-[var(--theme-text-quaternary)]/30">
              {item.id}
            </span>
          </div>

          {/* Arabic name for surahs */}
          {arabicName && (
            <p className="arabic-text mt-2.5 text-[1.2rem] leading-tight text-[var(--theme-text)]" dir="rtl">
              {arabicName}
            </p>
          )}

          {/* Translated name */}
          <p className={`${arabicName ? "mt-1" : "mt-2.5"} text-[13px] font-medium leading-tight text-[var(--theme-text)]`}>
            {label}
          </p>

          {/* Relative time */}
          <p className="mt-2 text-[11px] text-[var(--theme-text-tertiary)]">
            {timeText}
          </p>
        </div>
      </Link>

      {/* Remove button — 28px for better touch target */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          removeItem(item.type, item.id);
        }}
        className="absolute top-2.5 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--theme-bg)]/80 text-[var(--theme-text-tertiary)] backdrop-blur-sm transition-colors active:bg-[var(--theme-hover-bg)] active:text-[var(--theme-text)]"
        aria-label={t.continueReading.remove}
      >
        <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M2 2l8 8M10 2l-8 8" />
        </svg>
      </button>
    </div>
  );
}
