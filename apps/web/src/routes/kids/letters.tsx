import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "~/hooks/useTranslation";
import { useKidsProgressStore } from "~/stores/useKidsProgressStore";
import { ARABIC_LETTERS } from "~/lib/kids-constants";

export const Route = createFileRoute("/kids/letters")({
  component: KidsLetters,
});

function KidsLetters() {
  const { t } = useTranslation();
  const letters = useKidsProgressStore((s) => s.letters);

  const completedCount = Object.values(letters).filter((l) => l.completed).length;

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="kids-heading text-2xl font-extrabold text-blue-700">{t.kids.letters.title}</h1>
        <p className="mt-1 text-[14px] font-semibold text-blue-500">{t.kids.letters.subtitle}</p>
        <p className="mt-2 text-[13px] font-bold text-blue-400">
          {completedCount}/{ARABIC_LETTERS.length}
        </p>
      </div>

      {/* Letter Grid — RTL for Arabic letter order */}
      <div className="grid grid-cols-4 gap-3" dir="rtl">
        {ARABIC_LETTERS.map((letter) => {
          const progress = letters[letter.id];
          const completed = progress?.completed ?? false;
          const started = progress?.traced || progress?.matched || progress?.quizzed;

          return (
            <Link
              key={letter.id}
              to="/kids/letters/$letterId"
              params={{ letterId: letter.id }}
              className={`flex flex-col items-center gap-1 rounded-2xl p-3 shadow-sm transition-transform active:scale-90 ${
                completed
                  ? "bg-emerald-100 ring-2 ring-emerald-300"
                  : started
                    ? "bg-blue-50 ring-1 ring-blue-200"
                    : "bg-white"
              }`}
              style={{ boxShadow: "var(--kids-card-shadow, 0 2px 8px rgba(0,0,0,0.06))" }}
            >
              <span
                className="font-arabic text-3xl leading-none"
                style={{ color: completed ? "#059669" : "#374151" }}
                dir="rtl"
              >
                {letter.arabic}
              </span>
              <span className="text-[11px] font-bold text-gray-500" dir="ltr">
                {letter.name}
              </span>
              {completed && <span className="text-[10px]">⭐ {progress?.stars ?? 0}</span>}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
