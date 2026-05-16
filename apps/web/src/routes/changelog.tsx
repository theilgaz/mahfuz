/**
 * Changelog — /changelog
 * Milestone bazlı geliştirme günlüğü. Git history'den derlendi.
 */

import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "~/hooks/useTranslation";
import { staticHead } from "~/lib/seo";

export const Route = createFileRoute("/changelog")({
  head: () => staticHead("changelog"),
  component: ChangelogPage,
});

// ── Types ────────────────────────────────────────────────

type Category = "reading" | "audio" | "nav" | "learning" | "settings" | "hub" | "infra";
type Tag = "feat" | "fix" | "improve";

interface Entry {
  tag: Tag;
  category: Category;
  title: string;
  titleEn: string;
}

interface Day {
  date: string;
  entries: Entry[];
}

interface Milestone {
  version: string;
  name: string;
  nameEn: string;
  date: string; // release date
  days: Day[];
}

// ── Data ─────────────────────────────────────────────────

const MILESTONES: Milestone[] = [
  {
    version: "0.6",
    name: "Senkronizasyon & Performans",
    nameEn: "Sync & Performance",
    date: "2026-03-30",
    days: [
      {
        date: "2026-03-30",
        entries: [
          { tag: "feat", category: "reading", title: "Uzun sureler için sanal kaydırma (virtual scrolling)", titleEn: "Virtual scrolling for long surahs" },
          { tag: "feat", category: "reading", title: "Kelime renklendirme: 4 palet seçeneği", titleEn: "Word coloring with 4 palette options" },
          { tag: "feat", category: "reading", title: "İstatistikler sayfası ve okuma grafikleri", titleEn: "Stats page with reading charts" },
          { tag: "feat", category: "nav", title: "Arama: popüler sureler, anahtar kelime önerileri, bulanık eşleşme", titleEn: "Search: popular surahs, keyword suggestions, fuzzy matching" },
          { tag: "feat", category: "nav", title: "Tüm navigasyon tek AppHeader'da birleştirildi", titleEn: "All navigation unified in single AppHeader" },
          { tag: "feat", category: "hub", title: "Profil sayfası yeniden tasarlandı (yer imleri + keşfet)", titleEn: "Redesigned profile page with bookmarks + discover" },
          { tag: "feat", category: "reading", title: "5 yeni Türkçe meal eklendi (toplam 9)", titleEn: "5 new Turkish translations added (total 9)" },
          { tag: "feat", category: "reading", title: "Sayfa geçiş animasyonları (view transitions)", titleEn: "Page transition animations (view transitions)" },
          { tag: "improve", category: "settings", title: "Ayarlar iki sekmeli düzen ve canlı önizleme", titleEn: "Settings: two-tab layout with live preview" },
          { tag: "improve", category: "infra", title: "Fontlar self-host, ağır bileşenler lazy-load", titleEn: "Self-hosted fonts, lazy-loaded heavy components" },
          { tag: "improve", category: "reading", title: "İskelet yükleyiciler ve komşu sayfa ön yükleme", titleEn: "Skeleton loaders and adjacent page prefetch" },
          { tag: "improve", category: "infra", title: "Erişilebilirlik: focus trap, ARIA, canlı bölgeler", titleEn: "Accessibility: focus trap, ARIA, live regions" },
          { tag: "fix", category: "reading", title: "Mushaf modunda kelime kelime geçişi devre dışı", titleEn: "Disabled word-by-word toggle in mushaf mode" },
          { tag: "fix", category: "infra", title: "Tema: tüm sabit kodlu renkler CSS değişkenlerine taşındı", titleEn: "All hardcoded colors replaced with CSS variables" },
          { tag: "fix", category: "learning", title: "Elifba: nokta konumları ve çizim rehberi iyileştirmeleri", titleEn: "Alifba: dot positions and stroke guide improvements" },
          { tag: "fix", category: "nav", title: "Router: sayısal sure yönlendirme düzeltmesi", titleEn: "Router: numeric surah redirect fix" },
          { tag: "fix", category: "infra", title: "Hata sınırları, SW önbellek ve yeniden çizim düzeltmeleri", titleEn: "Error boundaries, SW cache and re-render fixes" },
          { tag: "fix", category: "infra", title: "Üretimdeki font 404 hatası düzeltildi", titleEn: "Fixed font 404 errors in production" },
        ],
      },
      {
        date: "2026-03-29",
        entries: [
          { tag: "feat", category: "settings", title: "Cihazlar arası senkronizasyon: okuma konumu, ayarlar, yer imleri, hıfz", titleEn: "Cross-device sync: reading position, settings, bookmarks, hifz" },
          { tag: "feat", category: "infra", title: "Konteyner başlangıcında otomatik veritabanı göçü", titleEn: "Auto-run database migrations on container start" },
          { tag: "fix", category: "settings", title: "Mod değişiminde ayar paneli açık kalıyor", titleEn: "Settings panel stays open on mode change" },
          { tag: "fix", category: "hub", title: "İstatistik/katkıcılar API'si ve FOUC önleme", titleEn: "Stats/contributors API and FOUC prevention" },
        ],
      },
    ],
  },
  {
    version: "0.5",
    name: "Keşfet & İyileştirmeler",
    nameEn: "Explore & Refinements",
    date: "2026-03-29",
    days: [
      {
        date: "2026-03-29",
        entries: [
          { tag: "feat", category: "hub", title: "Keşfet merkezi ve Yeni Ne Var sayfası", titleEn: "Explore hub and What's New page" },
          { tag: "feat", category: "hub", title: "GitHub katkıcılar ve krediler bölümü", titleEn: "GitHub contributors and credits section" },
          { tag: "feat", category: "hub", title: "Dil seçici (7 dil)", titleEn: "Language picker (7 languages)" },
          { tag: "feat", category: "learning", title: "Elifba ayrı sayfaya taşındı (/alifba)", titleEn: "Alifba moved to dedicated route" },
          { tag: "feat", category: "reading", title: "Selçuklu yıldızı ayet sonu işaretleri", titleEn: "Seljuk star verse end markers" },
          { tag: "feat", category: "reading", title: "Secde ayeti işaretleri", titleEn: "Sajdah verse markers" },
          { tag: "feat", category: "reading", title: "Okuma ilerleme çubuğu", titleEn: "Reading progress bar" },
          { tag: "feat", category: "nav", title: "Birleşik okuma üst çubuğu", titleEn: "Unified reading header" },
          { tag: "feat", category: "nav", title: "Meem butonu ile son okunanlar popup'ı", titleEn: "Recent readings popup via Meem button" },
          { tag: "feat", category: "nav", title: "Nüzul sırasına göre sure filtresi", titleEn: "Revelation order surah filter" },
          { tag: "feat", category: "audio", title: "Belirli ayetten başlatma desteği", titleEn: "Play from specific verse" },
          { tag: "improve", category: "nav", title: "Sure seçicide sure adı gösterimi", titleEn: "Surah name in picker trigger" },
          { tag: "improve", category: "nav", title: "Alt çubuk yeniden sıralandı", titleEn: "Bottom bar reordered" },
          { tag: "improve", category: "reading", title: "Çalan ayetin arka planı vurgulanıyor", titleEn: "Background highlight on playing verse" },
          { tag: "improve", category: "settings", title: "Hıfz takipçisi kart tabanlı tasarım", titleEn: "Hifz tracker card-based UI" },
          { tag: "fix", category: "reading", title: "Bağlam menüsü konum düzeltmesi", titleEn: "Context menu positioning fix" },
          { tag: "fix", category: "reading", title: "Ses kelime vurgu rengi düzeltmesi", titleEn: "Audio word highlight color fix" },
          { tag: "fix", category: "infra", title: "routeTree.gen.ts git takibi", titleEn: "routeTree.gen.ts tracking in git" },
        ],
      },
      {
        date: "2026-03-28",
        entries: [
          { tag: "fix", category: "reading", title: "Secavend işaretleri satır sonu kopması engellendi", titleEn: "Secavend marks line-break fix" },
          { tag: "improve", category: "nav", title: "Sure listesi: ikon hover efektleri", titleEn: "Surah list icon hover effects" },
        ],
      },
    ],
  },
  {
    version: "0.4",
    name: "Kelime Kelime & Çoklu Meal",
    nameEn: "Word by Word & Multi-Translation",
    date: "2026-03-27",
    days: [
      {
        date: "2026-03-27",
        entries: [
          { tag: "feat", category: "nav", title: "Alt navigasyon tüm sayfalarda görünür", titleEn: "Bottom nav visible on all pages" },
          { tag: "feat", category: "learning", title: "Ezber durumu takipçisi (ayet bazlı)", titleEn: "Memorization tracker (verse-level)" },
          { tag: "feat", category: "reading", title: "Çoklu meal desteği ve Mushaf satır düzeni", titleEn: "Multi-translation and mushaf line view" },
          { tag: "feat", category: "reading", title: "Muhammed Esed Türkçe meali", titleEn: "Muhammed Esed Turkish translation" },
        ],
      },
      {
        date: "2026-03-26",
        entries: [
          { tag: "feat", category: "reading", title: "Kelime kelime çeviri (3 aşamalı: kapalı/hover/açık)", titleEn: "Word-by-word translation (off/hover/on)" },
          { tag: "feat", category: "reading", title: "Yüzen yazı boyutu kontrolü", titleEn: "Floating font size controls" },
          { tag: "feat", category: "audio", title: "Ses çalarken kelime kelime vurgulama", titleEn: "Word-by-word highlighting during playback" },
          { tag: "feat", category: "audio", title: "Zamanlama verisi eksik hafızlar için yedek", titleEn: "Fallback for reciters without timing" },
          { tag: "feat", category: "nav", title: "Türkçe sure isimleri ve cüz navigasyonu", titleEn: "Turkish surah names and juz navigation" },
          { tag: "feat", category: "settings", title: "Ekran uyanık kalma (wake lock)", titleEn: "Wake lock on reading pages" },
          { tag: "feat", category: "infra", title: "PWA: favicon, manifest ikonları", titleEn: "PWA: favicon, manifest icons" },
          { tag: "fix", category: "settings", title: "Ayar paneli sadeleştirildi", titleEn: "Settings panel decluttered" },
          { tag: "fix", category: "reading", title: "Tecvid iç içe tag desteği", titleEn: "Nested tajweed tag support" },
          { tag: "fix", category: "audio", title: "Çift navigasyon ses takılması giderildi", titleEn: "Duplicate nav playback stutter fix" },
        ],
      },
    ],
  },
  {
    version: "0.3",
    name: "Çocuk Modülü & Ezberleme",
    nameEn: "Kids Module & Memorization",
    date: "2026-03-24",
    days: [
      {
        date: "2026-03-24",
        entries: [
          { tag: "feat", category: "learning", title: "Harf yazma alıştırması (Amiri font rehberiyle)", titleEn: "Letter tracing with Amiri font guide" },
          { tag: "feat", category: "learning", title: "Çocuk modülü: harf oyunları, profil yönetimi", titleEn: "Kids module: letter games, profiles" },
          { tag: "fix", category: "learning", title: "RTL harfler, boya teması, navigasyon düzeltmeleri", titleEn: "RTL letters, crayon theme, nav fixes" },
        ],
      },
      {
        date: "2026-03-22",
        entries: [
          { tag: "feat", category: "learning", title: "Ezberleme: 5 mod (öğren, dinle, test, yaz, immersive)", titleEn: "Memorization: 5 modes" },
          { tag: "feat", category: "learning", title: "Yanlış cevaplar için tekrar turu", titleEn: "Retry round for wrong answers" },
        ],
      },
    ],
  },
  {
    version: "0.2",
    name: "Ezberleme & Temalar",
    nameEn: "Memorization & Themes",
    date: "2026-03-09",
    days: [
      {
        date: "2026-03-09",
        entries: [
          { tag: "feat", category: "learning", title: "Kanban düzeni, istatistikler, doğrulama sınavı", titleEn: "Kanban layout, stats, verification quiz" },
          { tag: "feat", category: "learning", title: "3 kategorili sure seçici, ezber işaretleme", titleEn: "3-category surah selector, mark as mastered" },
        ],
      },
      {
        date: "2026-03-08",
        entries: [
          { tag: "feat", category: "reading", title: "Çoklu meal: sıralama, öncelik seçimi", titleEn: "Multi-translation: reorder, primary" },
          { tag: "feat", category: "hub", title: "Uygulama içi krediler sayfası", titleEn: "In-app credits page" },
          { tag: "feat", category: "learning", title: "SM-2 tekrar algoritması ile ezberleme modülü", titleEn: "Memorization module with SM-2" },
        ],
      },
      {
        date: "2026-03-07",
        entries: [
          { tag: "feat", category: "settings", title: "Karanlık tema ve tema duyarlı vurgular", titleEn: "Dark theme and theme-aware highlights" },
          { tag: "feat", category: "audio", title: "QDC bölüm ses API'si ile 25+ hafız", titleEn: "QDC chapter audio API with 25+ reciters" },
        ],
      },
    ],
  },
  {
    version: "0.1",
    name: "Bismillah",
    nameEn: "Bismillah",
    date: "2026-03-05",
    days: [
      {
        date: "2026-03-06",
        entries: [
          { tag: "feat", category: "nav", title: "Gezinme sayfası: sekmeler ve Fihrist konu dizini", titleEn: "Browse page with tabs and Fihrist" },
          { tag: "feat", category: "nav", title: "Mobil tam ekran menü ve yapışkan araç çubuğu", titleEn: "Mobile fullscreen nav and sticky toolbar" },
          { tag: "feat", category: "nav", title: "Mahfuz logosu header ve favicon'a eklendi", titleEn: "Mahfuz logo in header and favicon" },
        ],
      },
      {
        date: "2026-03-05",
        entries: [
          { tag: "feat", category: "reading", title: "Besmele otomatik gösterimi ve ses öncesi eklenmesi", titleEn: "Auto bismillah display and audio prepend" },
          { tag: "feat", category: "reading", title: "Kelime kelime renklendirme", titleEn: "Word-by-word coloring" },
          { tag: "feat", category: "reading", title: "Mushaf tam ekran modu", titleEn: "Mushaf fullscreen mode" },
          { tag: "feat", category: "infra", title: "İlk commit: Bismillah", titleEn: "Initial commit: Bismillah" },
        ],
      },
    ],
  },
];

