import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ReadingListItem {
  type: "surah" | "juz" | "page";
  id: number;
  addedAt: number;
  lastReadAt: number | null;
}

interface ReadingListState {
  items: ReadingListItem[];
  addItem: (type: ReadingListItem["type"], id: number) => void;
  removeItem: (type: ReadingListItem["type"], id: number) => void;
  touchItem: (type: ReadingListItem["type"], id: number) => void;
  isInList: (type: ReadingListItem["type"], id: number) => boolean;
}

const MAX_ITEMS = 20;

function sortItems(items: ReadingListItem[]): ReadingListItem[] {
  return [...items].sort((a, b) => {
    const aTime = a.lastReadAt ?? a.addedAt;
    const bTime = b.lastReadAt ?? b.addedAt;
    return bTime - aTime;
  });
}

export const useReadingListStore = create<ReadingListState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (type, id) => {
        const { items } = get();
        if (items.some((i) => i.type === type && i.id === id)) return;
        const next = [
          { type, id, addedAt: Date.now(), lastReadAt: null },
          ...items,
        ].slice(0, MAX_ITEMS);
        set({ items: sortItems(next) });
      },
      removeItem: (type, id) => {
        set({ items: get().items.filter((i) => !(i.type === type && i.id === id)) });
      },
      touchItem: (type, id) => {
        const { items } = get();
        const idx = items.findIndex((i) => i.type === type && i.id === id);
        if (idx === -1) return;
        const updated = items.map((i, j) =>
          j === idx ? { ...i, lastReadAt: Date.now() } : i,
        );
        set({ items: sortItems(updated) });
      },
      isInList: (type, id) => {
        return get().items.some((i) => i.type === type && i.id === id);
      },
    }),
    { name: "mahfuz-reading-list" },
  ),
);
