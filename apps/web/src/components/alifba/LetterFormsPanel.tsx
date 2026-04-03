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
    { label: t.alifba.isolated, form: forms.isolated },
    { label: t.alifba.initial, form: forms.initial, limited: isNonConnector },
    { label: t.alifba.medial, form: forms.medial, limited: isNonConnector },
    { label: t.alifba.final, form: forms.final },
  ];

  return (
    <div className="grid grid-cols-4 gap-2">
      {items.map(({ label, form, limited }) => (
        <div
          key={label}
          className="flex flex-col items-center gap-1.5 py-3 px-1 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]"
        >
          <span
            className="font-arabic text-3xl leading-none"
            dir="rtl"
            style={{ fontFamily: "var(--font-arabic)" }}
          >
            {form}
          </span>
          <span className="text-[10px] text-[var(--color-text-secondary)] text-center leading-tight">
            {label}
          </span>
          {limited && (
            <span className="text-[9px] text-[var(--color-accent)]/70">≈</span>
          )}
        </div>
      ))}
    </div>
  );
}
