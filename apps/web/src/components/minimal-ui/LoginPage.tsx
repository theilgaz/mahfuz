/**
 * Sign-in / sign-up page -- minimal UI editorial design.
 * OAuth (Google/Apple) + email/password form.
 */

import { useState } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { signIn, signUp } from "~/lib/auth-client";
import { useTranslation } from "~/hooks/useTranslation";
import { LogoMeem } from "./LogoMeem";
import { MuIcons } from "./icons";

interface LoginPageProps {
  redirect?: string;
}

export function LoginPageMinimal({ redirect }: LoginPageProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
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
      if (mode === "signup") {
        const result = await signUp.email({ name: name || email.split("@")[0], email, password });
        if (result.error) {
          setError(result.error.message || "Kayit basarisiz");
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
      setError("Bir hata olustu");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    try {
      const result = await signIn.social({ provider: "google", callbackURL: redirect || "/" });
      if (result?.error) {
        setError(result.error.message || "Google girisi basarisiz");
      }
    } catch {
      setError("Google girisi basarisiz");
    }
  };

  return (
    <div className="mu-sover" style={{ animation: "none", background: "var(--mu-bg)" }}>
      <div className="mu-signin">
        <div className="mu-signin-head">
          <div style={{ marginBottom: 16 }}>
            <LogoMeem size={52} />
          </div>
          <h2>{mode === "signin" ? "Tekrar hoş geldin" : "Mahfuz'a katıl"}</h2>
          <p className="mu-muted" style={{ fontSize: 14, margin: 0, maxWidth: "34ch", marginLeft: "auto", marginRight: "auto" }}>
            {mode === "signin"
              ? "Yer imlerin, ilerlemen ve notların senin hesabına bağlı."
              : "Bir hesap aç; okuduğun her ayet seninle kalsın."}
          </p>
        </div>

        {error && (
          <p style={{ color: "#b32020", fontSize: 13, textAlign: "center", margin: "0 0 16px" }}>
            {error}
          </p>
        )}

        <div className="mu-signin-oauth">
          <button type="button" className="mu-oauth" onClick={handleGoogle}>
            {MuIcons.google}
            <span>Google ile devam et</span>
          </button>
          <button type="button" className="mu-oauth" style={{ color: "var(--mu-ink)" }}>
            {MuIcons.apple}
            <span>Apple ile devam et</span>
          </button>
        </div>

        <div className="mu-signin-or">
          <span>veya e-posta ile</span>
        </div>

        <form className="mu-signin-form" onSubmit={handleSubmit}>
          {mode === "signup" && (
            <label className="mu-field">
              <span>Ad</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ahmet Yilmaz"
              />
            </label>
          )}
          <label className="mu-field">
            <span>E-posta</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sen@ornek.com"
              required
            />
          </label>
          <label className="mu-field">
            <span>Parola</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="--------"
              required
            />
          </label>
          <button
            type="submit"
            className="mu-btn primary"
            style={{ justifyContent: "center", marginTop: 8, width: "100%" }}
            disabled={loading}
          >
            {loading ? "..." : mode === "signin" ? "Giriş yap" : "Hesap oluştur"}
            {MuIcons.arrowRight}
          </button>
        </form>

        <p className="mu-signin-alt">
          {mode === "signin" ? "Hesabin yok mu?" : "Zaten bir hesabin var mi?"}
          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          >
            {mode === "signin" ? "Kayıt ol" : "Giriş yap"}
          </button>
        </p>
      </div>
    </div>
  );
}
