/**
 * Alifba page -- hero with stats, letter card, 7-column grid, lessons.
 * Minimal UI editorial design.
 */

import { useState, useMemo, useRef } from "react";
import { useTranslation } from "~/hooks/useTranslation";
import { ARABIC_LETTERS } from "~/lib/kids-constants";
import { playLetterAudio, type LetterAudioHandle } from "~/lib/letter-audio";
import { useAlifbaStore, computeAlifbaStats } from "~/stores/alifba.store";
import { useShallow } from "zustand/react/shallow";
import { MuIcons } from "./icons";

const ALIFBA_LETTERS = [
  { ar: "ا", name: "Elif", tr: "Alef", sound: "/a/", ex: "أَب - baba" },
  { ar: "ب", name: "Be", tr: "Ba", sound: "/b/", ex: "بَيْت - ev" },
  { ar: "ت", name: "Te", tr: "Ta", sound: "/t/", ex: "تَمْر - hurma" },
  { ar: "ث", name: "Se", tr: "Tha", sound: "/θ/", ex: "ثَلَاث - üç" },
  { ar: "ج", name: "Cim", tr: "Jim", sound: "/ʤ/", ex: "جَبَل - dağ" },
  { ar: "ح", name: "Ha", tr: "Ha", sound: "/ħ/", ex: "حَجَر - taş" },
  { ar: "خ", name: "Hı", tr: "Kha", sound: "/x/", ex: "خُبْز - ekmek" },
  { ar: "د", name: "Dal", tr: "Dal", sound: "/d/", ex: "دَار - ev" },
  { ar: "ذ", name: "Zel", tr: "Dhal", sound: "/ð/", ex: "ذَهَب - altın" },
  { ar: "ر", name: "Ra", tr: "Ra", sound: "/r/", ex: "رَبّ - Rab" },
  { ar: "ز", name: "Ze", tr: "Zay", sound: "/z/", ex: "زَيْت - yağ" },
  { ar: "س", name: "Sin", tr: "Sin", sound: "/s/", ex: "سَلَام - selam" },
  { ar: "ش", name: "Şin", tr: "Shin", sound: "/ʃ/", ex: "شَمْس - güneş" },
  { ar: "ص", name: "Sad", tr: "Sad", sound: "/sˤ/", ex: "صَبْر - sabır" },
  { ar: "ض", name: "Dad", tr: "Dad", sound: "/dˤ/", ex: "ضَوْء - ışık" },
  { ar: "ط", name: "Tı", tr: "Ta", sound: "/tˤ/", ex: "طَرِيق - yol" },
  { ar: "ظ", name: "Zı", tr: "Za", sound: "/ðˤ/", ex: "ظِلّ - gölge" },
  { ar: "ع", name: "Ayin", tr: "Ayn", sound: "/ʕ/", ex: "عَيْن - göz" },
  { ar: "غ", name: "Gayin", tr: "Ghayn", sound: "/ɣ/", ex: "غَيْم - bulut" },
  { ar: "ف", name: "Fe", tr: "Fa", sound: "/f/", ex: "فَجْر - şafak" },
  { ar: "ق", name: "Kaf", tr: "Qaf", sound: "/q/", ex: "قَلَم - kalem" },
  { ar: "ك", name: "Kef", tr: "Kaf", sound: "/k/", ex: "كِتَاب - kitap" },
  { ar: "ل", name: "Lam", tr: "Lam", sound: "/l/", ex: "لَيْل - gece" },
  { ar: "م", name: "Mim", tr: "Mim", sound: "/m/", ex: "مَاء - su" },
  { ar: "ن", name: "Nun", tr: "Nun", sound: "/n/", ex: "نُور - ışık" },
  { ar: "ه", name: "He", tr: "Ha", sound: "/h/", ex: "هُدَى - hidayet" },
  { ar: "و", name: "Vav", tr: "Waw", sound: "/w/", ex: "وَرْد - gül" },
  { ar: "ي", name: "Ye", tr: "Ya", sound: "/j/", ex: "يَد - el" },
];

const LESSONS = [
  { n: "01", t: "Tek harfler", s: "Elif'ten Ye'ye 28 harf", p: 100 },
  { n: "02", t: "Harekeler", s: "Fetha, kesra, damme", p: 60 },
  { n: "03", t: "Med harfleri", s: "Uzatmalar ve sükün", p: 25 },
  { n: "04", t: "İlk kelimeler", s: "Okuma pratiği", p: 0 },
];

