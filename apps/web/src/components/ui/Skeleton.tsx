interface SkeletonProps {
  className?: string;
  variant?: "text" | "circle" | "card";
  lines?: number;
}

export function Skeleton({
  className = "",
  variant = "text",
  lines = 1,
}: SkeletonProps) {
  if (variant === "circle") {
    return <div className={`skeleton h-10 w-10 !rounded-full ${className}`} />;
  }

  if (variant === "card") {
    return <div className={`skeleton h-32 w-full !rounded-2xl ${className}`} />;
  }

  // text variant
  if (lines === 1) {
    return <div className={`skeleton h-4 w-full rounded-md ${className}`} />;
  }

  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`skeleton h-4 rounded-md ${i === lines - 1 ? "w-3/5" : "w-full"} ${className}`}
        />
      ))}
    </div>
  );
}
