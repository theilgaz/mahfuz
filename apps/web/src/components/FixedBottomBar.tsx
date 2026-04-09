import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export function FixedBottomBar({ children }: Props) {
  return (
    <div className="fixed bottom-0 inset-x-0 z-20 px-4 pt-3 pb-[calc(3.5rem+env(safe-area-inset-bottom))] bg-[var(--color-bg)] border-t border-[var(--color-border)]">
      {children}
    </div>
  );
}
