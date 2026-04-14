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
  "fill-blank": {
    bg: "#C4A882", primary: "#8B6914", secondary: "#D4B87A", surface: "#F5EBD8",
    glow: "rgba(139,105,20,0.25)", img: "/images/games/mahfuz-fill-in-the-blank.webp", isDark: false,
  },
  "verse-chain": {
    bg: "#1B4A3B", primary: "#C9A84C", secondary: "#2D6B52", surface: "#0F3028",
    glow: "rgba(201,168,76,0.3)", img: "/images/games/mahfuz-verse-chain.webp", isDark: true,
  },
  "word-meaning": {
    bg: "#D4A845", primary: "#8B5E1A", secondary: "#E8C56D", surface: "#FDF3DC",
    glow: "rgba(139,94,26,0.2)", img: "/images/games/mahfuz-word-meaning.webp", isDark: false,
  },
  "hexagon": {
    bg: "#1A3D2B", primary: "#4A9B6A", secondary: "#2D6B4A", surface: "#0F2A1C",
    glow: "rgba(74,155,106,0.3)", img: "/images/games/mahfuz-hexagon-letters.webp", isDark: true,
  },
  "surah-guess": {
    bg: "#B8C9B0", primary: "#4A7A40", secondary: "#8FB085", surface: "#E8F0E4",
    glow: "rgba(74,122,64,0.2)", img: "/images/games/mahfuz-surah-recognition.webp", isDark: false,
  },
};
