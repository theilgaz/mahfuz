import type { ReactNode } from "react";
import { cn } from "./cn";

type MaxWidth = "narrow" | "default" | "wide" | "full";

const WIDTHS: Record<MaxWidth, string> = {
  narrow: "max-w-3xl",
  default: "max-w-5xl",
  wide: "max-w-6xl",
  full: "max-w-none",
};

export interface PageShellProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  maxWidth?: MaxWidth;
  children: ReactNode;
  className?: string;
}

export function PageShell({
  title,
  subtitle,
  actions,
  maxWidth = "default",
  children,
  className,
}: PageShellProps) {
  const hasHeader = title || subtitle || actions;
  return (
    <div className={cn("mx-auto w-full px-4 pt-6 sm:pt-8 pb-20", WIDTHS[maxWidth], className)}>
      {hasHeader && (
        <header className="mb-6 sm:mb-8 flex items-start gap-4">
          <div className="min-w-0 flex-1">
            {title && (
              <h1 className="text-2xl sm:text-[1.625rem] font-semibold leading-tight text-[var(--mu-ink)] truncate">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="mt-1 text-sm text-[var(--mu-muted)]">{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </header>
      )}
      {children}
    </div>
  );
}
