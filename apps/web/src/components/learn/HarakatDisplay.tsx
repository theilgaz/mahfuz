import { getLetterById } from "@mahfuz/shared/data/learn/alphabet";
import { useTranslation } from "~/hooks/useTranslation";

interface HarakatDisplayProps {
  letterId: number;
  harakats: string[];
}

export function HarakatDisplay({ letterId, harakats }: HarakatDisplayProps) {
  const { t } = useTranslation();
  const letter = getLetterById(letterId);
  if (!letter) return null;

  const filtered = letter.harakatCombinations.filter((hc) =>
    harakats.includes(hc.harakat),
  );

  return (
    <div className="rounded-2xl bg-[var(--theme-bg-primary)] p-4 shadow-[var(--shadow-card)]">
      <div className="mb-3 flex items-center gap-2">
        <span className="arabic-text text-2xl text-[var(--theme-text)]" dir="rtl">
          {letter.forms.isolated}
        </span>
        <span className="text-[13px] font-medium text-[var(--theme-text-secondary)]">
          {letter.nameRoman}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {filtered.map((hc) => (
          <div
            key={hc.harakat}
            className="flex flex-col items-center gap-1 rounded-xl bg-[var(--theme-bg)] p-3"
          >
            <span className="arabic-text text-4xl leading-none text-[var(--theme-text)]" dir="rtl">
              {hc.combined}
            </span>
            <span className="text-[12px] font-medium text-primary-600">
              {hc.sound}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
