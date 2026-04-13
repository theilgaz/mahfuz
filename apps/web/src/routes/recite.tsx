/**
 * Tilavet Tanıma sayfası — /recite
 * Three modes: Find Verse, Memorization Verification, Follow Along.
 */

import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "~/hooks/useTranslation";
import { useRecitationStore } from "~/stores/recitation.store";
import { FindVerseSheet } from "~/components/recitation/FindVerseSheet";
import { VerificationMode } from "~/components/recitation/VerificationMode";
import { useSurahs } from "~/hooks/useQuranQuery";
import { getSurahName } from "~/lib/surah-names-i18n";

export const Route = createFileRoute("/recite")({
  component: RecitePage,
});

type Mode = "select" | "find" | "verify" | "follow";

function RecitePage() {
  const { t, locale } = useTranslation();
  const [mode, setMode] = useState<Mode>("select");
  const [verifySurahId, setVerifySurahId] = useState<number | null>(null);
  const showBar = useRecitationStore((s) => s.showBar);
  const setStoreMode = useRecitationStore((s) => s.setMode);
  const { data: surahs } = useSurahs();

  const handleFindVerse = () => {
    setStoreMode("find-verse");
    showBar();
    setMode("find");
  };

  const handleVerify = (surahId: number) => {
    setVerifySurahId(surahId);
    setStoreMode("verify", { surah: surahId });
    setMode("verify");
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24">
      <h1 className="text-lg font-semibold mb-1">
        {t.recitation?.title ?? "Tilavet Tanıma"}
      </h1>
      <p className="text-sm text-[var(--color-text-secondary)] mb-6">
        Kur'an okuyun, hangi ayet olduğunu tanıyalım
      </p>

      {mode === "select" && (
        <div className="space-y-3">
          {/* Find My Verse */}
          <button
            onClick={handleFindVerse}
            className="w-full text-left rounded border border-[var(--color-border)] p-4 hover:border-[var(--color-accent)] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="2" width="6" height="12" rx="3" />
                  <path d="M5 10a7 7 0 0 0 14 0" />
                  <path d="M12 17v4" />
                  <path d="M8 21h8" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold">{t.recitation?.findVerse ?? "Ayetimi Bul"}</p>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  {t.recitation?.findVerseDesc ?? "Okuyun, hangi ayet olduğunu bulalım"}
                </p>
              </div>
            </div>
          </button>

          {/* Memorization Verification */}
          <button
            onClick={() => setMode("verify")}
            className="w-full text-left rounded border border-[var(--color-border)] p-4 hover:border-[var(--color-accent)] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold">{t.recitation?.verify ?? "Ezberimi Doğrula"}</p>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  {t.recitation?.verifyDesc ?? "Ezberlediğiniz ayetleri sesinizle doğrulayın"}
                </p>
              </div>
            </div>
          </button>

          {/* Follow Along */}
          <button
            onClick={() => {
              setStoreMode("follow-along");
              showBar();
            }}
            className="w-full text-left rounded border border-[var(--color-border)] p-4 hover:border-[var(--color-accent)] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
                  <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold">{t.recitation?.followAlong ?? "Takip Et"}</p>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  {t.recitation?.followAlongDesc ?? "Okurken sizi takip edelim"}
                </p>
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Find Verse result area */}
      {mode === "find" && (
        <div>
          <button onClick={() => setMode("select")} className="text-xs text-[var(--color-text-secondary)] mb-4 flex items-center gap-1">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M9 3L5 7l4 4" /></svg>
            Geri
          </button>
          <FindVerseSheet />
        </div>
      )}

      {/* Verification — surah selector or active mode */}
      {mode === "verify" && !verifySurahId && (
        <div>
          <button onClick={() => setMode("select")} className="text-xs text-[var(--color-text-secondary)] mb-4 flex items-center gap-1">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M9 3L5 7l4 4" /></svg>
            Geri
          </button>
          <h2 className="text-sm font-semibold mb-3">Sure seçin</h2>
          <div className="space-y-1">
            {surahs.slice(0, 30).map((s) => (
              <button
                key={s.id}
                onClick={() => handleVerify(s.id)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-[var(--color-surface)] transition-colors"
              >
                <span className="text-sm">{s.id}. {getSurahName(s.id, locale) || s.nameSimple}</span>
                <span className="text-xs text-[var(--color-text-secondary)]">{s.ayahCount} ayet</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {mode === "verify" && verifySurahId && (
        <div>
          <button
            onClick={() => { setVerifySurahId(null); setMode("verify"); }}
            className="text-xs text-[var(--color-text-secondary)] mb-4 flex items-center gap-1"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M9 3L5 7l4 4" /></svg>
            Geri
          </button>
          <VerificationMode surahId={verifySurahId} />
        </div>
      )}
    </div>
  );
}
