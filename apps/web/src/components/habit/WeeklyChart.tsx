/**
 * Haftalık okuma grafiği — 7 günlük bar chart.
 * Minimal, animasyonsuz, sadece veri.
 */

const DAY_LABELS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

interface WeeklyChartProps {
  days: Array<{ date: string; pagesRead: number }>;
  dailyTarget: number;
}

export function WeeklyChart({ days, dailyTarget }: WeeklyChartProps) {
  const maxPages = Math.max(dailyTarget, ...days.map((d) => d.pagesRead));

  return (
    <div className="px-4 py-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
      <p className="text-xs text-[var(--color-text-secondary)] mb-3">Son 7 gün</p>

      <div className="flex items-end gap-1.5 h-16">
        {days.map((day, i) => {
          const height = maxPages > 0 ? (day.pagesRead / maxPages) * 100 : 0;
          const isToday = i === days.length - 1;
          const hitTarget = day.pagesRead >= dailyTarget;

          return (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
              {/* Bar */}
              <div className="w-full flex items-end justify-center" style={{ height: "48px" }}>
                <div
                  className={`w-full max-w-5 rounded-t transition-all ${
                    hitTarget
                      ? "bg-[var(--color-accent)]"
                      : day.pagesRead > 0
                        ? "bg-[var(--color-accent)] opacity-40"
                        : "bg-[var(--color-border)]"
                  }`}
                  style={{ height: `${Math.max(height, 4)}%` }}
                />
              </div>

              {/* Gün etiketi */}
              <span
                className={`text-[10px] ${
                  isToday ? "font-medium text-[var(--color-text-primary)]" : "text-[var(--color-text-secondary)]"
                }`}
              >
                {DAY_LABELS[new Date(day.date).getDay() === 0 ? 6 : new Date(day.date).getDay() - 1]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
