import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTranslation } from "~/hooks/useTranslation";
import { staticHead } from "~/lib/seo";

export const Route = createFileRoute("/auth/callback")({
  head: () => staticHead("auth-callback"),
  component: AuthCallback,
});

function AuthCallback() {
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    const redirect = async () => {
      await router.invalidate();
      router.navigate({ to: "/" });
    };
    redirect();
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="mb-4 h-8 w-8 animate-spin rounded-full border-[3px] border-[var(--color-border)] border-t-[var(--color-accent)]" />
      <p className="text-sm text-[var(--color-text-secondary)]">{t.auth.redirecting}</p>
    </div>
  );
}
