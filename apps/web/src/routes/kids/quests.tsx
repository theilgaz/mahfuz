import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "~/hooks/useTranslation";
import { useKidsQuestStore } from "~/stores/useKidsQuestStore";
import type { KidsQuestType } from "~/lib/kids-constants";

export const Route = createFileRoute("/kids/quests")({
  component: KidsQuests,
});

const QUEST_ICONS: Record<KidsQuestType, string> = {
  listen_surah: "🎧",
  learn_letters: "🔤",
  review_surah: "📖",
  quiz: "🧠",
};

function KidsQuests() {
  const { t } = useTranslation();
  const quests = useKidsQuestStore((s) => s.quests);
  const chestOpened = useKidsQuestStore((s) => s.chestOpened);
  const allCompleted = useKidsQuestStore((s) => s.allCompleted);
  const openChest = useKidsQuestStore((s) => s.openChest);

  const allDone = allCompleted();

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="kids-heading text-2xl font-extrabold text-amber-700">{t.kids.quests.title}</h1>
        <p className="mt-1 text-[14px] font-semibold text-amber-500">{t.kids.quests.daily}</p>
      </div>

      {/* Quest Cards */}
      {quests.length > 0 ? (
        <div className="space-y-3">
          {quests.map((quest) => {
            const icon = QUEST_ICONS[quest.type as KidsQuestType] ?? "⭐";
            const percentage = Math.min((quest.progress / quest.target) * 100, 100);

            return (
              <div
                key={quest.id}
                className={`rounded-2xl p-4 shadow-sm ${
                  quest.completed ? "bg-emerald-50" : "bg-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{icon}</span>
                  <div className="flex-1">
                    <h3 className="text-[15px] font-semibold text-gray-800">
                      {t.kids.quests.types[quest.type as KidsQuestType]}
                    </h3>
                    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          quest.completed ? "bg-emerald-400" : "bg-amber-400"
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="mt-0.5 text-[12px] text-gray-400">
                      {quest.progress}/{quest.target}
                    </span>
                  </div>
                  {quest.completed && (
                    <span className="text-xl">✅</span>
                  )}
                </div>
              </div>
            );
          })}

          {/* Treasure Chest */}
          {allDone && !chestOpened && (
            <button
              onClick={openChest}
              className="mt-4 flex w-full flex-col items-center gap-3 rounded-3xl bg-gradient-to-b from-amber-100 to-amber-200 p-6 shadow-md transition-transform active:scale-95"
            >
              <span className="animate-bounce text-5xl">🎁</span>
              <span className="text-lg font-bold text-amber-700">
                {t.kids.quests.openChest}
              </span>
            </button>
          )}

          {allDone && chestOpened && (
            <div className="mt-4 rounded-3xl bg-emerald-50 p-6 text-center">
              <span className="text-4xl">🎉</span>
              <p className="mt-2 text-[15px] font-bold text-emerald-700">
                {t.kids.quests.allDone}
              </p>
              <p className="mt-1 text-[13px] text-emerald-500">
                {t.kids.quests.newQuestsTomorrow}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
          <span className="text-4xl">⭐</span>
          <p className="mt-3 text-[15px] font-semibold text-gray-500">
            {t.kids.quests.newQuestsTomorrow}
          </p>
        </div>
      )}
    </div>
  );
}
