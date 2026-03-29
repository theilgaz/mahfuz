import { useRef, useState, useCallback, useMemo, useEffect } from "react";
import type { ArabicLetter } from "~/lib/kids-constants";
import {
  LETTER_STROKES,
  smoothSvgPath,
  angleDeg,
  dist,
  type StrokePoint,
} from "~/lib/letter-strokes";
import { LETTER_GUIDE_PATHS } from "~/lib/letter-guide-paths";

interface LetterTraceProps {
  letter: ArabicLetter;
  onComplete: () => void;
}

const VIEWBOX = 280;
const DOT_TOLERANCE = 44;
const STROKE_W = 16;

// ── Path-slider constants ──────────────────────────────────────────
const SAMPLE_STEP = 2; // Sample SVG path every 2 units for smooth matching
const PATH_TOLERANCE = 40; // Max finger distance from path
const SEARCH_WINDOW = 120; // Forward search window in samples (~240 SVG units)
const COMPLETE_T = 0.95; // Auto-complete when ≥95% traced

interface PathSample {
  x: number;
  y: number;
  t: number; // 0-1 normalised position along path
}

export function LetterTrace({ letter, onComplete }: LetterTraceProps) {
  if (!LETTER_STROKES[letter.id]) {
    return (
      <div className="flex flex-col items-center gap-4 py-4">
        <p className="text-sm text-gray-400">
          &quot;{letter.id}&quot; için çizim verisi bulunamadı.
        </p>
        <button
          onClick={onComplete}
          className="rounded-xl bg-emerald-500 px-8 py-3 text-[14px] font-bold text-white shadow-md active:scale-95"
        >
          Sonraki →
        </button>
      </div>
    );
  }

  return <LetterTraceInner letter={letter} onComplete={onComplete} />;
}

// ────────────────────────────────────────────────────────────────────

