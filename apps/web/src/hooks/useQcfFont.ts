/**
 * QCF (Quran Complex Font) V2 per-page font yukleme hook'u.
 * FontFace API ile runtime'da font yukler, TanStack Query ile cache'ler.
 */

import { useQuery } from "@tanstack/react-query";

const QCF_V2_CDN = "https://verses.quran.foundation/fonts/quran/hafs/v2/woff2";

export function useQcfFont(pageNumber: number, enabled = true) {
  return useQuery({
    queryKey: ["qcf-font", "v2", pageNumber],
    queryFn: async () => {
      const fontName = `QCF_V2_P${pageNumber}`;

      // Zaten yuklenmisse tekrar yukleme
      for (const face of document.fonts) {
        if (face.family === fontName && face.status === "loaded") {
          return fontName;
        }
      }

      const url = `${QCF_V2_CDN}/p${pageNumber}.woff2`;
      const fontFace = new FontFace(fontName, `url(${url})`, {
        display: "swap",
      });

      await fontFace.load();
      document.fonts.add(fontFace);
      return fontName;
    },
    staleTime: Infinity,
    gcTime: 1000 * 60 * 30, // 30 dakika
    enabled,
  });
}
