/**
 * Tecvid Öğrenme — 16 temel kural, örnekli, interaktif.
 */

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "~/hooks/useTranslation";

export const Route = createFileRoute("/tajweed")({
  component: TajweedPage,
});

interface TajweedRule {
  id: string;
  name: string;
  arabic: string;
  definition: string;
  accent: string; // hex color
  examples: { arabic: string; highlight: string; transliteration: string }[];
  conditions: string[];
  duration?: string;
}

type T = ReturnType<typeof useTranslation>["t"];

const STATIC_RULE_DATA: {
  id: string;
  arabic: string;
  accent: string;
  examples: { arabic: string; highlight: string; transliteration: string }[];
  duration?: string;
  nameKey: keyof T["tajweedPage"];
  defKey: keyof T["tajweedPage"];
  condsKey: keyof T["tajweedPage"];
}[] = [
  {
    id: "madd-tabii",
    arabic: "مَدُّ طَبِيعِي",
    accent: "#7C9CBF",
    examples: [
      { arabic: "قَالَ", highlight: "ا", transliteration: "kāle" },
      { arabic: "يَقُولُ", highlight: "و", transliteration: "yekūlu" },
    ],
    duration: "2 haraka",
    nameKey: "maddTabiiName",
    defKey: "maddTabiiDef",
    condsKey: "maddTabiiConds",
  },
  {
    id: "madd-muttasil",
    arabic: "مَدُّ مُتَّصِل",
    accent: "#E05555",
    examples: [
      { arabic: "جَاءَ", highlight: "اء", transliteration: "cāe" },
      { arabic: "السَّمَاءِ", highlight: "اء", transliteration: "es-semāi" },
    ],
    duration: "4-5 haraka",
    nameKey: "maddMuttasilName",
    defKey: "maddMuttasilDef",
    condsKey: "maddMuttasilConds",
  },
  {
    id: "madd-munfasil",
    arabic: "مَدُّ مُنْفَصِل",
    accent: "#C0602A",
    examples: [
      { arabic: "إِنَّا أَنْزَلْنَاهُ", highlight: "ا أ", transliteration: "innā enzelnāhu" },
    ],
    duration: "4-5 haraka",
    nameKey: "maddMunfasilName",
    defKey: "maddMunfasilDef",
    condsKey: "maddMunfasilConds",
  },
  {
    id: "madd-lazim",
    arabic: "مَدُّ لاَزِم",
    accent: "#8B2020",
    examples: [
      { arabic: "آلۤمۤ", highlight: "ل", transliteration: "elif lām mīm" },
      { arabic: "الۤمۤر", highlight: "ل", transliteration: "elif lām mīm rā" },
    ],
    duration: "6 haraka",
    nameKey: "maddLazimName",
    defKey: "maddLazimDef",
    condsKey: "maddLazimConds",
  },
  {
    id: "idgam",
    arabic: "إِدْغَام",
    accent: "#2E7D32",
    examples: [
      { arabic: "مِن رَّبِّهِمْ", highlight: "نر", transliteration: "mir-rabbihim" },
      { arabic: "يَوْمَئِذٍ نَّاعِمَةٌ", highlight: "نن", transliteration: "nāime" },
    ],
    nameKey: "idgamName",
    defKey: "idgamDef",
    condsKey: "idgamConds",
  },
  {
    id: "ihfa",
    arabic: "إِخْفَاء",
    accent: "#558B2F",
    examples: [
      { arabic: "مِن قَبْلِ", highlight: "نق", transliteration: "min kable" },
      { arabic: "عَنصُرٍ", highlight: "نص", transliteration: "anṣur" },
    ],
    nameKey: "ihfaName",
    defKey: "ihfaDef",
    condsKey: "ihfaConds",
  },
  {
    id: "izhar",
    arabic: "إِظْهَار",
    accent: "#5C6BC0",
    examples: [
      { arabic: "مَنْ عَمِلَ", highlight: "نع", transliteration: "men amile" },
      { arabic: "أَنْهَارٌ", highlight: "نه", transliteration: "enhārun" },
    ],
    nameKey: "izharName",
    defKey: "izharDef",
    condsKey: "izharConds",
  },
  {
    id: "iqlab",
    arabic: "إِقْلاَب",
    accent: "#00ACC1",
    examples: [
      { arabic: "مِنۢ بَعْدِ", highlight: "نب", transliteration: "mim-badi" },
      { arabic: "أَنبِئُونِي", highlight: "نب", transliteration: "embiūnī" },
    ],
    nameKey: "iqlabName",
    defKey: "iqlabDef",
    condsKey: "iqlabConds",
  },
  {
    id: "qalqala",
    arabic: "قَلْقَلَة",
    accent: "#1565C0",
    examples: [
      { arabic: "يَلْهَثْ ذَّٰلِكَ", highlight: "ث", transliteration: "yelheẕ żālike" },
      { arabic: "قُلْ أَعُوذُ", highlight: "ل", transliteration: "kul euzu" },
    ],
    nameKey: "qalqalaName",
    defKey: "qalqalaDef",
    condsKey: "qalqalaConds",
  },
  {
    id: "shaddah-ghunnah",
    arabic: "شَدَّةُ الغُنَّة",
    accent: "#AD1457",
    examples: [
      { arabic: "إِنَّ", highlight: "نّ", transliteration: "inne" },
      { arabic: "ثُمَّ", highlight: "مّ", transliteration: "ṡümme" },
    ],
    duration: "2 haraka",
    nameKey: "shaddahGhunnahName",
    defKey: "shaddahGhunnahDef",
    condsKey: "shaddahGhunnahConds",
  },
  {
    id: "tafkhim",
    arabic: "تَفْخِيم",
    accent: "#E65100",
    examples: [
      { arabic: "اللَّهُ", highlight: "ل", transliteration: "allāhu" },
      { arabic: "الصَّلَاةُ", highlight: "ص", transliteration: "eṣ-ṣalātu" },
    ],
    nameKey: "tafkhimName",
    defKey: "tafkhimDef",
    condsKey: "tafkhimConds",
  },
  {
    id: "tarqiq",
    arabic: "تَرْقِيق",
    accent: "#00838F",
    examples: [
      { arabic: "رَحِيمٌ", highlight: "ر", transliteration: "rahīmun" },
      { arabic: "بِسْمِ", highlight: "ب", transliteration: "bismi" },
    ],
    nameKey: "tarqiqName",
    defKey: "tarqiqDef",
    condsKey: "tarqiqConds",
  },
  {
    id: "waqf-ibtida",
    arabic: "وَقْف وَابْتِدَاء",
    accent: "#2E7D32",
    examples: [
      { arabic: "لَا رَيْبَ فِيهِ", highlight: "ۛ", transliteration: "lā raybe fīhi" },
    ],
    nameKey: "waqfIbtidaName",
    defKey: "waqfIbtidaDef",
    condsKey: "waqfIbtidaConds",
  },
  {
    id: "hamzatul-wasl",
    arabic: "هَمْزَةُ الوَصْل",
    accent: "#757575",
    examples: [
      { arabic: "اقْرَأْ بِاسْمِ", highlight: "ا ا", transliteration: "ikra' bismi" },
    ],
    nameKey: "hamzatulWaslName",
    defKey: "hamzatulWaslDef",
    condsKey: "hamzatulWaslConds",
  },
  {
    id: "idgam-mutajanisayn",
    arabic: "إِدْغَام مُتَجَانِسَيْن",
    accent: "#546E7A",
    examples: [
      { arabic: "قَدْ تَبَيَّنَ", highlight: "دت", transliteration: "kat-tebeyyen" },
      { arabic: "وَقَالَت طَّائِفَةٌ", highlight: "تط", transliteration: "wekālet-tāifetun" },
    ],
    nameKey: "idgamMutajanisaynName",
    defKey: "idgamMutajanisaynDef",
    condsKey: "idgamMutajanisaynConds",
  },
  {
    id: "ra-ahkam",
    arabic: "أَحْكَامُ الرَّاء",
    accent: "#6A1E8A",
    examples: [
      { arabic: "رَبِّ", highlight: "ر", transliteration: "rabbi (heavy)" },
      { arabic: "رِزْقٌ", highlight: "ر", transliteration: "rızkun (light)" },
    ],
    nameKey: "raAhkamName",
    defKey: "raAhkamDef",
    condsKey: "raAhkamConds",
  },
];

