/**
 * Qaida roadmap - paylasilan step tanimlari ve ilerleme hook'u.
 * Hem /alifba hem /qaida sayfalarinda kullanilir.
 */

import { useEffect } from "react";
import { useAlifbaStore, computeAlifbaStats } from "~/stores/alifba.store";
import { useQaidaStore } from "~/stores/qaida.store";
import { getFirstIncompleteLessonForStep, getStageForStep } from "~/lib/qaida-helpers";

export interface StepDef {
  id: number;
  titleKey: string;
  subtitleKey: string;
  icon: string;
  link: string | null;
  examLink: string | null;
  isMilestone?: boolean;
}

export const STEPS: StepDef[] = [
  { id: 1, titleKey: "qaidaStep1", subtitleKey: "qaidaStep1Desc", icon: "\u0627", link: "/alifba", examLink: "/alifba/exam" },
  { id: 2, titleKey: "qaidaStep2", subtitleKey: "qaidaStep2Desc", icon: "\u0628\u064E", link: null, examLink: "/alifba/exam/2" },
  { id: 3, titleKey: "qaidaStep3", subtitleKey: "qaidaStep3Desc", icon: "\u0631\u064E\u0628\u0652", link: null, examLink: "/alifba/exam/3" },
  { id: 4, titleKey: "qaidaStep4", subtitleKey: "qaidaStep4Desc", icon: "\u0643\u0650\u062A\u064E\u0627\u0628\u064B\u0627", link: null, examLink: "/alifba/exam/4" },
  { id: 5, titleKey: "qaidaStep5", subtitleKey: "qaidaStep5Desc", icon: "\u0631\u064E\u0628\u064E\u0651", link: null, examLink: "/alifba/exam/5" },
  { id: 6, titleKey: "qaidaStep6", subtitleKey: "qaidaStep6Desc", icon: "\u0642\u064E\u0627\u0644\u064E", link: null, examLink: "/alifba/exam/6" },
  { id: 7, titleKey: "qaidaStep7", subtitleKey: "qaidaStep7Desc", icon: "\u0628\u0650\u0633\u0652\u0645\u0650", link: null, examLink: "/alifba/exam/7" },
  { id: 8, titleKey: "qaidaStep8", subtitleKey: "qaidaStep8Desc", icon: "\u0627\u0644\u0644\u0651\u064E\u0647\u0650", link: null, examLink: "/alifba/exam/8" },
  { id: 9, titleKey: "qaidaStep9", subtitleKey: "qaidaStep9Desc", icon: "\u0627\u0644\u0652\u0641\u064E\u0627\u062A\u0650\u062D\u064E\u0629", link: null, examLink: "/alifba/exam/9", isMilestone: true },
  { id: 10, titleKey: "qaidaStep10", subtitleKey: "qaidaStep10Desc", icon: "\u062A\u064E\u062C\u0652\u0648\u0650\u064A\u062F", link: "/tajweed", examLink: null },
];

export type StepStatus = "completed" | "available" | "locked";

/** Adim icin dinamik ders linki hesapla */
export function getLessonLinkForStep(stepId: number, completedLessons: Set<string>): string | null {
  if (stepId === 1 || stepId === 10) return null;
  const lessonId = getFirstIncompleteLessonForStep(stepId, completedLessons);
  return lessonId ? `/alifba/lesson/${lessonId}` : null;
}

/** Adim icin ders ilerleme sayisi */
export function getStepLessonProgress(stepId: number, completedLessons: Set<string>): { done: number; total: number } | null {
  if (stepId === 1 || stepId === 10) return null;
  const stage = getStageForStep(stepId);
  if (!stage) return null;
  const done = stage.lessons.filter((l) => completedLessons.has(l.id)).length;
  return { done, total: stage.lessons.length };
}

/** Her adimin durumunu hesapla (completed / available / locked) */
export function useStepStatuses(): StepStatus[] {
  const alifbaState = useAlifbaStore();
  const { completedSteps, completeStep } = useQaidaStore();
  const completedSet = new Set(completedSteps);

  const { mastered } = computeAlifbaStats(alifbaState);
  const elifbaComplete = mastered >= 28;

  useEffect(() => {
    if (elifbaComplete && !completedSet.has(1)) {
      completeStep(1);
    }
  }, [elifbaComplete]); // eslint-disable-line react-hooks/exhaustive-deps

  return STEPS.map((step) => {
    if (completedSet.has(step.id)) return "completed";
    if (step.id === 1) return "available";
    if (completedSet.has(step.id - 1)) return "available";
    return "locked";
  });
}
