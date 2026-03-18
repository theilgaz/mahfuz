import type { Word } from "@mahfuz/shared/types";

interface MemorizeWordCardProps {
  word: Word;
  isActive?: boolean;
  isHidden?: boolean;
  size?: "lg" | "md" | "sm";
  onTap?: () => void;
}

const sizeMap = {
  lg: { arabic: "text-[28px]", sub: "text-[14px]", meaning: "text-[13px]" },
  md: { arabic: "text-[22px]", sub: "text-[12px]", meaning: "text-[11px]" },
  sm: { arabic: "text-[18px]", sub: "text-[11px]", meaning: "text-[10px]" },
} as const;

export function MemorizeWordCard({
  word,
  isActive = false,
  isHidden = false,
  size = "md",
  onTap,
}: MemorizeWordCardProps) {
  const s = sizeMap[size];

  return (
    <button
      type="button"
      onClick={onTap}
      className={`flex flex-col items-center gap-1 rounded-xl px-3 py-2 transition-all ${
        isActive
          ? "scale-105 border-2 border-primary-500 bg-primary-500/10 shadow-md"
          : "border border-[var(--theme-divider)] bg-[var(--theme-bg-primary)]"
      } ${onTap ? "cursor-pointer hover:bg-[var(--theme-hover-bg)]" : "cursor-default"}`}
    >
      {/* Arabic text */}
      <span
        className={`arabic-text font-semibold leading-relaxed text-[var(--theme-text)] ${s.arabic} ${
          isHidden ? "select-none blur-md" : ""
        }`}
        dir="rtl"
      >
        {word.text_imlaei || word.text}
      </span>

      {/* Transliteration */}
      {!isHidden && word.transliteration?.text && (
        <span className={`${s.sub} text-primary-600`}>
          {word.transliteration.text}
        </span>
      )}

      {/* Meaning / Translation */}
      {!isHidden && word.translation?.text && (
        <span className={`${s.meaning} text-[var(--theme-text-tertiary)]`}>
          {word.translation.text}
        </span>
      )}
    </button>
  );
}
