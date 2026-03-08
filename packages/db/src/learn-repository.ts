import { db } from "./schema";
import type { LessonProgressEntry, LearnConceptEntry } from "./schema";
import { MASTERY_INTERVALS } from "@mahfuz/shared/types";

export class LearnRepository {
  // Lesson Progress
  async getLessonProgress(
    userId: string,
    lessonId: string,
  ): Promise<LessonProgressEntry | undefined> {
    return db.lesson_progress
      .where("id")
      .equals(`${userId}-${lessonId}`)
      .first();
  }

  async getAllProgressForStage(
    userId: string,
    stageId: number,
  ): Promise<LessonProgressEntry[]> {
    return db.lesson_progress
      .where("[userId+stageId]")
      .equals([userId, stageId])
      .toArray();
  }

  async getCompletedLessons(userId: string): Promise<LessonProgressEntry[]> {
    return db.lesson_progress
      .where("[userId+status]")
      .equals([userId, "completed"])
      .toArray();
  }

  async upsertLessonProgress(entry: LessonProgressEntry): Promise<void> {
    await db.lesson_progress.put({
      ...entry,
      id: `${entry.userId}-${entry.lessonId}`,
    });
  }

  async getStageCompletionMap(
    userId: string,
  ): Promise<Map<number, { total: number; completed: number }>> {
    const all = await db.lesson_progress
      .where("userId")
      .equals(userId)
      .toArray();

    // Manually handle since userId isn't a direct index
    // Actually we filter from the compound index
    const map = new Map<number, { total: number; completed: number }>();

    for (const entry of all) {
      const existing = map.get(entry.stageId) || { total: 0, completed: 0 };
      existing.total++;
      if (entry.status === "completed") existing.completed++;
      map.set(entry.stageId, existing);
    }

    return map;
  }

  async getTotalSevapPointEarned(userId: string): Promise<number> {
    const completed = await this.getCompletedLessons(userId);
    return completed.reduce((sum, e) => sum + e.sevapPointEarned, 0);
  }

  // Concept Mastery (Simplified SRS)
  async getConcept(
    userId: string,
    conceptId: string,
  ): Promise<LearnConceptEntry | undefined> {
    return db.learn_concepts
      .where("[userId+conceptId]")
      .equals([userId, conceptId])
      .first();
  }

  async getConceptsDueForReview(
    userId: string,
    now: number = Date.now(),
    limit: number = 20,
  ): Promise<LearnConceptEntry[]> {
    return db.learn_concepts
      .where("[userId+nextReviewAt]")
      .between([userId, 0], [userId, now])
      .limit(limit)
      .toArray();
  }

  async upsertConceptMastery(entry: LearnConceptEntry): Promise<void> {
    await db.learn_concepts.put({
      ...entry,
      id: `${entry.userId}-${entry.conceptId}`,
    });
  }

  async recordConceptResult(
    userId: string,
    conceptId: string,
    isCorrect: boolean,
  ): Promise<LearnConceptEntry> {
    const existing = await this.getConcept(userId, conceptId);
    const now = Date.now();

    const entry: LearnConceptEntry = existing || {
      id: `${userId}-${conceptId}`,
      userId,
      conceptId,
      correctCount: 0,
      incorrectCount: 0,
      masteryLevel: 0,
      nextReviewAt: 0,
    };

    if (isCorrect) {
      entry.correctCount++;
      // Level up if enough correct answers at current level
      const thresholds = [2, 3, 4]; // correct answers needed for each level
      if (
        entry.masteryLevel < 3 &&
        entry.correctCount >= thresholds[entry.masteryLevel]
      ) {
        entry.masteryLevel = Math.min(3, entry.masteryLevel + 1) as 0 | 1 | 2 | 3;
      }
    } else {
      entry.incorrectCount++;
      // Level down on incorrect
      if (entry.masteryLevel > 0) {
        entry.masteryLevel = Math.max(0, entry.masteryLevel - 1) as 0 | 1 | 2 | 3;
      }
    }

    // Schedule next review
    const interval = MASTERY_INTERVALS[entry.masteryLevel];
    entry.nextReviewAt = interval === Infinity ? Number.MAX_SAFE_INTEGER : now + interval;

    await this.upsertConceptMastery(entry);
    return entry;
  }

  async getAllConcepts(userId: string): Promise<LearnConceptEntry[]> {
    return db.learn_concepts.where("userId").equals(userId).toArray();
  }
}

export const learnRepository = new LearnRepository();
