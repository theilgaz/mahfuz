/**
 * Organic Meem (م) — Mahfuz lettermark logo.
 * Tema-uyumlu gradient: CSS variables (--logo-g1..g4, --logo-hl) ile.
 */

import { useId } from "react";

interface MahfuzLogoProps {
  className?: string;
  size?: number;
}

const MEEM_PATH =
  "M177,156.577c-8.706,1.423-15.241,6.257-17.357,8.65-2.167,2.441-6.147,6.7-7.332,16.905a22.5,22.5,0,0,0-6.146,1.177C141.051,185,133.3,188.382,128.5,196.9c-6.245,10.51-6.639,18.538-4.918,29.366a107.479,107.479,0,0,0,6.079,21.233,170.644,170.644,0,0,0,11.662,23.951c9,15.2,15.162,11.33,15.162,11.33s3.214-1.5,2.608-7.314c-.787-7.318-4.208-15.237-7.753-25.458-3.676-10.615-9.41-28.628-9.161-43.646a15.176,15.176,0,0,1,6.914.213c2.977.638,13.827,6.267,18.231,8.775,4.389,2.485,9.157,5.248,10.66,6s9.584,5.142,17.985,1.4c8.5-3.8,11.39-16.2,10.992-21.94-.426-5.931-9.2-26.056-12.387-31.049-2.946-4.645-7.724-13.344-15.709-13.344a10.621,10.621,0,0,0-1.863.158m-3,33.554c-2.086-1.209-5.535-3.129-5.535-3.129a39.562,39.562,0,0,1,2.981-18.02c.822.526,9.23,8.512,14.269,28.126-2.914-1.713-9.637-5.758-11.715-6.977";

const VIEW_BOX = "118 152 93 138";
const ASPECT = 93 / 138;

export function MahfuzLogo({ className, size }: MahfuzLogoProps) {
  const uid = useId();
  const gradId = `mg${uid}`;
  const hlId = `mh${uid}`;

  const h = size ?? 40;
  const sizeProps = { width: Math.round(h * ASPECT), height: h };

  return (
    <svg
      viewBox={VIEW_BOX}
      aria-label="Mahfuz"
      role="img"
      className={className}
      {...sizeProps}
    >
      <defs>
        <linearGradient id={gradId} x1="0.15" y1="0" x2="0.85" y2="1">
          <stop offset="0%" stopColor="var(--logo-g1)" />
          <stop offset="35%" stopColor="var(--logo-g2)" />
          <stop offset="70%" stopColor="var(--logo-g3)" />
          <stop offset="100%" stopColor="var(--logo-g4)" />
        </linearGradient>
        <linearGradient id={hlId} x1="0.3" y1="0" x2="0.5" y2="0.6">
          <stop offset="0%" stopColor="var(--logo-hl)" stopOpacity={0.5} />
          <stop offset="100%" stopColor="var(--logo-g2)" stopOpacity={0} />
        </linearGradient>
      </defs>
      <g transform="translate(2, 2)" opacity={0.08}>
        <path fill="#000" d={MEEM_PATH} />
      </g>
      <path fill={`url(#${gradId})`} d={MEEM_PATH} />
      <path fill={`url(#${hlId})`} d={MEEM_PATH} />
    </svg>
  );
}
