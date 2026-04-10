export interface GameTheme {
  bg: string;
  primary: string;
  img: string;
  isDark: boolean;
}

export const GAME_THEMES: Record<string, GameTheme> = {
  "fill-blank":   { bg: "#C4A882", primary: "#8B6914", img: "/images/games/mahfuz-fill-in-the-blank.png", isDark: false },
  "verse-chain":  { bg: "#1B4A3B", primary: "#C9A84C", img: "/images/games/mahfuz-verse-chain.png",       isDark: true  },
  "word-meaning": { bg: "#D4A845", primary: "#8B5E1A", img: "/images/games/mahfuz-word-meaning.png",      isDark: false },
  "hexagon":      { bg: "#1A3D2B", primary: "#4A9B6A", img: "/images/games/mahfuz-hexagon-letters.png",   isDark: true  },
  "surah-guess":  { bg: "#B8C9B0", primary: "#4A7A40", img: "/images/games/mahfuz-surah-recognition.png", isDark: false },
};
