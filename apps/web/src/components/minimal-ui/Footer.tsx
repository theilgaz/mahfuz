import { Link } from "@tanstack/react-router";
import { useLocaleStore } from "~/stores/locale.store";
import { LOCALE_CODES, type Locale } from "~/locales/registry";
import { LogoMeem } from "./LogoMeem";

const LOCALE_LABELS: Record<Locale, string> = {
  tr: "TR",
  en: "EN",
  es: "ES",
  fr: "FR",
  ar: "AR",
  de: "DE",
  nl: "NL",
};

export function Footer() {
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);

  return (
    <footer className="mu-foot">
      <div className="mu-foot-inner">
        <div className="mu-foot-brand" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <LogoMeem size={24} />
          <span className="mu-brand-latin">Mahfuz</span>
        </div>
        <p className="mu-foot-meta mu-muted">
          <Link
            to="/mahfuz"
            style={{ all: "unset", cursor: "pointer" }}
            aria-label="Mahfuz: Kuran'ın korunması"
          >
            15:9
          </Link>
        </p>
        <div className="mu-foot-langs">
          {LOCALE_CODES.map((code, i) => (
            <span key={code}>
              {i > 0 && <span className="mu-muted"> - </span>}
              <button
                onClick={() => setLocale(code)}
                style={{
                  all: "unset",
                  cursor: "pointer",
                  color: locale === code ? "var(--mu-ink)" : undefined,
                  fontWeight: locale === code ? 600 : undefined,
                }}
                className={locale === code ? "" : "mu-muted"}
              >
                {LOCALE_LABELS[code]}
              </button>
            </span>
          ))}
        </div>
      </div>
    </footer>
  );
}
