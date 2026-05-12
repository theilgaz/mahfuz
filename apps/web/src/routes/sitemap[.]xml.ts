/**
 * GET /sitemap.xml — dinamik sitemap.
 *
 * İçerik:
 *  - Statik kamuya açık sayfalar
 *  - 114 sure (/surah/$slug)
 *  - 604 mushaf sayfası (/page/$n)
 *  - 30 cüz (/juz/$n)
 *  - 6236 ayet tahlili (/analyse/$verseKey)
 *
 * Auth/ephemeral sayfalar (profile, bookmarks, meclis, khatm, api/*) dahil değil.
 * 1 saatlik CDN cache + 30 dakika browser cache.
 */

import { createFileRoute } from "@tanstack/react-router";
import { SURAHS } from "~/lib/surah-ayah-counts";
import { surahSlug } from "~/lib/surah-slugs";

const ORIGIN = "https://mahfuz.ilg.az";

interface UrlEntry {
  loc: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: number;
}

const STATIC_URLS: UrlEntry[] = [
  { loc: "/", changefreq: "daily", priority: 1.0 },
  { loc: "/discover", changefreq: "weekly", priority: 0.9 },
  { loc: "/tajweed", changefreq: "monthly", priority: 0.7 },
  { loc: "/search", changefreq: "monthly", priority: 0.6 },
  { loc: "/games", changefreq: "monthly", priority: 0.6 },
  { loc: "/games/ayah-2048", changefreq: "monthly", priority: 0.5 },
  { loc: "/games/fill-blank", changefreq: "monthly", priority: 0.5 },
  { loc: "/games/hexagon", changefreq: "monthly", priority: 0.5 },
  { loc: "/games/kelime-tahmini", changefreq: "monthly", priority: 0.5 },
  { loc: "/games/surah-guess", changefreq: "monthly", priority: 0.5 },
  { loc: "/games/verse-chain", changefreq: "monthly", priority: 0.5 },
  { loc: "/games/word-match", changefreq: "monthly", priority: 0.5 },
  { loc: "/games/word-meaning", changefreq: "monthly", priority: 0.5 },
  { loc: "/alifba", changefreq: "monthly", priority: 0.7 },
  { loc: "/alifba/letters", changefreq: "monthly", priority: 0.6 },
  { loc: "/about", changefreq: "monthly", priority: 0.4 },
  { loc: "/changelog", changefreq: "weekly", priority: 0.4 },
  { loc: "/premium", changefreq: "monthly", priority: 0.5 },
];

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildSitemap(): string {
  const urls: UrlEntry[] = [...STATIC_URLS];

  for (let id = 1; id <= 114; id++) {
    urls.push({ loc: `/surah/${surahSlug(id)}`, changefreq: "monthly", priority: 0.9 });
  }

  for (let n = 1; n <= 604; n++) {
    urls.push({ loc: `/page/${n}`, changefreq: "monthly", priority: 0.7 });
  }

  for (let j = 1; j <= 30; j++) {
    urls.push({ loc: `/juz/${j}`, changefreq: "monthly", priority: 0.7 });
  }

  for (const s of SURAHS) {
    for (let a = 1; a <= s.ayahCount; a++) {
      urls.push({ loc: `/analyse/${s.id}:${a}`, changefreq: "yearly", priority: 0.5 });
    }
  }

  const body = urls
    .map((u) => {
      const parts = [`    <loc>${escapeXml(ORIGIN + u.loc)}</loc>`];
      if (u.changefreq) parts.push(`    <changefreq>${u.changefreq}</changefreq>`);
      if (u.priority != null) parts.push(`    <priority>${u.priority.toFixed(1)}</priority>`);
      return `  <url>\n${parts.join("\n")}\n  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const xml = buildSitemap();
        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=1800, s-maxage=3600",
          },
        });
      },
    },
  },
});
