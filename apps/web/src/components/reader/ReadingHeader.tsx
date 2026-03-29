/**
 * İnce okuma header'ı — geri tuşu, orta alan (children), ayar butonu.
 * Tüm okuma route'larında kullanılır. Scroll'da sticky kalır.
 */

import { useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { SettingsPanel } from "./SettingsPanel";

interface ReadingHeaderProps {
  /** Orta alan — sure picker, sayfa picker vs. */
  children: ReactNode;
  /** Ayar paneli context'i */
  settingsContext?: { surahId?: number; pageNumber?: number };
}

export function ReadingHeader({ children, settingsContext }: ReadingHeaderProps) {
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-20 flex items-center h-11 px-1 bg-[var(--color-bg)]/95 backdrop-blur-sm border-b border-[var(--color-border)]">
        {/* Geri */}
        <button
          onClick={() => navigate({ to: "/" })}
          className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-[var(--color-surface)] transition-colors shrink-0"
          aria-label="Geri"
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 4L7 10L13 16" />
          </svg>
        </button>

        {/* Orta alan */}
        <div className="flex-1 flex items-center justify-center min-w-0">
          {children}
        </div>

        {/* Ayarlar */}
        <button
          onClick={() => setSettingsOpen(true)}
          className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-[var(--color-surface)] transition-colors shrink-0"
          aria-label="Ayarlar"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>
      </header>

      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} context={settingsContext} />
    </>
  );
}
