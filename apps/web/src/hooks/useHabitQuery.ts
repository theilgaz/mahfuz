/**
 * Alışkanlık motoru TanStack Query hook'ları.
 */

import { queryOptions, useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getStreak,
  getWeeklySummary,
  getActiveHatim,
  getReadingGoal,
  getCompletedHatims,
  startHatim,
  setReadingGoal,
  logReadingSession,
} from "~/lib/habit-service";

// ── Query Keys ───────────────────────────────────────────

export const habitKeys = {
  all: ["habit"] as const,
  streak: (userId: string) => [...habitKeys.all, "streak", userId] as const,
  weekly: (userId: string) => [...habitKeys.all, "weekly", userId] as const,
  hatim: (userId: string) => [...habitKeys.all, "hatim", userId] as const,
  hatims: (userId: string) => [...habitKeys.all, "hatims", userId] as const,
  goal: (userId: string) => [...habitKeys.all, "goal", userId] as const,
};

// ── Query Options ────────────────────────────────────────

export const streakQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: habitKeys.streak(userId),
    queryFn: () => getStreak({ data: userId }),
    staleTime: 60_000, // 1 dakika
  });

export const weeklySummaryQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: habitKeys.weekly(userId),
    queryFn: () => getWeeklySummary({ data: userId }),
    staleTime: 60_000,
  });

export const activeHatimQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: habitKeys.hatim(userId),
    queryFn: () => getActiveHatim({ data: userId }),
    staleTime: 60_000,
  });

export const readingGoalQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: habitKeys.goal(userId),
    queryFn: () => getReadingGoal({ data: userId }),
    staleTime: Infinity,
  });

export const completedHatimsQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: habitKeys.hatims(userId),
    queryFn: () => getCompletedHatims({ data: userId }),
    staleTime: 60_000,
  });

// ── Hooks ────────────────────────────────────────────────

export function useStreak(userId: string) {
  return useSuspenseQuery(streakQueryOptions(userId));
}

export function useWeeklySummary(userId: string) {
  return useSuspenseQuery(weeklySummaryQueryOptions(userId));
}

export function useActiveHatim(userId: string) {
  return useSuspenseQuery(activeHatimQueryOptions(userId));
}

export function useReadingGoal(userId: string) {
  return useSuspenseQuery(readingGoalQueryOptions(userId));
}

// ── Mutations ────────────────────────────────────────────

export function useLogReading(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      pagesRead: number;
      ayahsRead: number;
      durationSeconds: number;
      startPage?: number;
      endPage?: number;
    }) => logReadingSession({ data: { userId, ...input } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: habitKeys.streak(userId) });
      queryClient.invalidateQueries({ queryKey: habitKeys.weekly(userId) });
      queryClient.invalidateQueries({ queryKey: habitKeys.hatim(userId) });
    },
  });
}

export function useStartHatim(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => startHatim({ data: userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: habitKeys.hatim(userId) });
      queryClient.invalidateQueries({ queryKey: habitKeys.hatims(userId) });
    },
  });
}

export function useSetReadingGoal(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dailyTargetPages: number) =>
      setReadingGoal({ data: { userId, dailyTargetPages } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: habitKeys.goal(userId) });
    },
  });
}
