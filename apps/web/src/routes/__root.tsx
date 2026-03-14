import { useEffect } from "react";
import {
  Outlet,
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { getSession } from "~/lib/auth-session";
import type { Session } from "~/lib/auth";
import { migrateV1ToV2 } from "~/lib/store-migration";
import appCss from "~/styles/app.css?url";

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
      { title: "Mahfuz v2 | Kuran-ı Kerim" },
      { name: "theme-color", content: "#1c3f44" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "apple-touch-icon", href: "/icons/apple-touch-icon.png" },
      { rel: "icon", type: "image/png", sizes: "32x32", href: "/icons/favicon-32.png" },
      { rel: "icon", type: "image/png", sizes: "16x16", href: "/icons/favicon-16.png" },
    ],
  }),
  component: ({ children }: { children: ReactNode }) => (
    <RootLayout>{children}</RootLayout>
  ),
});

function RootLayout({ children }: { children: ReactNode }) {
  useEffect(() => {
    migrateV1ToV2();
  }, []);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js");
    }
  }, []);

  return (
    <html lang="tr">
      <head>
        {/* Inline critical CSS: hide body until Tailwind stylesheet loads to prevent FOUC */}
        <style dangerouslySetInnerHTML={{ __html: "body{opacity:0}" }} />
        <HeadContent />
      </head>
      <body>
        <Outlet />
        <Scripts />
      </body>
    </html>
  );
}
