/**
 * Yillik aktivite heatmap (GitHub contribution graph stili).
 * 7 satir (Pzt..Paz) x ~53 sutun (hafta). Hucre rengi okunan sayfanin
 * gunluk hedefe oranina gore bes kademede koyulasir.
 */

import { useMemo } from "react";

interface Day {
  date: string;
  pagesRead: number;
}

interface Props {
  days: Day[];
  dailyTarget: number;
  monthLabels?: string[];
  dowLabels?: string[]; // [Pzt, Sal, Car, Per, Cum, Cmt, Paz]
  lessLabel?: string;
  moreLabel?: string;
  totalLabel?: (n: number) => string;
}

const DEFAULT_MONTHS = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
const DEFAULT_DOW = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

function mondayDow(d: Date): number {
  const x = d.getDay();
  return x === 0 ? 6 : x - 1;
}

function intensity(p: number, target: number): 0 | 1 | 2 | 3 | 4 {
  if (p <= 0) return 0;
  const r = p / Math.max(target, 1);
  if (r < 0.5) return 1;
  if (r < 1) return 2;
  if (r < 2) return 3;
  return 4;
}

function cellColor(level: number): string {
  if (level === 0) return "color-mix(in oklab, var(--mu-ink), transparent 92%)";
  return `color-mix(in oklab, var(--mu-accent), transparent ${100 - level * 22}%)`;
}

export function ContributionHeatmap({
  days,
  dailyTarget,
  monthLabels = DEFAULT_MONTHS,
  dowLabels = DEFAULT_DOW,
  lessLabel = "az",
  moreLabel = "çok",
  totalLabel = (n) => `${n} gün okundu`,
}: Props) {
  const { columns, monthByCol, activeDays } = useMemo(() => {
    const cols: Array<Array<Day | null>> = [];
    if (days.length === 0) return { columns: cols, monthByCol: new Map<number, string>(), activeDays: 0 };

    const padded: Array<Day | null> = [];
    const firstDow = mondayDow(new Date(days[0].date));
    for (let i = 0; i < firstDow; i++) padded.push(null);

    let active = 0;
    for (const d of days) {
      padded.push(d);
      if (d.pagesRead > 0) active++;
    }
    while (padded.length % 7 !== 0) padded.push(null);

    for (let c = 0; c < padded.length / 7; c++) {
      cols.push(padded.slice(c * 7, c * 7 + 7));
    }

    const byCol = new Map<number, string>();
    let lastMonth = -1;
    cols.forEach((col, ci) => {
      const first = col.find(Boolean) as Day | undefined;
      if (!first) return;
      const m = new Date(first.date).getMonth();
      if (m !== lastMonth) {
        byCol.set(ci, monthLabels[m]);
        lastMonth = m;
      }
    });

    return { columns: cols, monthByCol: byCol, activeDays: active };
  }, [days, monthLabels]);

  return (
    <div className="mu-hm" dir="ltr">
      <div className="mu-hm-scroll">
        <div className="mu-hm-inner">
          <div className="mu-hm-months">
            {columns.map((_, ci) => (
              <span key={ci} className="mu-hm-month">{monthByCol.get(ci) ?? ""}</span>
            ))}
          </div>
          <div className="mu-hm-body">
            <div className="mu-hm-dow">
              {dowLabels.map((d, i) => (
                <span key={i}>{i % 2 === 0 ? d : ""}</span>
              ))}
            </div>
            <div className="mu-hm-cols">
              {columns.map((col, ci) => (
                <div key={ci} className="mu-hm-col">
                  {col.map((cell, ri) =>
                    cell ? (
                      <span
                        key={ri}
                        className="mu-hm-cell"
                        style={{ background: cellColor(intensity(cell.pagesRead, dailyTarget)) }}
                        title={`${cell.date} · ${cell.pagesRead}`}
                      />
                    ) : (
                      <span key={ri} className="mu-hm-cell mu-hm-cell--empty" />
                    ),
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="mu-hm-foot">
        <span className="mu-hm-total">{totalLabel(activeDays)}</span>
        <span className="mu-hm-legend">
          <span>{lessLabel}</span>
          {[0, 1, 2, 3, 4].map((l) => (
            <span key={l} className="mu-hm-key" style={{ background: cellColor(l) }} />
          ))}
          <span>{moreLabel}</span>
        </span>
      </div>
    </div>
  );
}
