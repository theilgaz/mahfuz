/**
 * Minimal UI icon set -- Phosphor Thin + custom glyphs.
 * Each icon is a React element (not a component) for direct use in JSX.
 */

import { MagnifyingGlass, House, Compass, BookOpen, BookmarkSimple, Play, Pause, CaretLeft, CaretRight, Sun, Moon, GearSix, X, ArrowRight, Trophy, User, Fire, Check, Copy, ShareNetwork, NotePencil, Lock, Microphone, Plus, Minus, Brain, ClockCounterClockwise, UsersThree, Star, GameController, UsersFour } from "@phosphor-icons/react";

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
  settings: <GearSix {...p} />,
  close: <X {...p} />,
  arrowRight: <ArrowRight {...p} />,
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
} as const;
