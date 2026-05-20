/**
 * Aktivite heatmap — son ~12 hafta, GitHub contribution graph stili.
 * 7 satır (Pzt..Paz) × ~12-13 sütun (haftalar). Hücre rengi okunan
 * sayfa sayısının günlük hedefe oranıyla beş kademede koyulaşır.
 */

import { useTranslation } from "~/hooks/useTranslation";

interface HeatmapProps {
  days: Array<{ date: string; pagesRead: number }>;
  dailyTarget: number;
  className?: string;
}

const CELL = 11;
const GAP = 3;

function intensity(pages: number, target: number): 0 | 1 | 2 | 3 | 4 {
  if (pages <= 0) return 0;
  const safeTarget = Math.max(target, 1);
  const ratio = pages / safeTarget;
  if (ratio < 0.5) return 1;
  if (ratio < 1) return 2;
  if (ratio < 2) return 3;
  return 4;
}

function mondayBasedDow(date: Date): number {
  const d = date.getDay();
  return d === 0 ? 6 : d - 1;
}

function cellColor(level: 0 | 1 | 2 | 3 | 4): string {
  if (level === 0) return "color-mix(in oklab, var(--mu-ink), transparent 92%)";
  const transparency = 100 - level * 25;
  return `color-mix(in oklab, var(--mu-accent), transparent ${transparency}%)`;
}

export function WeeklyChart({ days, dailyTarget, className }: HeatmapProps) {
  const { t } = useTranslation();
  const DAY_LABELS = [
    t.habit.dayMon,
    t.habit.dayTue,
    t.habit.dayWed,
    t.habit.dayThu,
    t.habit.dayFri,
    t.habit.daySat,
    t.habit.daySun,
  ];

  type Cell = { pagesRead: number; date: string } | null;
  const grid: Cell[][] = Array.from({ length: 7 }, () => []);

  if (days.length > 0) {
    const firstDow = mondayBasedDow(new Date(days[0].date));
    for (let r = 0; r < firstDow; r++) grid[r].push(null);
    for (const d of days) {
      const dow = mondayBasedDow(new Date(d.date));
      grid[dow].push(d);
    }
    const cols = Math.max(...grid.map((r) => r.length));
    for (let r = 0; r < 7; r++) {
      while (grid[r].length < cols) grid[r].push(null);
    }
  }

  const cols = grid[0]?.length ?? 0;

  return (
    <div className={`px-4 py-3 rounded bg-[var(--color-surface)] border border-[var(--color-border)] flex flex-col${className ? ` ${className}` : ""}`} dir="ltr">
      <p className="text-xs text-[var(--color-text-secondary)] mb-3" dir="auto">
        {t.habit.lastTwelveWeeks}
      </p>

      <div className="flex gap-2 overflow-x-auto">
        <div className="flex flex-col" style={{ gap: GAP, paddingTop: 1, fontSize: 9, lineHeight: 1 }}>
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <span
              key={i}
              className="text-[var(--color-text-secondary)]"
              style={{
                height: CELL,
                display: "inline-flex",
                alignItems: "center",
                opacity: i % 2 === 0 ? 1 : 0,
                minWidth: 16,
              }}
            >
              {i % 2 === 0 ? DAY_LABELS[i] : ""}
            </span>
          ))}
        </div>

        <div className="flex" style={{ gap: GAP }}>
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="flex flex-col" style={{ gap: GAP }}>
              {Array.from({ length: 7 }).map((_, r) => {
                const cell = grid[r][c];
                if (!cell) {
                  return <span key={r} style={{ width: CELL, height: CELL }} />;
                }
                const lvl = intensity(cell.pagesRead, dailyTarget);
                return (
                  <span
                    key={r}
                    title={`${cell.date} · ${cell.pagesRead} ${t.habit.nPages.replace("{n} ", "")}`}
                    style={{
                      width: CELL,
                      height: CELL,
                      borderRadius: 2,
                      background: cellColor(lvl),
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-end gap-1.5 mt-auto pt-3 text-[10px] text-[var(--color-text-secondary)]">
        <span>{t.habit.less}</span>
        {([0, 1, 2, 3, 4] as const).map((lvl) => (
          <span
            key={lvl}
            style={{
              width: CELL,
              height: CELL,
              borderRadius: 2,
              background: cellColor(lvl),
              display: "inline-block",
            }}
          />
        ))}
        <span>{t.habit.more}</span>
      </div>
    </div>
  );
}
