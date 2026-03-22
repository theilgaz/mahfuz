import { useState, useMemo } from "react";
import { useAudioStore } from "~/stores/useAudioStore";
import {
  CURATED_RECITERS,
  FEATURED_RECITERS,
} from "@mahfuz/shared/constants";
import type { CuratedReciter } from "@mahfuz/shared/constants";
import { useTranslation } from "~/hooks/useTranslation";
import {
  Dialog,
  DialogSheet,
  DialogTitle,
  DialogClose,
} from "~/components/ui/Dialog";

interface ReciterModalProps {
  open: boolean;
  onClose: () => void;
  onSelect?: (reciterId: number) => void;
}

const STYLE_LABELS: Record<string, string> = {
  Murattal: "Murattal",
  Mujawwad: "Mujawwad",
  Muallim: "Muallim",
  "Çocuk Tekrarı": "Çocuk Tekrarı",
};

export function ReciterModal({ open, onClose, onSelect }: ReciterModalProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const reciterId = useAudioStore((s) => s.reciterId);
  const setReciter = useAudioStore((s) => s.setReciter);

  const filtered = useMemo(() => {
    if (!search.trim()) return null; // null = show featured + all sections
    const q = search.toLowerCase();
    return CURATED_RECITERS.filter((r) =>
      r.name.toLowerCase().includes(q) ||
      r.country.toLowerCase().includes(q) ||
      r.style.toLowerCase().includes(q),
    );
  }, [search]);

  const handleSelect = (id: number) => {
    if (onSelect) {
      onSelect(id);
    } else {
      setReciter(id);
    }
    onClose();
  };

  const nonFeatured = CURATED_RECITERS.filter((r) => !r.featured);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogSheet>
        <div className="relative z-10 w-full max-w-lg animate-slide-up rounded-t-2xl bg-[var(--theme-bg-primary)] p-5 shadow-modal sm:rounded-2xl">
          <div className="mb-4 flex items-center justify-between">
            <DialogTitle className="text-[17px] font-semibold text-[var(--theme-text)]">
              {t.audio.reciterSelection}
            </DialogTitle>
            <DialogClose
              className="rounded-full p-1 text-[var(--theme-text-tertiary)] transition-colors hover:bg-[var(--theme-hover-bg)] hover:text-[var(--theme-text)]"
              aria-label={t.common.close}
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </DialogClose>
          </div>

          <input
            type="text"
            placeholder={t.audio.searchReciter}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mb-3 w-full rounded-xl border border-[var(--theme-border)] bg-[var(--theme-input-bg)] px-4 py-2.5 text-[14px] text-[var(--theme-text)] outline-none placeholder:text-[var(--theme-text-quaternary)] focus:border-primary-500/40 focus:ring-2 focus:ring-primary-500/20"
          />

          <div className="max-h-[50vh] overflow-y-auto">
            {filtered ? (
              // Search results
              filtered.length > 0 ? (
                <div className="space-y-0.5">
                  {filtered.map((r) => (
                    <ReciterRow
                      key={`${r.id}-${r.style}`}
                      reciter={r}
                      isActive={r.id === reciterId}
                      onSelect={handleSelect}
                    />
                  ))}
                </div>
              ) : (
                <p className="py-8 text-center text-[13px] text-[var(--theme-text-tertiary)]">
                  {t.common.noResults}
                </p>
              )
            ) : (
              // Default view: Featured + All
              <>
                <div className="mb-3">
                  <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--theme-text-tertiary)]">
                    {t.audio.featured}
                  </p>
                  <div className="space-y-0.5">
                    {FEATURED_RECITERS.map((r) => (
                      <ReciterRow
                        key={`${r.id}-${r.style}`}
                        reciter={r}
                        isActive={r.id === reciterId}
                        isFeatured
                        onSelect={handleSelect}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--theme-text-tertiary)]">
                    {t.audio.allReciters}
                  </p>
                  <div className="space-y-0.5">
                    {nonFeatured.map((r) => (
                      <ReciterRow
                        key={`${r.id}-${r.style}`}
                        reciter={r}
                        isActive={r.id === reciterId}
                        onSelect={handleSelect}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </DialogSheet>
    </Dialog>
  );
}

function ReciterRow({
  reciter,
  isActive,
  isFeatured,
  onSelect,
}: {
  reciter: CuratedReciter;
  isActive: boolean;
  isFeatured?: boolean;
  onSelect: (id: number) => void;
}) {
  return (
    <button
      onClick={() => onSelect(reciter.id)}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
        isActive
          ? "bg-primary-600/10 text-primary-700"
          : isFeatured
            ? "border border-primary-500/20 bg-primary-50/30 text-[var(--theme-text)] hover:bg-primary-50/60"
            : "text-[var(--theme-text)] hover:bg-[var(--theme-hover-bg)]"
      }`}
    >
      <span className="flex-1">
        <span className="block text-[14px] font-medium">
          {reciter.name}
        </span>
        <span className="block text-[12px] text-[var(--theme-text-tertiary)]">
          {reciter.country} · {STYLE_LABELS[reciter.style] ?? reciter.style}
        </span>
      </span>
      {isActive ? (
        <svg
          className="h-4 w-4 flex-shrink-0 text-primary-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      ) : isFeatured ? (
        <svg
          className="h-4 w-4 flex-shrink-0 text-amber-400"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ) : null}
    </button>
  );
}
