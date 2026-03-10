import { useTranslation } from "~/hooks/useTranslation";
import { Button } from "./Button";

interface ErrorViewProps {
  message?: string;
  onRetry?: () => void;
  onGoHome?: () => void;
}

export function ErrorView({ message, onRetry, onGoHome }: ErrorViewProps) {
  const { t } = useTranslation();

  return (
    <div className="animate-fade-in flex flex-col items-center justify-center py-28">
      <svg
        className="mb-4 h-12 w-12 text-red-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
        />
      </svg>
      <h2 className="mb-1 text-[17px] font-semibold text-[var(--theme-text)]">
        {t.ui.errorTitle}
      </h2>
      <p className="mb-6 text-[15px] text-[var(--theme-text-tertiary)]">
        {message || t.ui.errorDefault}
      </p>
      <div className="flex gap-3">
        {onGoHome && (
          <Button variant="secondary" onClick={onGoHome}>
            {t.ui.goHome}
          </Button>
        )}
        {onRetry && (
          <Button onClick={onRetry}>{t.ui.retry}</Button>
        )}
      </div>
    </div>
  );
}
