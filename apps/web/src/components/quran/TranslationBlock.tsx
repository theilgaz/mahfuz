import { useState, memo } from "react";
import type { Translation } from "@mahfuz/shared/types";

interface TranslationBlockProps {
  translations: Translation[];
  fontSize: number;
  revealed?: boolean;
  onExpandedChange?: (expandedIndices: Set<number>) => void;
}

export const TranslationBlock = memo(function TranslationBlock({
  translations,
  fontSize,
  revealed,
  onExpandedChange,
}: TranslationBlockProps) {
  const [expandedSet, setExpandedSet] = useState<Set<number>>(
    () => new Set([0]),
  );

  const isMultiple = translations.length > 1;

  function toggle(index: number) {
    if (!isMultiple) return;
    setExpandedSet((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      onExpandedChange?.(next);
      return next;
    });
  }

  return (
    <div
      className={`space-y-2 ${revealed ? "animate-reveal" : ""}`}
    >
      {translations.map((t, i) => {
        const isOpen = isMultiple ? expandedSet.has(i) : true;

        return (
          <div
            key={t.id}
            className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-primary)]"
          >
            {/* Header */}
            <button
              type="button"
              onClick={() => toggle(i)}
              className={`flex w-full items-center gap-2 px-3.5 py-2.5 text-left ${
                isMultiple ? "cursor-pointer" : "cursor-default"
              }`}
              aria-expanded={isOpen}
              tabIndex={isMultiple ? 0 : -1}
            >
              <span
                className={`h-2 w-2 flex-shrink-0 rounded-full ${
                  isOpen
                    ? "bg-[var(--theme-translation-accent)]"
                    : "border border-[var(--theme-text-quaternary)]"
                }`}
                style={
                  isOpen
                    ? {
                        background: "var(--color-primary-500)",
                      }
                    : undefined
                }
              />
              <span className="flex-1 text-[12px] font-semibold text-[var(--theme-text-tertiary)]">
                {t.resource_name}
              </span>
              {isMultiple && (
                <svg
                  className={`h-3.5 w-3.5 flex-shrink-0 text-[var(--theme-text-quaternary)] transition-transform duration-200 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>

            {/* Body, animated grid */}
            <div
              className="accordion-grid"
              data-open={isOpen}
            >
              <div className="overflow-hidden">
                <div className="px-3.5 pb-3">
                  <p
                    className="translation-text leading-[1.8] text-[var(--theme-text-secondary)]"
                    style={{
                      fontSize: `calc(15px * ${fontSize})`,
                    }}
                    dangerouslySetInnerHTML={{ __html: t.text }}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
});
