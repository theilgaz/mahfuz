/**
 * Minimal UI icon set -- Phosphor Thin + custom glyphs.
 * Each icon is a React element (not a component) for direct use in JSX.
 */

import { MagnifyingGlass, House, Compass, BookOpen, BookmarkSimple, Play, Pause, CaretLeft, CaretRight, Sun, Moon, GearSix, X, ArrowRight, ArrowLeft, Trophy, User, Fire, Check, Copy, ShareNetwork, NotePencil, Lock, Microphone, Plus, Minus, Brain, ClockCounterClockwise, UsersThree, Star, GameController, UsersFour, ChartLineUp } from "@phosphor-icons/react";

const w = 18;
const p = { size: w, weight: "light" as const };

export const MuIcons = {
  search: <MagnifyingGlass {...p} />,
  home: <House {...p} />,
  compass: <Compass {...p} />,
  book: <BookOpen {...p} />,
  bookmark: <BookmarkSimple {...p} />,
  bookmarkFill: <BookmarkSimple size={w} weight="fill" />,
  play: <Play size={w} weight="fill" />,
  pause: <Pause size={w} weight="fill" />,
  back: <CaretLeft {...p} />,
  chev: <CaretRight {...p} />,
  sun: <Sun {...p} />,
  moon: <Moon {...p} />,
  filterVintage: (
    <svg viewBox="0 0 24 24" width={w} height={w} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18.7 12.4c-.28-.16-.57-.29-.86-.4.29-.11.58-.24.86-.4 1.92-1.11 2.99-3.12 3-5.19-1.79-1.03-4.07-1.11-5.99 0-.28.16-.54.35-.78.54.05-.31.08-.63.08-.95 0-2.22-1.21-4.15-3-5.19-1.79 1.04-3 2.97-3 5.19 0 .32.03.64.08.95-.24-.2-.5-.39-.78-.55-1.92-1.11-4.2-1.03-5.99 0 .01 2.07 1.08 4.08 3 5.19.28.16.57.29.86.4-.29.11-.58.24-.86.4-1.92 1.11-2.99 3.12-3 5.19 1.79 1.03 4.07 1.11 5.99 0 .28-.16.54-.35.78-.54-.05.32-.08.64-.08.96 0 2.22 1.21 4.15 3 5.19 1.79-1.04 3-2.97 3-5.19 0-.32-.03-.64-.08-.95.24.2.5.38.78.54 1.92 1.11 4.2 1.03 5.99 0-.01-2.1-1.08-4.1-3-5.21zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" />
    </svg>
  ),
  settings: <GearSix {...p} />,
  close: <X {...p} />,
  arrowRight: <ArrowRight {...p} />,
  arrowLeft: <ArrowLeft {...p} />,
  games: <Trophy {...p} />,
  alif: (
    <span style={{ fontFamily: "var(--font-arabic)", fontSize: 18, fontWeight: 700, lineHeight: 1 }}>ا ب</span>
  ),
  user: <User {...p} />,
  flame: <Fire {...p} />,
  check: <Check {...p} />,
  copy: <Copy {...p} />,
  share: <ShareNetwork {...p} />,
  note: <NotePencil {...p} />,
  google: (
    <svg viewBox="0 0 24 24" width={w} height={w}>
      <path fill="#4285F4" d="M22 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.6a4.8 4.8 0 0 1-2.1 3.1v2.6h3.4c2-1.8 3.1-4.5 3.1-7.6z" />
      <path fill="#34A853" d="M12 22c2.8 0 5.2-.9 7-2.5l-3.4-2.6c-.9.6-2.1 1-3.6 1-2.8 0-5.1-1.8-6-4.4H2.5v2.7A10 10 0 0 0 12 22z" />
      <path fill="#FBBC04" d="M6 13.4a6 6 0 0 1 0-2.8V7.9H2.5a10 10 0 0 0 0 8.2L6 13.4z" />
      <path fill="#EA4335" d="M12 6c1.5 0 2.9.5 4 1.5l3-3A10 10 0 0 0 2.5 7.9L6 10.6A6 6 0 0 1 12 6z" />
    </svg>
  ),
  apple: (
    <svg viewBox="0 0 24 24" width={w} height={w} fill="currentColor">
      <path d="M17 12.5c0-2 1.6-3 1.7-3.1a3.7 3.7 0 0 0-2.9-1.6c-1.2-.1-2.4.7-3 .7-.7 0-1.6-.7-2.7-.7a4 4 0 0 0-3.4 2.1c-1.5 2.5-.4 6.3 1 8.4.7 1 1.5 2.1 2.6 2.1 1 0 1.4-.7 2.7-.7 1.2 0 1.5.7 2.7.7 1.1 0 1.8-1 2.5-2 .8-1.1 1.1-2.2 1.1-2.3-.1 0-2.3-.9-2.3-3.6zM15 5.4a3.4 3.4 0 0 0 .8-2.6 3.5 3.5 0 0 0-2.3 1.2 3.3 3.3 0 0 0-.9 2.5A3 3 0 0 0 15 5.4z" />
    </svg>
  ),
  lock: <Lock {...p} />,
  mic: <Microphone {...p} />,
  plus: <Plus {...p} />,
  minus: <Minus {...p} />,
  brain: <Brain {...p} />,
  history: <ClockCounterClockwise {...p} />,
  usersThree: <UsersThree {...p} />,
  star: <Star {...p} />,
  gameController: <GameController {...p} />,
  usersFour: <UsersFour {...p} />,
  chart: <ChartLineUp {...p} />,
} as const;
