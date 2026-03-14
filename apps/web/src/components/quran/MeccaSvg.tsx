interface MeccaSvgProps {
  className?: string;
}

export function MeccaSvg({ className }: MeccaSvgProps) {
  return (
    <img
      src="/images/kaaba.png"
      alt=""
      aria-hidden="true"
      width={420}
      height={420}
      className={className}
      draggable={false}
    />
  );
}
