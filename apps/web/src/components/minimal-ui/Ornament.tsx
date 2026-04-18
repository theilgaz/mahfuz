/**
 * Rub el Hizb (۞) ornament -- used as a divider.
 */

interface OrnamentProps {
  size?: number;
  opacity?: number;
}

export function Ornament({ size = 20, opacity = 0.45 }: OrnamentProps) {
  return (
    <span
      style={{ fontSize: size, lineHeight: 1, opacity }}
      aria-hidden="true"
    >
      ۞
    </span>
  );
}
