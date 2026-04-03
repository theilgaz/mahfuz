/**
 * Bir harfin 4 yazılış formunu gösteren panel (başta/ortada/sonda/bağımsız).
 * NON_CONNECTOR harflerde başta/ortada aynıdır; bu durumu panel gösterir.
 */

import { getLetterForms, NON_CONNECTORS } from "~/lib/kids-constants";
import { useTranslation } from "~/hooks/useTranslation";

interface LetterFormsPanelProps {
  arabic: string;
  letterId: string;
}

export function LetterFormsPanel({ arabic, letterId: _letterId }: LetterFormsPanelProps) {
  const { t } = useTranslation();
  const forms = getLetterForms(arabic);
  const isNonConnector = NON_CONNECTORS.has(arabic);

  const items = [
    { label: t.alifba.isolated, form: forms.isolated, limited: false },
    { label: t.alifba.initial, form: forms.initial, limited: isNonConnector },
    { label: t.alifba.medial, form: forms.medial, limited: isNonConnector },
    { label: t.alifba.final, form: forms.final, limited: false },
  ];

  return (
    <div className="grid grid-cols-4 gap-3">
      {items.map(({ label, form, limited }) => (
        <div key={label} className="flex flex-col items-center gap-2">
          {/* Label above card */}
          <span className="text-[10px] font-medium text-[var(--color-text-secondary)] uppercase tracking-wide">
            {label}
          </span>
          {/* Card — just the glyph */}
          <div
            className={`relative w-full aspect-square rounded-2xl flex items-center justify-center border transition-colors ${
              limited
                ? "bg-[var(--color-surface)] border-[var(--color-border)] opacity-60"
                : "bg-[var(--color-surface)] border-[var(--color-border)]"
            }`}
          >
            <span
              className="text-4xl leading-none select-none"
              dir="rtl"
              style={{ fontFamily: "var(--font-arabic)" }}
            >
              {form}
            </span>
            {limited && (
              <span className="absolute bottom-1.5 right-2 text-[9px] text-[var(--color-accent)]/60 font-medium">
                ≈
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
