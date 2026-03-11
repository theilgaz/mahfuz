import { memo } from "react";
import { Link } from "@tanstack/react-router";
import type { Chapter } from "@mahfuz/shared/types";
import { useTranslation } from "~/hooks/useTranslation";
import { getSurahName } from "~/lib/surah-name";

interface ChapterCardProps {
  chapter: Chapter;
}

export const ChapterCard = memo(function ChapterCard({ chapter }: ChapterCardProps) {
  const { t, locale } = useTranslation();
  const isMakkah = chapter.revelation_place === "makkah";
  const surahName = getSurahName(chapter.id, chapter.translated_name.name, locale);

  return (
    <Link
      to="/surah/$surahId"
      params={{ surahId: String(chapter.id) }}
      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-[var(--theme-bg-primary)] p-4 transition-all hover:shadow-[var(--shadow-elevated)] active:scale-[0.98]"
    >
      {/* Background illustration, pinned to bottom-right as subtle watermark */}
      <img
        src={isMakkah ? "/images/kaaba.png" : "/images/nabawi.png"}
        alt=""
        aria-hidden="true"
        draggable={false}
        className="pointer-events-none absolute -bottom-3 -right-3 h-[90px] w-[90px] object-contain opacity-[0.06] transition-opacity duration-300 group-hover:opacity-[0.18]"
      />

      {/* Top: number + arabic */}
      <div className="relative mb-4 flex items-start justify-between gap-2">
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--theme-pill-bg)] text-[12px] font-semibold tabular-nums text-[var(--theme-text)]">
          {chapter.id}
        </span>
        <span className="relative flex-shrink-0">
          <span
            className="pointer-events-none absolute inset-0 scale-[2.5] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{ background: `radial-gradient(circle, var(--theme-surah-header-glow) 0%, transparent 70%)` }}
            aria-hidden="true"
          />
          <span
            className="arabic-text relative text-[22px] leading-none text-[var(--theme-text-secondary)]"
            dir="rtl"
          >
            {chapter.name_arabic}
          </span>
        </span>
      </div>

      {/* Bottom: names + meta */}
      <div className="relative">
        <h3 className="truncate text-[14px] font-semibold leading-snug text-[var(--theme-text)]">
          {surahName}
        </h3>
        <p className="mt-0.5 text-[11px] leading-normal text-[var(--theme-text-tertiary)]">
          {chapter.name_simple}
          <span className="mx-1 opacity-40">·</span>
          {chapter.verses_count} {t.browse.versesCount}
        </p>
      </div>
    </Link>
  );
});
