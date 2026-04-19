/**
 * Meem (م) logo mark -- Arsenal-style crest with Meem glyph.
 * Used in the minimal UI editorial design.
 */

interface LogoMeemProps {
  size?: number;
}

const MEEM_PATH =
  "M1.45 75Q0.85 71.75 0.42 68.30Q0 64.85 0 62.00Q0 58.70 0.80 55.95Q1.60 53.20 3.48 51.58Q5.35 49.95 8.50 49.95Q9.80 49.95 11.45 50.10Q13.10 50.25 14.57 50.25Q16.05 50.25 17.05 49.70Q18.05 49.15 18.05 47.70Q18.05 46.40 17.43 45.28Q16.80 44.15 15.80 43.48Q14.80 42.80 13.70 42.80Q12.40 42.80 11.63 43.58Q10.85 44.35 10.43 45.63Q10 46.90 9.85 48.33Q9.70 49.75 9.70 51.00L4.65 52.30Q4.65 50.35 4.95 47.95Q5.25 45.55 5.97 43.15Q6.70 40.75 7.93 38.73Q9.15 36.70 11 35.48Q12.85 34.25 15.35 34.25Q18.10 34.25 20.53 35.40Q22.95 36.55 24.80 38.60Q26.65 40.65 27.68 43.23Q28.70 45.80 28.70 48.70Q28.70 51.55 27.63 53.18Q26.55 54.80 24.85 55.50Q23.15 56.20 21.30 56.20Q19.75 56.20 18.10 55.85Q16.45 55.50 14.85 55.18Q13.25 54.85 11.80 54.85Q10.55 54.85 9.85 55.35Q9.15 55.85 8.88 56.68Q8.60 57.50 8.60 58.60Q8.60 59.80 8.90 61.40Q9.20 63.00 9.72 64.78Q10.25 66.55 10.88 68.25Q11.50 69.95 12.15 71.35L1.45 75Z";

const OUTER = "M161.4,0.4c-38.4,0-109.3,9.9-145.4,30.9C-31.5,199.8,33.1,314.4,161.4,379.4c128.3-65,192.9-180.2,145.4-348.1C270.7,10.3,199.8,0.4,161.4,0.4z";
const INNER = "M161.4,11.2c-37.8,0-80.3,4.8-136,27.6c-41.5,147.1,6.6,264.9,136,329.2c129.3-64.2,177.4-182.1,135.9-329.2C241.6,16.1,199.2,11.2,161.4,11.2z";
const WHITE_L = "M161.2,11.1c-37.6,0-77.9,5.6-114.3,19.4C9.1,181,37,291,161.4,367.9L161.2,11.1z";
const WHITE_R = "M161.4,367.9c124.5-76.9,152.3-186.8,114.5-337.4c-36.4-13.8-76.7-19.4-114.3-19.4L161.4,367.9z";
const RED_L = "M161.4,11.1c-37.8,0-76.1,5.7-107.1,16.5c-39.1,157.8-7.7,264.4,107.2,337.2L161.4,11.1z";
const RED_R = "M161.5,11.1c37.8,0,76.1,5.7,107.2,16.5c39.1,157.8,7.7,264.4-107.2,337.2L161.5,11.1z";

export function LogoMeem({ size = 38 }: LogoMeemProps) {
  const w = Math.round(size * (323 / 380));
  return (
    <span
      className="mu-brand-mark"
      style={{ width: w, height: size, display: "inline-flex", alignItems: "center", justifyContent: "center" }}
    >
      <svg
        viewBox="0 0 323 380"
        width={w}
        height={size}
        aria-hidden="true"
      >
        <path d={OUTER} fill="currentColor" />
        <path d={INNER} fill="currentColor" opacity="0.85" />
        <path d={WHITE_L} fill="#fff" opacity="0.15" />
        <path d={WHITE_R} fill="#fff" opacity="0.15" />
        <path d={RED_L} fill="currentColor" opacity="0.95" />
        <path d={RED_R} fill="currentColor" opacity="0.8" />
        <defs>
          <clipPath id="lm-ac">
            <path d={INNER} />
          </clipPath>
        </defs>
        <g clipPath="url(#lm-ac)">
          <g transform="translate(101, -15) scale(4.2)">
            <path fill="#fff" d={MEEM_PATH} />
          </g>
        </g>
      </svg>
    </span>
  );
}
