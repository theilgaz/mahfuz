interface MadinaSvgProps {
  className?: string;
}

export function MadinaSvg({ className }: MadinaSvgProps) {
  return (
    <img
      src="/images/nabawi.png"
      alt=""
      aria-hidden="true"
      width={400}
      height={400}
      className={className}
      draggable={false}
    />
  );
}
