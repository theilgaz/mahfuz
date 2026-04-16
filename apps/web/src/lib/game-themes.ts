export interface GameTheme {
  bg: string;
  primary: string;
  secondary: string;
  surface: string;
  glow: string;
  img: string;
  isDark: boolean;
}

export const GAME_THEMES: Record<string, GameTheme> = {
  // Kelime Doldurma - warm parchment/manuscript feel (filling in ancient text)
  "fill-blank": {
    bg: "#2C1810", primary: "#D4A04C", secondary: "#8B5E3C", surface: "#3D2617",
    glow: "rgba(212,160,76,0.3)", img: "/images/games/mahfuz-fill-in-the-blank.webp", isDark: true,
  },
  // Ayet Zinciri - deep emerald chain links (connecting verses)
  "verse-chain": {
    bg: "#0A2A1B", primary: "#C9A84C", secondary: "#2D6B52", surface: "#0F3028",
    glow: "rgba(201,168,76,0.3)", img: "/images/games/mahfuz-verse-chain.webp", isDark: true,
  },
  // Kelime Anlami - calm slate-blue (quiet study feel)
  "word-meaning": {
    bg: "#24303E", primary: "#7EBAC8", secondary: "#4E8A9C", surface: "#2C3C4A",
    glow: "rgba(126,186,200,0.18)", img: "/images/games/mahfuz-word-meaning.webp", isDark: true,
  },
  // Hexagon Harf - deep forest green (honeycomb in nature)
  "hexagon": {
    bg: "#0B1F14", primary: "#4A9B6A", secondary: "#2D6B4A", surface: "#132E1E",
    glow: "rgba(74,155,106,0.3)", img: "/images/games/mahfuz-hexagon-letters.webp", isDark: true,
  },
  // Sure Tanima - midnight blue/teal (listening, contemplation)
  "surah-guess": {
    bg: "#0D1B2A", primary: "#48BFE3", secondary: "#2D6DA8", surface: "#1B2D45",
    glow: "rgba(72,191,227,0.25)", img: "/images/games/mahfuz-surah-recognition.webp", isDark: true,
  },
  // Kelime Tahmini - dark olive/sage (wordle-style, thoughtful)
  "kelime-tahmini": {
    bg: "#1A2118", primary: "#6B9E5B", secondary: "#4A7A3E", surface: "#232E20",
    glow: "rgba(107,158,91,0.3)", img: "/images/games/mahfuz-kelime-tahmini.webp", isDark: true,
  },
  // Ayet 2048 - deep navy/crimson (arcade energy)
  "ayet-2048": {
    bg: "#1A1A2E", primary: "#E94560", secondary: "#533483", surface: "#16213E",
    glow: "rgba(233,69,96,0.3)", img: "/images/games/mahfuz-ayet-2048.webp", isDark: true,
  },
};

/**
 * CSS patterns per game -- subtle geometric overlays.
 * Each returns a CSS background-image value (repeating SVG-encoded patterns).
 */
const GAME_PATTERNS: Record<string, { pattern: string; size: string; opacity: string }> = {
  // Manuscript grid lines (horizontal ruled lines like ancient text)
  "fill-blank": {
    pattern: `repeating-linear-gradient(
      0deg,
      transparent,
      transparent 28px,
      rgba(212,160,76,0.15) 28px,
      rgba(212,160,76,0.15) 29px
    )`,
    size: "100% 30px",
    opacity: "0.5",
  },
  // Chain links -- interlocking circles
  "verse-chain": {
    pattern: `radial-gradient(circle at 30px 15px, transparent 12px, rgba(201,168,76,0.12) 12px, rgba(201,168,76,0.12) 14px, transparent 14px),
      radial-gradient(circle at 0px 15px, transparent 12px, rgba(201,168,76,0.12) 12px, rgba(201,168,76,0.12) 14px, transparent 14px)`,
    size: "60px 30px",
    opacity: "0.6",
  },
  // Book pages -- subtle horizontal lines
  "word-meaning": {
    pattern: `repeating-linear-gradient(
      0deg,
      transparent,
      transparent 24px,
      rgba(126,186,200,0.06) 24px,
      rgba(126,186,200,0.06) 25px
    )`,
    size: "100% 26px",
    opacity: "0.5",
  },
  // Honeycomb hex pattern
  "hexagon": {
    pattern: `radial-gradient(circle at 25px 0, rgba(74,155,106,0.12) 8px, transparent 8px),
      radial-gradient(circle at 0 43px, rgba(74,155,106,0.12) 8px, transparent 8px),
      radial-gradient(circle at 50px 43px, rgba(74,155,106,0.12) 8px, transparent 8px)`,
    size: "50px 86px",
    opacity: "0.5",
  },
  // Sound waves -- concentric arcs
  "surah-guess": {
    pattern: `repeating-radial-gradient(
      circle at 50% 100%,
      transparent,
      transparent 18px,
      rgba(72,191,227,0.06) 18px,
      rgba(72,191,227,0.06) 20px
    )`,
    size: "200px 100px",
    opacity: "0.8",
  },
  // Letter tiles grid
  "kelime-tahmini": {
    pattern: `linear-gradient(rgba(107,158,91,0.1) 1px, transparent 1px),
      linear-gradient(90deg, rgba(107,158,91,0.1) 1px, transparent 1px)`,
    size: "48px 58px",
    opacity: "0.6",
  },
  // Grid cells (4x4 board feel)
  "ayet-2048": {
    pattern: `linear-gradient(rgba(233,69,96,0.08) 1px, transparent 1px),
      linear-gradient(90deg, rgba(83,52,131,0.08) 1px, transparent 1px)`,
    size: "80px 80px",
    opacity: "0.7",
  },
};

/** Build inline style object for a game background.
 *  Overrides CSS custom properties so child components
 *  (option cards, score badges, stat boxes, etc.) inherit dark theme. */
export function gameBgStyle(theme: GameTheme, gameId?: string): React.CSSProperties {
  const pat = gameId ? GAME_PATTERNS[gameId] : undefined;
  return {
    // Background layers
    "--game-bg-color": theme.bg,
    "--game-bg-gradient": `linear-gradient(180deg, ${theme.bg}, ${theme.surface})`,
    ...(pat && {
      "--game-bg-pattern": pat.pattern,
      "--game-pattern-size": pat.size,
      "--game-pattern-opacity": pat.opacity,
    }),
    // Override app-level CSS custom properties for dark game UIs
    ...(theme.isDark && {
      "--color-surface": theme.surface,
      "--color-bg": theme.bg,
      "--color-border": `${theme.primary}20`,
      "--color-text-primary": "rgba(255,255,255,0.92)",
      "--color-text-secondary": "rgba(255,255,255,0.50)",
      "--color-accent": theme.primary,
      // Mushaf overrides (fill-blank verse card)
      "--mushaf-bg": theme.surface,
      "--mushaf-border": `${theme.primary}18`,
      "--mushaf-shadow": "rgba(0,0,0,0.25)",
      "--mushaf-inner-shadow": "rgba(0,0,0,0.15)",
    }),
  } as React.CSSProperties;
}
