import type { Verse } from "@mahfuz/shared/types";
import { Bismillah } from "./Bismillah";
import { usePreferencesStore, getActiveColors } from "~/stores/usePreferencesStore";

/** Surahs that do NOT get a Bismillah prefix */
const NO_BISMILLAH_SURAHS = new Set([1, 9]);

interface MushafViewProps {
  verses: Verse[];
  showBismillah?: boolean;
}

export function MushafView({ verses, showBismillah = true }: MushafViewProps) {
  const colorizeWords = usePreferencesStore((s) => s.colorizeWords);
  const colorPaletteId = usePreferencesStore((s) => s.colorPaletteId);
  const colors = getActiveColors({ colorPaletteId });

  return (
    <div className="mushaf-page">
      {/* Outer cetvel (gold ruling line) */}
      <div className="mushaf-cetvel-outer">
        {/* Lapis lazuli illumination band */}
        <div className="mushaf-tezhip-band">
          {/* Hatayi floral pattern overlay */}
          <div className="mushaf-hatayi-pattern" />

          {/* Corner ornaments — köşelik */}
          <TezhipCorner position="top-left" />
          <TezhipCorner position="top-right" />
          <TezhipCorner position="bottom-left" />
          <TezhipCorner position="bottom-right" />

          {/* Edge medallions — ortabağ */}
          <EdgeMedallion position="top" />
          <EdgeMedallion position="bottom" />
          <EdgeMedallion position="left" />
          <EdgeMedallion position="right" />

          {/* Inner cetvel (double gold line) */}
          <div className="mushaf-cetvel-inner">
            {/* Writing surface */}
            <div className="mushaf-content">
              <p
                className="arabic-text text-center text-[1.65rem] leading-[2.8] text-[var(--mushaf-ink)]"
                dir="rtl"
              >
                {verses.map((verse) => {
                  const surahId = Number(verse.verse_key.split(":")[0]);
                  const needsBismillah =
                    showBismillah &&
                    verse.verse_number === 1 &&
                    !NO_BISMILLAH_SURAHS.has(surahId);
                  const words =
                    verse.words?.filter((w) => w.char_type_name === "word") ?? [];
                  return (
                    <span key={verse.id}>
                      {needsBismillah && (
                        <>
                          <span className="block w-full py-2 text-[1.5rem]">
                            بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
                          </span>
                        </>
                      )}
                      {colorizeWords && words.length > 0
                        ? words.map((w, i) => (
                            <span
                              key={w.id}
                              style={{ color: colors[i % colors.length] }}
                            >
                              {w.text_uthmani}{" "}
                            </span>
                          ))
                        : (
                            <>
                              {verse.text_uthmani}{" "}
                            </>
                          )}
                      <span className="mushaf-durak">
                        {toArabicNumeral(verse.verse_number)}
                      </span>
                      {"  "}
                    </span>
                  );
                })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function toArabicNumeral(n: number): string {
  return String(n).replace(/\d/g, (d) => String.fromCharCode(0x0660 + Number(d)));
}

/**
 * Ottoman köşelik — corner ornament with rumi scrollwork and hatayi flower
 */
function TezhipCorner({
  position,
}: {
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}) {
  const rotate =
    position === "top-left"
      ? 0
      : position === "top-right"
        ? 90
        : position === "bottom-right"
          ? 180
          : 270;

  const posClass =
    position === "top-left"
      ? "top-0 left-0"
      : position === "top-right"
        ? "top-0 right-0"
        : position === "bottom-left"
          ? "bottom-0 left-0"
          : "bottom-0 right-0";

  return (
    <svg
      className={`mushaf-koselik absolute ${posClass}`}
      viewBox="0 0 64 64"
      fill="none"
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      {/* Background gold fill for corner area */}
      <path
        d="M0 0 L28 0 C20 4, 12 12, 8 20 L8 28 C4 20, 0 10, 0 0z"
        fill="var(--mushaf-gold)"
        opacity="0.15"
      />
      {/* Primary rumi scroll — elegant spiral vine */}
      <path
        d="M4 4 C4 4, 6 20, 10 28 C14 36, 22 42, 32 46"
        stroke="var(--mushaf-gold)"
        strokeWidth="1.2"
        fill="none"
        opacity="0.8"
      />
      <path
        d="M4 4 C4 4, 20 6, 28 10 C36 14, 42 22, 46 32"
        stroke="var(--mushaf-gold)"
        strokeWidth="1.2"
        fill="none"
        opacity="0.8"
      />
      {/* Secondary inner scroll */}
      <path
        d="M6 8 C8 16, 10 22, 16 30 C20 36, 26 40, 34 44"
        stroke="var(--mushaf-gold-light)"
        strokeWidth="0.6"
        fill="none"
        opacity="0.5"
      />
      <path
        d="M8 6 C16 8, 22 10, 30 16 C36 20, 40 26, 44 34"
        stroke="var(--mushaf-gold-light)"
        strokeWidth="0.6"
        fill="none"
        opacity="0.5"
      />
      {/* Hatayi bud — central flower */}
      <circle cx="10" cy="10" r="4" fill="var(--mushaf-gold)" opacity="0.2" />
      <circle cx="10" cy="10" r="2.5" fill="var(--mushaf-gold)" opacity="0.4" />
      <circle cx="10" cy="10" r="1" fill="var(--mushaf-gold-dark)" opacity="0.7" />
      {/* Petal flourishes */}
      <ellipse
        cx="18" cy="10" rx="4" ry="1.5"
        fill="var(--mushaf-gold)"
        opacity="0.25"
        transform="rotate(-8, 18, 10)"
      />
      <ellipse
        cx="10" cy="18" rx="1.5" ry="4"
        fill="var(--mushaf-gold)"
        opacity="0.25"
        transform="rotate(-8, 10, 18)"
      />
      {/* Small accent dots along curves */}
      <circle cx="18" cy="24" r="1" fill="var(--mushaf-gold)" opacity="0.35" />
      <circle cx="24" cy="18" r="1" fill="var(--mushaf-gold)" opacity="0.35" />
      <circle cx="26" cy="34" r="0.8" fill="var(--mushaf-gold)" opacity="0.25" />
      <circle cx="34" cy="26" r="0.8" fill="var(--mushaf-gold)" opacity="0.25" />
    </svg>
  );
}

/**
 * Edge medallion — ortabağ (mid-border ornament)
 */
function EdgeMedallion({
  position,
}: {
  position: "top" | "bottom" | "left" | "right";
}) {
  const isHorizontal = position === "top" || position === "bottom";

  const posClass =
    position === "top"
      ? "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2"
      : position === "bottom"
        ? "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2"
        : position === "left"
          ? "left-0 top-1/2 -translate-x-1/2 -translate-y-1/2"
          : "right-0 top-1/2 translate-x-1/2 -translate-y-1/2";

  return (
    <svg
      className={`absolute z-[2] ${posClass}`}
      width={isHorizontal ? "32" : "20"}
      height={isHorizontal ? "20" : "32"}
      viewBox={isHorizontal ? "0 0 32 20" : "0 0 20 32"}
      fill="none"
    >
      {isHorizontal ? (
        /* Horizontal pointed oval — like a shamsa */
        <>
          <ellipse cx="16" cy="10" rx="14" ry="8" fill="var(--mushaf-lapis)" stroke="var(--mushaf-gold)" strokeWidth="0.8" />
          <ellipse cx="16" cy="10" rx="10" ry="5.5" fill="none" stroke="var(--mushaf-gold)" strokeWidth="0.5" opacity="0.6" />
          <ellipse cx="16" cy="10" rx="3" ry="3" fill="var(--mushaf-gold)" opacity="0.3" />
          <circle cx="16" cy="10" r="1.2" fill="var(--mushaf-gold)" opacity="0.6" />
        </>
      ) : (
        /* Vertical pointed oval */
        <>
          <ellipse cx="10" cy="16" rx="8" ry="14" fill="var(--mushaf-lapis)" stroke="var(--mushaf-gold)" strokeWidth="0.8" />
          <ellipse cx="10" cy="16" rx="5.5" ry="10" fill="none" stroke="var(--mushaf-gold)" strokeWidth="0.5" opacity="0.6" />
          <ellipse cx="10" cy="16" rx="3" ry="3" fill="var(--mushaf-gold)" opacity="0.3" />
          <circle cx="10" cy="16" r="1.2" fill="var(--mushaf-gold)" opacity="0.6" />
        </>
      )}
    </svg>
  );
}
