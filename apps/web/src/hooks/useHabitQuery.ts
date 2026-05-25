/**
 * Alışkanlık motoru TanStack Query hook'ları.
 * userId server tarafında oturumdan türetilir; client'tan parametre geçilmez.
 */

import { queryOptions, useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getStreak,
  getWeeklySummary,
  getYearActivity,
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
  streak: () => [...habitKeys.all, "streak"] as const,
  weekly: () => [...habitKeys.all, "weekly"] as const,
  year: () => [...habitKeys.all, "year"] as const,
  hatim: () => [...habitKeys.all, "hatim"] as const,
  hatims: () => [...habitKeys.all, "hatims"] as const,
  goal: () => [...habitKeys.all, "goal"] as const,
};

// ── Query Options ────────────────────────────────────────

export const streakQueryOptions = () =>
  queryOptions({
    queryKey: habitKeys.streak(),
    queryFn: () => getStreak(),
    staleTime: 60_000,
  });

export const weeklySummaryQueryOptions = () =>
  queryOptions({
    queryKey: habitKeys.weekly(),
    queryFn: () => getWeeklySummary(),
    staleTime: 60_000,
  });

export const yearActivityQueryOptions = () =>
  queryOptions({
    queryKey: habitKeys.year(),
    queryFn: () => getYearActivity(),
    staleTime: 60_000,
  });

export const activeHatimQueryOptions = () =>
  queryOptions({
    queryKey: habitKeys.hatim(),
    queryFn: () => getActiveHatim(),
    staleTime: 60_000,
  });

export const readingGoalQueryOptions = () =>
  queryOptions({
    queryKey: habitKeys.goal(),
    queryFn: () => getReadingGoal(),
    staleTime: Infinity,
  });

export const completedHatimsQueryOptions = () =>
  queryOptions({
    queryKey: habitKeys.hatims(),
    queryFn: () => getCompletedHatims(),
    staleTime: 60_000,
  });

// ── Hooks ────────────────────────────────────────────────

export function useStreak() {
  return useSuspenseQuery(streakQueryOptions());
}

export function useWeeklySummary() {
  return useSuspenseQuery(weeklySummaryQueryOptions());
}

export function useActiveHatim() {
  return useSuspenseQuery(activeHatimQueryOptions());
}

export function useReadingGoal() {
  return useSuspenseQuery(readingGoalQueryOptions());
}

// ── Mutations ────────────────────────────────────────────

export function useLogReading() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      pagesRead: number;
      ayahsRead: number;
      durationSeconds: number;
      startPage?: number;
      endPage?: number;
    }) => logReadingSession({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: habitKeys.streak() });
      queryClient.invalidateQueries({ queryKey: habitKeys.weekly() });
      queryClient.invalidateQueries({ queryKey: habitKeys.hatim() });
    },
  });
}

export function useStartHatim() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => startHatim(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: habitKeys.hatim() });
      queryClient.invalidateQueries({ queryKey: habitKeys.hatims() });
    },
  });
}

export function useSetReadingGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dailyTargetPages: number) =>
      setReadingGoal({ data: { dailyTargetPages } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: habitKeys.goal() });
    },
  });
}
