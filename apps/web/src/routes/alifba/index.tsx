/**
 * Elifba ana sayfası — /alifba
 * Harf ızgarası + modül giriş kartları (sesli quiz, form quizi, sınav, oyunlar).
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { ARABIC_LETTERS } from "~/lib/kids-constants";
import { useTranslation } from "~/hooks/useTranslation";
import { useAlifbaStore, computeAlifbaStats } from "~/stores/alifba.store";
import { useShallow } from "zustand/react/shallow";

export const Route = createFileRoute("/alifba/")({
  component: AlifbaIndexPage,
});

function AlifbaIndexPage() {
  const { t } = useTranslation();
  const { progress, streak, examHistory, gameHighScores } = useAlifbaStore(
    useShallow((s) => ({
      progress: s.progress,
      streak: s.streak,
      examHistory: s.examHistory,
      gameHighScores: s.gameHighScores,
    })),
  );

  const stats = useMemo(
    () => computeAlifbaStats({ progress, streak, examHistory, gameHighScores, totalDays: 0, lastStudyDate: null }),
    [progress, streak, examHistory, gameHighScores],
  );

  const modules = [
    {
      id: "voice-quiz",
      to: "/alifba/quiz/voice" as const,
      label: t.alifba.voiceQuiz,
      desc: t.alifba.voiceQuizDesc,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 2h6v12a3 3 0 0 1-6 0V2z" />
          <path d="M5 10a7 7 0 0 0 14 0" />
          <path d="M12 17v4" />
          <path d="M8 21h8" />
        </svg>
      ),
    },
    {
      id: "forms-quiz",
      to: "/alifba/quiz/forms" as const,
      label: t.alifba.formsQuiz,
      desc: t.alifba.formsQuizDesc,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="8" height="8" rx="2" />
          <rect x="13" y="3" width="8" height="8" rx="2" />
          <rect x="3" y="13" width="8" height="8" rx="2" />
          <rect x="13" y="13" width="8" height="8" rx="2" />
        </svg>
      ),
    },
    {
      id: "exam",
      to: "/alifba/exam" as const,
      label: t.alifba.mixedExam,
      desc: t.alifba.mixedExamDesc,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 12l2 2 4-4" />
          <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
        </svg>
      ),
      badge: stats.bestExam != null ? `${stats.bestExam}/28` : undefined,
    },
    {
      id: "games",
      to: "/alifba/games" as const,
      label: t.alifba.games,
      desc: t.alifba.gamesDesc,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="6" width="20" height="12" rx="4" />
          <path d="M7 12h4" />
          <path d="M9 10v4" />
          <circle cx="16" cy="12" r="1" fill="currentColor" />
          <circle cx="19" cy="12" r="1" fill="currentColor" />
        </svg>
      ),
    },
  ];

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24">
      {/* Başlık + istatistikler */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-semibold">{t.alifba.title}</h1>
          <p className="text-xs text-[var(--color-text-secondary)]">{t.alifba.subtitle}</p>
        </div>
        <div className="flex gap-3 text-center">
          <div>
            <p className="text-base font-bold text-[var(--color-accent)]">{stats.seen}</p>
            <p className="text-[10px] text-[var(--color-text-secondary)]">{t.alifba.seen}</p>
          </div>
          <div>
            <p className="text-base font-bold text-[var(--color-accent)]">{stats.streak}</p>
            <p className="text-[10px] text-[var(--color-text-secondary)]">{t.alifba.streak}</p>
          </div>
        </div>
      </div>

      {/* Modül kartları */}
      <div className="grid grid-cols-2 gap-2 mb-5">
        {modules.map((mod) => (
          <Link
            key={mod.id}
            to={mod.to}
            className="flex flex-col gap-2 p-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-accent)]/50 hover:bg-[var(--color-accent)]/5 transition-colors active:scale-[0.98]"
          >
            <div className="flex items-center justify-between">
              <span className="text-[var(--color-accent)]">{mod.icon}</span>
              {mod.badge && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] font-medium">
                  {mod.badge}
                </span>
              )}
            </div>
            <div>
              <p className="text-sm font-medium">{mod.label}</p>
              <p className="text-[11px] text-[var(--color-text-secondary)] leading-snug mt-0.5">{mod.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Harf ızgarası */}
      <p className="text-xs font-medium text-[var(--color-text-secondary)] mb-2">{t.alifba.learnLetters}</p>
      <div className="grid grid-cols-7 gap-2" dir="rtl">
        {ARABIC_LETTERS.map((letter) => {
          const prog = progress[letter.id];
          const isSeen = prog?.seen;
          const isMastered = prog?.seen && prog?.tracingDone && (prog?.voiceScore ?? 0) >= 80;
          return (
            <Link
              key={letter.id}
              to="/alifba/$letterId"
              params={{ letterId: letter.id }}
              className={`flex flex-col items-center justify-center gap-2 h-[4.5rem] rounded-xl border transition-colors active:scale-95 ${
                isMastered
                  ? "bg-[var(--color-accent)]/10 border-[var(--color-accent)]/40"
                  : isSeen
                    ? "bg-[var(--color-surface)] border-[var(--color-border)] opacity-80"
                    : "bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-accent)] hover:bg-[var(--color-accent)]/5"
              }`}
            >
              <span className="text-3xl leading-none" style={{ fontFamily: "var(--font-arabic)" }}>
                {letter.arabic}
              </span>
              <span className="text-[10px] text-[var(--color-text-secondary)] leading-none">{letter.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
