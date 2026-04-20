/**
 * Kar\u0131\u015F\u0131k S\u0131nav -- /alifba/exam
 * 28 soruluk kapsaml\u0131 s\u0131nav: ses tan\u0131ma + form tan\u0131ma kar\u0131\u015F\u0131k.
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ARABIC_LETTERS, getLetterForms, getSimilarDistractors, NON_CONNECTORS, shuffle } from "~/lib/kids-constants";
import { useTranslation } from "~/hooks/useTranslation";
import { useAlifbaStore } from "~/stores/alifba.store";
import { LetterAudioButton } from "~/components/alifba/LetterAudioButton";
import { playCorrect, playWrong } from "~/lib/quiz-sounds";
import { playLetterAudio, type LetterAudioHandle } from "~/lib/letter-audio";

export const Route = createFileRoute("/alifba/exam/")({
  component: ExamPage,
});

type QType = "voice" | "form";
type FormType = "isolated" | "initial" | "medial" | "final";


function buildQuestions() {
  return shuffle(ARABIC_LETTERS).map((letter, i) => {
    const qtype: QType = i % 2 === 0 ? "voice" : "form";
    const nc = NON_CONNECTORS.has(letter.arabic);
    const availableForms: FormType[] = nc ? ["isolated", "final"] : ["initial", "medial", "final"];
    const formType = availableForms[Math.floor(Math.random() * availableForms.length)];
    const forms = getLetterForms(letter.arabic);
    const distractors = getSimilarDistractors(letter.id, 3);
    return {
      letter,
      qtype,
      formType,
      displayForm: forms[formType],
      choices: shuffle([letter, ...distractors]),
    };
  });
}

function buildLastChanceQuestions(wrongLetterIds: string[]) {
  return wrongLetterIds.map((id, i) => {
    const letter = ARABIC_LETTERS.find((l) => l.id === id)!;
    const qtype: QType = i % 2 === 0 ? "voice" : "form";
    const nc = NON_CONNECTORS.has(letter.arabic);
    const availableForms: FormType[] = nc ? ["isolated", "final"] : ["initial", "medial", "final"];
    const formType = availableForms[Math.floor(Math.random() * availableForms.length)];
    const forms = getLetterForms(letter.arabic);
    const distractors = getSimilarDistractors(letter.id, 3);
    return {
      letter,
      qtype,
      formType,
      displayForm: forms[formType],
      choices: shuffle([letter, ...distractors]),
    };
  });
}

type Phase = "main" | "lastChance" | "done";

function ExamPage() {
  const { t } = useTranslation();
  const addExamResult = useAlifbaStore((s) => s.addExamResult);
  const [started, setStarted] = useState(false);
  const [questions] = useState(buildQuestions);
  const [phase, setPhase] = useState<Phase>("main");
  const [lcQuestions, setLcQuestions] = useState<ReturnType<typeof buildQuestions>>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const [lcCorrectIds, setLcCorrectIds] = useState<string[]>([]);

  const currentQuestions = phase === "lastChance" ? lcQuestions : questions;
  const q = currentQuestions[index];
  const audioHandleRef = useRef<LetterAudioHandle | null>(null);
  const playedKeyRef = useRef<string | null>(null);

  // Auto-play audio when a voice question appears
  useEffect(() => {
    if (!started || phase === "done" || !q || q.qtype !== "voice") return;
    const key = `${phase}-${index}`;
    if (playedKeyRef.current === key) return;
    playedKeyRef.current = key;
    audioHandleRef.current = playLetterAudio(q.letter.arabic, q.letter.id, () => {});
    return () => {
      audioHandleRef.current?.stop();
    };
  }, [index, phase, started]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChoice = useCallback(
    (choiceId: string) => {
      if (selected) return;
      setSelected(choiceId);
      const isCorrect = choiceId === q.letter.id;
      if (isCorrect) { setCorrect((c) => c + 1); playCorrect(); } else { playWrong(); }

      const newWrongIds = phase === "main" && !isCorrect ? [...wrongIds, q.letter.id] : wrongIds;
      const newLcCorrectIds = phase === "lastChance" && isCorrect ? [...lcCorrectIds, q.letter.id] : lcCorrectIds;

      setTimeout(() => {
        if (index + 1 >= currentQuestions.length) {
          if (phase === "main") {
            if (newWrongIds.length > 0) {
              setWrongIds(newWrongIds);
              setLcQuestions(buildLastChanceQuestions(newWrongIds));
              setIndex(0);
              setSelected(null);
              setCorrect(0);
              setPhase("lastChance");
            } else {
              addExamResult({ score: questions.length, total: questions.length });
              setPhase("done");
            }
          } else {
            const finalCorrect = (questions.length - newWrongIds.length) + newLcCorrectIds.length;
            addExamResult({ score: finalCorrect, total: questions.length });
            setLcCorrectIds(newLcCorrectIds);
            setPhase("done");
          }
        } else {
          if (phase === "main") setWrongIds(newWrongIds);
          if (phase === "lastChance") setLcCorrectIds(newLcCorrectIds);
          setIndex((i) => i + 1);
          setSelected(null);
        }
      }, 700);
    },
    [selected, q, index, correct, currentQuestions, phase, wrongIds, lcCorrectIds, questions, addExamResult],
  );

  if (!started) {
    return (
      <div className="mu-roadmap">
        <Link to="/alifba/letters" className="mu-letters-back">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M10 4L6 8l4 4" />
          </svg>
          {t.nav.back}
        </Link>
        <div className="mu-exam-intro">
          <div className="mu-exam-intro-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
          </div>
          <p className="mu-eyebrow" style={{ margin: "16px 0 8px" }}>
            <span className="mu-eb-line" />
            {"Harf S\u0131nav\u0131"}
          </p>
          <h1 className="mu-exam-intro-title">{"Ne Kadar Biliyorsun?"}</h1>
          <p className="mu-exam-intro-desc">{t.alifba.mixedExamDesc}</p>
          <p className="mu-exam-intro-meta">{"28 soru -- Ses ve form tan\u0131ma"}</p>
          <button onClick={() => setStarted(true)} className="mu-btn primary" style={{ marginTop: 20 }}>
            {t.alifba.examStart}
          </button>
        </div>
      </div>
    );
  }

  if (phase === "done") {
    const finalCorrect = questions.length - wrongIds.length + lcCorrectIds.length;
    const pct = Math.round((finalCorrect / questions.length) * 100);
    const passed = pct >= 70;
    return (
      <div className="mu-roadmap">
        <div className="mu-exam-result">
          <div className="mu-exam-result-badge" style={{ background: passed ? "var(--mu-accent-soft)" : "var(--mu-bg-soft)", color: passed ? "var(--mu-accent)" : "var(--mu-muted)" }}>
            {passed ? (
              <svg width="40" height="40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            ) : (
              <svg width="40" height="40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            )}
          </div>
          <span className="mu-exam-result-score">{finalCorrect}/{questions.length}</span>
          <p className="mu-exam-result-pct">%{pct}</p>
          <p className="mu-exam-result-msg">
            {passed ? "Harika! Harfleri iyi biliyorsun." : "Biraz daha pratik yapal\u0131m."}
          </p>
          <div className="mu-exam-result-actions">
            <Link to="/alifba/letters" className="mu-btn ghost small">{t.nav.back}</Link>
            <button
              onClick={() => {
                setIndex(0); setSelected(null); setCorrect(0);
                setWrongIds([]); setLcCorrectIds([]); setLcQuestions([]);
                setPhase("main"); setStarted(true);
              }}
              className="mu-btn primary small"
            >
              {t.alifba.tryAgain}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mu-roadmap">
      {/* Header */}
      <div className="mu-step-progress-header">
        <span>{phase === "lastChance" ? t.alifba.lastChance : "Harf S\u0131nav\u0131"}</span>
        <span>{index + 1} / {currentQuestions.length}</span>
      </div>

      {/* Progress */}
      <div className="mu-letters-progress" style={{ marginBottom: 24 }}>
        <div className="mu-letters-progress-fill" style={{ width: `${(index / currentQuestions.length) * 100}%` }} />
      </div>

      {/* Last chance banner */}
      {phase === "lastChance" && (
        <div className="mu-exam-banner">
          <div>
            <p className="mu-exam-banner-title">{t.alifba.lastChance}</p>
            <p className="mu-exam-banner-desc">{t.alifba.lastChanceDesc}</p>
          </div>
        </div>
      )}

      {/* Question */}
      <div className="mu-exam-question">
        {q.qtype === "voice" ? (
          <>
            <p className="mu-exam-prompt">{t.alifba.voiceQuiz}</p>
            <LetterAudioButton letterId={q.letter.id} size="lg" />
          </>
        ) : (
          <>
            <p className="mu-exam-prompt">{t.alifba.formsQuiz}</p>
            <span className="mu-exam-arabic" dir="rtl">{q.displayForm}</span>
          </>
        )}
      </div>

      {/* Options */}
      <div className="mu-exam-options">
        {q.choices.map((choice) => {
          const isSelected = selected === choice.id;
          const isRight = choice.id === q.letter.id;
          const cls = [
            "mu-exam-option",
            selected && isRight ? "correct" : "",
            selected && isSelected && !isRight ? "wrong" : "",
            selected && !isRight && !isSelected ? "faded" : "",
          ].filter(Boolean).join(" ");

          return (
            <button
              key={choice.id}
              onClick={() => handleChoice(choice.id)}
              disabled={!!selected}
              className={cls}
            >
              <span className="mu-exam-option-ar">{choice.arabic}</span>
              {selected && isRight && (
                <svg className="mu-exam-option-icon" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
              )}
              {selected && isSelected && !isRight && (
                <svg className="mu-exam-option-icon" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
