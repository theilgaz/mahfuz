import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "~/hooks/useTranslation";
import { resolveNestedKey } from "~/lib/i18n-utils";

interface ProgressMapProps {
  stages: {
    id: number;
    titleKey: string;
    lessonCount: number;
    completedCount: number;
  }[];
  unlockedStages: Set<number>;
}

type StageStatus = "completed" | "current" | "locked";

/** How far nodes sit from center (percentage of half-width) */
const SNAKE_OFFSET = 0.62;

/** Vertical spacing between nodes */
const ROW_HEIGHT = 120;

/** Node radius in the SVG */
const NODE_RADIUS = 28;

/** Determine whether a stage is completed, current (unlocked but incomplete), or locked */
function getStatus(
  stage: ProgressMapProps["stages"][number],
  unlockedStages: Set<number>,
): StageStatus {
  if (
    stage.completedCount >= stage.lessonCount &&
    stage.lessonCount > 0
  ) {
    return "completed";
  }
  if (unlockedStages.has(stage.id)) {
    return "current";
  }
  return "locked";
}

export function ProgressMap({ stages, unlockedStages }: ProgressMapProps) {
  const { t } = useTranslation();

  /** Compute positions and metadata for every stage node */
  const nodes = useMemo(() => {
    const svgWidth = 360;
    const centerX = svgWidth / 2;
    const paddingTop = 48;

    let firstCurrentFound = false;

    return stages.map((stage, index) => {
      const status = getStatus(stage, unlockedStages);

      // Snake pattern: alternate left / right, with first node centered at top
      let x: number;
      if (index === 0) {
        x = centerX;
      } else {
        // Odd indices go right, even indices go left (offset from center)
        const direction = index % 2 === 1 ? 1 : -1;
        x = centerX + direction * (centerX * SNAKE_OFFSET);
      }

      const y = paddingTop + index * ROW_HEIGHT;

      const isFirstCurrent = status === "current" && !firstCurrentFound;
      if (isFirstCurrent) firstCurrentFound = true;

      const title = resolveNestedKey(t.learn, stage.titleKey) || stage.titleKey;

      return {
        ...stage,
        x,
        y,
        status,
        isFirstCurrent,
        title: typeof title === "string" ? title : stage.titleKey,
      };
    });
  }, [stages, unlockedStages, t]);

  const svgWidth = 360;
  const svgHeight = 48 + stages.length * ROW_HEIGHT + 40;

  return (
    <div className="relative mx-auto w-full max-w-[400px]">
      {/* SVG layer: path lines between nodes */}
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="absolute inset-0 h-full w-full"
        fill="none"
        aria-hidden="true"
      >
        <defs>
          {/* Pulse animation for the first current node */}
          <radialGradient id="pulse-glow">
            <stop offset="0%" stopColor="var(--color-primary-500)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="var(--color-primary-500)" stopOpacity="0" />
          </radialGradient>
        </defs>

        {nodes.map((node, index) => {
          if (index === 0) return null;
          const prev = nodes[index - 1];

          // Determine path style based on whether both ends are completed/current
          const isCompletedPath =
            prev.status === "completed" &&
            (node.status === "completed" || node.status === "current");

          // Control points for a smooth cubic bezier between prev and current
          const midY = (prev.y + node.y) / 2;
          const d = `M ${prev.x} ${prev.y} C ${prev.x} ${midY}, ${node.x} ${midY}, ${node.x} ${node.y}`;

          return (
            <path
              key={`path-${node.id}`}
              d={d}
              stroke={
                isCompletedPath
                  ? "var(--color-emerald-400)"
                  : "var(--color-gray-300)"
              }
              strokeWidth={3}
              strokeDasharray={isCompletedPath ? "none" : "8 6"}
              strokeLinecap="round"
              className={
                isCompletedPath
                  ? "opacity-80 dark:opacity-60"
                  : "opacity-40 dark:opacity-25"
              }
            />
          );
        })}

        {/* Pulse ring on the first current node */}
        {nodes.map((node) =>
          node.isFirstCurrent ? (
            <circle
              key={`pulse-${node.id}`}
              cx={node.x}
              cy={node.y}
              r={NODE_RADIUS + 10}
              fill="url(#pulse-glow)"
              className="animate-[pulse-ring_2s_ease-in-out_infinite]"
            />
          ) : null,
        )}
      </svg>

      {/* HTML layer: node circles and labels */}
      <div
        className="relative"
        style={{ height: svgHeight }}
      >
        {nodes.map((node) => {
          const progress =
            node.lessonCount > 0
              ? Math.round((node.completedCount / node.lessonCount) * 100)
              : 0;

          // Label position: left or right of the node
          const labelOnRight = node.x < svgWidth / 2 || nodes.indexOf(node) === 0;

          const nodeContent = (
            <div
              className="absolute flex items-center gap-3"
              style={{
                // Convert SVG coordinates to percentage positions
                left: `${(node.x / svgWidth) * 100}%`,
                top: node.y,
                transform: "translate(-50%, -50%)",
                flexDirection: labelOnRight ? "row" : "row-reverse",
              }}
            >
              {/* Circle */}
              <div
                className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-[3px] transition-all ${
                  node.status === "completed"
                    ? "border-emerald-400 bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                    : node.status === "current"
                      ? "border-primary-400 bg-primary-600 text-white shadow-lg shadow-primary-500/20"
                      : "border-[var(--theme-border)] bg-[var(--theme-bg)] text-[var(--theme-text-tertiary)] opacity-60"
                }`}
              >
                {node.status === "completed" ? (
                  /* Checkmark */
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : node.status === "current" ? (
                  /* Stage number */
                  <span className="text-lg font-bold">{node.id}</span>
                ) : (
                  /* Lock icon */
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                    />
                  </svg>
                )}

                {/* Pulse ring for first current stage */}
                {node.isFirstCurrent && (
                  <span className="absolute inset-0 animate-ping rounded-full border-2 border-primary-400 opacity-40" />
                )}
              </div>

              {/* Label */}
              <div
                className={`min-w-0 max-w-[140px] ${
                  labelOnRight ? "text-left" : "text-right"
                }`}
              >
                <p
                  className={`truncate text-[13px] font-semibold leading-tight ${
                    node.status === "locked"
                      ? "text-[var(--theme-text-tertiary)] opacity-60"
                      : "text-[var(--theme-text)]"
                  }`}
                >
                  {node.title}
                </p>
                {node.status !== "locked" && node.lessonCount > 0 && (
                  <p className="mt-0.5 text-[11px] text-[var(--theme-text-tertiary)]">
                    {node.completedCount}/{node.lessonCount} {t.learn.lessons}
                    {progress > 0 && progress < 100 && (
                      <span className="ml-1 font-medium">
                        %{progress}
                      </span>
                    )}
                  </p>
                )}
                {node.status === "locked" && (
                  <p className="mt-0.5 text-[11px] text-[var(--theme-text-tertiary)] opacity-50">
                    {t.learn.stageLocked}
                  </p>
                )}
              </div>
            </div>
          );

          // Wrap in Link only for clickable stages
          if (node.status === "completed" || node.status === "current") {
            return (
              <Link
                key={node.id}
                to="/learn/stage/$stageId"
                params={{ stageId: String(node.id) }}
                className="group"
              >
                {nodeContent}
              </Link>
            );
          }

          return (
            <div key={node.id} aria-disabled="true">
              {nodeContent}
            </div>
          );
        })}
      </div>

      {/* Inline keyframes for the pulse-ring animation */}
      <style>{`
        @keyframes pulse-ring {
          0%, 100% { r: ${NODE_RADIUS + 6}; opacity: 0.4; }
          50% { r: ${NODE_RADIUS + 16}; opacity: 0; }
        }
      `}</style>
    </div>
  );
}
