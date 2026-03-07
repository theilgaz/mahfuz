import { useEffect } from "react";
import {
  usePreferencesStore,
  getArabicFont,
  getArabicFontSizeForMode,
  getTranslationFontSizeForMode,
} from "~/stores/usePreferencesStore";

const injectedLinks = new Set<string>();

function injectGoogleFont(url: string) {
  if (injectedLinks.has(url)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = url;
  document.head.appendChild(link);
  injectedLinks.add(url);
}

const THEME_META_COLORS: Record<string, string> = {
  light: "#059669",
  sepia: "#8b7332",
  dark: "#1a1a1a",
  dimmed: "#22272e",
};

export function useFontLoader() {
  const arabicFontId = usePreferencesStore((s) => s.arabicFontId);
  const viewMode = usePreferencesStore((s) => s.viewMode);
  const normalArabicFontSize = usePreferencesStore((s) => s.normalArabicFontSize);
  const normalTranslationFontSize = usePreferencesStore((s) => s.normalTranslationFontSize);
  const wbwArabicFontSize = usePreferencesStore((s) => s.wbwArabicFontSize);
  const mushafArabicFontSize = usePreferencesStore((s) => s.mushafArabicFontSize);
  const theme = usePreferencesStore((s) => s.theme);

  useEffect(() => {
    const font = getArabicFont(arabicFontId);

    if (font.source === "google" && font.googleUrl) {
      injectGoogleFont(font.googleUrl);
    }

    const arabicFontSize = getArabicFontSizeForMode({ viewMode, normalArabicFontSize, wbwArabicFontSize, mushafArabicFontSize });
    const translationFontSize = getTranslationFontSizeForMode({ viewMode, normalTranslationFontSize });

    const html = document.documentElement;
    html.style.setProperty(
      "--font-arabic",
      `${font.family}, "Traditional Arabic", serif`,
    );
    html.style.setProperty("--arabic-font-scale", String(arabicFontSize));
    html.style.setProperty(
      "--translation-font-scale",
      String(translationFontSize),
    );
  }, [arabicFontId, viewMode, normalArabicFontSize, normalTranslationFontSize, wbwArabicFontSize, mushafArabicFontSize]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute("content", THEME_META_COLORS[theme] || "#059669");
    }
  }, [theme]);
}
