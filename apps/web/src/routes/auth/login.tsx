import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { signIn, signUp } from "~/lib/auth-client";
import { MahfuzLogo } from "~/components/icons/MahfuzLogo";
import { useTranslation } from "~/hooks/useTranslation";

export const Route = createFileRoute("/auth/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: (search.redirect as string) || "",
  }),
  component: LoginPage,
});

function LoginPage() {
  const { redirect } = Route.useSearch();
  const router = useRouter();
  const { t } = useTranslation();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "register") {
        const result = await signUp.email({ name, email, password });
        if (result.error) {
          setError(result.error.message || t.auth.registerFailed);
          return;
        }
      } else {
        const result = await signIn.email({ email, password });
        if (result.error) {
          setError(result.error.message || t.auth.loginFailed);
          return;
        }
      }
      await router.invalidate();
      router.navigate({ to: redirect || "/" });
    } catch {
      setError(t.auth.genericError);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    try {
      const result = await signIn.social({
        provider: "google",
        callbackURL: redirect || "/",
      });
      if (result?.error) {
        setError(result.error.message || t.auth.googleFailed);
      }
    } catch {
      setError(t.auth.googleFailed);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-[380px]">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex flex-col items-center gap-1">
            <MahfuzLogo size={48} />
          </Link>
          <h1 className="mt-3 text-xl font-semibold">
            {mode === "login" ? t.auth.login : t.auth.createAccount}
          </h1>
        </div>

        <div className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          {error && (
            <div role="alert" aria-live="assertive" className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-[13px] text-red-400">
              {error}
            </div>
          )}

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="flex w-full items-center justify-center gap-2.5 rounded border border-[var(--color-border)] px-4 py-2.5 text-sm font-medium transition-colors hover:bg-[var(--color-bg)]"
          >
            <GoogleIcon />
            {t.auth.continueWithGoogle}
          </button>

          {/* Divider */}
          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-[var(--color-border)]" />
            <span className="text-[11px] text-[var(--color-text-secondary)]">{t.auth.or}</span>
            <div className="h-px flex-1 bg-[var(--color-border)]" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === "register" && (
              <div>
                <label htmlFor="auth-name" className="sr-only">{t.auth.namePlaceholder}</label>
                <input
                  id="auth-name"
                  type="text"
                  required
                  aria-required="true"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t.auth.namePlaceholder}
                  className="w-full rounded border border-[var(--color-border)] bg-[var(--color-bg)] px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-[var(--color-accent)]"
                />
              </div>
            )}
            <div>
              <label htmlFor="auth-email" className="sr-only">{t.auth.emailPlaceholder}</label>
              <input
                id="auth-email"
                type="email"
                required
                aria-required="true"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.auth.emailPlaceholder}
                className="w-full rounded border border-[var(--color-border)] bg-[var(--color-bg)] px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-[var(--color-accent)]"
              />
            </div>
            <div>
              <label htmlFor="auth-password" className="sr-only">{t.auth.passwordPlaceholder}</label>
              <input
                id="auth-password"
                type="password"
                required
                aria-required="true"
                autoComplete={mode === "register" ? "new-password" : "current-password"}
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.auth.passwordPlaceholder}
                className="w-full rounded border border-[var(--color-border)] bg-[var(--color-bg)] px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-[var(--color-accent)]"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded bg-[var(--color-accent)] py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading
                ? "..."
                : mode === "login"
                  ? t.auth.login
                  : t.auth.register}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-[12px] text-[var(--color-text-secondary)]">
          {mode === "login" ? `${t.auth.noAccount} ` : `${t.auth.hasAccount} `}
          <button
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError("");
            }}
            className="font-medium text-[var(--color-accent)]"
          >
            {mode === "login" ? t.auth.register : t.auth.login}
          </button>
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}
