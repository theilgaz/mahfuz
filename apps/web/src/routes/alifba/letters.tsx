/**
 * Harf indeks sayfası -- /alifba/letters
 * 28 Arapça harfi minimal-ui stilinde gösterir.
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { ARABIC_LETTERS } from "~/lib/kids-constants";
import { useTranslation } from "~/hooks/useTranslation";
import { useAlifbaStore, computeAlifbaStats } from "~/stores/alifba.store";
import { useShallow } from "zustand/react/shallow";
import { useMemo } from "react";
import { staticHead } from "~/lib/seo";

export const Route = createFileRoute("/alifba/letters")({
  head: () => staticHead("alifba-letters"),
  component: LetterIndexPage,
});

function LetterIndexPage() {
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

  return (
    <div className="mu-roadmap">
      {/* Back */}
      <Link
        to="/alifba"
        className="mu-letters-back"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M10 4L6 8l4 4" />
        </svg>
        {t.nav.back}
      </Link>

      {/* Header */}
      <div className="mu-letters-header">
        <div>
          <h1 className="mu-letters-title">
            {t.alifba?.learnLetters ?? "Harfleri Tan\u0131"}
          </h1>
          <p className="mu-letters-sub">
            {"28 Arap\u00E7a harf"}
          </p>
        </div>
        <div className="mu-letters-stats">
          <div className="mu-letters-stat">
            <span className="mu-letters-stat-num">{stats.mastered}</span>
            <span className="mu-letters-stat-label">{t.alifba?.mastered ?? "Tamamlanan"}</span>
          </div>
          <div className="mu-letters-stat">
            <span className="mu-letters-stat-num">{stats.seen}</span>
            <span className="mu-letters-stat-label">{t.alifba?.seen ?? "G\u00F6r\u00FClm\u00FC\u015F"}</span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mu-letters-progress">
        <div className="mu-letters-progress-fill" style={{ width: `${(stats.mastered / 28) * 100}%` }} />
      </div>

      {/* Letter grid */}
      <div className="mu-letters-grid" dir="rtl">
        {ARABIC_LETTERS.map((letter) => {
          const prog = progress[letter.id];
          const isSeen = prog?.seen;
          const isMastered = prog?.seen && prog?.tracingDone;
          return (
            <Link
              key={letter.id}
              to="/alifba/$letterId"
              params={{ letterId: letter.id }}
              className={[
                "mu-letters-card",
                isMastered ? "mastered" : isSeen ? "seen" : "",
              ].join(" ")}
            >
              {isMastered && (
                <span className="mu-letters-check">
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <path d="M1.5 4L3 5.5L6.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              )}
              <span className="mu-letters-ar" style={{ fontFamily: "var(--mu-ff-ar)" }}>
                {letter.arabic}
              </span>
              <span className="mu-letters-name">{letter.name}</span>
            </Link>
          );
        })}
      </div>

      {/* Exam link */}
      <Link to="/alifba/exam" className="mu-btn primary" style={{ justifyContent: "center", marginTop: 24 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 12l2 2 4-4" />
          <circle cx="12" cy="12" r="10" />
        </svg>
{t.hub?.qaidaExamStart ?? "S\u0131nava gir"}
      </Link>
    </div>
  );
}
