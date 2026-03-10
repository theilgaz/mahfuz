import { Link, useMatches } from "@tanstack/react-router";
import { usePreferencesStore } from "~/stores/usePreferencesStore";
import { useTranslation } from "~/hooks/useTranslation";

interface TabItem {
  to: string;
  label: string;
  icon: (active: boolean) => React.ReactNode;
  matchPatterns: string[];
  visible: boolean;
}

export function BottomTabBar() {
  const { t } = useTranslation();
  const showLearnTab = usePreferencesStore((s) => s.showLearnTab);
  const showMemorizeTab = usePreferencesStore((s) => s.showMemorizeTab);
  const matches = useMatches();

  const currentPath = matches[matches.length - 1]?.fullPath ?? "";

  const tabs: TabItem[] = [
    {
      to: "/browse",
      label: t.nav.browse,
      icon: (active) => <BookIcon active={active} />,
      matchPatterns: ["/browse", "/surah/", "/page/", "/juz/"],
      visible: true,
    },
    {
      to: "/learn",
      label: t.nav.learn,
      icon: (active) => <GraduationIcon active={active} />,
      matchPatterns: ["/learn"],
      visible: showLearnTab,
    },
    {
      to: "/memorize",
      label: t.nav.memorize,
      icon: (active) => <BrainIcon active={active} />,
      matchPatterns: ["/memorize"],
      visible: showMemorizeTab,
    },
    {
      to: "/settings",
      label: t.nav.settings,
      icon: (active) => <SettingsIcon active={active} />,
      matchPatterns: ["/settings"],
      visible: true,
    },
  ];

  const visibleTabs = tabs.filter((tab) => tab.visible);

  const isActive = (patterns: string[]) =>
    patterns.some((p) => currentPath === p || currentPath.startsWith(p));

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-[var(--theme-border)] bg-[var(--theme-bg-primary)]/80 backdrop-blur-xl backdrop-saturate-150 lg:hidden" role="navigation" aria-label="Main navigation" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      <div className="flex h-[60px] items-center justify-around px-2">
        {visibleTabs.map((tab) => {
          const active = isActive(tab.matchPatterns);
          return (
            <Link
              key={tab.to}
              to={tab.to}
              aria-label={tab.label}
              className="flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-1 transition-transform active:scale-90"
            >
              <div className="relative">
                {tab.icon(active)}
                {active && (
                  <span className="absolute -bottom-1 left-1/2 h-[3px] w-[3px] -translate-x-1/2 rounded-full bg-primary-600" />
                )}
              </div>
              <span
                className={`text-[11px] font-medium leading-tight ${
                  active
                    ? "text-primary-600"
                    : "text-[var(--theme-text-tertiary)]"
                }`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// --- Tab Bar Icons (24px, filled when active) ---

function BookIcon({ active }: { active: boolean }) {
  if (active) {
    return (
      <svg className="h-6 w-6 text-primary-600" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.25 4.533A9.707 9.707 0 006 3a9.735 9.735 0 00-3.25.555.75.75 0 00-.5.707v14.25a.75.75 0 001 .707A8.237 8.237 0 016 18.75c1.995 0 3.823.707 5.25 1.886V4.533zM12.75 20.636A8.214 8.214 0 0118 18.75c.966 0 1.89.166 2.75.47a.75.75 0 001-.708V4.262a.75.75 0 00-.5-.707A9.735 9.735 0 0018 3a9.707 9.707 0 00-5.25 1.533v16.103z" />
      </svg>
    );
  }
  return (
    <svg className="h-6 w-6 text-[var(--theme-text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  );
}

function GraduationIcon({ active }: { active: boolean }) {
  if (active) {
    return (
      <svg className="h-6 w-6 text-primary-600" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.7 2.805a.75.75 0 01.6 0A60.65 60.65 0 0122.83 8.72a.75.75 0 01-.231 1.337 49.949 49.949 0 00-9.902 3.912l-.003.002-.34.18a.75.75 0 01-.707 0A50.009 50.009 0 007.5 12.174v-.224c0-.131.067-.248.172-.311a.75.75 0 01.573-.065 47.228 47.228 0 013.426 1.15.75.75 0 101.091-.302l-.37-.133V7.5c0-.108-.022-.217-.066-.316l-.01-.02a.75.75 0 00-.627-.457 60.567 60.567 0 00-1.882-.083c-.58 0-1.16.014-1.738.041a.75.75 0 01-.078-1.498 62.055 62.055 0 012.5-.09l.18.002a.75.75 0 01.076.002z" />
        <path d="M12.971 1.816A5.23 5.23 0 0114.25 5.25v1.875c0 .207.084.407.232.554l.043.043-.174.076a51.386 51.386 0 00-3.86 1.963 49.636 49.636 0 00-3.86-1.963l-.174-.076.043-.043a.781.781 0 00.232-.554V5.25c0-1.246.434-2.39 1.16-3.288l.014-.017c.211-.267.452-.512.716-.733l.09-.072a.75.75 0 01.468-.164c.175 0 .34.06.473.164l.09.072c.264.22.505.466.716.733z" />
        <path d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347" />
      </svg>
    );
  }
  return (
    <svg className="h-6 w-6 text-[var(--theme-text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342M12 13.489V21m0 0a7.5 7.5 0 003.75-6.488M12 21a7.5 7.5 0 01-3.75-6.488" />
    </svg>
  );
}

function BrainIcon({ active }: { active: boolean }) {
  if (active) {
    return (
      <svg className="h-6 w-6 text-primary-600" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.7 2.805a.75.75 0 01.6 0A60.65 60.65 0 0122.83 8.72a.75.75 0 01-.231 1.337 49.949 49.949 0 00-9.902 3.912l-.003.002-.34.18a.75.75 0 01-.707 0A50.009 50.009 0 007.5 12.174v-.224c0-.131.067-.248.172-.311a.75.75 0 01.573-.065 47.228 47.228 0 013.426 1.15.75.75 0 101.091-.302l-.37-.133V7.5" />
        <path d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347" />
      </svg>
    );
  }
  return (
    <svg className="h-6 w-6 text-[var(--theme-text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
    </svg>
  );
}

function HeadphonesIcon({ active }: { active: boolean }) {
  if (active) {
    return (
      <svg className="h-6 w-6 text-primary-600" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
        <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" />
      </svg>
    );
  }
  return (
    <svg className="h-6 w-6 text-[var(--theme-text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
    </svg>
  );
}

function SettingsIcon({ active }: { active: boolean }) {
  if (active) {
    return (
      <svg className="h-6 w-6 text-primary-600" viewBox="0 0 24 24" fill="currentColor">
        <path fillRule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 00-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 00-2.282.819l-.922 1.597a1.875 1.875 0 00.432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 000 1.139c.015.2-.059.352-.153.43l-.841.692a1.875 1.875 0 00-.432 2.385l.922 1.597a1.875 1.875 0 002.282.818l1.019-.382c.115-.043.283-.031.45.082.312.214.641.405.985.57.182.088.277.228.297.35l.178 1.071c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.072c.02-.12.114-.26.297-.349.344-.165.673-.356.985-.57.167-.114.335-.125.45-.082l1.02.382a1.875 1.875 0 002.28-.819l.923-1.597a1.875 1.875 0 00-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 000-1.139c-.016-.2.059-.352.153-.43l.84-.692c.708-.582.891-1.59.433-2.385l-.922-1.597a1.875 1.875 0 00-2.282-.818l-1.02.382c-.114.043-.282.031-.449-.083a7.49 7.49 0 00-.985-.57c-.183-.087-.277-.227-.297-.348l-.179-1.072a1.875 1.875 0 00-1.85-1.567h-1.843zM12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" clipRule="evenodd" />
      </svg>
    );
  }
  return (
    <svg className="h-6 w-6 text-[var(--theme-text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
