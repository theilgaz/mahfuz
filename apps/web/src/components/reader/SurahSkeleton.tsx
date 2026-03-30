/**
 * Skeleton loader for SurahView — pulsing Arabic + translation lines.
 */

export function SurahSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-4 animate-pulse">
      {/* Besmele skeleton */}
      <div className="pt-6 pb-4 flex justify-center">
        <div className="h-8 w-64 rounded bg-[var(--color-surface)]" />
      </div>

      {/* Ayah blocks */}
      <div className="pb-8 space-y-0">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="py-3 border-b border-[var(--color-border)] last:border-b-0">
            {/* Arabic text — RTL, varying widths */}
            <div className="flex flex-col items-end gap-2 mb-3" dir="rtl">
              <div className="h-7 rounded bg-[var(--color-surface)]" style={{ width: `${85 - (i % 3) * 10}%` }} />
              {i % 2 === 0 && (
                <div className="h-7 rounded bg-[var(--color-surface)]" style={{ width: `${60 - (i % 4) * 8}%` }} />
              )}
            </div>
            {/* Translation — LTR, shorter */}
            <div className="flex flex-col gap-1.5">
              <div className="h-4 rounded bg-[var(--color-surface)]" style={{ width: `${90 - (i % 3) * 12}%` }} />
              <div className="h-4 rounded bg-[var(--color-surface)]" style={{ width: `${65 - (i % 2) * 15}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
