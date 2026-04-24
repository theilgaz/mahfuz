/**
 * Ders içerik bloklarını renderler.
 * Her blok tipine göre uygun bileşeni çağırır.
 */

import type { ContentBlock } from "@mahfuz/shared/types";
import { getLetterById, resolveLearnKey } from "~/lib/qaida-helpers";
import { useTranslation } from "~/hooks/useTranslation";

export function ContentBlockRenderer({ block }: { block: ContentBlock }) {
  const { t } = useTranslation();
  const learn = t.learn as Record<string, unknown>;

  switch (block.type) {
    case "text":
      return <TextBlock text={resolveLearnKey(learn, block.data.key)} />;
    case "letter_display":
      return <LetterDisplayBlock letterId={block.data.letterId} />;
    case "letter_forms":
      return <LetterFormsBlock letterId={block.data.letterId} />;
    case "harakat_table":
      return <HarakatTableBlock letterId={block.data.letterId} harakats={block.data.harakats} />;
    case "word_example":
      return <WordExampleBlock arabic={block.data.arabic} transliteration={block.data.transliteration} meaning={block.data.meaning} />;
    case "tip":
      return <TipBlock text={resolveLearnKey(learn, block.data.key)} />;
    case "audio_example":
      return null; // ses ornekleri sonra eklenecek
    default:
      return null;
  }
}

function TextBlock({ text }: { text: string }) {
  return (
    <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-4">
      {text}
    </p>
  );
}

function LetterDisplayBlock({ letterId }: { letterId: number }) {
  const letter = getLetterById(letterId);
  if (!letter) return null;

  return (
    <div className="flex flex-col items-center gap-2 py-4 mb-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
      <span
        className="text-7xl leading-none"
        dir="rtl"
        style={{ fontFamily: "var(--font-arabic)" }}
      >
        {letter.forms.isolated}
      </span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-[var(--color-text-primary)]">
          {letter.nameRoman}
        </span>
        <span className="text-xs text-[var(--color-text-secondary)]">
          ({letter.nameArabic})
        </span>
      </div>
      <span className="text-xs text-[var(--color-text-secondary)]">
        {letter.sound}
      </span>
    </div>
  );
}

function LetterFormsBlock({ letterId }: { letterId: number }) {
  const { t } = useTranslation();
  const letter = getLetterById(letterId);
  if (!letter) return null;

  const items = [
    { label: t.alifba.final, form: letter.forms.final, limited: false },
    { label: t.alifba.medial, form: letter.forms.medial, limited: letter.forms.isNonConnector },
    { label: t.alifba.initial, form: letter.forms.initial, limited: letter.forms.isNonConnector },
    { label: t.alifba.isolated, form: letter.forms.isolated, limited: false },
  ];

  return (
    <div className="mb-4">
      <p className="text-xs font-medium text-[var(--color-text-secondary)] mb-2">
        {letter.nameRoman} - Formlar
      </p>
      <div className="grid grid-cols-4 gap-2">
        {items.map(({ label, form, limited }) => (
          <div key={label} className="flex flex-col items-center gap-1">
            <span className="text-[10px] text-[var(--color-text-secondary)] uppercase tracking-wide">
              {label}
            </span>
            <div
              className={`w-full aspect-square rounded-lg flex items-center justify-center border border-[var(--color-border)] bg-[var(--color-surface)] ${limited ? "opacity-50" : ""}`}
            >
              <span
                className="text-3xl leading-none"
                dir="rtl"
                style={{ fontFamily: "var(--font-arabic)" }}
              >
                {form}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HarakatTableBlock({ letterId, harakats }: { letterId: number; harakats: string[] }) {
  const letter = getLetterById(letterId);
  if (!letter) return null;

  const combos = letter.harakatCombinations.filter((c) =>
    harakats.includes(c.harakat),
  );

  if (combos.length === 0) return null;

  return (
    <div className="mb-3">
      <div className="flex items-center gap-3 py-3 px-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
        <span
          className="text-2xl text-[var(--color-text-secondary)]"
          dir="rtl"
          style={{ fontFamily: "var(--font-arabic)" }}
        >
          {letter.forms.isolated}
        </span>
        <div className="flex-1 flex gap-4 justify-center">
          {combos.map((c) => (
            <div key={c.combined} className="flex flex-col items-center">
              <span
                className="text-4xl leading-[1.8] text-[var(--color-accent)]"
                dir="rtl"
                style={{ fontFamily: "var(--font-arabic)" }}
              >
                {c.combined}
              </span>
              <span className="text-xs text-[var(--color-text-secondary)] -mt-1">
                {c.sound}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function WordExampleBlock({ arabic, transliteration, meaning }: { arabic: string; transliteration: string; meaning?: string }) {
  return (
    <div className="flex items-center gap-3 py-3 px-4 mb-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
      <span
        className="text-2xl leading-[1.8] text-[var(--color-text-primary)] shrink-0"
        dir="rtl"
        style={{ fontFamily: "var(--font-arabic)" }}
      >
        {arabic}
      </span>
      <div className="flex flex-col">
        <span className="text-sm font-medium text-[var(--color-accent)]">
          {transliteration}
        </span>
        {meaning && (
          <span className="text-xs text-[var(--color-text-secondary)]">
            {meaning}
          </span>
        )}
      </div>
    </div>
  );
}

function TipBlock({ text }: { text: string }) {
  return (
    <div className="flex gap-2.5 px-4 py-3 mb-4 rounded-xl border border-[var(--color-accent)]/20 bg-[var(--color-accent)]/5">
      <svg className="w-4 h-4 text-[var(--color-accent)] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
        {text}
      </p>
    </div>
  );
}
