import type { ReactNode } from "react";
import { Button } from "./Button";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="animate-fade-in flex flex-col items-center justify-center rounded-2xl bg-[var(--theme-bg-primary)] p-8 text-center shadow-[var(--shadow-card)]">
      {icon && (
        <div className="mb-4 text-[var(--theme-text-quaternary)]">{icon}</div>
      )}
      <h3 className="mb-1 text-[17px] font-semibold text-[var(--theme-text)]">
        {title}
      </h3>
      {description && (
        <p className="mb-6 text-[14px] text-[var(--theme-text-tertiary)]">
          {description}
        </p>
      )}
      {action && (
        <Button onClick={action.onClick}>{action.label}</Button>
      )}
    </div>
  );
}
