/**
 * Meem (م) logo mark -- circular seal with Arabic glyph.
 * Used in the minimal UI editorial design.
 */

interface LogoMeemProps {
  size?: number;
}

export function LogoMeem({ size = 38 }: LogoMeemProps) {
  return (
    <span
      className="mu-brand-mark"
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 40 40"
        width={size}
        height={size}
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="meem-g" cx="35%" cy="30%" r="80%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.25" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.05" />
          </radialGradient>
          <clipPath id="meem-clip">
            <circle cx="20" cy="20" r="18.5" />
          </clipPath>
        </defs>
        <circle cx="20" cy="20" r="19" fill="url(#meem-g)" />
        <circle
          cx="20"
          cy="20"
          r="18.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.7"
        />
        <circle
          cx="20"
          cy="20"
          r="15"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.6"
          opacity="0.45"
        />
        <text
          x="20"
          y="24"
          textAnchor="middle"
          fontFamily="'Amiri Quran','Amiri',serif"
          fontSize="42"
          fill="currentColor"
          clipPath="url(#meem-clip)"
        >
          م
        </text>
      </svg>
    </span>
  );
}