export function AlifbaPage() {
  const { t } = useTranslation();
  const [active, setActive] = useState(ALIFBA_LETTERS[23]); // Mim
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<LetterAudioHandle | null>(null);

  // Get progress from store
  const { progress: letterProgress, streak, examHistory, gameHighScores, totalDays, lastStudyDate } = useAlifbaStore(
    useShallow((s) => ({
      progress: s.progress,
      streak: s.streak,
      examHistory: s.examHistory,
      gameHighScores: s.gameHighScores,
      totalDays: s.totalDays,
      lastStudyDate: s.lastStudyDate,
    })),
  );
  const stats = useMemo(
    () => computeAlifbaStats({ progress: letterProgress, streak, examHistory, gameHighScores, totalDays, lastStudyDate }),
    [letterProgress, streak, examHistory, gameHighScores, totalDays, lastStudyDate],
  );
  const progress = stats.seen || 6;

  return (
    <div className="mu-alifba">
      {/* Hero */}
      <section className="mu-alifba-hero">
        <div>
          <p className="mu-eyebrow">
            <span className="mu-eb-line" />
            {t.hub?.alifba ?? "Elifba"} - 28 harf
          </p>
          <h1 className="mu-display">
            Harfi tanı,<span className="mu-display-accent"> sesi ezberle.</span>
          </h1>
          <p className="mu-lede">
            Arap alfabesi -- yazılışı, adı, sesi ve ilk kelimelerle. Her harf için kısa bir işitme pratiği ve tekrar kartı.
          </p>
          <div className="mu-alifba-stats">
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span className="mu-astat-n">
                {progress}<span style={{ fontSize: 18, color: "var(--mu-muted)", marginLeft: 2 }}>/28</span>
              </span>
              <span className="mu-astat-l">öğrenilen harf</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span className="mu-astat-n">{stats.mastered || 0}</span>
              <span className="mu-astat-l">ders tamamla</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span className="mu-astat-n">--</span>
              <span className="mu-astat-l">günlük seri</span>
            </div>
          </div>
        </div>

        {/* Active letter card */}
        <div className="mu-alifba-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: "var(--mu-ff-mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
            <span className="mu-muted">Bugünün harfi</span>
            <span style={{ background: "var(--mu-accent-soft)", color: "var(--mu-accent-ink)", padding: "3px 10px", borderRadius: 999, fontSize: 11, letterSpacing: "0.05em", fontFamily: "var(--mu-ff-mono)" }}>
              {active.sound}
            </span>
          </div>
          <div className="mu-alifba-glyph" dir="rtl">{active.ar}</div>
          <div className="mu-alifba-name">
            <span>{active.name}</span>
            <span className="mu-muted">- {active.tr}</span>
          </div>
          <p style={{ fontFamily: "var(--mu-ff-ar)", fontSize: 28, direction: "rtl", color: "var(--mu-ink-2)", margin: "20px 0 4px", lineHeight: 1 }} dir="rtl">
            {active.ex.split(" - ")[0]}
          </p>
          <p style={{ fontSize: 14, color: "var(--mu-muted)", margin: "0 0 24px" }}>
            {active.ex.split(" - ")[1]}
          </p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <button
              className={`mu-btn primary ${playing ? "on" : ""}`}
              onClick={() => {
                if (playing) return;
                const letter = ARABIC_LETTERS.find((l) => l.arabic === active.ar);
                if (!letter) return;
                setPlaying(true);
                audioRef.current = playLetterAudio(letter.arabic, letter.id, () => setPlaying(false));
              }}
            >
              {playing ? MuIcons.pause : MuIcons.play} Telaffuzu duy
            </button>
            <button className="mu-btn ghost">
              {MuIcons.mic} Tekrar et
            </button>
          </div>
        </div>
      </section>

      {/* 28-letter grid */}
      <section style={{ paddingTop: 24, borderTop: "1px solid var(--mu-line)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 24, paddingTop: 24 }}>
          <h2 className="mu-h2" style={{ margin: 0 }}>28 harf</h2>
          <p className="mu-muted">Harfe tıklayarak kartı değiştir.</p>
        </div>
        <div className="mu-alifba-grid" dir="rtl">
          {ALIFBA_LETTERS.map((l, i) => {
            const done = i < progress;
            const isActive = l.ar === active.ar;
            return (
              <button
                key={l.ar}
                className={`mu-alif-tile ${done ? "done " : ""}${isActive ? "on" : ""}`}
                onClick={() => setActive(l)}
              >
                <span className="mu-alif-tile-n">{String(i + 1).padStart(2, "0")}</span>
                <span className="mu-alif-tile-ar" dir="rtl">{l.ar}</span>
                <span className="mu-alif-tile-name">{l.name}</span>
                {done && (
                  <span className="mu-alif-tile-check">{MuIcons.check}</span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Lessons */}
      <section style={{ paddingTop: 24, borderTop: "1px solid var(--mu-line)" }}>
        <h2 className="mu-h2">Dersler</h2>
        <div className="mu-lesson-row">
          {LESSONS.map((l) => (
            <article key={l.n} className="mu-lesson">
              <span className="mu-lesson-n">{l.n}</span>
              <h3>{l.t}</h3>
              <p className="mu-muted" style={{ fontSize: 13, margin: "0 0 16px" }}>{l.s}</p>
              <div className="mu-lesson-bar">
                <span style={{ width: `${l.p}%` }} />
              </div>
              <div className="mu-lesson-foot">
                <span className="mu-muted">{l.p}% tamamlandı</span>
                {l.p === 0 ? (
                  <span style={{ color: "var(--mu-muted)" }}>{MuIcons.lock}</span>
                ) : (
                  <span className="mu-lesson-go">
                    {l.p === 100 ? "Tekrar et" : "Devam et"} {MuIcons.arrowRight}
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
