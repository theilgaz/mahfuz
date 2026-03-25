/**
 * Yer imleri store'u — favori ayetler.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface Bookmark {
  surahId: number;
  ayahNumber: number;
  pageNumber: number;
  createdAt: number;
}

interface BookmarksState {
  bookmarks: Bookmark[];
}

interface BookmarksActions {
  addBookmark: (bookmark: Omit<Bookmark, "createdAt">) => void;
  removeBookmark: (surahId: number, ayahNumber: number) => void;
  isBookmarked: (surahId: number, ayahNumber: number) => boolean;
  toggleBookmark: (bookmark: Omit<Bookmark, "createdAt">) => void;
}

export const useBookmarksStore = create<BookmarksState & BookmarksActions>()(
  persist(
    (set, get) => ({
      bookmarks: [],

      addBookmark: (bm) =>
        set((s) => ({
          bookmarks: [
            ...s.bookmarks,
            { ...bm, createdAt: Date.now() },
          ],
        })),

      removeBookmark: (surahId, ayahNumber) =>
        set((s) => ({
          bookmarks: s.bookmarks.filter(
            (b) => !(b.surahId === surahId && b.ayahNumber === ayahNumber),
          ),
        })),

      isBookmarked: (surahId, ayahNumber) =>
        get().bookmarks.some(
          (b) => b.surahId === surahId && b.ayahNumber === ayahNumber,
        ),

      toggleBookmark: (bm) => {
        if (get().isBookmarked(bm.surahId, bm.ayahNumber)) {
          get().removeBookmark(bm.surahId, bm.ayahNumber);
        } else {
          get().addBookmark(bm);
        }
      },
    }),
    {
      name: "mahfuz-core-bookmarks",
    },
  ),
);