// ── Category metadata ────────────────────────────────────

const CATEGORY_META: Record<Category, { labelTr: string; labelEn: string }> = {
  reading: { labelTr: "Okuma", labelEn: "Reading" },
  audio: { labelTr: "Ses", labelEn: "Audio" },
  nav: { labelTr: "Gezinme", labelEn: "Navigation" },
  learning: { labelTr: "Öğrenme", labelEn: "Learning" },
  settings: { labelTr: "Ayarlar", labelEn: "Settings" },
  hub: { labelTr: "Keşfet", labelEn: "Explore" },
  infra: { labelTr: "Altyapı", labelEn: "Infrastructure" },
};

const ALL_CATEGORIES: Category[] = ["reading", "audio", "nav", "learning", "settings", "hub", "infra"];

// ── Components ───────────────────────────────────────────

function TagDot({ tag }: { tag: Tag }) {
  const color = {
    feat: "bg-[var(--color-accent)]",
    fix: "bg-[var(--color-text-secondary)]",
    improve: "bg-[var(--color-accent)]/50",
  }[tag];
  return <span className={`w-1.5 h-1.5 rounded-full ${color} shrink-0 mt-[7px]`} />;
}

function TagLabel({ tag, t }: { tag: Tag; t: any }) {
  const labels = { feat: t.changelog.tags.new, fix: t.changelog.tags.fix, improve: t.changelog.tags.improved };
  const styles = {
    feat: "bg-[var(--color-accent)]/15 text-[var(--color-accent)]",
    fix: "bg-[var(--color-text-secondary)]/10 text-[var(--color-text-secondary)]",
    improve: "bg-[var(--color-accent)]/8 text-[var(--color-accent)]/70",
  };
  return (
    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${styles[tag]}`}>
      {labels[tag]}
    </span>
  );
}

type FilterTag = "all" | Tag;

function ChangelogPage() {
  const { t, locale } = useTranslation();
  const isEn = locale !== "tr";

  const [tagFilter, setTagFilter] = useState<FilterTag>("all");
  const [categoryFilter, setCategoryFilter] = useState<Category | "all">("all");

  const bcp47 = { tr: "tr-TR", en: "en-US", es: "es-ES", fr: "fr-FR", ar: "ar-SA", de: "de-DE", nl: "nl-NL" }[locale] ?? "tr-TR";

  // Filter milestones → days → entries
  const filtered = useMemo(() => {
    return MILESTONES
      .map((ms) => ({
        ...ms,
        days: ms.days
          .map((day) => ({
            ...day,
            entries: day.entries.filter((e) => {
              if (tagFilter !== "all" && e.tag !== tagFilter) return false;
              if (categoryFilter !== "all" && e.category !== categoryFilter) return false;
              return true;
            }),
          }))
          .filter((day) => day.entries.length > 0),
      }))
      .filter((ms) => ms.days.length > 0);
  }, [tagFilter, categoryFilter]);

  const tagChips: Array<{ key: FilterTag; label: string }> = [
    { key: "all", label: t.changelog.filterAll },
    { key: "feat", label: t.changelog.tags.new },
    { key: "improve", label: t.changelog.tags.improved },
    { key: "fix", label: t.changelog.tags.fix },
  ];

  // Total entry count
  const totalEntries = filtered.reduce((sum, ms) => sum + ms.days.reduce((s, d) => s + d.entries.length, 0), 0);

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Link
          to="/discover"
          className="p-2 rounded-lg hover:bg-[var(--color-surface)] transition-colors"
          aria-label={t.nav.back}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5L7 10L12 15" />
          </svg>
        </Link>
        <div>
          <h1 className="text-lg font-semibold">{t.changelog.title}</h1>
          <p className="text-[11px] text-[var(--color-text-secondary)]">
            {filtered.length} milestone · {totalEntries} {isEn ? "entries" : "kayıt"}
          </p>
        </div>
      </div>

      {/* Filters — single row: tag chips left, category dropdown right */}
      <div className="flex items-center gap-2 mb-5">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          {tagChips.map((chip) => (
            <button
              key={chip.key}
              onClick={() => setTagFilter(chip.key)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors shrink-0 ${
                tagFilter === chip.key
                  ? "bg-[var(--mu-accent-soft)] text-[var(--mu-accent-ink)]"
                  : "border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Category dropdown */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as Category | "all")}
          className="text-[11px] font-medium px-2 py-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-secondary)] outline-none shrink-0"
        >
          <option value="all">{t.changelog.filterAll}</option>
          {ALL_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {isEn ? CATEGORY_META[cat].labelEn : CATEGORY_META[cat].labelTr}
            </option>
          ))}
        </select>
      </div>

      {/* Milestones */}
      <div className="space-y-8">
        {filtered.map((ms) => {
          const msDate = new Date(ms.date).toLocaleDateString(bcp47, { day: "numeric", month: "long", year: "numeric" });
          const entryCount = ms.days.reduce((s, d) => s + d.entries.length, 0);

          return (
            <div key={ms.version}>
              {/* Milestone header */}
              <div className="flex items-center gap-3 mb-3">
                <span className="w-8 h-8 rounded-lg bg-[var(--color-accent)]/10 text-[var(--color-accent)] flex items-center justify-center text-xs font-bold shrink-0">
                  {ms.version}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{isEn ? ms.nameEn : ms.name}</p>
                  <p className="text-[10px] text-[var(--color-text-secondary)]">
                    {msDate} · {entryCount} {isEn ? "changes" : "değişiklik"}
                  </p>
                </div>
              </div>

              {/* Days within milestone */}
              <div className="space-y-4 ml-[2.75rem]">
                {ms.days.map((day) => {
                  const dayDate = new Date(day.date).toLocaleDateString(bcp47, { day: "numeric", month: "short" });

                  return (
                    <div key={day.date}>
                      <p className="text-[11px] font-medium text-[var(--color-text-secondary)] mb-1.5">{dayDate}</p>
                      <div className="space-y-0.5 border-l-2 border-[var(--color-border)] pl-3">
                        {day.entries.map((entry, i) => (
                          <div key={i} className="flex items-start gap-2.5 py-1.5">
                            <TagDot tag={entry.tag} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm">{isEn ? entry.titleEn : entry.title}</span>
                                <TagLabel tag={entry.tag} t={t} />
                              </div>
                              <span className="text-[10px] text-[var(--color-text-secondary)]">
                                {isEn ? CATEGORY_META[entry.category].labelEn : CATEGORY_META[entry.category].labelTr}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-sm text-[var(--color-text-secondary)] py-12">
          {t.common.noResults}
        </p>
      )}
    </div>
  );
}
