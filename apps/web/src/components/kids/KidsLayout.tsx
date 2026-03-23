import { Outlet, Link, useMatches, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, useMemo } from "react";
import { useTranslation } from "~/hooks/useTranslation";
import { useKidsStore, useActiveKidsProfile } from "~/stores/useKidsStore";
import { KidsTabBar } from "./KidsTabBar";
import { AvatarDisplay } from "./AvatarDisplay";
import { FloatingMascot } from "./Mascot";
import { CelebrationOverlay } from "./CelebrationOverlay";
import { KIDS_LEVELS } from "~/lib/kids-constants";

export function KidsLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const profile = useActiveKidsProfile();
  const profiles = useKidsStore((s) => s.profiles);
  const setActiveProfile = useKidsStore((s) => s.setActiveProfile);
  const level = useKidsStore((s) => s.level);
  const stars = useKidsStore((s) => s.stars);
  const gems = useKidsStore((s) => s.gems);
  const streak = useKidsStore((s) => s.streak);
  const startSession = useKidsStore((s) => s.startSession);
  const tickSession = useKidsStore((s) => s.tickSession);
  const sessionTimeSpent = useKidsStore((s) => s.sessionTimeSpent);
  const dailyTimeLimit = useKidsStore((s) => s.dailyTimeLimit);

  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Session timer
  useEffect(() => {
    startSession();
    timerRef.current = setInterval(tickSession, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startSession, tickSession]);

  // Close profile menu on outside click
  useEffect(() => {
    if (!showProfileMenu) return;
    const handler = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showProfileMenu]);

  const currentLevel = KIDS_LEVELS.find((l) => l.id === level) ?? KIDS_LEVELS[0];
  const nextLevel = KIDS_LEVELS[level] ?? null;
  const progressToNext = nextLevel
    ? Math.min(((stars - currentLevel.starsRequired) / (nextLevel.starsRequired - currentLevel.starsRequired)) * 100, 100)
    : 100;

  // Level-up celebration
  const [celebration, setCelebration] = useState<{ type: "levelUp"; message: string } | null>(null);
  const prevLevelRef = useRef(level);
  useEffect(() => {
    if (level > prevLevelRef.current) {
      const lvl = KIDS_LEVELS.find((l) => l.id === level);
      setCelebration({
        type: "levelUp",
        message: `${t.kids.mascot.levelUp} ${lvl ? t.kids.levels[lvl.key as keyof typeof t.kids.levels] : ""}`,
      });
    }
    prevLevelRef.current = level;
  }, [level, t]);

  // Mascot messages
  const mascotMessages = useMemo(() => [
    t.kids.mascot.keepGoing,
    t.kids.mascot.streakReminder,
    t.kids.mascot.greatJob,
  ], [t]);

  // Context-aware back navigation
  const matches = useMatches();
  const currentPath = matches[matches.length - 1]?.fullPath ?? "";

  const backTarget = useMemo(() => {
    // Sub-pages: go to parent kids page
    if (currentPath.startsWith("/kids/letters/")) return { to: "/kids/letters" as const, label: t.kids.nav.letters };
    // Top-level kids pages: go to main app
    if (currentPath.startsWith("/kids/")) return { to: "/browse" as const, label: t.kids.nav.backToApp };
    return { to: "/browse" as const, label: t.kids.nav.backToApp };
  }, [currentPath, t]);

  const timeLimitReached = dailyTimeLimit > 0 && sessionTimeSpent >= dailyTimeLimit * 60;

  if (timeLimitReached) {
    return (
      <div className="kids-zone flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-b from-amber-50 to-emerald-50 p-8 text-center">
        <div className="text-6xl">🌙</div>
        <h1 className="text-2xl font-bold text-emerald-700">{t.kids.session.timeUp}</h1>
        <p className="text-lg text-emerald-600">{t.kids.session.timeUpMessage}</p>
        <Link
          to="/browse"
          className="mt-4 rounded-2xl bg-emerald-500 px-8 py-3 text-lg font-bold text-white shadow-lg active:scale-95"
        >
          {t.kids.nav.backToApp}
        </Link>
      </div>
    );
  }

  return (
    <div className="kids-zone flex min-h-screen flex-col" style={{ background: "var(--kids-bg, linear-gradient(135deg, #fff7ed, #ecfdf5, #fef3c7))" }}>
      {/* Kids Header */}
      <header className="sticky top-0 z-20 border-b-2 border-emerald-200" style={{ background: "var(--kids-header-bg, rgba(255,255,255,0.92))", backdropFilter: "blur(16px)" }}>
        <div className="flex h-14 items-center justify-between px-4">
          {/* Left: Context-aware back */}
          <Link
            to={backTarget.to}
            className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[13px] font-bold text-emerald-600 hover:bg-emerald-50 active:scale-95"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            <span className="hidden sm:inline">{backTarget.label}</span>
          </Link>

          {/* Center: Avatar + Profile switcher */}
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 rounded-xl px-2 py-1 hover:bg-emerald-50 active:scale-95"
            >
              {profile && (
                <AvatarDisplay
                  name={profile.name}
                  avatarId={profile.avatarId}
                  level={level}
                  size="sm"
                  showLevel
                />
              )}
              <div className="hidden sm:block text-left">
                <div className="text-[12px] font-extrabold text-emerald-700">
                  {profile?.name}
                </div>
                <div className="h-1.5 w-20 overflow-hidden rounded-full bg-emerald-100">
                  <div
                    className="h-full rounded-full bg-emerald-400 transition-all duration-500"
                    style={{ width: `${progressToNext}%` }}
                  />
                </div>
              </div>
              {/* Dropdown arrow */}
              <svg className="h-3 w-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>

            {/* Profile dropdown menu */}
            {showProfileMenu && (
              <div className="absolute left-1/2 top-full mt-2 w-56 -translate-x-1/2 rounded-2xl bg-white p-2 shadow-lg ring-1 ring-black/5 animate-scale-in z-50">
                {profiles.map((p) => {
                  const isActive = p.id === profile?.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        setActiveProfile(p);
                        setShowProfileMenu(false);
                      }}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                        isActive ? "bg-emerald-50" : "hover:bg-gray-50"
                      }`}
                    >
                      <AvatarDisplay name={p.name} avatarId={p.avatarId} level={1} size="sm" />
                      <span className="flex-1 text-[13px] font-bold text-gray-700">{p.name}</span>
                      {isActive && <span className="text-emerald-500 text-xs font-bold">✓</span>}
                    </button>
                  );
                })}

                <div className="my-1 h-px bg-gray-100" />

                {/* Manage profiles link */}
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate({ to: "/kids/profile" });
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-bold text-emerald-600 hover:bg-emerald-50"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {t.kids.profile.manageProfiles}
                </button>
              </div>
            )}
          </div>

          {/* Right: Stars + Gems + Streak */}
          <div className="flex items-center gap-3">
            {streak > 0 && (
              <span className="flex items-center gap-0.5 text-[13px] font-extrabold text-orange-500">
                🔥 {streak}
              </span>
            )}
            <span className="hidden items-center gap-1 text-[13px] font-extrabold text-amber-500 sm:flex">
              ⭐ {stars}
            </span>
            <span className="hidden items-center gap-1 text-[13px] font-extrabold text-indigo-400 sm:flex">
              💎 {gems}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-[120px] lg:pb-6">
        <Outlet />
      </main>

      {/* Floating Mascot */}
      <FloatingMascot messages={mascotMessages} mood="happy" />

      {/* Celebration Overlay */}
      {celebration && (
        <CelebrationOverlay
          type={celebration.type}
          visible
          message={celebration.message}
          onComplete={() => setCelebration(null)}
        />
      )}

      {/* Bottom Tab Bar */}
      <KidsTabBar />
    </div>
  );
}
