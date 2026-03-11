import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { Suspense, useMemo } from "react";
import { chaptersQueryOptions } from "~/hooks/useChapters";
import { juzListQueryOptions } from "~/hooks/useJuz";
import { Loading } from "~/components/ui/Loading";
import { Skeleton } from "~/components/ui/Skeleton";
import { SegmentedControl } from "~/components/ui/SegmentedControl";
import { SurahListPanel } from "~/components/browse/SurahListPanel";
import { JuzListPanel } from "~/components/browse/JuzListPanel";
import { PageListPanel } from "~/components/browse/PageListPanel";
import { FihristPanel } from "~/components/browse/FihristPanel";
import { useTranslation } from "~/hooks/useTranslation";
import { ContinueReadingSection } from "~/components/browse/ContinueReadingSection";
import { DailyVerseCard } from "~/components/browse/DailyVerseCard";
import { QuickAccessSection } from "~/components/browse/QuickAccessSection";
import { useReadingListStore } from "~/stores/useReadingListStore";


const VALID_TABS = ["surahs", "juzs", "pages", "index"] as const;
type TabType = (typeof VALID_TABS)[number];

export const Route = createFileRoute("/_app/browse/$tab")({
  validateSearch: (search: Record<string, unknown>) => ({
    topic: typeof search.topic === "string" ? search.topic : undefined,
  }),
  beforeLoad: ({ params }) => {
    if (!VALID_TABS.includes(params.tab as TabType)) {
      throw redirect({ to: "/browse/surahs" });
    }
  },
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(chaptersQueryOptions()),
      context.queryClient.ensureQueryData(juzListQueryOptions()),
    ]);
  },
  pendingComponent: () => (
    <div className="mx-auto max-w-[680px] px-5 py-5 sm:px-6 sm:py-10 lg:max-w-[960px]">
      <Skeleton className="mb-5 h-8 w-40" />
      <Skeleton variant="card" className="mb-5 h-10" />
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl p-3">
            <Skeleton variant="circle" className="h-9 w-9" />
            <div className="flex-1">
              <Skeleton className="mb-1.5 h-4 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  ),
  component: BrowsePage,
});

function getGreeting(t: ReturnType<typeof useTranslation>["t"]) {
  const h = new Date().getHours();
  if (h < 12) return t.continueReading.greetingMorning;
  if (h < 17) return t.continueReading.greetingAfternoon;
  return t.continueReading.greetingEvening;
}

function BrowsePage() {
  const { tab } = Route.useParams();
  const { topic } = Route.useSearch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const hasItems = useReadingListStore((s) => s.items.length > 0);
  const currentTab = tab as TabType;

  const TAB_OPTIONS = [
    { value: "surahs" as TabType, label: t.browse.surahs },
    { value: "juzs" as TabType, label: t.browse.juzs },
    { value: "pages" as TabType, label: t.browse.pages },
    { value: "index" as TabType, label: t.browse.index },
  ];

  const TAB_TITLES: Record<TabType, string> = {
    surahs: t.browse.surahs,
    juzs: t.browse.juzs,
    pages: t.browse.pages,
    index: t.browse.index,
  };

  const setTab = (value: TabType) => {
    navigate({
      to: "/browse/$tab",
      params: { tab: value },
      replace: true,
    });
  };

  const greeting = useMemo(() => getGreeting(t), [t]);

  return (
    <div className="mx-auto max-w-[680px] px-5 py-5 sm:px-6 sm:py-10 lg:max-w-[960px]">
      {/* Daily Verse */}
      <DailyVerseCard />

      {/* Greeting + Continue Reading */}
      {hasItems && (
        <p className="mb-1 text-[13px] font-medium text-[var(--theme-text-tertiary)]">
          {greeting}
        </p>
      )}
      <ContinueReadingSection />

      {/* Quick Access */}
      <QuickAccessSection />

      <h1 className="mb-5 text-[24px] font-semibold tracking-[-0.02em] text-[var(--theme-text)] sm:mb-6 sm:text-[28px]">
        {TAB_TITLES[currentTab]}
      </h1>

      {/* Tabs */}
      <div className="mb-5 sm:mb-6">
        <SegmentedControl
          options={TAB_OPTIONS}
          value={currentTab}
          onChange={setTab}
          stretch
        />
      </div>

      {/* Tab content */}
      <Suspense fallback={<Loading text={t.common.loading} />}>
        {currentTab === "surahs" && <SurahListPanel />}
        {currentTab === "juzs" && <JuzListPanel />}
        {currentTab === "pages" && <PageListPanel />}
        {currentTab === "index" && <FihristPanel initialTopic={topic} />}
      </Suspense>
    </div>
  );
}