function makeRules(t: T): TajweedRule[] {
  return STATIC_RULE_DATA.map((r) => ({
    id: r.id,
    arabic: r.arabic,
    accent: r.accent,
    examples: r.examples,
    duration: r.duration,
    name: t.tajweedPage[r.nameKey] as string,
    definition: t.tajweedPage[r.defKey] as string,
    conditions: (t.tajweedPage[r.condsKey] as string).split("|||"),
  }));
}

function makeCategories(t: T) {
  return [
    { label: t.tajweedPage.catNunTanween, ids: ["idgam", "ihfa", "izhar", "iqlab"] },
    { label: t.tajweedPage.catMadd, ids: ["madd-tabii", "madd-muttasil", "madd-munfasil", "madd-lazim"] },
    { label: t.tajweedPage.catSpecial, ids: ["qalqala", "shaddah-ghunnah", "tafkhim", "tarqiq", "ra-ahkam"] },
    { label: t.tajweedPage.catReading, ids: ["waqf-ibtida", "hamzatul-wasl", "idgam-mutajanisayn"] },
  ];
}

// hex → rgba helper
function alpha(hex: string, a: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function RuleCard({ rule, onSelect }: { rule: TajweedRule; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className="w-full text-left flex items-center gap-0 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:shadow-sm active:scale-[0.99] transition-all duration-150 overflow-hidden"
    >
      {/* Arabic badge */}
      <div
        className="w-14 self-stretch flex items-center justify-center shrink-0"
        style={{ backgroundColor: alpha(rule.accent, 0.08) }}
      >
        <span
          className="text-sm leading-none font-bold"
          dir="rtl"
          lang="ar"
          style={{ fontFamily: "var(--font-arabic)", color: rule.accent }}
        >
          {rule.arabic.split(" ")[0]}
        </span>
      </div>

      {/* Separator */}
      <div className="w-px self-stretch" style={{ backgroundColor: "var(--color-border)" }} />

      {/* Content */}
      <div className="flex-1 min-w-0 px-4 py-3.5">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <p className="text-sm font-semibold text-[var(--color-text-primary)]">{rule.name}</p>
          {rule.duration && (
            <span
              className="text-[9px] px-1.5 py-0.5 rounded-full font-bold tracking-wide shrink-0"
              style={{ backgroundColor: alpha(rule.accent, 0.12), color: rule.accent }}
            >
              {rule.duration}
            </span>
          )}
        </div>
        <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed line-clamp-1">
          {rule.definition}
        </p>
      </div>

      <svg className="w-4 h-4 text-[var(--color-border)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}

function RuleDetail({ rule, onBack, t }: { rule: TajweedRule; onBack: () => void; t: T }) {
  return (
    <div className="space-y-3">
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors mb-1"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        {t.tajweedPage.back}
      </button>

      {/* Hero */}
      <div
        className="rounded-2xl px-5 pt-5 pb-4 border"
        style={{
          background: `linear-gradient(135deg, ${alpha(rule.accent, 0.08)} 0%, ${alpha(rule.accent, 0.03)} 100%)`,
          borderColor: alpha(rule.accent, 0.25),
        }}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <p className="text-lg font-bold text-[var(--color-text-primary)] leading-tight">{rule.name}</p>
            {rule.duration && (
              <span
                className="mt-1.5 inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold tracking-wide"
                style={{ backgroundColor: alpha(rule.accent, 0.15), color: rule.accent }}
              >
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                </svg>
                {rule.duration}
              </span>
            )}
          </div>
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: alpha(rule.accent, 0.12) }}
          >
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: rule.accent }}
            />
          </div>
        </div>

        {/* Arabic */}
        <div className="text-center py-5 border-t border-b" style={{ borderColor: alpha(rule.accent, 0.15) }}>
          <p
            className="text-4xl leading-loose"
            dir="rtl"
            lang="ar"
            style={{ fontFamily: "var(--font-arabic)", color: rule.accent }}
          >
            {rule.arabic}
          </p>
        </div>

        {/* Definition */}
        <p className="mt-4 text-sm text-[var(--color-text-primary)] leading-relaxed">
          {rule.definition}
        </p>
      </div>

      {/* Conditions */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
        <div className="px-4 py-2.5 border-b border-[var(--color-border)] flex items-center gap-2">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: rule.accent }}>
            <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
          </svg>
          <p className="text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
            {t.tajweedPage.sectionConditions}
          </p>
        </div>
        <ul className="divide-y divide-[var(--color-border)]">
          {rule.conditions.map((c, i) => (
            <li key={i} className="flex items-start gap-3 px-4 py-3">
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5"
                style={{ backgroundColor: alpha(rule.accent, 0.12), color: rule.accent }}
              >
                {i + 1}
              </span>
              <span className="text-sm text-[var(--color-text-primary)] leading-relaxed">{c}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Examples */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
        <div className="px-4 py-2.5 border-b border-[var(--color-border)] flex items-center gap-2">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: rule.accent }}>
            <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
          </svg>
          <p className="text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
            {t.tajweedPage.sectionExamples}
          </p>
        </div>
        <div className="divide-y divide-[var(--color-border)]">
          {rule.examples.map((ex, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-4">
              {/* Full verse */}
              <div className="flex-1 min-w-0">
                <p
                  className="text-2xl text-[var(--color-text-primary)] leading-loose"
                  dir="rtl"
                  lang="ar"
                  style={{ fontFamily: "var(--font-arabic)" }}
                >
                  {ex.arabic}
                </p>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 font-mono">{ex.transliteration}</p>
              </div>

              {/* Highlighted letters */}
              <div className="shrink-0 text-center">
                <p className="text-[10px] text-[var(--color-text-secondary)] mb-1">{t.tajweedPage.ruleApplied}</p>
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: alpha(rule.accent, 0.1) }}
                >
                  <span
                    className="text-xl font-bold"
                    dir="rtl"
                    lang="ar"
                    style={{ fontFamily: "var(--font-arabic)", color: rule.accent }}
                  >
                    {ex.highlight}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TajweedPage() {
  const { t } = useTranslation();
  const [selectedRule, setSelectedRule] = useState<TajweedRule | null>(null);

  const TAJWEED_RULES = makeRules(t);
  const CATEGORY_GROUPS = makeCategories(t);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
      {selectedRule ? (
        <RuleDetail rule={selectedRule} onBack={() => setSelectedRule(null)} t={t} />
      ) : (
        <>
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-[var(--color-accent)]/10 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--color-text-primary)]">{t.tajweedPage.title}</h1>
              <p className="text-xs text-[var(--color-text-secondary)]">
                {t.tajweedPage.subtitle.replace("{count}", String(TAJWEED_RULES.length))}
              </p>
            </div>
          </div>

          {/* Categories */}
          {CATEGORY_GROUPS.map((group) => {
            const rules = group.ids.map((id) => TAJWEED_RULES.find((r) => r.id === id)!).filter(Boolean);
            return (
              <div key={group.label} className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                    {group.label}
                  </h2>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)] font-medium">
                    {rules.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {rules.map((rule) => (
                    <RuleCard key={rule.id} rule={rule} onSelect={() => setSelectedRule(rule)} />
                  ))}
                </div>
              </div>
            );
          })}

          {/* Quiz teaser */}
          <div className="px-5 py-4 rounded-2xl border border-dashed border-[var(--color-border)] flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-[var(--color-text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="2" y="6" width="20" height="12" rx="3"/><path d="M6 12h4M8 10v4"/><circle cx="15" cy="11" r="1"/><circle cx="18" cy="13" r="1"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">{t.tajweedPage.quizTitle}</p>
              <p className="text-xs text-[var(--color-text-secondary)]">{t.tajweedPage.quizDesc}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
