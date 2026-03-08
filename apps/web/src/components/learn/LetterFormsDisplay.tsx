import type { ArabicLetter } from "@mahfuz/shared/types";
import { useTranslation } from "~/hooks/useTranslation";

interface LetterFormsDisplayProps {
  letter: ArabicLetter;
}

export function LetterFormsDisplay({ letter }: LetterFormsDisplayProps) {
  const { t } = useTranslation();

  const forms = [
    { label: t.learn.forms.isolated, value: letter.forms.isolated },
    { label: t.learn.forms.initial, value: letter.forms.initial },
    { label: t.learn.forms.medial, value: letter.forms.medial },
    { label: t.learn.forms.final, value: letter.forms.final },
  ];

  return (
    <div className="rounded-2xl bg-[var(--theme-bg-primary)] p-4 shadow-[var(--shadow-card)]">
      <div className="mb-3 flex items-center gap-2">
        <span className="arabic-text text-2xl text-[var(--theme-text)]" dir="rtl">
          {letter.forms.isolated}
        </span>
        <span className="text-[13px] font-medium text-[var(--theme-text)]">
          {letter.nameRoman}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {forms.map((form) => (
          <div
            key={form.label}
            className="flex flex-col items-center gap-1 rounded-xl bg-[var(--theme-bg)] p-3"
          >
            <span className="arabic-text text-3xl leading-none text-[var(--theme-text)]" dir="rtl">
              {form.value}
            </span>
            <span className="text-[10px] text-[var(--theme-text-tertiary)]">
              {form.label}
            </span>
          </div>
        ))}
      </div>

      {letter.forms.isNonConnector && (
        <p className="mt-2 text-center text-[11px] text-amber-600">
          {t.learn.nonConnectorNote}
        </p>
      )}
    </div>
  );
}
