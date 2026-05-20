/**
 * Home shelves — categorized navigation chips for the main features.
 */

import { Link } from "@tanstack/react-router";
import { useTranslation } from "~/hooks/useTranslation";
import { MuIcons } from "./icons";

export function HomeShelves() {
  const { t } = useTranslation();
  const s = t.home.shelves;
  const c = t.home.chips;

  return (
    <section className="mx-auto w-full max-w-2xl px-4 pb-12 flex flex-col gap-7">
      <div>
        <p className="mu-eyebrow" style={{ margin: 0, marginBottom: 10 }}>{s.read}</p>
        <div className="flex flex-wrap gap-2">
          <Link to="/fihrist" className="mu-nav-chip">{c.surahList}</Link>
          <Link to="/page/$pageNumber" params={{ pageNumber: "1" }} search={{ ayah: undefined }} className="mu-nav-chip">{c.pageView}</Link>
          <Link to="/juz/$juzId" params={{ juzId: "1" }} search={{ ayah: undefined }} className="mu-nav-chip">{c.juzView}</Link>
          <Link to="/discover" className="mu-nav-chip">{c.discover}</Link>
        </div>
      </div>

      <div>
        <p className="mu-eyebrow" style={{ margin: 0, marginBottom: 10 }}>{s.learn}</p>
        <div className="flex flex-wrap gap-2">
          <Link to="/alifba" className="mu-nav-chip">{c.alifba}</Link>
          <Link to="/tajweed" className="mu-nav-chip">{c.tajweed}</Link>
        </div>
      </div>

      <div>
        <p className="mu-eyebrow" style={{ margin: 0, marginBottom: 10 }}>{s.practice}</p>
        <div className="flex flex-wrap gap-2">
          <Link to="/hifz" className="mu-nav-chip">{c.hifz}</Link>
          <Link to="/recite" className="mu-nav-chip">{c.recite}</Link>
          <Link to="/notes" className="mu-nav-chip">{c.notes}</Link>
          <Link to="/bookmarks" className="mu-nav-chip">{c.bookmarks}</Link>
          <Link to="/stats" className="mu-nav-chip">{c.stats}</Link>
        </div>
      </div>

      <div>
        <p className="mu-eyebrow" style={{ margin: 0, marginBottom: 10 }}>{s.community}</p>
        <div className="flex flex-wrap gap-2">
          <Link to="/khatm" className="mu-nav-chip">{c.khatm}</Link>
          <Link to="/games/scoreboard" className="mu-nav-chip">{c.scoreboard}</Link>
          <Link to="/premium" className="mu-nav-chip">{c.premium}</Link>
        </div>
      </div>

      <div>
        <div className="flex items-baseline justify-between mb-[10px]">
          <p className="mu-eyebrow" style={{ margin: 0 }}>{s.games}</p>
          <Link to="/games" className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--mu-accent-ink)] transition-colors flex items-center gap-0.5">
            {t.home.viewAll}
            {MuIcons.chev}
          </Link>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/games/fill-blank" className="mu-nav-chip">{c.fillBlank}</Link>
          <Link to="/games/kelime-tahmini" className="mu-nav-chip">{c.wordGuess}</Link>
          <Link to="/games/ayah-2048" className="mu-nav-chip">{c.ayah2048}</Link>
          <Link to="/games/surah-guess" className="mu-nav-chip">{c.surahGuess}</Link>
        </div>
      </div>
    </section>
  );
}
