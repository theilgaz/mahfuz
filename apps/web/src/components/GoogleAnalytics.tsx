/**
 * Google Analytics 4 — gtag.js script enjekte eder ve SPA route geçişlerinde
 * `page_view` event'i gönderir. Initial pageview gtag config'inde
 * `send_page_view: false` ile bastırıldığı için ilk render dahil her
 * navigation tek event üretir.
 *
 * Measurement ID: G-H65RR4CYB9 (mahfuz.ilg.az)
 */

import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";

const GA_ID = "G-H65RR4CYB9";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function GoogleAnalyticsScripts() {
  return (
    <>
      <link rel="preconnect" href="https://www.googletagmanager.com" crossOrigin="anonymous" />
      <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} />
      <script
        dangerouslySetInnerHTML={{
          __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','${GA_ID}',{send_page_view:false});`,
        }}
      />
    </>
  );
}

export function GoogleAnalyticsTracker() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const searchStr = useRouterState({ select: (s) => s.location.searchStr });

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.gtag !== "function") return;
    // useEffect, HeadContent'in <title>'ı güncellemesinden sonra çalışır
    window.gtag("event", "page_view", {
      page_path: pathname + (searchStr || ""),
      page_title: document.title,
      page_location: window.location.href,
    });
  }, [pathname, searchStr]);

  return null;
}
