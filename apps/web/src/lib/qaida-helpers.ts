/**
 * Qaida yardimci fonksiyonlari.
 * Step-Stage eslesmesi, ders navigasyonu, i18n key cozumleme.
 */

import { CURRICULUM } from "@mahfuz/shared/data/learn/curriculum";
import { ARABIC_ALPHABET } from "@mahfuz/shared/data/learn/alphabet";
import type { Stage, Lesson, ArabicLetter } from "@mahfuz/shared/types";

/** Qaida 10-adim -> Curriculum stage ID eslesmesi */
export const STEP_TO_STAGE: Record<number, number> = {
  1: 1,   // Harfler
  2: 3,   // Fetha/Ustun
  3: 7,   // Sukun/CVC
  4: 8,   // Tenvin
  5: 9,   // Sedde
  6: 6,   // Med Harfleri
  7: 2,   // Bagli Harfler
  8: 10,  // Temel Kelimeler
  9: 11,  // Kisa Sureler
  10: 12, // Tecvid
};

export function getStageForStep(stepId: number): Stage | undefined {
  const stageId = STEP_TO_STAGE[stepId];
  if (!stageId) return undefined;
  return CURRICULUM.find((s) => s.id === stageId);
}

export function getStageById(stageId: number): Stage | undefined {
  return CURRICULUM.find((s) => s.id === stageId);
}

export function getLessonWithStage(lessonId: string): { lesson: Lesson; stage: Stage } | undefined {
  for (const stage of CURRICULUM) {
    const lesson = stage.lessons.find((l) => l.id === lessonId);
    if (lesson) return { lesson, stage };
  }
  return undefined;
}

export function getNextLesson(lessonId: string): { lesson: Lesson; stage: Stage } | undefined {
  for (const stage of CURRICULUM) {
    const idx = stage.lessons.findIndex((l) => l.id === lessonId);
    if (idx >= 0 && idx < stage.lessons.length - 1) {
      return { lesson: stage.lessons[idx + 1], stage };
    }
  }
  return undefined;
}

export function getLessonIndex(lessonId: string, stage: Stage): number {
  return stage.lessons.findIndex((l) => l.id === lessonId);
}

export function getFirstIncompleteLessonForStep(
  stepId: number,
  completedLessons: Set<string>,
): string | undefined {
  const stage = getStageForStep(stepId);
  if (!stage) return undefined;
  const incomplete = stage.lessons.find((l) => !completedLessons.has(l.id));
  return incomplete?.id ?? stage.lessons[0]?.id;
}

export function getLetterById(id: number): ArabicLetter | undefined {
  return ARABIC_ALPHABET.find((l) => l.id === id);
}

/**
 * Dot-notation key'i t.learn nesnesinde cozumler.
 * Ornek: resolveLearnKey(t, "s1.l1.intro") -> t.learn.s1.l1.intro
 */
export function resolveLearnKey(learn: Record<string, unknown>, key: string): string {
  const parts = key.split(".");
  let current: unknown = learn;
  for (const part of parts) {
    if (current && typeof current === "object" && part in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return key; // fallback: key'i dondur
    }
  }
  return typeof current === "string" ? current : key;
}
