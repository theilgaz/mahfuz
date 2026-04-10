/**
 * Qaida · Temel Kuran okuma müfredatı.
 * Elifba'dan (harf tanıma) başlayıp Fatiha okumaya götüren 10 adımlı yol.
 */

import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/qaida")({
  component: QaidaPage,
});

const STEPS = [
  {
    id: 1,
    title: "Harfleri Tanı",
    subtitle: "28 Arapça harf · izole form",
    icon: "ا",
    status: "available" as const,
    link: "/alifba",
  },
  {
    id: 2,
    title: "Hareke · Kısa Sesli Harfler",
    subtitle: "Fetha (َ), Kesra (ِ), Damme (ُ)",
    icon: "بَ",
    status: "locked" as const,
    link: null,
  },
  {
    id: 3,
    title: "Sükun ve Kapalı Heceler",
    subtitle: "CVC yapısı · بَكْ, رَبْ",
    icon: "رَبْ",
    status: "locked" as const,
    link: null,
  },
  {
    id: 4,
    title: "Tenvin",
    subtitle: "Nunlama · ً ٍ ٌ",
    icon: "كِتَابًا",
    status: "locked" as const,
    link: null,
  },
  {
    id: 5,
    title: "Şedde",
    subtitle: "Şeddeleme · الله, رَبَّ",
    icon: "رَبَّ",
    status: "locked" as const,
    link: null,
  },
  {
    id: 6,
    title: "Med Harfleri",
    subtitle: "Uzatma · elif, vav, ye",
    icon: "قَالَ",
    status: "locked" as const,
    link: null,
  },
  {
    id: 7,
    title: "Bağlı Harfler",
    subtitle: "Başta, ortada, sonda form",
    icon: "بِسْمِ",
    status: "locked" as const,
    link: null,
  },
  {
    id: 8,
    title: "Kısa Kelimeler",
    subtitle: "Besmele hazırlığı",
    icon: "اللَّهِ",
    status: "locked" as const,
    link: null,
  },
  {
    id: 9,
    title: "Fatiha'yı Oku",
    subtitle: "Büyük başarı · tam sure",
    icon: "الْفَاتِحَة",
    status: "locked" as const,
    link: null,
    isMilestone: true,
  },
  {
    id: 10,
    title: "Tecvide Giriş",
    subtitle: "Okuma kuralları · ileri adım",
    icon: "تَجْوِيد",
    status: "locked" as const,
    link: "/tajweed",
  },
];

function StepCard({ step, index }: { step: (typeof STEPS)[0]; index: number }) {
  const isAvailable = step.status === "available";

  const content = (
    <div
      className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl border transition-all ${
        step.isMilestone
          ? "border-[var(--color-accent)]/40 bg-gradient-to-r from-[var(--color-accent)]/5 to-transparent"
          : isAvailable
            ? "border-[var(--color-accent)]/30 bg-[var(--color-surface)] hover:border-[var(--color-accent)] cursor-pointer"
            : "border-[var(--color-border)] bg-[var(--color-surface)]/50 opacity-60 cursor-not-allowed"
      }`}
    >
      {/* Numara */}
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
          isAvailable
            ? "bg-[var(--color-accent)]/15 text-[var(--color-accent)]"
            : "bg-[var(--color-border)]/50 text-[var(--color-text-secondary)]"
        }`}
      >
        {index + 1}
      </div>

      {/* İçerik */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${isAvailable ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-secondary)]"}`}>
          {step.title}
          {step.isMilestone && (
            <span className="ml-2 inline-flex items-center gap-0.5 text-[10px] text-[var(--color-accent)] font-bold">
              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21l1.9-5.7a8.5 8.5 0 113.8 3.8L3 21z"/></svg>
              MİLESTONE
            </span>
          )}
        </p>
        <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{step.subtitle}</p>
      </div>

      {/* Arapça örnek */}
      <span
        className={`text-xl shrink-0 ${isAvailable ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-secondary)]"}`}
        style={{ fontFamily: "var(--font-arabic)" }}
      >
        {step.icon}
      </span>

      {/* Durum */}
      {!isAvailable && (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--color-border)] shrink-0">
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      )}
    </div>
  );

  if (isAvailable && step.link) {
    return (
      <Link to={step.link as "/alifba"}>
        {content}
      </Link>
    );
  }

  return content;
}

function QaidaPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
      {/* Başlık */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Qaida</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          Sıfırdan Fatiha'ya, 10 adımlı temel okuma yolculuğu
        </p>
      </div>

      {/* İlerleme özeti */}
      <div className="mb-5 flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-[var(--color-text-secondary)]">İlerleme</span>
            <span className="text-xs font-medium text-[var(--color-accent)]">1 / 10</span>
          </div>
          <div className="h-1.5 rounded-full bg-[var(--color-border)]">
            <div className="h-full rounded-full bg-[var(--color-accent)]" style={{ width: "10%" }} />
          </div>
        </div>
      </div>

      {/* Adımlar */}
      <div className="space-y-2">
        {STEPS.map((step, i) => (
          <StepCard key={step.id} step={step} index={i} />
        ))}
      </div>

      {/* Açıklama */}
      <div className="mt-6 p-4 rounded-xl border border-[var(--color-accent)]/20 bg-[var(--color-accent)]/5 text-sm text-[var(--color-text-secondary)] leading-relaxed">
        <strong className="text-[var(--color-accent)] block mb-1">Qaida nedir?</strong>
        Arapça harfleri birleştirerek kelime okumanın temeli. Elifba'yı (harfleri) tanıdıktan sonra bu 10 adımı tamamlayan her kullanıcı Fatiha suresini kendi başına okuyabilir.
      </div>

      {/* Tecvid bağlantısı */}
      <Link
        to="/tajweed"
        className="mt-4 flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)]/50 transition-colors"
      >
        <div className="w-8 h-8 rounded-xl bg-[var(--color-accent)]/10 flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-[var(--color-text-primary)]">Tecvid Kuralları</p>
          <p className="text-xs text-[var(--color-text-secondary)]">16 kural, örnekli anlatım</p>
        </div>
        <svg className="w-4 h-4 text-[var(--color-text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  );
}
