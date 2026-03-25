import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { signIn, signUp } from "~/lib/auth-client";
import { MahfuzLogo } from "~/components/icons/MahfuzLogo";

export const Route = createFileRoute("/auth/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: (search.redirect as string) || "",
  }),
  component: LoginPage,
});

function LoginPage() {
  const { redirect } = Route.useSearch();
  const router = useRouter();
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
          setError(result.error.message || "Kayıt başarısız");
          return;
        }
      } else {
        const result = await signIn.email({ email, password });
        if (result.error) {
          setError(result.error.message || "Giriş başarısız");
          return;
        }
      }
      await router.invalidate();
      router.navigate({ to: redirect || "/" });
    } catch {
      setError("Bir hata oluştu");
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
        setError(result.error.message || "Google ile giriş başarısız");
      }
    } catch {
      setError("Google ile giriş başarısız");
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
            {mode === "login" ? "Giriş Yap" : "Hesap Oluştur"}
          </h1>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          {error && (
            <div className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-[13px] text-red-400">
              {error}
            </div>
          )}

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-[var(--color-border)] px-4 py-2.5 text-sm font-medium transition-colors hover:bg-[var(--color-bg)]"
          >
            <GoogleIcon />
            Google ile devam et
          </button>

          {/* Divider */}
          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-[var(--color-border)]" />
            <span className="text-[11px] text-[var(--color-text-secondary)]">veya</span>
            <div className="h-px flex-1 bg-[var(--color-border)]" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === "register" && (
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="İsim"
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-[var(--color-accent)]"
              />
            )}
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-posta"
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-[var(--color-accent)]"
            />
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Şifre (min 8 karakter)"
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-[var(--color-accent)]"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[var(--color-accent)] py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading
                ? "..."
                : mode === "login"
                  ? "Giriş Yap"
                  : "Kayıt Ol"}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-[12px] text-[var(--color-text-secondary)]">
          {mode === "login" ? "Hesabın yok mu? " : "Zaten hesabın var mı? "}
          <button
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError("");
            }}
            className="font-medium text-[var(--color-accent)]"
          >
            {mode === "login" ? "Kayıt Ol" : "Giriş Yap"}
          </button>
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4.5 w-4.5" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}
