/**
 * Mahfuz logo -- green squircle with white Meem.
 */

interface MahfuzLogoProps {
  className?: string;
  size?: number;
}

export function MahfuzLogo({ className, size }: MahfuzLogoProps) {
  const s = size ?? 40;

  return (
    <img
      src="/icons/meem-logo.png"
      alt="Mahfuz"
      className={className}
      width={s}
      height={s}
      style={{ width: s, height: s, objectFit: "contain" }}
    />
  );
}
