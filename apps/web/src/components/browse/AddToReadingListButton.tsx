import { useState, useEffect, useRef } from "react";
import { useReadingListStore } from "~/stores/useReadingListStore";
import type { ReadingListItem } from "~/stores/useReadingListStore";
import { useTranslation } from "~/hooks/useTranslation";

interface AddToReadingListButtonProps {
  type: ReadingListItem["type"];
  id: number;
  iconOnly?: boolean;
}

export function AddToReadingListButton({ type, id, iconOnly }: AddToReadingListButtonProps) {
  const addItem = useReadingListStore((s) => s.addItem);
  const removeItem = useReadingListStore((s) => s.removeItem);
  const active = useReadingListStore((s) => s.items.some((i) => i.type === type && i.id === id));
  const { t } = useTranslation();
  const [animating, setAnimating] = useState(false);
  const prevActive = useRef(active);

  useEffect(() => {
    if (!prevActive.current && active) {
      setAnimating(true);
      const timer = setTimeout(() => setAnimating(false), 500);
      return () => clearTimeout(timer);
    }
    prevActive.current = active;
  }, [active]);

  const toggle = () => {
    if (active) {
      removeItem(type, id);
    } else {
      addItem(type, id);
    }
  };

  if (iconOnly) {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-label={active ? t.continueReading.following : t.continueReading.follow}
        className={`inline-flex h-7 w-7 items-center justify-center rounded-full transition-all active:scale-[0.97] ${
          active
            ? "text-primary-600"
            : "text-[var(--theme-text-tertiary)] hover:text-[var(--theme-text-secondary)]"
        }`}
      >
        <svg className={`h-4 w-4 ${animating ? "animate-bookmark-pop" : ""}`} viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-medium transition-all active:scale-[0.97] ${
        active
          ? "bg-primary-600/10 text-primary-600"
          : "bg-[var(--theme-hover-bg)] text-[var(--theme-text-secondary)] hover:bg-[var(--theme-pill-bg)]"
      }`}
    >
      <svg className={`h-3 w-3 ${animating ? "animate-bookmark-pop" : ""}`} viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
      {active ? t.continueReading.following : t.continueReading.follow}
    </button>
  );
}
