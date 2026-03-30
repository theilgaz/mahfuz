/**
 * CSS-animated waveform bars driven by RMS level.
 */

interface WaveformVisualizerProps {
  rmsLevel: number; // 0-1
  isActive: boolean;
}

const BAR_COUNT = 5;
const BASE_HEIGHTS = [0.3, 0.5, 0.8, 0.5, 0.3];

export function WaveformVisualizer({ rmsLevel, isActive }: WaveformVisualizerProps) {
  return (
    <div className="flex items-center gap-0.5 h-5">
      {Array.from({ length: BAR_COUNT }).map((_, i) => {
        const h = isActive
          ? BASE_HEIGHTS[i] * (0.3 + rmsLevel * 0.7)
          : 0.15;
        return (
          <div
            key={i}
            className="w-0.5 rounded-full bg-[var(--color-accent)] transition-all duration-100"
            style={{ height: `${h * 100}%`, minHeight: 2 }}
          />
        );
      })}
    </div>
  );
}
