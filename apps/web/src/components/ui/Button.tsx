import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  loading?: boolean;
  icon?: ReactNode;
}

const VARIANT_CLASSES = {
  primary:
    "bg-primary-600 text-white hover:bg-primary-700 active:scale-[0.97] shadow-sm",
  secondary:
    "border border-[var(--theme-divider)] bg-[var(--theme-bg-primary)] text-[var(--theme-text)] hover:bg-[var(--theme-hover-bg)] active:scale-[0.97] shadow-sm",
  ghost:
    "bg-transparent text-[var(--theme-text)] hover:bg-[var(--theme-hover-bg)] active:scale-[0.97]",
  danger:
    "bg-red-500 text-white hover:bg-red-600 active:scale-[0.97]",
} as const;

const SIZE_CLASSES = {
  sm: "px-3 py-1.5 text-[13px] rounded-lg",
  md: "px-4 py-2.5 text-[14px] rounded-xl",
  lg: "px-5 py-3 text-[15px] rounded-xl font-semibold",
} as const;

export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  loading = false,
  icon,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 font-medium transition-all ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${fullWidth ? "w-full" : ""} ${disabled || loading ? "pointer-events-none opacity-50" : ""} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </button>
  );
}
