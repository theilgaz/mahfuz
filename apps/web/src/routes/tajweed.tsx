/**
 * Tecvid Öğrenme — 16 temel kural, örnekli, interaktif.
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/tajweed")({
  component: TajweedPage,
});

interface TajweedRule {
  id: string;
  name: string;
  arabic: string;
  definition: string;
  color: string;
  examples: { arabic: string; highlight: string; transliteration: string }[];
  conditions: string[];
  duration?: string;
}

const TAJWEED_RULES: TajweedRule[] = [
  {
    id: "madd-tabii",
    name: "Med-i Tabii",
    arabic: "مَدُّ طَبِيعِي",
    definition: "Uzatma harflerinin (ا و ي) olduğu yerde 2 elif (1 elif = 1 hareke süresi) uzatılır.",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    examples: [
      { arabic: "قَالَ", highlight: "ا", transliteration: "kāle" },
      { arabic: "يَقُولُ", highlight: "و", transliteration: "yekūlu" },
    ],
    conditions: ["Uzatma harfi med harfi olmalı", "Akabinde hemze veya sükun gelmemeli"],
    duration: "2 hareke",
  },
  {
    id: "madd-muttasil",
    name: "Med-i Muttasıl",
    arabic: "مَدُّ مُتَّصِل",
    definition: "Med harfinden sonra aynı kelimede hemze gelirse 4-5 hareke uzatılır.",
    color: "bg-purple-100 text-purple-700 border-purple-200",
    examples: [
      { arabic: "جَاءَ", highlight: "اء", transliteration: "cāe" },
      { arabic: "السَّمَاءِ", highlight: "اء", transliteration: "es-semāi" },
    ],
    conditions: ["Med harfi ve hemze aynı kelimede", "4 veya 5 hareke"],
    duration: "4-5 hareke",
  },
  {
    id: "madd-munfasil",
    name: "Med-i Munfasıl",
    arabic: "مَدُّ مُنْفَصِل",
    definition: "Birinci kelimenin sonunda med harfi, ikinci kelimenin başında hemze varsa 4-5 hareke.",
    color: "bg-violet-100 text-violet-700 border-violet-200",
    examples: [
      { arabic: "إِنَّا أَنْزَلْنَاهُ", highlight: "ا أ", transliteration: "innā enzelnāhu" },
    ],
    conditions: ["Med harfi ve hemze ayrı kelimelerde", "Vasl halinde 4-5 hareke"],
    duration: "4-5 hareke",
  },
  {
    id: "idgam",
    name: "İdgam",
    arabic: "إِدْغَام",
    definition: "Tenvinli harften veya nun-i sakineden sonra (ي ر م ل و ن) harfleri gelirse bu harflere katmak.",
    color: "bg-green-100 text-green-700 border-green-200",
    examples: [
      { arabic: "مِن رَّبِّهِمْ", highlight: "نر", transliteration: "mir-rabbihim" },
      { arabic: "يَوْمَئِذٍ نَّاعِمَةٌ", highlight: "نن", transliteration: "nāime" },
    ],
    conditions: ["Nun-i sakin veya tenvin", "Sonra idgam harfi (ينملو) gelir"],
  },
  {
    id: "ihfa",
    name: "İhfa",
    arabic: "إِخْفَاء",
    definition: "Nun-i sakin veya tenvinle ihfa harfleri arasında; ne tam nun ne de tam idgam — arası bir ses.",
    color: "bg-yellow-100 text-yellow-700 border-yellow-200",
    examples: [
      { arabic: "مِن قَبْلِ", highlight: "نق", transliteration: "min kable" },
      { arabic: "عَنصُرٍ", highlight: "نص", transliteration: "anṣur" },
    ],
    conditions: ["15 ihfa harfi", "Günne (genizleşme) ile okunur"],
  },
  {
    id: "izhar",
    name: "İzhar",
    arabic: "إِظْهَار",
    definition: "Nun-i sakin veya tenvinle boğaz harfleri (ء هـ ع غ ح خ) gelirse açık okunur.",
    color: "bg-orange-100 text-orange-700 border-orange-200",
    examples: [
      { arabic: "مَنْ عَمِلَ", highlight: "نع", transliteration: "men amile" },
      { arabic: "أَنْهَارٌ", highlight: "نه", transliteration: "enhārun" },
    ],
    conditions: ["6 boğaz harfi", "Günnesiz, açık okuma"],
  },
  {
    id: "iqlab",
    name: "İklab",
    arabic: "إِقْلاَب",
    definition: "Nun-i sakin veya tenvinle (ب) gelirse نُ → م gibi çevirip idgam et.",
    color: "bg-red-100 text-red-700 border-red-200",
    examples: [
      { arabic: "مِنۢ بَعْدِ", highlight: "نب", transliteration: "mim-badi" },
      { arabic: "أَنبِئُونِي", highlight: "نب", transliteration: "embiūnī" },
    ],
    conditions: ["Yalnızca (ب) harfinde", "م sesi çıkar, günne yapılır"],
  },
  {
    id: "qalqala",
    name: "Kalkalah",
    arabic: "قَلْقَلَة",
    definition: "Sükun halinde (ق ط ب ج د) harflerine güçlü titreşim/sıçrama ses verilir.",
    color: "bg-teal-100 text-teal-700 border-teal-200",
    examples: [
      { arabic: "يَلْهَثْ ذَّٰلِكَ", highlight: "ث", transliteration: "yelheẕ żālike" },
      { arabic: "قُلْ أَعُوذُ", highlight: "ل", transliteration: "kul euzu" },
    ],
    conditions: ["5 kalkalah harfi: قطبجد", "Sükun veya vakıf halinde"],
  },
  {
    id: "shaddah-ghunnah",
    name: "Şedde-i Günne",
    arabic: "شَدَّةُ الغُنَّة",
    definition: "Şeddeli م ve ن harflerine günne (2 hareke genizleşme) yapılır.",
    color: "bg-pink-100 text-pink-700 border-pink-200",
    examples: [
      { arabic: "إِنَّ", highlight: "نّ", transliteration: "inne" },
      { arabic: "ثُمَّ", highlight: "مّ", transliteration: "ṡümme" },
    ],
    conditions: ["Şeddeli م veya ن", "2 hareke günne"],
    duration: "2 hareke",
  },
  {
    id: "tafkhim",
    name: "Tefhim",
    arabic: "تَفْخِيم",
    definition: "Kalın seslendirme — ر harfi, استعلاء harfleri (خ ص ض غ ط ق ظ) ve lam-i celale uygulanır.",
    color: "bg-amber-100 text-amber-700 border-amber-200",
    examples: [
      { arabic: "اللَّهُ", highlight: "ل", transliteration: "allāhu" },
      { arabic: "الصَّلَاةُ", highlight: "ص", transliteration: "eṣ-ṣalātu" },
    ],
    conditions: ["7 isti'la harfi", "Ağız arka kısmı kullanılır"],
  },
  {
    id: "tarqiq",
    name: "Terkik",
    arabic: "تَرْقِيق",
    definition: "İnce seslendirme — isti'la harfleri dışındakilere ve bazı ر durumlarına uygulanır.",
    color: "bg-sky-100 text-sky-700 border-sky-200",
    examples: [
      { arabic: "رَحِيمٌ", highlight: "ر", transliteration: "rahīmun" },
      { arabic: "بِسْمِ", highlight: "ب", transliteration: "bismi" },
    ],
    conditions: ["Fethalı ر çoğunlukla kalın", "Kesralı ر ince"],
  },
  {
    id: "waqf-ibtida",
    name: "Vakıf ve İbtida",
    arabic: "وَقْف وَابْتِدَاء",
    definition: "Vakıf: uygun yerde durmak. İbtida: uygun yerde başlamak. Manayı bozmadan durmak esastır.",
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    examples: [
      { arabic: "لَا رَيْبَ فِيهِ", highlight: "ۛ", transliteration: "lā raybe fīhi" },
    ],
    conditions: ["مـ = gerekli vakıf", "ط = mutlak vakıf", "ج = caiz vakıf", "لا = vakıf yapma"],
  },
  {
    id: "hamzatul-wasl",
    name: "Hemze-i Vasl",
    arabic: "هَمْزَةُ الوَصْل",
    definition: "Kelimenin başındaki hemze, ortada okunurken düşer. Cümle başında okunur.",
    color: "bg-indigo-100 text-indigo-700 border-indigo-200",
    examples: [
      { arabic: "اقْرَأْ بِاسْمِ", highlight: "ا ا", transliteration: "ikra' bismi" },
    ],
    conditions: ["Vasl: hemze düşer", "İbtida: hemze okunur"],
  },
  {
    id: "idgam-mutajanisayn",
    name: "İdgam-ı Mütecaniseyn",
    arabic: "إِدْغَام مُتَجَانِسَيْن",
    definition: "Mahreçleri farklı, sıfatları aynı iki harf yan yana gelince birincisi ikinciye katılır.",
    color: "bg-rose-100 text-rose-700 border-rose-200",
    examples: [
      { arabic: "قَدْ تَبَيَّنَ", highlight: "دت", transliteration: "kat-tebeyyen" },
      { arabic: "وَقَالَت طَّائِفَةٌ", highlight: "تط", transliteration: "wekālet-tāifetun" },
    ],
    conditions: ["د→ت، ت→ط، ث→ذ çiftleri", "İkinci harfe tam katma"],
  },
  {
    id: "madd-lazim",
    name: "Med-i Lazım",
    arabic: "مَدُّ لاَزِم",
    definition: "Med harfinden sonra sükun-u lazım (kalıcı sükun) gelince 6 hareke uzatılır.",
    color: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200",
    examples: [
      { arabic: "آلۤمۤ", highlight: "ل", transliteration: "elif lām mīm" },
      { arabic: "الۤمۤر", highlight: "ل", transliteration: "elif lām mīm rā" },
    ],
    conditions: ["6 hareke — en uzun med", "Sure başı harflerinde"],
    duration: "6 hareke",
  },
  {
    id: "ra-ahkam",
    name: "Ra Harfinin Ahkamı",
    arabic: "أَحْكَامُ الرَّاء",
    definition: "ر harfi fethalı veya zammalıysa kalın; kesralı ya da öncesinde kesra varsa ince okunur.",
    color: "bg-cyan-100 text-cyan-700 border-cyan-200",
    examples: [
      { arabic: "رَبِّ", highlight: "ر", transliteration: "rabbi (kalın)" },
      { arabic: "رِزْقٌ", highlight: "ر", transliteration: "rızkun (ince)" },
    ],
    conditions: ["Fethalı/zammalı → kalın", "Kesralı → ince", "İstisnalar: استعلاء harfleriyle"],
  },
];

const CATEGORY_GROUPS = [
  { label: "Nun ve Tenvin", ids: ["idgam", "ihfa", "izhar", "iqlab"] },
  { label: "Med (Uzatma)", ids: ["madd-tabii", "madd-muttasil", "madd-munfasil", "madd-lazim"] },
  { label: "Sese Özel", ids: ["qalqala", "shaddah-ghunnah", "tafkhim", "tarqiq", "ra-ahkam"] },
  { label: "Okuma Kuralları", ids: ["waqf-ibtida", "hamzatul-wasl", "idgam-mutajanisayn"] },
];

function RuleCard({ rule, onSelect }: { rule: TajweedRule; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left flex items-start gap-3 px-4 py-3.5 rounded-xl border transition-all hover:shadow-sm ${rule.color}`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-bold">{rule.name}</p>
          {rule.duration && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/60 font-semibold">
              {rule.duration}
            </span>
          )}
        </div>
        <p className="text-xs mt-0.5 opacity-80 font-arabic" dir="rtl" lang="ar" style={{ fontFamily: "var(--font-arabic)" }}>
          {rule.arabic}
        </p>
        <p className="text-xs mt-1 opacity-70 leading-relaxed line-clamp-2">{rule.definition}</p>
      </div>
      <svg className="w-4 h-4 shrink-0 mt-0.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}

function RuleDetail({ rule, onBack }: { rule: TajweedRule; onBack: () => void }) {
  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Geri
      </button>

      {/* Başlık */}
      <div className={`px-5 py-4 rounded-2xl border ${rule.color}`}>
        <p className="text-xl font-bold">{rule.name}</p>
        <p className="text-2xl mt-1" dir="rtl" lang="ar" style={{ fontFamily: "var(--font-arabic)" }}>{rule.arabic}</p>
        {rule.duration && (
          <span className="mt-2 inline-block text-xs px-2 py-0.5 rounded-full bg-white/60 font-semibold">
            Süre: {rule.duration}
          </span>
        )}
      </div>

      {/* Tanım */}
      <div className="px-4 py-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
        <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2">Tanım</p>
        <p className="text-sm text-[var(--color-text-primary)] leading-relaxed">{rule.definition}</p>
      </div>

      {/* Koşullar */}
      <div className="px-4 py-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
        <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2">Uygulama Koşulları</p>
        <ul className="space-y-1">
          {rule.conditions.map((c, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-[var(--color-text-primary)]">
              <span className="text-[var(--color-accent)] shrink-0 font-bold">·</span>
              {c}
            </li>
          ))}
        </ul>
      </div>

      {/* Örnekler */}
      <div>
        <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2">Örnekler</p>
        <div className="space-y-2">
          {rule.examples.map((ex, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
              <div>
                <p
                  className="text-2xl text-right text-[var(--color-text-primary)]"
                  dir="rtl"
                  lang="ar"
                  style={{ fontFamily: "var(--font-arabic)" }}
                >
                  {ex.arabic}
                </p>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{ex.transliteration}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-xs text-[var(--color-text-secondary)]">Kural uygulandığı yer</p>
                <p
                  className="text-xl text-[var(--color-accent)] font-bold"
                  dir="rtl"
                  lang="ar"
                  style={{ fontFamily: "var(--font-arabic)" }}
                >
                  {ex.highlight}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TajweedPage() {
  const [selectedRule, setSelectedRule] = useState<TajweedRule | null>(null);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
      {selectedRule ? (
        <RuleDetail rule={selectedRule} onBack={() => setSelectedRule(null)} />
      ) : (
        <>
          {/* Başlık */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-2xl bg-[var(--color-accent)]/10 flex items-center justify-center text-xl">
              🎯
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Tecvid Öğren</h1>
              <p className="text-xs text-[var(--color-text-secondary)]">
                {TAJWEED_RULES.length} kural · Örnekli anlatım
              </p>
            </div>
          </div>

          {/* Gruplar */}
          {CATEGORY_GROUPS.map((group) => {
            const rules = group.ids.map((id) => TAJWEED_RULES.find((r) => r.id === id)!).filter(Boolean);
            return (
              <div key={group.label} className="mb-6">
                <h2 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2">
                  {group.label}
                </h2>
                <div className="space-y-2">
                  {rules.map((rule) => (
                    <RuleCard key={rule.id} rule={rule} onSelect={() => setSelectedRule(rule)} />
                  ))}
                </div>
              </div>
            );
          })}

          {/* Yakında: Quiz */}
          <div className="px-4 py-4 rounded-2xl border border-dashed border-[var(--color-border)] text-center">
            <p className="text-sm font-medium text-[var(--color-text-primary)] mb-1">🎮 Tecvid Quizi</p>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Öğrendiklerini test et — yakında Premium ile
            </p>
          </div>
        </>
      )}
    </div>
  );
}
