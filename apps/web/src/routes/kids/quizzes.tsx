import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "~/hooks/useTranslation";

export const Route = createFileRoute("/kids/quizzes")({
  component: KidsQuizzes,
});

const QUIZ_CATEGORIES = [
  { id: "prophets", icon: "🕌", color: "bg-emerald-50 text-emerald-700" },
  { id: "prayer", icon: "🤲", color: "bg-blue-50 text-blue-700" },
  { id: "duas", icon: "📿", color: "bg-purple-50 text-purple-700" },
  { id: "morals", icon: "💚", color: "bg-amber-50 text-amber-700" },
  { id: "ramadan", icon: "🌙", color: "bg-indigo-50 text-indigo-700" },
] as const;

function KidsQuizzes() {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  if (selectedCategory) {
    return (
      <div className="mx-auto max-w-lg px-4 py-6">
        <button
          onClick={() => setSelectedCategory(null)}
          className="mb-4 flex items-center gap-1 text-[14px] font-medium text-emerald-600"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          {t.kids.common.back}
        </button>

        <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
          <span className="text-5xl">
            {QUIZ_CATEGORIES.find((c) => c.id === selectedCategory)?.icon}
          </span>
          <h2 className="mt-4 text-xl font-bold text-gray-700">
            {t.kids.quizzes.categories[selectedCategory as keyof typeof t.kids.quizzes.categories]}
          </h2>
          <p className="mt-2 text-[14px] text-gray-400">
            {t.kids.quizzes.comingSoon}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <div className="mb-6 text-center">
        <h1 className="kids-heading text-2xl font-extrabold text-emerald-700">{t.kids.quizzes.title}</h1>
      </div>

      <div className="space-y-3">
        {QUIZ_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`flex w-full items-center gap-4 rounded-2xl p-5 shadow-sm transition-transform active:scale-[0.97] ${cat.color}`}
          >
            <span className="text-3xl">{cat.icon}</span>
            <span className="text-[16px] font-bold">
              {t.kids.quizzes.categories[cat.id as keyof typeof t.kids.quizzes.categories]}
            </span>
            <svg className="ml-auto h-5 w-5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}
