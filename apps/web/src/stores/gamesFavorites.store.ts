/**
 * Favori oyunlar — oyunlar listesinde üstte gösterilir.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface GamesFavoritesState {
  favoriteIds: string[];
}

interface GamesFavoritesActions {
  toggle: (id: string) => void;
  isFavorite: (id: string) => boolean;
}

export const useGamesFavoritesStore = create<GamesFavoritesState & GamesFavoritesActions>()(
  persist(
    (set, get) => ({
      favoriteIds: [],
      toggle: (id) =>
        set((s) => ({
          favoriteIds: s.favoriteIds.includes(id)
            ? s.favoriteIds.filter((f) => f !== id)
            : [...s.favoriteIds, id],
        })),
      isFavorite: (id) => get().favoriteIds.includes(id),
    }),
    { name: "mahfuz-games-favorites" }
  )
);
