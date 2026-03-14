import type { Chapter } from "@mahfuz/shared/types";
import { useTranslation } from "~/hooks/useTranslation";
import { getSurahName } from "~/lib/surah-name";

interface SurahHeaderProps {
  chapter: Chapter;
  onPlay?: () => void;
  isPlaying?: boolean;
}

export function SurahHeader({ chapter, onPlay, isPlaying }: SurahHeaderProps) {
  const { t, locale } = useTranslation();
  const isMakkah = chapter.revelation_place === "makkah";

  return (
    <div
      className="relative mb-10 overflow-hidden rounded-3xl bg-[var(--theme-pill-bg)] px-6 py-10 text-center"
    >
      {/* Background illustration with bottom fade */}
      <div
        className="pointer-events-none absolute inset-0 flex items-start justify-center"
        style={{
          maskImage: 'linear-gradient(to bottom, black 35%, transparent 85%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 35%, transparent 85%)',
        }}
      >
        <img
          src={isMakkah ? "/images/kaaba.png" : "/images/nabawi.png"}
          alt=""
          aria-hidden="true"
          draggable={false}
          width={isMakkah ? 420 : 400}
          height={isMakkah ? 420 : 400}
          className={`object-contain opacity-[0.28] ${
            isMakkah
              ? "h-[420px] w-[420px]"
              : "h-[400px] w-[400px]"
          }`}
        />
      </div>

      {/* Radial glow behind text content */}
      <div
        className="pointer-events-none absolute inset-0 z-[5]"
        style={{
          background: `radial-gradient(ellipse 60% 50% at 50% 55%, var(--theme-surah-header-glow) 0%, transparent 100%)`,
        }}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative z-10">
        <h1
          className="arabic-text mb-3 text-[3.5rem] leading-tight text-[var(--theme-text)] sm:text-[4rem]"
          dir="rtl"
        >
          {chapter.name_arabic}
        </h1>
        <p className="text-[17px] font-semibold tracking-[-0.01em] text-[var(--theme-text)]">
          {getSurahName(chapter.id, chapter.translated_name.name, locale)}
        </p>
        <p className="mt-1 text-[13px] text-[var(--theme-text-tertiary)]">{chapter.name_simple}</p>
        <div className="mx-auto mt-4 flex items-center justify-center gap-1.5 text-[12px] text-[var(--theme-text-tertiary)]">
          <span className="flex items-center gap-1">
            <span
              className={`inline-block h-[6px] w-[6px] rounded-full ${
                isMakkah ? "bg-amber-500" : "bg-emerald-600"
              }`}
            />
            {isMakkah ? t.quranReader.makkah : t.quranReader.madinah}
          </span>
          <span>·</span>
          <span>{chapter.verses_count} {t.quranReader.versesUnit}</span>
          <span>·</span>
          <span>
            {t.common.page} {chapter.pages[0]}–{chapter.pages[1]}
          </span>
        </div>

        {/* Play surah button */}
        {onPlay && (
          <button
            onClick={onPlay}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary-600 px-5 py-2 text-[13px] font-medium text-white shadow-sm transition-all hover:bg-primary-700 active:scale-[0.97]"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              {isPlaying ? (
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              ) : (
                <path d="M8 5.14v14l11-7-11-7z" />
              )}
            </svg>
            {isPlaying ? t.quranReader.pause : t.audio.listenSurah}
          </button>
        )}
      </div>
    </div>
  );
}
