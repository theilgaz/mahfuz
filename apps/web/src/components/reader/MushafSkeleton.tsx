/**
 * Skeleton loader for MushafPage — pulsing 15-line mushaf layout.
 */

export function MushafSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 animate-pulse">
      {/* Page header */}
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 w-20 rounded bg-[var(--color-surface)]" />
        <div className="h-4 w-16 rounded bg-[var(--color-surface)]" />
      </div>

      {/* Mushaf lines — 15 lines with centered Arabic text widths */}
      <div className="flex flex-col items-center gap-3" dir="rtl">
        {Array.from({ length: 15 }).map((_, i) => (
          <div
            key={i}
            className="h-7 rounded bg-[var(--color-surface)]"
            style={{ width: `${92 - (i % 4) * 3}%` }}
          />
        ))}
      </div>

      {/* Page number */}
      <div className="flex justify-center mt-6">
        <div className="h-4 w-8 rounded bg-[var(--color-surface)]" />
      </div>
    </div>
  );
}
