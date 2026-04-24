/**
 * Sınav oluşturucu.
 * ExamConfig'e göre generator'lardan soru toplar.
 */

import { shuffle } from "~/lib/kids-constants";
import { QAIDA_TOPICS, type ExamConfig } from "./qaida-topics";
import { getGenerator, type ExamQuestion } from "./exam-generators";

/**
 * Konu sınavı oluşturur.
 * Her generator'dan eşit sayıda soru alır, karıştırır.
 */
export function buildExam(config: ExamConfig): ExamQuestion[] {
  const { questionCount, generators } = config;
  if (generators.length === 0) return [];

  const perGenerator = Math.ceil(questionCount / generators.length);
  const questions: ExamQuestion[] = [];

  for (const genId of generators) {
    const gen = getGenerator(genId);
    questions.push(...gen(perGenerator));
  }

  // Toplam soru sayısına kes ve karıştır
  return shuffle(questions).slice(0, questionCount);
}

/**
 * Seviye testi oluşturur.
 * Her topic'ten 3 soru, topic sirasi korunur (kolay -> zor).
 * Toplam: 10 topic x 3 = 30 soru.
 */
export function buildPlacementExam(): { questions: ExamQuestion[]; topicBoundaries: number[] } {
  const questions: ExamQuestion[] = [];
  const topicBoundaries: number[] = []; // her topic'in başlangıç indeksi

  for (const topic of QAIDA_TOPICS) {
    topicBoundaries.push(questions.length);

    if (topic.examConfig.generators.length === 0) {
      // Placeholder topic (tajweed) -- 3 bos soru ekleme, sonraki topic'e gec
      // Placement test bunu "gecildi" sayar
      continue;
    }

    // Her topic'ten 3 soru
    const topicQuestions = buildExam({
      questionCount: 3,
      passThreshold: topic.examConfig.passThreshold,
      generators: topic.examConfig.generators,
    });

    questions.push(...topicQuestions);
  }

  return { questions, topicBoundaries };
}
