/**
 * Lig & sezon kupa ikonları.
 * Kullanıcı tarafından sağlanan SVG path'leri; renk currentColor üzerinden kontrol edilir.
 *
 * - TrophyIcon: profil/satır kupa sayacı (jenerik)
 * - MedalLeague: lig şampiyonu (1.) — lig'e göre süslenmiş varyant
 * - RosetteIcon: sezon top-10 katılım kokartı (madalya almayan 2-10)
 */

import { LEAGUE_COLORS, type League } from "~/lib/league";

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
  title?: string;
}

const baseProps = {
  fill: "none" as const,
  xmlns: "http://www.w3.org/2000/svg",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function TrophyIcon({ size = 18, color = "currentColor", strokeWidth = 2, title }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...baseProps}>
      {title && <title>{title}</title>}
      <path
        d="M12 15C8.68629 15 6 12.3137 6 9V3.44444C6 3.0306 6 2.82367 6.06031 2.65798C6.16141 2.38021 6.38021 2.16141 6.65798 2.06031C6.82367 2 7.0306 2 7.44444 2H16.5556C16.9694 2 17.1763 2 17.342 2.06031C17.6198 2.16141 17.8386 2.38021 17.9397 2.65798C18 2.82367 18 3.0306 18 3.44444V9C18 12.3137 15.3137 15 12 15ZM12 15V18M18 4H20.5C20.9659 4 21.1989 4 21.3827 4.07612C21.6277 4.17761 21.8224 4.37229 21.9239 4.61732C22 4.80109 22 5.03406 22 5.5V6C22 6.92997 22 7.39496 21.8978 7.77646C21.6204 8.81173 20.8117 9.62038 19.7765 9.89778C19.395 10 18.93 10 18 10M6 4H3.5C3.03406 4 2.80109 4 2.61732 4.07612C2.37229 4.17761 2.17761 4.37229 2.07612 4.61732C2 4.80109 2 5.03406 2 5.5V6C2 6.92997 2 7.39496 2.10222 7.77646C2.37962 8.81173 3.18827 9.62038 4.22354 9.89778C4.60504 10 5.07003 10 6 10M7.44444 22H16.5556C16.801 22 17 21.801 17 21.5556C17 19.5919 15.4081 18 13.4444 18H10.5556C8.59188 18 7 19.5919 7 21.5556C7 21.801 7.19898 22 7.44444 22Z"
        stroke={color}
        strokeWidth={strokeWidth}
      />
    </svg>
  );
}

const BRONZE_PATH =
  "M7.96668 14.7219L7 22L11.5884 19.247C11.7381 19.1572 11.8129 19.1123 11.8928 19.0947C11.9634 19.0792 12.0366 19.0792 12.1072 19.0947C12.1871 19.1123 12.2619 19.1572 12.4116 19.247L17 22L16.0343 14.7212M19 9C19 12.866 15.866 16 12 16C8.13401 16 5 12.866 5 9C5 5.13401 8.13401 2 12 2C15.866 2 19 5.13401 19 9Z";

const SILVER_PATH =
  "M7 15.0903V22L11.7029 20.1188C11.8126 20.0749 11.8675 20.053 11.9242 20.0443C11.9744 20.0366 12.0256 20.0366 12.0758 20.0443C12.1325 20.053 12.1874 20.0749 12.2971 20.1188L17 22V15.0903M19.5 9.5C19.5 13.6421 16.1421 17 12 17C7.85786 17 4.5 13.6421 4.5 9.5C4.5 5.35786 7.85786 2 12 2C16.1421 2 19.5 5.35786 19.5 9.5Z";

