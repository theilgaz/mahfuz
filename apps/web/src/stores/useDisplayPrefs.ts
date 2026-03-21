import { createPreferenceStore } from "~/lib/create-preference-store";
import type { Theme } from "~/lib/constants";
import type { ColorPaletteId } from "~/lib/fonts";

export const useDisplayPrefs = createPreferenceStore("mahfuz-display-prefs", {
  theme: "sepia" as Theme,
  arabicFontId: "scheherazade-new",
  colorizeWords: true,
  colorPaletteId: "pastel" as ColorPaletteId,
  textType: "simple" as "uthmani" | "simple",
});
