import { forwardRef } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

interface ListRowClassOpts {
  interactive?: boolean;
  divider?: boolean;
  dense?: boolean;
}

export function listRowClasses({ interactive = false, divider = false, dense = false }: ListRowClassOpts = {}): string {
  return cn(
    "flex items-center gap-3 min-h-[44px]",
    dense ? "py-2 px-3" : "py-3 px-3",
    divider && "border-b border-[var(--mu-line)]",
    interactive &&
      "cursor-pointer transition-colors duration-150 [transition-timing-function:var(--mu-ease)] hover:bg-[var(--mu-bg-soft)]",
  );
}

export interface ListRowProps extends HTMLAttributes<HTMLDivElement> {
  leading?: ReactNode;
  trailing?: ReactNode;
  divider?: boolean;
  dense?: boolean;
  interactive?: boolean;
}

export const ListRow = forwardRef<HTMLDivElement, ListRowProps>(function ListRow(
  { leading, trailing, divider, dense, interactive, className, children, ...rest },
  ref,
) {
  const isInteractive = interactive ?? Boolean(rest.onClick);
  return (
    <div
      ref={ref}
      className={cn(listRowClasses({ interactive: isInteractive, divider, dense }), className)}
      {...rest}
    >
      {leading && <div className="shrink-0">{leading}</div>}
      <div className="flex-1 min-w-0">{children}</div>
      {trailing && <div className="shrink-0">{trailing}</div>}
    </div>
  );
});
