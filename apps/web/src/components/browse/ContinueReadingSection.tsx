import { useSuspenseQuery } from "@tanstack/react-query";
import { chaptersQueryOptions } from "~/hooks/useChapters";
import { useReadingListStore } from "~/stores/useReadingListStore";
import { ReadingListCard } from "./ReadingListCard";
import { useTranslation } from "~/hooks/useTranslation";

export function ContinueReadingSection() {
  const items = useReadingListStore((s) => s.items);
  const { t } = useTranslation();
  const { data: chapters } = useSuspenseQuery(chaptersQueryOptions());

  if (items.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-[var(--theme-text)]">
          {t.continueReading.title}
        </h2>
        <span className="text-[11px] tabular-nums text-[var(--theme-text-quaternary)]">
          {items.length}
        </span>
      </div>
      <div className="-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 scrollbar-none sm:-mx-6 sm:px-6">
        {items.map((item) => (
          <ReadingListCard
            key={`${item.type}-${item.id}`}
            item={item}
            chapters={chapters}
          />
        ))}
      </div>
    </section>
  );
}
