/**
 * Mürşid - misyon, rehberlik modülleri ve gönüllü destek.
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "~/hooks/useTranslation";
import { Ornament } from "~/components/minimal-ui/Ornament";
import { staticHead } from "~/lib/seo";

export const Route = createFileRoute("/premium")({
  head: () => staticHead("premium"),
  component: PremiumPage,
});

function PremiumPage() {
  const { t } = useTranslation();

  return (
    <div className="mu-home">
      {/* Hero */}
      <header style={{ textAlign: "center", padding: "48px 0 32px" }}>
        <p className="mu-eyebrow" style={{ justifyContent: "center" }}>
          <span className="mu-eb-line" />
          {t.premium.heroLabel}
          <span className="mu-eb-line" />
        </p>
        <h1 className="mu-display" style={{ fontSize: "clamp(32px, 5vw, 48px)", marginTop: 12 }}>
          {t.premium.heroTitle.split("\n").map((line, i) => (
            <span key={i}>
              {i > 0 && <br />}
              {line}
            </span>
          ))}
        </h1>
        <p className="mu-muted" style={{ fontSize: 15, lineHeight: 1.6, maxWidth: 360, margin: "12px auto 0" }}>
          {t.premium.heroDesc}
        </p>
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 24 }}>
          <Ornament size={20} />
        </div>
      </header>

      {/* Free features */}
      <section style={{ paddingBottom: 32 }}>
        <p className="mu-eyebrow" style={{ marginBottom: 16 }}>
          <span className="mu-eb-line" />
          {t.premium.freeForever}
        </p>
        <div className="mu-premium-grid">
          {FREE_FEATURES.map((f) => (
            <div key={f.labelKey} className="mu-premium-card">
              <span className="mu-premium-card-icon">{f.icon}</span>
              <span className="mu-premium-card-label">{t.premium[f.labelKey]}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Guidance modules */}
      <section style={{ paddingBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <p className="mu-eyebrow" style={{ margin: 0 }}>
            <span className="mu-eb-line" />
            {t.premium.guidanceModules}
          </p>
          <span style={{ fontFamily: "var(--mu-ff-mono)", fontSize: 11, letterSpacing: "0.06em", color: "var(--mu-accent)", textTransform: "uppercase" }}>
            {t.premium.comingSoon}
          </span>
        </div>
        <div className="mu-premium-modules">
          {MODULES.map((m) => (
            <div key={m.titleKey} className="mu-premium-module">
              <span className="mu-premium-module-icon">{m.icon}</span>
              <div>
                <p style={{ fontSize: 14, fontWeight: 500, color: "var(--mu-ink)", marginBottom: 4 }}>
                  {t.premium[m.titleKey]}
                </p>
                <p className="mu-muted" style={{ fontSize: 12, lineHeight: 1.5 }}>
                  {t.premium[m.descKey]}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Voluntary support */}
      <section style={{ paddingBottom: 32 }}>
        <p className="mu-eyebrow" style={{ marginBottom: 16 }}>
          <span className="mu-eb-line" />
          {t.premium.voluntarySupport}
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <SupportRow
            title={t.premium.voluntarySupport}
            desc={t.premium.voluntarySupportDesc}
            comingSoon={t.premium.comingSoon}
          />
          <SupportRow
            title={t.premium.scholarshipTitle}
            desc={t.premium.scholarshipDesc}
            comingSoon={t.premium.comingSoon}
          />
        </div>
      </section>

      {/* Footer note */}
      <p className="mu-muted" style={{ textAlign: "center", fontSize: 12, lineHeight: 1.6, opacity: 0.7, paddingBottom: 24 }}>
        {t.premium.paymentNote}
      </p>

      {/* Back */}
      <div style={{ display: "flex", justifyContent: "center", paddingBottom: 48 }}>
        <Link to="/" className="mu-btn ghost">
          Ana sayfa
        </Link>
      </div>
    </div>
  );
}

/* ── Support row ── */

function SupportRow({ title, desc, comingSoon }: { title: string; desc: string; comingSoon: string }) {
  return (
    <div style={{
      padding: "16px 20px",
      borderRadius: 8,
      border: "1px solid var(--mu-line)",
      background: "var(--mu-bg-card)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <p style={{ fontSize: 14, fontWeight: 500, color: "var(--mu-ink)" }}>{title}</p>
        <span style={{ fontFamily: "var(--mu-ff-mono)", fontSize: 10, letterSpacing: "0.06em", color: "var(--mu-muted)", textTransform: "uppercase" }}>
          {comingSoon}
        </span>
      </div>
      <p className="mu-muted" style={{ fontSize: 13, lineHeight: 1.5 }}>{desc}</p>
    </div>
  );
}

/* ── Data ── */

const FREE_FEATURES = [
  {
    labelKey: "fullQuran" as const,
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    labelKey: "audioRecitation" as const,
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 18v-6a9 9 0 0118 0v6" />
        <path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z" />
      </svg>
    ),
  },
  {
    labelKey: "alifba" as const,
    icon: (
      <span style={{ fontFamily: "var(--mu-ff-ar)", fontSize: 20, lineHeight: 1 }}>اب</span>
    ),
  },
  {
    labelKey: "tenTranslations" as const,
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
      </svg>
    ),
  },
  {
    labelKey: "games" as const,
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    labelKey: "khatmGroup" as const,
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    labelKey: "verseAnalysis" as const,
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
      </svg>
    ),
  },
  {
    labelKey: "qaidaCurriculum" as const,
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
];

const MODULES = [
  {
    titleKey: "structuredEducation" as const,
    descKey: "structuredEducationDesc" as const,
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    titleKey: "personalGuidance" as const,
    descKey: "personalGuidanceDesc" as const,
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    titleKey: "customCurriculum" as const,
    descKey: "customCurriculumDesc" as const,
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
      </svg>
    ),
  },
  {
    titleKey: "progressReport" as const,
    descKey: "progressReportDesc" as const,
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
];
