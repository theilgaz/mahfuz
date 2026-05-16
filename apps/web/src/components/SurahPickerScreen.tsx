/**
 * Oyun başlangıcında sure seçim ekranı.
 * Tüm sure bazlı oyunlarda paylaşılır.
 */

import { useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { getSurahs } from "~/lib/quran-service";
import { useSurahSelectionStore } from "~/stores/surahSelection.store";
import { useHifzStore } from "~/stores/hifz.store";
import { useStudiedStore } from "~/stores/studied.store";
import { useGamePreferencesStore } from "~/stores/gamePreferences.store";
import { useTranslation } from "~/hooks/useTranslation";
import { getSurahName } from "~/lib/surah-names-i18n";
import { GameMiniLeaderboard } from "~/components/GameMiniLeaderboard";
import type { VerseFilter } from "~/lib/game-service";
import type { Difficulty } from "~/lib/game-scoring";

type Mode = "all" | "hifz" | "studied" | "custom";

const PRESETS = [
  { key: "namaz",     labelKey: "presetNamaz",     ids: [1, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114] },
  { key: "duhaToNas", labelKey: "presetDuhaToNas", range: [93,  114] as const },
  { key: "amme",      labelKey: "presetAmme",      range: [78,  114] as const },
  { key: "tabaraka",  labelKey: "presetTabaraka",  range: [67,   77] as const },
] as const;

interface Props {
  /** Game illustration URL (from GameTheme.img). */
  gameImg?: string;
  /** When true, hides surah selection and only shows difficulty. */
  difficultyOnly?: boolean;
  /** When true, shows only Normal/Zor (mapped to easy/hard) instead of 4 levels. */
  simpleDifficulty?: boolean;
  /** Game ID for showing mini leaderboard (e.g. "fill-blank"). */
  gameId?: string;
  onStart: (surahIds: number[], verseFilter?: VerseFilter, difficulty?: Difficulty) => void;
}

export function SurahPickerScreen({ gameImg, difficultyOnly, simpleDifficulty, gameId, onStart }: Props) {
  const { t, locale } = useTranslation();
  const savedIds = useSurahSelectionStore((s) => s.selectedSurahIds);
  const saveIds = useSurahSelectionStore((s) => s.setSelectedSurahIds);
  const memorized = useHifzStore((s) => s.memorized);
  const persistDifficulty = useGamePreferencesStore((s) => s.setDifficulty);
  const [difficulty, setDifficultyState] = useState<Difficulty>(() => {
    const saved = gameId ? useGamePreferencesStore.getState().getDifficulty(gameId) : undefined;
    return saved ?? (simpleDifficulty ? "easy" : "medium");
  });
  const setDifficulty = (d: Difficulty) => {
    setDifficultyState(d);
    if (gameId) persistDifficulty(gameId, d);
  };

  const studiedIds = useStudiedStore((s) => s.surahIds);

  const memorizedEntries = Object.entries(memorized)
    .filter(([, verses]) => verses.length > 0)
    .map(([id, verses]) => ({ surahId: Number(id), verses }))
    .sort((a, b) => a.surahId - b.surahId);

  const hasHifz = memorizedEntries.length > 0;

  const hasStudied = studiedIds.length > 0;

  const [mode, setMode] = useState<Mode>(() => {
    if (hasHifz) return "hifz";
    if (hasStudied) return "studied";
    return savedIds.length > 0 ? "custom" : "all";
  });
  const [selected, setSelected] = useState<Set<number>>(new Set(savedIds));
  const [search, setSearch] = useState("");
  const [hifzExpanded, setHifzExpanded] = useState(false);

  const { data: surahs = [], isLoading } = useQuery({
    queryKey: ["quran", "surahs"],
    queryFn: () => getSurahs(),
    staleTime: Infinity,
  });

  const surahMap = new Map(surahs.map((s) => [s.id, s]));

  const filtered = surahs.filter((s) => {
    const q = search.toLowerCase();
    const i18nName = getSurahName(s.id, locale) ?? "";
    return (
      i18nName.toLowerCase().includes(q) ||
      s.nameSimple.toLowerCase().includes(q) ||
      s.nameArabic.includes(search) ||
      String(s.id).includes(search)
    );
  });

  const toggle = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const handleStart = () => {
    if (difficultyOnly) {
      onStart([], undefined, difficulty);
      return;
    }
    if (mode === "all") {
      onStart([], undefined, difficulty);
    } else if (mode === "hifz") {
      const surahIds = memorizedEntries.map((e) => e.surahId);
      const verseFilter: VerseFilter = memorizedEntries.map((e) => ({
        surahId: e.surahId,
        verseNums: e.verses,
      }));
      onStart(surahIds, verseFilter, difficulty);
    } else if (mode === "studied") {
      onStart(studiedIds, undefined, difficulty);
    } else {
      const ids = [...selected];
      saveIds(ids);
      onStart(ids, undefined, difficulty);
    }
  };

  const hifzTotalVerses = memorizedEntries.reduce((s, e) => s + e.verses.length, 0);

  const startButtonLabel = difficultyOnly
    ? t.surahPicker.startAll
    : mode === "all"
    ? t.surahPicker.startAll
    : mode === "hifz"
    ? t.surahPicker.testMyHifz.replace("{count}", String(hifzTotalVerses))
    : mode === "studied"
    ? t.surahPicker.startWithSurahs.replace("{count}", String(studiedIds.length))
    : selected.size > 0
    ? t.surahPicker.startWithSurahs.replace("{count}", String(selected.size))
    : t.surahPicker.modeCustomHint;

  const startDisabled = !difficultyOnly && ((mode === "custom" && selected.size === 0) || (mode === "studied" && studiedIds.length === 0));

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-20">
      {/* Oyun görseli */}
      {gameImg && (
        <div className="flex justify-center mb-4">
          <img
            src={gameImg}
            alt=""
            className="w-32 h-32 object-contain rounded-2xl"
          />
        </div>
      )}

      {/* Zorluk seçimi */}
      <div className="mb-5">
        <div className="flex rounded-lg border border-[var(--color-border)] overflow-hidden bg-[var(--color-surface)]">
          {(simpleDifficulty
            ? ([
                { d: "easy" as Difficulty, label: "Normal", dotColor: "bg-emerald-500" },
                { d: "hard" as Difficulty, label: "Zor", dotColor: "bg-red-500" },
              ])
            : ([
                { d: "easy" as Difficulty, label: t.gameScoring.diffEasy, dotColor: "bg-emerald-500" },
                { d: "medium" as Difficulty, label: t.gameScoring.diffMedium, dotColor: "bg-amber-500" },
                { d: "hard" as Difficulty, label: t.gameScoring.diffHard, dotColor: "bg-red-500" },
                { d: "hafiz" as Difficulty, label: t.gameScoring.diffHafiz, dotColor: "bg-purple-500" },
              ])
          ).map(({ d, label, dotColor }) => {
            const active = difficulty === d;
            return (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-all ${
                  active
                    ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                    : "text-[var(--color-text-secondary)] hover:bg-[var(--color-accent)]/5"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mod seçimi */}
      {!difficultyOnly && <div className="space-y-2">
        {/* Tüm Kuran */}
        <button
          onClick={() => setMode("all")}
          className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-lg border transition-all text-left ${
            mode === "all"
              ? "border-[var(--color-accent)]/50 bg-[var(--color-accent)]/5"
              : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)]/30"
          }`}
        >
          <RadioDot active={mode === "all"} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--color-text-primary)]">{t.surahPicker.modeAll}</p>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{t.surahPicker.modeAllHint}</p>
          </div>
        </button>

        {/* Ezberim */}
        <div className={`rounded-lg border transition-all overflow-hidden ${
          mode === "hifz"
            ? "border-[var(--color-accent)]/50 bg-[var(--color-accent)]/5"
            : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)]/30"
        }`}>
          <button
            onClick={() => {
              if (!hasHifz) return;
              if (mode === "hifz") {
                setHifzExpanded((v) => !v);
              } else {
                setMode("hifz");
              }
            }}
            className={`w-full flex items-center gap-3 px-4 py-3.5 text-left ${!hasHifz ? "opacity-60" : ""}`}
            disabled={!hasHifz}
          >
            <RadioDot active={mode === "hifz"} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--color-text-primary)]">{t.surahPicker.modeHifz}</p>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                {hasHifz
                  ? `${memorizedEntries.length} ${t.surahPicker.modeHifzSurahs} · ${hifzTotalVerses} ${t.surahPicker.modeHifzVerses}`
                  : t.surahPicker.noMemorized}
              </p>
            </div>
            {hasHifz && mode === "hifz" && (
              <svg className={`w-4 h-4 text-[var(--color-text-secondary)] transition-transform ${hifzExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </button>

          {/* Hifz detay listesi */}
          {mode === "hifz" && hasHifz && hifzExpanded && (
            <div className="border-t border-[var(--color-border)]">
              {memorizedEntries.map(({ surahId, verses }, i) => {
                const surah = surahMap.get(surahId);
                return (
                  <div
                    key={surahId}
                    className={`flex items-center gap-2 px-4 py-1.5 ${i > 0 ? "border-t border-[var(--color-border)]/50" : ""}`}
                  >
                    <span className="text-[10px] text-[var(--color-text-secondary)] w-6 shrink-0 tabular-nums">{surahId}</span>
                    <span className="text-xs text-[var(--color-text-primary)] flex-1 truncate">{getSurahName(surahId, locale) || surah?.nameSimple || `Sure ${surahId}`}</span>
                    <span className="text-xs text-[var(--color-text-secondary)]" style={{ fontFamily: "var(--font-arabic)" }} dir="rtl">{surah?.nameArabic}</span>
                    <span className="text-[10px] text-[var(--color-accent)] font-medium tabular-nums shrink-0 w-12 text-right">{verses.length} ayet</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Hifz yonetim linki */}
          <div className="border-t border-[var(--color-border)] px-4 py-2">
            <Link
              to="/hifz"
              className="text-xs text-[var(--color-accent)] hover:underline"
            >
              {t.surahPicker.manageHifz}
            </Link>
          </div>
        </div>

        {/* Çalıştıklarım */}
        <button
          onClick={() => { if (studiedIds.length > 0) setMode("studied"); }}
          className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-lg border transition-all text-left ${
            mode === "studied"
              ? "border-[var(--color-accent)]/50 bg-[var(--color-accent)]/5"
              : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)]/30"
          } ${studiedIds.length === 0 ? "opacity-60" : ""}`}
          disabled={studiedIds.length === 0}
        >
          <RadioDot active={mode === "studied"} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--color-text-primary)]">{t.surahPicker.presetWorked}</p>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
              {studiedIds.length > 0
                ? `${studiedIds.length} sure`
                : t.profile.studiedEmpty}
            </p>
          </div>
        </button>

        {/* Özel Seçim */}
        <button
          onClick={() => setMode("custom")}
          className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-lg border transition-all text-left ${
            mode === "custom"
              ? "border-[var(--color-accent)]/50 bg-[var(--color-accent)]/5"
              : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)]/30"
          }`}
        >
          <RadioDot active={mode === "custom"} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--color-text-primary)]">{t.surahPicker.modeCustom}</p>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
              {selected.size > 0
                ? t.surahPicker.selectedCount.replace("{count}", String(selected.size))
                : t.surahPicker.modeCustomHint}
            </p>
          </div>
        </button>

        {/* Ön tanımlı gruplar */}
        <div className="flex flex-wrap gap-1.5 px-1">
          {PRESETS.map((preset) => {
            const ids = "ids" in preset
              ? preset.ids.filter((id) => surahs.some((s) => s.id === id))
              : surahs.filter((s) => s.id >= preset.range[0] && s.id <= preset.range[1]).map((s) => s.id);
            const isActive = mode === "custom" && ids.length > 0 && ids.every((id) => selected.has(id)) && selected.size === ids.length;
            return (
              <button
                key={preset.key}
                onClick={() => { setMode("custom"); setSelected(new Set(ids)); setSearch(""); }}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                  isActive
                    ? "bg-[var(--color-accent)] border-[var(--color-accent)] text-white"
                    : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]/40 hover:text-[var(--color-accent)]"
                }`}
              >
                {t.surahPicker[preset.labelKey]}
              </button>
            );
          })}
        </div>

        {/* Özel seçim genişlemesi */}
        {mode === "custom" && (
          <div className="ml-9 space-y-2">
            {/* All / Clear */}
            <div className="flex gap-3 justify-end">
              <button onClick={() => setSelected(new Set(surahs.map((s) => s.id)))} className="text-xs text-[var(--color-accent)] hover:underline">
                {t.surahPicker.selectAll}
              </button>
              {selected.size > 0 && (
                <button onClick={() => setSelected(new Set())} className="text-xs text-[var(--color-text-secondary)] hover:underline">
                  {t.surahPicker.clear}
                </button>
              )}
            </div>

            {/* Arama */}
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="7" strokeWidth={2} />
                <path d="M21 21l-4.35-4.35" strokeWidth={2} strokeLinecap="round" />
              </svg>
              <input
                type="text"
                placeholder={t.surahPicker.searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm rounded border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:border-[var(--color-accent)]/60"
              />
            </div>

            {/* Sure listesi */}
            <div className="rounded-lg border border-[var(--color-border)] overflow-hidden overflow-y-auto max-h-[50vh]">
              {isLoading ? (
                <p className="text-center text-xs text-[var(--color-text-secondary)] py-6">{t.surahPicker.loading}</p>
              ) : (
                filtered.map((s, i) => {
                  const isSelected = selected.has(s.id);
                  return (
                    <button
                      key={s.id}
                      onClick={() => toggle(s.id)}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors ${
                        i > 0 ? "border-t border-[var(--color-border)]" : ""
                      } ${isSelected ? "bg-[var(--color-accent)]/8" : "bg-[var(--color-surface)] hover:bg-[var(--color-accent)]/5"}`}
                    >
                      <div className={`w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 border transition-colors ${
                        isSelected ? "bg-[var(--color-accent)] border-[var(--color-accent)]" : "border-[var(--color-border)]"
                      }`}>
                        {isSelected && (
                          <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className="text-[10px] text-[var(--color-text-secondary)] w-5 shrink-0 tabular-nums">{s.id}</span>
                      <span className={`text-xs flex-1 ${isSelected ? "text-[var(--color-accent)] font-medium" : "text-[var(--color-text-primary)]"}`}>{getSurahName(s.id, locale) || s.nameSimple}</span>
                      <span className="text-xs text-[var(--color-text-secondary)]" style={{ fontFamily: "var(--font-arabic)" }} dir="rtl">{s.nameArabic}</span>
                      <span className="text-[10px] text-[var(--color-text-secondary)] shrink-0 tabular-nums w-8 text-right">{s.ayahCount}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>}

      {/* Başlat butonu */}
      <button
        onClick={handleStart}
        disabled={startDisabled}
        className="w-full py-3.5 rounded-xl bg-[var(--mu-accent-soft)] text-[var(--mu-accent-ink)] font-semibold text-sm disabled:opacity-40 transition-opacity hover:opacity-90 mt-5"
      >
        {startButtonLabel}
      </button>

      {/* Mini leaderboard */}
      {gameId && <GameMiniLeaderboard gameId={gameId} />}
    </div>
  );
}

function RadioDot({ active }: { active: boolean }) {
  return (
    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
      active ? "border-[var(--color-accent)]" : "border-[var(--color-border)]"
    }`}>
      {active && <div className="w-2 h-2 rounded-full bg-[var(--color-accent)]" />}
    </div>
  );
}
