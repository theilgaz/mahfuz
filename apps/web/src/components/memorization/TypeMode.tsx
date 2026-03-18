import { useState, useCallback, useRef, useEffect } from "react";
import type { Verse, Word } from "@mahfuz/shared/types";
import { useTranslation } from "~/hooks/useTranslation";
import type { ModeResult, VerseResult, WordResult } from "~/stores/useMemorizationStore";

interface TypeModeProps {
  surahId: number;
  verses: Verse[];
  onVerseChange: (index: number) => void;
  onComplete: (result: ModeResult) => void;
}

function normalizeTranslit(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function getVerseWords(verse: Verse): Word[] {
  return verse.words?.filter((w) => w.char_type_name === "word") || [];
}

export function TypeMode({ surahId, verses, onVerseChange, onComplete }: TypeModeProps) {
  const { t } = useTranslation();
  const [verseIdx, setVerseIdx] = useState(0);
  const [wordIdx, setWordIdx] = useState(0);
  const [input, setInput] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [charFeedback, setCharFeedback] = useState<Array<"correct" | "wrong" | "pending">>([]);
  const [hintCount, setHintCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const wordStartTime = useRef(Date.now());
  const verseStartTime = useRef(Date.now());
  const wordResults = useRef<WordResult[]>([]);
  const verseResults = useRef<VerseResult[]>([]);

  const verse = verses[verseIdx];
  const words = getVerseWords(verse);
  const currentWord = words[wordIdx];

  const expectedTranslit = currentWord?.transliteration?.text || "";
  const normalizedExpected = normalizeTranslit(expectedTranslit);

  // Focus input on word change
  useEffect(() => {
    inputRef.current?.focus();
  }, [verseIdx, wordIdx]);

  // Validate characters as user types
  const handleInput = useCallback(
    (value: string) => {
      setInput(value);
      const normalizedInput = normalizeTranslit(value);
      const feedback: Array<"correct" | "wrong" | "pending"> = [];

      for (let i = 0; i < normalizedInput.length; i++) {
        if (i < normalizedExpected.length) {
          feedback.push(normalizedInput[i] === normalizedExpected[i] ? "correct" : "wrong");
        } else {
          feedback.push("wrong");
        }
      }
      setCharFeedback(feedback);
    },
    [normalizedExpected],
  );

  const advanceWord = useCallback(
    (wasCorrect: boolean) => {
      if (!currentWord) return;

      wordResults.current.push({
        wordPosition: currentWord.position,
        verseKey: verse.verse_key,
        correct: wasCorrect,
        mode: "type",
        timeMs: Date.now() - wordStartTime.current,
      });

      const nextWordIdx = wordIdx + 1;
      if (nextWordIdx < words.length) {
        setWordIdx(nextWordIdx);
        setInput("");
        setAttempts(0);
        setShowAnswer(false);
        setCharFeedback([]);
        setHintCount(0);
        wordStartTime.current = Date.now();
      } else {
        // Verse complete
        const verseWordResults = wordResults.current.filter((r) => r.verseKey === verse.verse_key);
        const correct = verseWordResults.filter((r) => r.correct).length;
        verseResults.current.push({
          verseKey: verse.verse_key,
          mode: "type",
          wordsCorrect: correct,
          wordsTotal: verseWordResults.length,
          timeMs: Date.now() - verseStartTime.current,
        });

        const nextVerseIdx = verseIdx + 1;
        if (nextVerseIdx < verses.length) {
          setVerseIdx(nextVerseIdx);
          setWordIdx(0);
          setInput("");
          setAttempts(0);
          setShowAnswer(false);
          setCharFeedback([]);
          setHintCount(0);
          wordStartTime.current = Date.now();
          verseStartTime.current = Date.now();
          onVerseChange(nextVerseIdx);
        } else {
          // All done
          const totalCorrect = verseResults.current.reduce((s, v) => s + v.wordsCorrect, 0);
          const totalWords = verseResults.current.reduce((s, v) => s + v.wordsTotal, 0);
          onComplete({
            mode: "type",
            surahId,
            verseResults: verseResults.current,
            totalCorrect,
            totalWords,
            completedAt: Date.now(),
          });
        }
      }
    },
    [currentWord, verse, wordIdx, words.length, verseIdx, verses.length, surahId, onComplete, onVerseChange],
  );

  const handleSubmit = useCallback(() => {
    if (showAnswer) {
      advanceWord(false);
      return;
    }

    const normalizedInput = normalizeTranslit(input);
    if (normalizedInput === normalizedExpected) {
      advanceWord(true);
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= 3) {
        setShowAnswer(true);
      }
    }
  }, [input, normalizedExpected, attempts, showAnswer, advanceWord]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  const handleHint = useCallback(() => {
    const nextHint = hintCount + 1;
    setHintCount(nextHint);
    setInput(expectedTranslit.slice(0, nextHint));
    handleInput(expectedTranslit.slice(0, nextHint));
  }, [hintCount, expectedTranslit, handleInput]);

  if (!currentWord) return null;

  const progressInVerse = words.length > 0 ? ((wordIdx) / words.length) * 100 : 0;

  return (
    <div className="flex flex-col p-4">
      {/* Verse progress */}
      <div className="mb-4">
        <div className="mb-1 flex items-center justify-between text-[12px] text-[var(--theme-text-tertiary)]">
          <span>{t.memorize.verse} {verse.verse_number}</span>
          <span className="tabular-nums">{wordIdx + 1} / {words.length}</span>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-[var(--theme-hover-bg)]">
          <div
            className="h-full rounded-full bg-amber-500 transition-all"
            style={{ width: `${progressInVerse}%` }}
          />
        </div>
      </div>

      {/* Current word display */}
      <div className="mb-6 rounded-2xl bg-[var(--theme-bg-primary)] p-6 text-center shadow-[var(--shadow-card)]">
        {/* Arabic */}
        <p className="arabic-text mb-1 text-[36px] font-semibold leading-relaxed text-[var(--theme-text)]" dir="rtl">
          {currentWord.text_imlaei || currentWord.text}
        </p>

        {/* Faint transliteration hint */}
        {expectedTranslit ? (
          <p className="mb-3 text-[14px] italic text-[var(--theme-text-tertiary)] opacity-50" style={{ fontFamily: "var(--font-sans)" }}>
            {expectedTranslit}
          </p>
        ) : (
          <div className="mb-3" />
        )}

        {/* Meaning */}
        {currentWord.translation?.text && (
          <p className="mb-4 text-[14px] text-[var(--theme-text-tertiary)]">
            {currentWord.translation.text}
          </p>
        )}

        {/* Expected transliteration (shown as hint or answer) */}
        {showAnswer && (
          <div className="mb-4 rounded-lg bg-amber-500/10 px-3 py-2">
            <p className="text-[14px] font-medium text-amber-600">{expectedTranslit}</p>
          </div>
        )}

        {/* Char-by-char feedback display */}
        {input.length > 0 && !showAnswer && (
          <div className="mb-4 flex justify-center gap-0.5">
            {charFeedback.map((status, i) => (
              <span
                key={i}
                className={`inline-block text-[18px] font-mono ${
                  status === "correct" ? "text-emerald-600" : "text-red-500"
                }`}
              >
                {input[i]}
              </span>
            ))}
          </div>
        )}

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => handleInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t.memorize.typeHere}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          className="w-full rounded-xl border-2 border-[var(--theme-divider)] bg-[var(--theme-bg)] px-4 py-3 text-center text-[16px] text-[var(--theme-text)] placeholder:text-[var(--theme-text-quaternary)] focus:border-primary-500 focus:outline-none"
        />

        {/* Attempt indicator */}
        {attempts > 0 && !showAnswer && (
          <p className="mt-2 text-[12px] text-red-500">
            {t.memorize.wrongAttempt} ({attempts}/3)
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleHint}
          disabled={showAnswer || hintCount >= normalizedExpected.length}
          className="flex-1 rounded-xl border border-[var(--theme-divider)] bg-[var(--theme-bg-primary)] py-3 text-[14px] font-medium text-[var(--theme-text-secondary)] disabled:opacity-30"
        >
          {t.memorize.hint} {hintCount > 0 && `(${hintCount})`}
        </button>
        <button
          onClick={handleSubmit}
          className="flex-1 rounded-xl bg-primary-600 py-3 text-[14px] font-medium text-white"
        >
          {showAnswer ? t.memorize.nextWord : t.memorize.checkWord}
        </button>
      </div>

      {/* Verse context (small) */}
      <div className="mt-6 rounded-xl bg-[var(--theme-bg-primary)] p-3" dir="rtl">
        <div className="flex flex-wrap justify-end gap-1">
          {words.map((w, i) => (
            <span
              key={w.id}
              className={`arabic-text inline-block text-[16px] ${
                i === wordIdx
                  ? "font-bold text-primary-600"
                  : i < wordIdx
                    ? "text-[var(--theme-text)]"
                    : "text-[var(--theme-text-quaternary)] blur-sm"
              }`}
            >
              {w.text_imlaei || w.text}{" "}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
