import {
  Outlet,
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import appCss from "~/styles/app.css?url";
import { OfflineIndicator } from "~/components/ui/OfflineIndicator";
import { InstallPrompt } from "~/components/ui/InstallPrompt";
import { getSession } from "~/lib/auth-session";
import type { Session } from "~/lib/auth";
import { useFontLoader } from "~/hooks/useFontLoader";
import { useTranslation } from "~/hooks/useTranslation";
import { Button } from "~/components/ui/Button";
import { useI18nStore } from "~/stores/useI18nStore";

interface RouterContext {
  queryClient: QueryClient;
  session: Session | null;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: async () => {
    const session = await getSession();
    return { session };
  },
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Mahfuz | Kuran-ı Kerim" },
      {
        name: "description",
        content:
          "Kuran-ı Kerim'i okuyun, dinleyin, ezberleyin. Açık kaynak Kuran uygulaması.",
      },
      { name: "theme-color", content: "#059669" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
      },
      { rel: "stylesheet", href: appCss },
      {
        rel: "preload",
        href: "/fonts/KFGQPCUthmanicScriptHAFS.woff2",
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
      },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "icon", href: "/images/mahfuz-logo.svg", type: "image/svg+xml" },
      { rel: "icon", href: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { rel: "icon", href: "/icons/favicon-16.png", sizes: "16x16", type: "image/png" },
      {
        rel: "apple-touch-icon",
        href: "/icons/apple-touch-icon.png",
      },
    ],
    scripts: [
      {
        src: "https://www.googletagmanager.com/gtag/js?id=G-H65RR4CYB9",
        async: true,
      },
      {
        children: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-H65RR4CYB9');`,
      },
      {
        children: `(function(){try{var p=JSON.parse(localStorage.getItem('mahfuz-preferences')||'{}');var s=p.state||{};var fonts={
'uthmani-hafs':'"KFGQPC Uthmani Hafs"',
'amiri-quran':'"Amiri Quran"',
'me-quran':'"me_quran"',
'scheherazade-new':'"Scheherazade New"',
'amiri':'"Amiri"',
'lateef':'"Lateef"',
'noto-naskh-arabic':'"Noto Naskh Arabic"',
'noto-sans-arabic':'"Noto Sans Arabic"',
'cairo':'"Cairo"',
'tajawal':'"Tajawal"',
'reem-kufi':'"Reem Kufi"',
'noto-kufi-arabic':'"Noto Kufi Arabic"',
'playpen-sans-arabic':'"Playpen Sans Arabic"',
'mada':'"Mada"',
'gulzar':'"Gulzar"',
'mirza':'"Mirza"'};var f=fonts[s.arabicFontId]||fonts['scheherazade-new'];var h=document.documentElement;h.style.setProperty('--font-arabic',f+',"Traditional Arabic",serif');if(s.arabicFontSize)h.style.setProperty('--arabic-font-scale',s.arabicFontSize);if(s.translationFontSize)h.style.setProperty('--translation-font-scale',s.translationFontSize);h.setAttribute('data-theme',s.theme||'sepia');}catch(e){}})()`,
      },
      {
        children: `if ('serviceWorker' in navigator) { window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js'); }); }`,
      },
    ],
  }),
  component: RootComponent,
  notFoundComponent: NotFound,
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  useFontLoader();
  const locale = useI18nStore((s) => s.locale);

  return (
    <html lang={locale}>
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen font-sans antialiased">
        <OfflineIndicator />
        {children}
        <InstallPrompt />
        <Scripts />
      </body>
    </html>
  );
}

function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6">
      <p className="arabic-text mb-6 text-5xl text-primary-600" dir="rtl">
        ٤٠٤
      </p>
      <h1 className="mb-2 text-2xl font-semibold tracking-tight text-[var(--theme-text)]">
        {t.error.notFound}
      </h1>
      <p className="text-[var(--theme-text-secondary)]">{t.error.notFoundDesc}</p>
      <a href="/">
        <Button size="lg" className="mt-8">
          {t.error.goHome}
        </Button>
      </a>
    </div>
  );
}
