/**
 * Qaida - Temel Kuran okuma mufredati.
 * Elifba'dan (harf tanima) baslayip Fatiha okumaya goturen 10 adimli yol.
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useAlifbaStore, computeAlifbaStats } from "~/stores/alifba.store";
import { useQaidaStore } from "~/stores/qaida.store";
import { useTranslation } from "~/hooks/useTranslation";
import { useEffect } from "react";

export const Route = createFileRoute("/qaida/")({
  component: QaidaPage,
});

interface StepDef {
  id: number;
  titleKey: string;
  subtitleKey: string;
  icon: string;
  link: string | null;
  examLink: string | null;
  isMilestone?: boolean;
}

const STEPS: StepDef[] = [
  { id: 1, titleKey: "qaidaStep1", subtitleKey: "qaidaStep1Desc", icon: "\u0627", link: "/alifba", examLink: "/alifba/exam" },
  { id: 2, titleKey: "qaidaStep2", subtitleKey: "qaidaStep2Desc", icon: "\u0628\u064E", link: null, examLink: "/qaida/exam/2" },
  { id: 3, titleKey: "qaidaStep3", subtitleKey: "qaidaStep3Desc", icon: "\u0631\u064E\u0628\u0652", link: null, examLink: null },
  { id: 4, titleKey: "qaidaStep4", subtitleKey: "qaidaStep4Desc", icon: "\u0643\u0650\u062A\u064E\u0627\u0628\u064B\u0627", link: null, examLink: null },
  { id: 5, titleKey: "qaidaStep5", subtitleKey: "qaidaStep5Desc", icon: "\u0631\u064E\u0628\u064E\u0651", link: null, examLink: null },
  { id: 6, titleKey: "qaidaStep6", subtitleKey: "qaidaStep6Desc", icon: "\u0642\u064E\u0627\u0644\u064E", link: null, examLink: null },
  { id: 7, titleKey: "qaidaStep7", subtitleKey: "qaidaStep7Desc", icon: "\u0628\u0650\u0633\u0652\u0645\u0650", link: null, examLink: null },
  { id: 8, titleKey: "qaidaStep8", subtitleKey: "qaidaStep8Desc", icon: "\u0627\u0644\u0644\u0651\u064E\u0647\u0650", link: null, examLink: null },
  { id: 9, titleKey: "qaidaStep9", subtitleKey: "qaidaStep9Desc", icon: "\u0627\u0644\u0652\u0641\u064E\u0627\u062A\u0650\u062D\u064E\u0629", link: null, examLink: null, isMilestone: true },
  { id: 10, titleKey: "qaidaStep10", subtitleKey: "qaidaStep10Desc", icon: "\u062A\u064E\u062C\u0652\u0648\u0650\u064A\u062F", link: "/tajweed", examLink: null },
];

type StepStatus = "completed" | "available" | "locked";

function useStepStatuses(): StepStatus[] {
  const alifbaState = useAlifbaStore();
  const { completedSteps, completeStep } = useQaidaStore();
  const completedSet = new Set(completedSteps);

  const { mastered } = computeAlifbaStats(alifbaState);
  const elifbaComplete = mastered >= 28;

  // Step 1 otomatik complete: 28 harf mastered ise
  useEffect(() => {
    if (elifbaComplete && !completedSet.has(1)) {
      completeStep(1);
    }
  }, [elifbaComplete]); // eslint-disable-line react-hooks/exhaustive-deps

  return STEPS.map((step) => {
    if (completedSet.has(step.id)) return "completed";
    // Step 1 her zaman acik
    if (step.id === 1) return "available";
    // Onceki adim tamamlandiysa bu adim acik
    if (completedSet.has(step.id - 1)) return "available";
    return "locked";
  });
}

function StepCard({ step, status, t }: { step: StepDef; status: StepStatus; t: ReturnType<typeof useTranslation>["t"] }) {
  const rowClass =
    status === "completed"
      ? "border-b-[var(--color-accent)]"
      : status === "available"
        ? "hover:bg-[var(--color-surface)] cursor-pointer"
        : "opacity-50 cursor-not-allowed";

  const content = (
    <div className={`flex items-center gap-4 py-3 px-1 border-b border-[var(--color-border)] transition-all ${rowClass}`}>
      {/* Numara / Durum */}
      <div
        className={`w-10 h-10 rounded flex items-center justify-center text-xs font-bold shrink-0 ${
          status === "completed"
            ? "bg-[var(--color-accent)] text-white"
            : status === "available"
              ? "border-2 border-[var(--color-accent)] text-[var(--color-accent)] bg-transparent"
              : "bg-[var(--color-border)]/30 text-[var(--color-text-secondary)]/60"
        }`}
      >
        {status === "completed" ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          step.id
        )}
      </div>

      {/* Icerik */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${
          status === "completed"
            ? "text-[var(--color-accent)]"
            : status === "available"
              ? "text-[var(--color-text-primary)]"
              : "text-[var(--color-text-secondary)]/60"
        }`}>
          {(t.hub as Record<string, string>)[step.titleKey]}
          {step.isMilestone && (
            <span className="ml-2 inline-flex items-center gap-0.5 text-[10px] text-[var(--color-accent)] font-bold">
              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21l1.9-5.7a8.5 8.5 0 113.8 3.8L3 21z"/></svg>
              {t.hub.qaidaMilestone}
            </span>
          )}
        </p>
        <p className={`text-xs mt-0.5 ${
          status === "completed"
            ? "text-[var(--color-accent)]/70"
            : "text-[var(--color-text-secondary)]"
        }`}>{(t.hub as Record<string, string>)[step.subtitleKey]}</p>
      </div>

      {/* Arapca ornek */}
      <span
        className={`text-xl shrink-0 ${
          status === "completed"
            ? "text-[var(--color-accent)]"
            : status === "available"
              ? "text-[var(--color-text-primary)]"
              : "text-[var(--color-text-secondary)]/40"
        }`}
        style={{ fontFamily: "var(--font-arabic)" }}
      >
        {step.icon}
      </span>

      {/* Durum ikonu */}
      {status === "locked" && (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--color-border)] shrink-0">
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      )}
    </div>
  );

  // Completed veya available: link varsa ders sayfasina, yoksa sinava yonlendir
  if (status === "completed" || status === "available") {
    if (step.link) {
      return <Link to={step.link as "/alifba"}>{content}</Link>;
    }
    if (step.examLink) {
      return <Link to={step.examLink as string}>{content}</Link>;
    }
  }

  return content;
}

function QaidaPage() {
  const { t } = useTranslation();
  const statuses = useStepStatuses();
  const completedCount = statuses.filter((s) => s === "completed").length;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-24">
      {/* Baslik */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">{t.hub.qaida}</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          {t.hub.qaidaSubtitle}
        </p>
      </div>

      {/* Ilerleme ozeti */}
      <div className="mb-5 flex items-center gap-3 py-3 px-1 border-b border-[var(--color-border)]">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-[var(--color-text-secondary)]">{t.hub.qaidaProgress}</span>
            <span className="text-xs font-medium text-[var(--color-accent)]">{completedCount} / 10</span>
          </div>
          <div className="h-1.5 rounded-full bg-[var(--color-border)]">
            <div className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-500" style={{ width: `${completedCount * 10}%` }} />
          </div>
        </div>
      </div>

      {/* Adimlar */}
      <div className="flex flex-col">
        {STEPS.map((step, i) => (
          <StepCard key={step.id} step={step} status={statuses[i]} t={t} />
        ))}
      </div>

      {/* Sinav bilgi */}
      {statuses.some((s) => s === "available") && (
        <div className="mt-5 px-4 py-3 rounded border border-[var(--color-accent)]/20 bg-[var(--color-accent)]/5 text-xs text-[var(--color-text-secondary)]">
          {t.hub.qaidaExamHint}
        </div>
      )}

      {/* Aciklama */}
      <div className="mt-4 p-4 rounded border border-[var(--color-accent)]/20 bg-[var(--color-accent)]/5 text-sm text-[var(--color-text-secondary)] leading-relaxed">
        <strong className="text-[var(--color-accent)] block mb-1">{t.hub.qaidaWhat}</strong>
        {t.hub.qaidaWhatBody}
      </div>

      {/* Tecvid baglantisi */}
      <Link
        to="/tajweed"
        className="mt-4 flex items-center gap-3 py-3 px-1 border-b border-[var(--color-border)] hover:bg-[var(--color-surface)] transition-colors"
      >
        <div className="w-9 h-9 rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-[var(--color-text-primary)]">{t.hub.qaidaTajweedLink}</p>
          <p className="text-xs text-[var(--color-text-secondary)]">{t.hub.qaidaTajweedLinkDesc}</p>
        </div>
        <svg className="w-4 h-4 text-[var(--color-text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  );
}
