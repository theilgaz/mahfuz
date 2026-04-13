/**
 * Mürşid - misyon, rehberlik modülleri ve gönüllü destek.
 */

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/premium")({
  component: PremiumPage,
});

const FREE_FEATURES = [
  {
    label: "Tüm Kuran",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    label: "Sesli kıraat",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 18v-6a9 9 0 0118 0v6" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z" />
      </svg>
    ),
  },
  {
    label: "Elifba",
    icon: (
      <span className="text-xl leading-none" style={{ fontFamily: "var(--font-arabic)" }}>اب</span>
    ),
  },
  {
    label: "10+ Meal",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
      </svg>
    ),
  },
  {
    label: "Oyunlar",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    label: "Hatim grubu",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    label: "Ayet tahlili",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
      </svg>
    ),
  },
  {
    label: "Kaide müfredatı",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
];

const MODULES = [
  {
    title: "Yapılandırılmış eğitim",
    desc: "Sıfırdan hıfza uzanan adım adım müfredat.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    title: "Birebir rehberlik",
    desc: "Uzman hoca eşliğinde kişisel ilerleme takibi.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    title: "Özelleştirilmiş müfredat",
    desc: "Denenmiş metodlarla kişiye özel yol haritası.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
      </svg>
    ),
  },
  {
    title: "İlerleme raporu",
    desc: "Telaffuz analizi ve haftalık değerlendirme.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
];

function SupportCard({ title, desc }: { title: string; desc: string }) {
  const [recurring, setRecurring] = useState(false);

  return (
    <div className="py-3 px-1 border-b border-[var(--color-border)]">
      <p className="font-semibold text-[var(--color-text-primary)] mb-1">{title}</p>
      <p className="text-sm text-[var(--color-text-secondary)] mb-4 leading-relaxed">{desc}</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-0.5 bg-[var(--color-border)]/40 rounded p-1">
          <button
            onClick={() => setRecurring(false)}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${
              !recurring
                ? "bg-[var(--color-bg)] text-[var(--color-text-primary)] shadow-sm"
                : "text-[var(--color-text-secondary)]"
            }`}
          >
            Tek seferlik
          </button>
          <button
            onClick={() => setRecurring(true)}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${
              recurring
                ? "bg-[var(--color-bg)] text-[var(--color-text-primary)] shadow-sm"
                : "text-[var(--color-text-secondary)]"
            }`}
          >
            Aylık
          </button>
        </div>
        <span className="text-xs text-[var(--color-text-secondary)] opacity-50 font-medium">Yakında</span>
      </div>
    </div>
  );
}

function Label({ children }: { children: string }) {
  return (
    <p className="text-[11px] font-semibold text-[var(--color-text-secondary)] tracking-widest mb-4 px-1">
      {children}
    </p>
  );
}

function PremiumPage() {
  return (
    <div className="max-w-3xl mx-auto pb-28">

      {/* Hero */}
      <div className="mx-4 mt-6 rounded bg-[var(--color-accent)] px-6 pt-10 pb-8 text-white text-center">
        <p className="text-xs font-semibold tracking-widest opacity-70 mb-3">Mahfuz Mürşid</p>
        <h1 className="text-4xl font-bold leading-tight tracking-tight mb-3">
          Öğrenmek<br />herkese açık.
        </h1>
        <p className="text-sm opacity-80 leading-relaxed max-w-xs mx-auto">
          Her sure, her ayet, her ses; tamamen ücretsiz. Mürşid yalnızca rehberlik için.
        </p>
      </div>

      {/* Ücretsiz özellikler */}
      <div className="px-4 mt-10">
        <Label>Her zaman ücretsiz</Label>
        <div className="grid grid-cols-4 gap-3">
          {FREE_FEATURES.map((f) => (
            <div
              key={f.label}
              className="rounded bg-[var(--color-surface)] border border-[var(--color-border)] flex flex-col items-center justify-center gap-2 py-4 px-1"
            >
              <span className="text-[var(--color-accent)]">{f.icon}</span>
              <span className="text-[10px] font-medium text-[var(--color-text-secondary)] text-center leading-tight">{f.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Rehberlik modülleri */}
      <div className="px-4 mt-10">
        <div className="flex items-center justify-between mb-4 px-1">
          <p className="text-[11px] font-semibold text-[var(--color-text-secondary)] tracking-widest">
            Rehberlik modülleri
          </p>
          <span className="text-[11px] font-medium text-[var(--color-accent)]">Yakında</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {MODULES.map((m) => (
            <div
              key={m.title}
              className="rounded bg-[var(--color-surface)] border border-[var(--color-border)] p-4"
            >
              <span className="inline-flex items-center justify-center w-10 h-10 rounded bg-[var(--color-accent)]/10 text-[var(--color-accent)] mb-3">
                {m.icon}
              </span>
              <p className="text-sm font-semibold text-[var(--color-text-primary)] leading-snug mb-1">{m.title}</p>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">{m.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Gönüllü destek */}
      <div className="px-4 mt-10">
        <Label>Gönüllü destek</Label>
        <div className="flex flex-col gap-3">
          <SupportCard
            title="Gönüllü destek"
            desc="Mahfuz'un gelişimine katkıda bulun."
          />
          <SupportCard
            title="Hafızlık öğrenci bursu"
            desc="Kuran'ı ezberlemeye çalışan bir öğrenciye destek ol."
          />
        </div>
      </div>

      {/* Dipnot */}
      <p className="text-center text-xs text-[var(--color-text-secondary)] opacity-50 leading-relaxed mt-8 px-4">
        Ödeme altyapısı henüz hazır değil. Destek seçenekleri yakında aktif olacak.
      </p>

    </div>
  );
}
