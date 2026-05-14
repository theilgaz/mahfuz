import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "link" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonClassOpts {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
}

const BASE =
  "inline-flex items-center justify-center gap-2 font-medium select-none " +
  "transition-colors duration-150 [transition-timing-function:var(--mu-ease)] " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--mu-accent)] " +
  "disabled:opacity-50 disabled:cursor-not-allowed";

const SIZES: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs rounded-[var(--mu-radius-sm)]",
  md: "h-10 px-4 text-sm rounded-[var(--mu-radius-sm)]",
  lg: "h-12 px-5 text-base rounded-[var(--mu-radius)]",
};

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--mu-accent)] text-white hover:bg-[color-mix(in_oklab,var(--mu-accent),black_8%)]",
  secondary:
    "bg-[var(--mu-bg-soft)] text-[var(--mu-ink)] border border-[var(--mu-line)] hover:bg-[var(--mu-bg-card)]",
  ghost:
    "bg-transparent text-[var(--mu-ink)] hover:bg-[var(--mu-bg-soft)]",
  link:
    "bg-transparent text-[var(--mu-accent)] hover:underline underline-offset-4 px-0 h-auto",
  danger:
    "bg-[var(--mu-danger)] text-white hover:bg-[color-mix(in_oklab,var(--mu-danger),black_8%)]",
};

export function buttonClasses({ variant = "primary", size = "md", block }: ButtonClassOpts = {}): string {
  return cn(BASE, SIZES[size], VARIANTS[variant], block && "w-full");
}

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "size"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  loading?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", block, loading, leading, trailing, className, children, disabled, type = "button", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      data-loading={loading || undefined}
      className={cn(buttonClasses({ variant, size, block }), className)}
      {...rest}
    >
      {loading ? <Spinner /> : leading}
      {children}
      {!loading && trailing}
    </button>
  );
});

function Spinner() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className="animate-spin">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" />
    </svg>
  );
}