// Altın ve Hafız aynı path; sadece renk farklı.
const STAR_MEDAL_PATH =
  "M7.86866 15.4599L7 22L11.5884 19.247C11.7381 19.1572 11.8129 19.1123 11.8928 19.0947C11.9634 19.0792 12.0366 19.0792 12.1072 19.0947C12.1871 19.1123 12.2619 19.1572 12.4116 19.247L17 22L16.1319 15.4571M16.4259 4.24888C16.5803 4.6224 16.8768 4.9193 17.25 5.0743L18.5589 5.61648C18.9325 5.77121 19.2292 6.06799 19.384 6.44154C19.5387 6.81509 19.5387 7.23481 19.384 7.60836L18.8422 8.91635C18.6874 9.29007 18.6872 9.71021 18.8427 10.0837L19.3835 11.3913C19.4602 11.5764 19.4997 11.7747 19.4997 11.975C19.4998 12.1752 19.4603 12.3736 19.3837 12.5586C19.3071 12.7436 19.1947 12.9118 19.0531 13.0534C18.9114 13.195 18.7433 13.3073 18.5582 13.3839L17.2503 13.9256C16.8768 14.0801 16.5799 14.3765 16.4249 14.7498L15.8827 16.0588C15.728 16.4323 15.4312 16.7291 15.0577 16.8838C14.6841 17.0386 14.2644 17.0386 13.8909 16.8838L12.583 16.342C12.2094 16.1877 11.7899 16.188 11.4166 16.3429L10.1077 16.8843C9.73434 17.0387 9.31501 17.0386 8.94178 16.884C8.56854 16.7293 8.27194 16.4329 8.11711 16.0598L7.57479 14.7504C7.42035 14.3769 7.12391 14.08 6.75064 13.925L5.44175 13.3828C5.06838 13.2282 4.77169 12.9316 4.61691 12.5582C4.46213 12.1849 4.46192 11.7654 4.61633 11.3919L5.1581 10.0839C5.31244 9.71035 5.31213 9.29079 5.15722 8.91746L4.61623 7.60759C4.53953 7.42257 4.50003 7.22426 4.5 7.02397C4.49997 6.82369 4.5394 6.62536 4.61604 6.44032C4.69268 6.25529 4.80504 6.08716 4.94668 5.94556C5.08832 5.80396 5.25647 5.69166 5.44152 5.61508L6.74947 5.07329C7.12265 4.91898 7.41936 4.6229 7.57448 4.25004L8.11664 2.94111C8.27136 2.56756 8.56813 2.27078 8.94167 2.11605C9.3152 1.96132 9.7349 1.96132 10.1084 2.11605L11.4164 2.65784C11.7899 2.81218 12.2095 2.81187 12.5828 2.65696L13.8922 2.11689C14.2657 1.96224 14.6853 1.96228 15.0588 2.11697C15.4322 2.27167 15.729 2.56837 15.8837 2.94182L16.426 4.25115L16.4259 4.24888Z";

const ROSETTE_PATH =
  "M8.87625 13.0953L4.70122 7.87653C4.44132 7.55166 4.31138 7.38922 4.21897 7.20834C4.13698 7.04787 4.07706 6.87705 4.04084 6.70052C4 6.50155 4 6.29354 4 5.8775V5.2C4 4.0799 4 3.51984 4.21799 3.09202C4.40973 2.71569 4.71569 2.40973 5.09202 2.21799C5.51984 2 6.0799 2 7.2 2H16.8C17.9201 2 18.4802 2 18.908 2.21799C19.2843 2.40973 19.5903 2.71569 19.782 3.09202C20 3.51984 20 4.0799 20 5.2V5.8775C20 6.29354 20 6.50155 19.9592 6.70052C19.9229 6.87705 19.863 7.04787 19.781 7.20834C19.6886 7.38922 19.5587 7.55166 19.2988 7.87652L15.1238 13.0953M5.00005 3L12.0001 12L19 3M15.5355 13.4645C17.4882 15.4171 17.4882 18.5829 15.5355 20.5355C13.5829 22.4882 10.4171 22.4882 8.46446 20.5355C6.51185 18.5829 6.51185 15.4171 8.46446 13.4645C10.4171 11.5118 13.5829 11.5118 15.5355 13.4645Z";

const LEAGUE_PATHS: Record<League, string> = {
  bronz: BRONZE_PATH,
  gumus: SILVER_PATH,
  altin: STAR_MEDAL_PATH,
  hafiz: STAR_MEDAL_PATH,
};

interface MedalLeagueProps extends IconProps {
  league: League;
}

export function MedalLeague({ league, size = 18, color, strokeWidth = 2, title }: MedalLeagueProps) {
  const stroke = color ?? LEAGUE_COLORS[league];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...baseProps}>
      {title && <title>{title}</title>}
      <path d={LEAGUE_PATHS[league]} stroke={stroke} strokeWidth={strokeWidth} />
    </svg>
  );
}

interface RosetteProps extends IconProps {
  league: League;
}

export function RosetteIcon({ league, size = 18, color, strokeWidth = 2, title }: RosetteProps) {
  const stroke = color ?? LEAGUE_COLORS[league];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...baseProps}>
      {title && <title>{title}</title>}
      <path d={ROSETTE_PATH} stroke={stroke} strokeWidth={strokeWidth} />
    </svg>
  );
}

/** Yatay sıra: lig rozeti (mevcut lig) — kullanıcı adının yanında. */
interface LeagueBadgeProps {
  league: League;
  size?: number;
  showLabel?: boolean;
}

export function LeagueBadge({ league, size = 14, showLabel = false }: LeagueBadgeProps) {
  const color = LEAGUE_COLORS[league];
  return (
    <span
      className="mu-league-badge"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        color,
        verticalAlign: "middle",
      }}
      title={league}
    >
      <MedalLeague league={league} size={size} />
      {showLabel && <span style={{ fontSize: size - 2, fontWeight: 600 }}>{labelFor(league)}</span>}
    </span>
  );
}

function labelFor(league: League): string {
  return league === "hafiz" ? "Hafız" : league === "altin" ? "Altın" : league === "gumus" ? "Gümüş" : "Bronz";
}