function LetterTraceInner({ letter, onComplete }: LetterTraceProps) {
  const strokeData = LETTER_STROKES[letter.id];
  const guideData = LETTER_GUIDE_PATHS[letter.id];
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);

  const [strokeIdx, setStrokeIdx] = useState(0);
  const [progress, setProgress] = useState(0); // 0-1 slider value
  const progressRef = useRef(0); // latest value for fast pointer events
  const [completedStrokes, setCompletedStrokes] = useState<boolean[]>(
    () => new Array(strokeData.strokes.length).fill(false),
  );
  const [tracing, setTracing] = useState(false);
  const [done, setDone] = useState(false);
  const [dotPop, setDotPop] = useState<number | null>(null);
  const [penTip, setPenTip] = useState<StrokePoint | null>(null);
  const samplesRef = useRef<PathSample[]>([]);

  const currentStroke = strokeData.strokes[strokeIdx] ?? null;
  const isCurrentDot = currentStroke?.type === "dot";

  // Pre-compute smooth SVG paths (same curve for in-progress & completed)
  const smoothPaths = useMemo(
    () =>
      strokeData.strokes.map((s) =>
        s.type === "path" ? smoothSvgPath(s.points) : "",
      ),
    [strokeData.strokes],
  );
  const currentSvgPath =
    currentStroke?.type === "path" ? smoothPaths[strokeIdx] : "";

  const startAngle = useMemo(() => {
    if (
      !currentStroke ||
      currentStroke.type === "dot" ||
      currentStroke.points.length < 2
    )
      return 0;
    return angleDeg(currentStroke.points[0], currentStroke.points[1]);
  }, [currentStroke]);

  // ── Sample the rendered SVG path for slider matching ─────────────
  useEffect(() => {
    const el = pathRef.current;
    if (!el) {
      samplesRef.current = [];
      return;
    }
    const totalLen = el.getTotalLength();
    if (totalLen === 0) {
      samplesRef.current = [];
      return;
    }
    const samples: PathSample[] = [];
    for (let d = 0; d <= totalLen; d += SAMPLE_STEP) {
      const pt = el.getPointAtLength(d);
      samples.push({ x: pt.x, y: pt.y, t: d / totalLen });
    }
    // Guarantee endpoint
    const last = el.getPointAtLength(totalLen);
    if (!samples.length || samples[samples.length - 1].t < 0.999) {
      samples.push({ x: last.x, y: last.y, t: 1 });
    }
    samplesRef.current = samples;
  }, [currentSvgPath]);

  // ── Coordinate helpers ───────────────────────────────────────────

  const getSVGPoint = useCallback(
    (e: React.TouchEvent | React.MouseEvent): StrokePoint | null => {
      const svg = svgRef.current;
      if (!svg) return null;
      const rect = svg.getBoundingClientRect();
      const scale = VIEWBOX / rect.width;
      let clientX: number, clientY: number;
      if ("touches" in e && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if ("clientX" in e) {
        clientX = (e as React.MouseEvent).clientX;
        clientY = (e as React.MouseEvent).clientY;
      } else {
        return null;
      }
      return {
        x: (clientX - rect.left) * scale,
        y: (clientY - rect.top) * scale,
      };
    },
    [],
  );

  // ── Stroke lifecycle ─────────────────────────────────────────────

  const advanceStroke = useCallback(() => {
    setCompletedStrokes((prev) => {
      const next = [...prev];
      next[strokeIdx] = true;
      return next;
    });
    const nextIdx = strokeIdx + 1;
    if (nextIdx >= strokeData.strokes.length) {
      setDone(true);
    } else {
      setStrokeIdx(nextIdx);
      setProgress(0);
      progressRef.current = 0;
      setPenTip(null);
      setTracing(false);
    }
  }, [strokeIdx, strokeData.strokes.length]);

  const handleReset = useCallback(() => {
    setStrokeIdx(0);
    setProgress(0);
    progressRef.current = 0;
    setPenTip(null);
    setTracing(false);
    setDone(false);
    setDotPop(null);
    setCompletedStrokes(new Array(strokeData.strokes.length).fill(false));
  }, [strokeData.strokes.length]);

  useEffect(() => {
    handleReset();
  }, [letter.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Pointer handlers (slider-on-a-curve) ─────────────────────────

  const handlePointerDown = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      if (done) return;
      e.preventDefault();
      const p = getSVGPoint(e);
      if (!p || !currentStroke) return;

      // Dot strokes: tap to complete
      if (isCurrentDot) {
        if (dist(p, currentStroke.points[0]) < DOT_TOLERANCE) {
          setDotPop(strokeIdx);
          setTimeout(() => {
            setDotPop(null);
            advanceStroke();
          }, 400);
        }
        return;
      }

      const samples = samplesRef.current;
      if (!samples.length) return;

      // Allow tracing if finger is near the current position on path
      const curIdx = Math.round(
        progressRef.current * (samples.length - 1),
      );
      const target = samples[curIdx];
      if (target && dist(p, target) < PATH_TOLERANCE) {
        setTracing(true);
      }
    },
    [done, getSVGPoint, currentStroke, isCurrentDot, strokeIdx, advanceStroke],
  );

  const handlePointerMove = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      if (!tracing || done) return;
      e.preventDefault();
      const p = getSVGPoint(e);
      if (!p) return;

      const samples = samplesRef.current;
      if (!samples.length) return;

      const curIdx = Math.round(
        progressRef.current * (samples.length - 1),
      );
      const maxIdx = Math.min(samples.length - 1, curIdx + SEARCH_WINDOW);

      // Find closest point on path AHEAD of current position
      let bestIdx = curIdx;
      let bestDist = Infinity;
      for (let i = curIdx; i <= maxIdx; i++) {
        const d = dist(p, samples[i]);
        if (d < bestDist) {
          bestDist = d;
          bestIdx = i;
        }
        // Early exit: once distance starts growing well past the minimum, stop
        if (d > bestDist + PATH_TOLERANCE) break;
      }

      // Only advance if within tolerance and actually forward
      if (bestDist < PATH_TOLERANCE && bestIdx > curIdx) {
        const newT = samples[bestIdx].t;
        progressRef.current = newT;
        setProgress(newT);
        setPenTip(samples[bestIdx]);

        if (newT >= COMPLETE_T) {
          setTracing(false);
          setPenTip(null);
          advanceStroke();
        }
      }
    },
    [tracing, done, getSVGPoint, advanceStroke],
  );

  const handlePointerUp = useCallback(() => setTracing(false), []);

  // ── Common SVG props ─────────────────────────────────────────────

  const thickStrokeProps = {
    strokeWidth: STROKE_W,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    fill: "none" as const,
  };

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <h2 className="text-xl font-bold text-blue-700">Harfi çiz</h2>
      <p className="text-[14px] text-gray-500">
        <span className="font-arabic text-lg" dir="rtl">
          {letter.arabic}
        </span>
        {" — "}
        {letter.name}
      </p>

      <div
        className="rounded-2xl bg-white shadow-sm"
        style={{ maxWidth: 300, width: "100%", aspectRatio: "1/1" }}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
          className="h-full w-full touch-none select-none"
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
        >
          {/* ── Font-derived filled guide ── */}
          {guideData && (
            <path d={guideData.guidePath} fill="#e5e7eb" stroke="none" />
          )}

          {/* ── Fallback dashed guides (no font guide) ── */}
          {!guideData &&
            strokeData.strokes.map((s, i) => {
              if (s.type === "dot") {
                return (
                  <circle
                    key={`guide-${i}`}
                    cx={s.points[0].x}
                    cy={s.points[0].y}
                    r={STROKE_W / 2}
                    fill="none"
                    stroke="#d1d5db"
                    strokeWidth={2.5}
                    strokeDasharray="4 4"
                  />
                );
              }
              return (
                <path
                  key={`guide-${i}`}
                  d={smoothPaths[i]}
                  stroke="#d1d5db"
                  {...thickStrokeProps}
                  strokeDasharray="1 20"
                />
              );
            })}

          {/* ── Dot guides (always visible) ── */}
          {guideData &&
            strokeData.strokes.map((s, i) => {
              if (s.type !== "dot") return null;
              return (
                <circle
                  key={`dot-guide-${i}`}
                  cx={s.points[0].x}
                  cy={s.points[0].y}
                  r={STROKE_W / 2}
                  fill="none"
                  stroke="#d1d5db"
                  strokeWidth={2.5}
                  strokeDasharray="4 4"
                />
              );
            })}

          {/* ── Invisible full path — used for getPointAtLength sampling ── */}
          {currentSvgPath && (
            <path
              ref={pathRef}
              d={currentSvgPath}
              fill="none"
              stroke="none"
              pointerEvents="none"
            />
          )}

          {/* ── Completed strokes ── */}
          {completedStrokes.map((c, i) => {
            if (!c) return null;
            const s = strokeData.strokes[i];
            if (s.type === "dot") {
              return (
                <circle
                  key={`done-${i}`}
                  cx={s.points[0].x}
                  cy={s.points[0].y}
                  r={STROKE_W / 2.5}
                  fill="#10B981"
                />
              );
            }
            return (
              <path
                key={`done-${i}`}
                d={smoothPaths[i]}
                stroke="#10B981"
                {...thickStrokeProps}
              />
            );
          })}

          {/* ── Current stroke: revealed via strokeDashoffset (slider) ── */}
          {!done && currentStroke?.type === "path" && progress > 0 && (
            <path
              d={currentSvgPath}
              stroke="#10B981"
              {...thickStrokeProps}
              pathLength={1}
              strokeDasharray="1 1"
              strokeDashoffset={1 - progress}
            />
          )}

          {/* ── Dot pop animation ── */}
          {dotPop !== null && (
            <circle
              cx={strokeData.strokes[dotPop].points[0].x}
              cy={strokeData.strokes[dotPop].points[0].y}
              r={STROKE_W / 2.5}
              fill="#10B981"
            >
              <animate
                attributeName="r"
                values="0;12;6"
                dur="0.3s"
                fill="freeze"
              />
            </circle>
          )}

          {/* ── Start indicator (pulsing green circle + arrow) ── */}
          {!done &&
            currentStroke?.type === "path" &&
            progress === 0 && (
              <g>
                <circle
                  cx={currentStroke.points[0].x}
                  cy={currentStroke.points[0].y}
                  r={14}
                  fill="none"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  opacity={0.4}
                >
                  <animate
                    attributeName="r"
                    values="12;20;12"
                    dur="1.4s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.5;0.15;0.5"
                    dur="1.4s"
                    repeatCount="indefinite"
                  />
                </circle>
                <circle
                  cx={currentStroke.points[0].x}
                  cy={currentStroke.points[0].y}
                  r={9}
                  fill="#10B981"
                />
                <polygon
                  points="-3.5,-3 4.5,0 -3.5,3"
                  fill="white"
                  transform={`translate(${currentStroke.points[0].x},${currentStroke.points[0].y}) rotate(${startAngle})`}
                />
              </g>
            )}

          {/* ── Pen tip (rides on the actual SVG path) ── */}
          {!done &&
            currentStroke?.type === "path" &&
            penTip &&
            progress < COMPLETE_T && (
              <g>
                <circle
                  cx={penTip.x}
                  cy={penTip.y}
                  r={11}
                  fill="rgba(16,185,129,0.15)"
                />
                <circle
                  cx={penTip.x}
                  cy={penTip.y}
                  r={6}
                  fill="#10B981"
                  stroke="white"
                  strokeWidth={2}
                />
              </g>
            )}

          {/* ── End target ── */}
          {!done &&
            currentStroke?.type === "path" &&
            (() => {
              const e =
                currentStroke.points[currentStroke.points.length - 1];
              return (
                <circle
                  cx={e.x}
                  cy={e.y}
                  r={7}
                  fill="none"
                  stroke="rgba(16,185,129,0.35)"
                  strokeWidth={2}
                  strokeDasharray="3 3"
                />
              );
            })()}

          {/* ── Dot target (tap) ── */}
          {!done && isCurrentDot && dotPop === null && (
            <g>
              <circle
                cx={currentStroke!.points[0].x}
                cy={currentStroke!.points[0].y}
                r={12}
                fill="none"
                stroke="#10B981"
                strokeWidth={2.5}
                opacity={0.4}
              >
                <animate
                  attributeName="r"
                  values="10;18;10"
                  dur="1.4s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="0.5;0.15;0.5"
                  dur="1.4s"
                  repeatCount="indefinite"
                />
              </circle>
              <circle
                cx={currentStroke!.points[0].x}
                cy={currentStroke!.points[0].y}
                r={7}
                fill="rgba(16,185,129,0.2)"
                stroke="#10B981"
                strokeWidth={2}
                strokeDasharray="3 3"
              />
            </g>
          )}
        </svg>
      </div>

      {/* Stroke progress indicators */}
      <div className="flex items-center gap-1.5">
        {strokeData.strokes.map((s, i) => (
          <div
            key={i}
            className={`flex items-center justify-center rounded-full transition-all duration-200 ${
              completedStrokes[i]
                ? "h-6 w-6 bg-emerald-400 text-white"
                : i === strokeIdx
                  ? "h-6 w-6 bg-emerald-500 text-white ring-2 ring-emerald-200 ring-offset-1"
                  : "h-4 w-4 bg-gray-200"
            }`}
          >
            {completedStrokes[i] ? (
              <svg
                viewBox="0 0 16 16"
                className="h-3 w-3"
                fill="none"
                stroke="currentColor"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 8.5 L6.5 12 L13 4" />
              </svg>
            ) : i === strokeIdx ? (
              <span className="text-[10px] font-bold">
                {s.type === "dot" ? "•" : i + 1}
              </span>
            ) : null}
          </div>
        ))}
      </div>

      {!done && currentStroke && (
        <p className="text-[13px] font-medium text-gray-400">
          {isCurrentDot
            ? "Noktaya dokun"
            : progress === 0
              ? "Yeşil noktadan başla"
              : "Çizmeye devam et"}
        </p>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleReset}
          className="rounded-xl border border-gray-200 px-6 py-3 text-[14px] font-semibold text-gray-500 active:scale-95"
        >
          Tekrar dene
        </button>
        {done && (
          <button
            onClick={onComplete}
            className="rounded-xl bg-emerald-500 px-8 py-3 text-[14px] font-bold text-white shadow-md active:scale-95"
          >
            Sonraki →
          </button>
        )}
      </div>
    </div>
  );
}
