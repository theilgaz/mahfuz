/**
 * Alifba page -- encouraging, approachable Quran reading journey.
 * Timeline with concrete Mim-based examples per step.
 */

import { useEffect, useRef, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "~/hooks/useTranslation";
import { useQaidaStore } from "~/stores/qaida.store";
import {
  STEPS,
  useStepStatuses,
  getLessonLinkForStep,
  type StepStatus,
} from "~/lib/qaida-roadmap";

/* ── Step examples (Mim-based) ─────────────────────── */

/** Each word pair: [arabic, latin]. Alternating colors applied per word. */
export const STEP_EXAMPLES: Record<number, { words: [string, string][]; desc: string }> = {
  1:  { words: [["ا","elif"], ["ب","be"], ["ت","te"], ["م","mim"]],
       desc: "28 Arapça harfi tek tek tanıyorsun." },
  2:  { words: [["مَ","me"], ["مِ","mi"], ["مُ","mu"]],
       desc: "Harflere hareke koyarak seslendir: fetha (üstün), kesra (esre), damme (ötre)." },
  3:  { words: [["مَكْ","mek"], ["رَبْ","rab"]],
       desc: "Sükun (cezim) ile harfi sessiz bırakmayı öğrenirsin." },
  4:  { words: [["كِتَابًا","kitaben"], ["عِلْمٍ","ilmin"]],
       desc: "Tenvin (nunlama): kelimenin sonuna -en, -in, -un sesi ekler." },
  5:  { words: [["رَبَّ","rabbe"], ["اللَّه","Allah"]],
       desc: "Şedde (teşdid): harfi iki kez okur gibi vurgularsın." },
  6:  { words: [["قَالَ","kale"], ["يَقُولُ","yekulu"]],
       desc: "Med harfleri (elif, vav, ye) ile sesi uzatırsın." },
  7:  { words: [["بِسْمِ","bismi"]],
       desc: "Harflerin başa, ortaya ve sona göre birleşen formlarını öğrenirsin." },
  8:  { words: [["اللّٰهِ","Allahi"], ["الرَّحْمٰنِ","er-Rahmani"]],
       desc: "Öğrendiklerini birleştirip kısa kelimeler okursun." },
  9:  { words: [["اَلْفَاتِحَة","el-Fatiha"]],
       desc: "Kur'an'ın ilk suresini baştan sona kendin okursun." },
  10: { words: [["تَجْوِيد","tecvid"]],
       desc: "Harfleri doğru mahrecinden, kurallarına göre güzel okursun." },
};

/* ── Motivational quotes ───────────────────────────── */

const QUOTES = [
  {
    words: [
      ["\u062E\u064E\u064A\u0652\u0631\u064F\u0643\u064F\u0645\u0652", "hayrukum"],
      ["\u0645\u064E\u0646\u0652", "men"],
      ["\u062A\u064E\u0639\u064E\u0644\u0651\u064E\u0645\u064E", "tealleme"],
      ["\u0627\u0644\u0652\u0642\u064F\u0631\u0652\u0622\u0646\u064E", "el-Kur'\u00E2ne"],
      ["\u0648\u064E\u0639\u064E\u0644\u0651\u064E\u0645\u064E\u0647\u064F", "ve allemeh\u00FC"],
    ] as [string, string][],
    tr: "Sizin en hay\u0131rl\u0131n\u0131z, Kur'an'\u0131 \u00F6\u011Frenen ve \u00F6\u011Fretendir.",
    ravi: "Hz. Osman b. Affan (r.a.)",
    kaynak: "Buhari",
    senet: "Fez\u00E2il\u00FCl-Kur'\u00E2n, 21",
  },
  {
    words: [
      ["\u0648\u064E\u0627\u0644\u0651\u064E\u0630\u0650\u064A", "vellezi"],
      ["\u064A\u064E\u0642\u0652\u0631\u064E\u0623\u064F", "yakre\u00FC"],
      ["\u0627\u0644\u0652\u0642\u064F\u0631\u0652\u0622\u0646\u064E", "el-Kur'\u00E2ne"],
      ["\u0648\u064E\u064A\u064E\u062A\u064E\u062A\u064E\u0639\u0652\u062A\u064E\u0639\u064F", "ve yetetea'teu"],
      ["\u0641\u0650\u064A\u0647\u0650", "f\u00EEhi"],
      ["\u0648\u064E\u0647\u064F\u0648\u064E", "ve h\u00FCve"],
      ["\u0639\u064E\u0644\u064E\u064A\u0652\u0647\u0650", "aleyhi"],
      ["\u0634\u064E\u0627\u0642\u0651\u064C", "\u015F\u00E2kkun"],
      ["\u0644\u064E\u0647\u064F", "leh\u00FC"],
      ["\u0623\u064E\u062C\u0652\u0631\u064E\u0627\u0646\u0650", "ecr\u00E2ni"],
    ] as [string, string][],
    tr: "Kur'an'\u0131 zorlanarak okuyan\u0131n iki ecri vard\u0131r.",
    ravi: "Hz. Ai\u015Fe (r.anha)",
    kaynak: "M\u00FCslim",
    senet: "M\u00FCs\u00E2fir\u00EEn, 244",
  },
];

/* ── Timeline Step ─────────────────────────────────── */

function TimelineStep({
  step,
  status,
  isActive,
  isLast,
  completedLessons,
}: {
  step: typeof STEPS[number];
  status: StepStatus;
  isActive: boolean;
  isLast: boolean;
  completedLessons: Set<string>;
}) {
  const { t } = useTranslation();
  const rowRef = useRef<HTMLDivElement>(null);

  const lessonLink = getLessonLinkForStep(step.id, completedLessons);
  const titleText = (t.hub as unknown as Record<string, string>)?.[step.titleKey] ?? step.titleKey;
  const example = STEP_EXAMPLES[step.id];

  const stepLink = step.id === 1
    ? "/alifba/letters"
    : step.id === 10
    ? "/tajweed"
    : `/alifba/step/${step.id}`;

  useEffect(() => {
    if (isActive && rowRef.current) {
      rowRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [isActive]);

  const inner = (
    <div
      ref={rowRef}
      className={[
        "mu-tl-step",
        status,
        isActive ? "active" : "",
      ].join(" ")}
    >
      {/* Timeline dot + line */}
      <div className="mu-tl-track">
        <div className={`mu-tl-dot ${status}`}>
          {status === "completed" ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <span>{step.id}</span>
          )}
        </div>
        {!isLast && <div className={`mu-tl-line ${status === "completed" ? "done" : ""}`} />}
      </div>

      {/* Content */}
      <div className="mu-tl-content">
        <p className="mu-tl-title">{titleText}</p>
        {example && (
          <>
            <p className="mu-tl-hint">{example.desc}</p>
            <div className="mu-tl-words" dir="rtl">
              {example.words.map(([ar, lat], wi) => (
                <div key={wi} className={`mu-tl-word ${wi % 2 === 0 ? "a" : "b"}`}>
                  <span className="mu-tl-word-ar">{ar}</span>
                  <span className="mu-tl-word-lat">{lat}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );

  if (status === "locked" || !stepLink) return inner;
  return <Link to={stepLink as string} style={{ textDecoration: "none", color: "inherit" }}>{inner}</Link>;
}

/* ── Quote Card ────────────────────────────────────── */

function QuoteCard({ quote }: { quote: typeof QUOTES[number] }) {
  return (
    <blockquote className="mu-tl-quote">
      <div className="mu-tl-quote-wbw" dir="rtl">
        {quote.words.map(([ar, lat], i) => (
          <div key={i} className="mu-tl-quote-word">
            <span className="mu-tl-quote-word-ar">{ar}</span>
            <span className="mu-tl-quote-word-lat">{lat}</span>
          </div>
        ))}
      </div>
      <p className="mu-tl-quote-tr">{quote.tr}</p>
      <footer className="mu-tl-quote-src">
        <span className="mu-tl-quote-label">Ravi:</span> {quote.ravi}
        <br />
        <span className="mu-tl-quote-label">Kaynak:</span> {quote.kaynak}, {quote.senet}
      </footer>
    </blockquote>
  );
}

/* ── Main Page ──────────────────────────────────────── */

export function AlifbaPage() {
  const { t } = useTranslation();
  const statuses = useStepStatuses();
  const lessonProgress = useQaidaStore((s) => s.lessonProgress);
  const completedLessons = useMemo(() => new Set(Object.keys(lessonProgress)), [lessonProgress]);

  const activeIdx = statuses.findIndex((s) => s === "available");

  return (
    <div className="mu-roadmap">
      {/* Hero */}
      <div className="mu-tl-hero">
        <h1 className="mu-roadmap-title">
          {t.hub?.roadmapTitle ?? "Kur'an Okuma Yolculuğun"}
        </h1>
        <p className="mu-tl-hero-sub">
          10 kısa adımda, sıfırdan Fatiha okumaya.
          {" "}Her adım bir öncekinin üstüne biner.
          {" "}Düşündüğünden çok daha kolay.
        </p>
      </div>

      {/* First quote - motivation before starting */}
      <QuoteCard quote={QUOTES[0]} />

      {/* Timeline */}
      <div className="mu-tl-path">
        {STEPS.map((step, i) => (
          <TimelineStep
            key={step.id}
            step={step}
            status={statuses[i]}
            isActive={i === activeIdx}
            isLast={i === STEPS.length - 1}
            completedLessons={completedLessons}
          />
        ))}
      </div>

      {/* Second quote - encouragement for those who struggle */}
      <QuoteCard quote={QUOTES[1]} />

      {/* Closing encouragement */}
      <p className="mu-tl-closing">
        Burada olman bile büyük bir adım.
        Kur'an'ı öğrenmeye niyet eden, yolun yarısını geçmiştir.
      </p>
    </div>
  );
}
