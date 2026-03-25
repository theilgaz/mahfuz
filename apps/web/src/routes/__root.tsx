import {
  Outlet,
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import { type ReactNode, useEffect } from "react";
import { useTranslation } from "~/hooks/useTranslation";
import { useLocaleStore } from "~/stores/locale.store";
import { AudioProvider } from "~/components/reader/AudioProvider";
import { useSettingsStore } from "~/stores/settings.store";
import { Link, useNavigate } from "@tanstack/react-router";
import { getSession } from "~/lib/auth-session";
import type { Session } from "~/lib/auth";
import appCss from "~/styles/app.css?url";

export interface RouterContext {
  queryClient: QueryClient;
  session: Session | null;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: async () => {
    const session = await getSession();
    return { session };
  },
  notFoundComponent: NotFound,
  pendingComponent: PendingIndicator,
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#ffffff", media: "(prefers-color-scheme: light)" },
      { name: "theme-color", content: "#111111", media: "(prefers-color-scheme: dark)" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { title: "Mahfuz — محفوظ" },
    ],
    links: [
      { rel: "manifest", href: "/manifest.json" },
      { rel: "apple-touch-icon", href: "/icons/icon-192.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;700&family=Scheherazade+New:wght@400;700&display=swap",
      },
      { rel: "stylesheet", href: appCss },
    ],
  }),
  component: RootComponent,
});

function PendingIndicator() {
  return (
    <div className="fixed top-0 inset-x-0 z-50 h-0.5 bg-[var(--color-accent)] animate-pulse" />
  );
}

function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <p className="text-6xl mb-4" dir="rtl" style={{ fontFamily: "var(--font-arabic)" }}>٤٠٤</p>
      <p className="text-lg font-medium mb-2">{t.error.notFound}</p>
      <p className="text-sm text-[var(--color-text-secondary)] mb-6">
        {t.error.notFoundDesc}
      </p>
      <Link
        to="/"
        className="px-5 py-2.5 rounded-xl bg-[var(--color-accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
      >
        {t.error.goHome}
      </Link>
    </div>
  );
}

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const locale = useLocaleStore((s) => s.locale);

  // Tema uygula
  const theme = useSettingsStore((s) => s.theme);
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js");
    }
  }, []);

  // Global Cmd+K / Ctrl+K → arama sayfası
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        navigate({ to: "/search" });
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);

  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <head>
        <HeadContent />
      </head>
      <body className="bg-[var(--color-bg)] text-[var(--color-text-primary)] antialiased">
        <AudioProvider />
        {children}
        <Scripts />
      </body>
    </html>
  );
}
