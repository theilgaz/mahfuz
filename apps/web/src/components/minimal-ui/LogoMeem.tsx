/**
 * Meem (م) logo mark -- shield with Meem glyph.
 * Used in the minimal UI editorial design.
 */

interface LogoMeemProps {
  size?: number;
}

const MEEM_PATH =
  "M1.45 75Q0.85 71.75 0.42 68.30Q0 64.85 0 62.00Q0 58.70 0.80 55.95Q1.60 53.20 3.48 51.58Q5.35 49.95 8.50 49.95Q9.80 49.95 11.45 50.10Q13.10 50.25 14.57 50.25Q16.05 50.25 17.05 49.70Q18.05 49.15 18.05 47.70Q18.05 46.40 17.43 45.28Q16.80 44.15 15.80 43.48Q14.80 42.80 13.70 42.80Q12.40 42.80 11.63 43.58Q10.85 44.35 10.43 45.63Q10 46.90 9.85 48.33Q9.70 49.75 9.70 51.00L4.65 52.30Q4.65 50.35 4.95 47.95Q5.25 45.55 5.97 43.15Q6.70 40.75 7.93 38.73Q9.15 36.70 11 35.48Q12.85 34.25 15.35 34.25Q18.10 34.25 20.53 35.40Q22.95 36.55 24.80 38.60Q26.65 40.65 27.68 43.23Q28.70 45.80 28.70 48.70Q28.70 51.55 27.63 53.18Q26.55 54.80 24.85 55.50Q23.15 56.20 21.30 56.20Q19.75 56.20 18.10 55.85Q16.45 55.50 14.85 55.18Q13.25 54.85 11.80 54.85Q10.55 54.85 9.85 55.35Q9.15 55.85 8.88 56.68Q8.60 57.50 8.60 58.60Q8.60 59.80 8.90 61.40Q9.20 63.00 9.72 64.78Q10.25 66.55 10.88 68.25Q11.50 69.95 12.15 71.35L1.45 75Z";

const SHIELD_PATH = "M5 8 Q5 2 12 2 L88 2 Q95 2 95 8 L95 55 Q95 85 50 118 Q5 85 5 55 Z";
const SHIELD_INNER = "M10 12 Q10 7 16 7 L84 7 Q90 7 90 12 L90 53 Q90 80 50 112 Q10 80 10 53 Z";

export function LogoMeem({ size = 38 }: LogoMeemProps) {
  const w = Math.round(size * (100 / 120));
  return (
    <span
      className="mu-brand-mark"
      style={{ width: w, height: size, display: "inline-flex", alignItems: "center", justifyContent: "center" }}
    >
      <svg
        viewBox="0 0 100 120"
        width={w}
        height={size}
        aria-hidden="true"
      >
        <path d={SHIELD_PATH} fill="currentColor" />
        <path d={SHIELD_INNER} fill="none" stroke="#e8d5a3" strokeWidth="1.5" opacity="0.6" />
        <defs>
          <clipPath id="lm-sc">
            <path d={SHIELD_INNER} />
          </clipPath>
        </defs>
        <g clipPath="url(#lm-sc)">
          <g transform="translate(32, 4) scale(1.28)">
            <path fill="#fff" d={MEEM_PATH} />
          </g>
        </g>
      </svg>
    </span>
  );
}
