/**
 * Sakura temasi — dokulen kiraz cicegi yapraklari (tum sayfalarda icerik uzerinden duser).
 * data-theme="sakura" iken __root.tsx icinde global mount edilir (arkaplan gorseli mu-sky ile birlikte).
 * Gorunurluk CSS token'lariyla ayarlanir: --mu-petal-fall, --mu-decor-op.
 */

import type { CSSProperties } from "react";

interface Petal {
  left: number;
  dx: number;
  rot: number;
  op: number;
  scale: number;
  dur: number;
  delay: number;
}

// Deterministik dagilim — SSR/hydration uyumu icin sabit degerler.
const PETALS: Petal[] = [
  { left: 4,  dx: 70,  rot: 380, op: 0.50, scale: 0.70, dur: 16, delay: -1 },
  { left: 12, dx: -30, rot: 300, op: 0.40, scale: 1.00, dur: 13, delay: -6 },
  { left: 22, dx: 110, rot: 520, op: 0.35, scale: 0.80, dur: 18, delay: -3 },
  { left: 33, dx: 40,  rot: 420, op: 0.55, scale: 0.90, dur: 14, delay: -9 },
  { left: 44, dx: -50, rot: 360, op: 0.45, scale: 0.65, dur: 17, delay: -2 },
  { left: 53, dx: 80,  rot: 480, op: 0.40, scale: 1.10, dur: 12, delay: -7 },
  { left: 63, dx: -20, rot: 320, op: 0.50, scale: 0.75, dur: 19, delay: -4 },
  { left: 71, dx: 120, rot: 560, op: 0.35, scale: 0.95, dur: 15, delay: -11 },
  { left: 80, dx: 30,  rot: 400, op: 0.55, scale: 0.70, dur: 13, delay: -5 },
  { left: 88, dx: -40, rot: 340, op: 0.45, scale: 1.05, dur: 18, delay: -8 },
  { left: 94, dx: 60,  rot: 500, op: 0.40, scale: 0.80, dur: 16, delay: -10 },
  { left: 17, dx: 90,  rot: 440, op: 0.50, scale: 0.85, dur: 14, delay: -13 },
];

export function SakuraDecor() {
  return (
    <div className="mu-petals" aria-hidden="true">
      {PETALS.map((p, i) => (
          <span
            key={i}
            style={{
              left: `${p.left}%`,
              transform: `scale(${p.scale})`,
              animationDuration: `${p.dur}s`,
              animationDelay: `${p.delay}s`,
              "--dx": `${p.dx}px`,
              "--rot": `${p.rot}deg`,
              "--op": p.op,
            } as CSSProperties}
          >
            <svg width="15" height="15" viewBox="-7.5 -7.5 15 15" aria-hidden="true">
              <path fill="var(--mu-petal-fall)" d="M0,-6.5 C2.6,-4.6 2.6,-1.4 0,0 C-2.6,-1.4 -2.6,-4.6 0,-6.5Z" />
            </svg>
          </span>
        ))}
    </div>
  );
}
