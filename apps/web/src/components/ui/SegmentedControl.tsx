import { useRef, useEffect, useState } from "react";

interface SegmentOption<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** When true, buttons stretch to fill equal widths */
  stretch?: boolean;
  /** When true, labels are hidden on mobile (icon-only) */
  iconOnlyMobile?: boolean;
  /** When true, no background/padding. Parent provides the container. */
  transparent?: boolean;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  stretch,
  iconOnlyMobile,
  transparent,
}: SegmentedControlProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });
  const activeIndex = options.findIndex((o) => o.value === value);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const buttons =
      container.querySelectorAll<HTMLButtonElement>("[data-segment]");
    const btn = buttons[activeIndex];
    if (btn) {
      setIndicator({ left: btn.offsetLeft, width: btn.offsetWidth });
    }
  }, [activeIndex]);

  return (
    <div
      ref={containerRef}
      role="tablist"
      className={`relative flex ${transparent ? "" : "rounded-xl bg-[var(--theme-pill-bg)] p-1"}`}
    >
      <div
        className={`absolute rounded-lg bg-[var(--theme-bg-primary)] shadow-sm transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${transparent ? "top-0 bottom-0" : "top-1 bottom-1"}`}
        style={{ left: indicator.left, width: indicator.width }}
      />
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            data-segment
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={`relative z-[1] flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-[12px] font-medium transition-colors duration-200 ${
              iconOnlyMobile && opt.icon ? "px-2.5 sm:px-3.5" : "px-3.5"
            } ${stretch ? "flex-1" : ""} ${
              active
                ? "text-[var(--theme-text)]"
                : "text-[var(--theme-text-tertiary)] hover:text-[var(--theme-text-secondary)]"
            }`}
          >
            {opt.icon}
            <span className={iconOnlyMobile && opt.icon ? "hidden sm:inline" : ""}>
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
