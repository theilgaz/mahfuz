import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallback,
});

function AuthCallback() {
  const router = useRouter();

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
      <p className="text-sm text-[var(--color-text-secondary)]">Yönlendiriliyor...</p>
    </div>
  );
}
