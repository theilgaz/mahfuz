import { forwardRef } from "react";
import type { HTMLAttributes } from "react";
import { cn } from "./cn";

interface CardClassOpts {
  padded?: boolean;
  hover?: boolean;
  flush?: boolean;
}

export function cardClasses({ padded = true, hover = false, flush = false }: CardClassOpts = {}): string {
  return cn(
    "bg-[var(--mu-bg-card)] border border-[var(--mu-line)]",
    flush ? "" : "rounded-[var(--mu-radius)]",
    padded && "p-4",
    hover &&
      "transition-[transform,border-color] duration-200 [transition-timing-function:var(--mu-ease)] " +
        "hover:-translate-y-px hover:border-[var(--mu-line-2)]",
  );
}

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padded?: boolean;
  hover?: boolean;
  flush?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { padded, hover, flush, className, children, ...rest },
  ref,
) {
  return (
    <div ref={ref} className={cn(cardClasses({ padded, hover, flush }), className)} {...rest}>
      {children}
    </div>
  );
});
