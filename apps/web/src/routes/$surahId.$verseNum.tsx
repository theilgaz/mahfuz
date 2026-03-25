/**
 * Shorthand verse route — /33/35 → /surah/al-ahzab?ayah=35
 * Also handles /33 alone → /surah/al-ahzab
 */

import { createFileRoute, redirect } from "@tanstack/react-router";
import { surahSlug } from "~/lib/surah-slugs";

export const Route = createFileRoute("/$surahId/$verseNum")({
  beforeLoad: ({ params }) => {
    const surahId = parseInt(params.surahId, 10);
    const verseNum = parseInt(params.verseNum, 10);

    if (isNaN(surahId) || surahId < 1 || surahId > 114) {
      throw redirect({ to: "/" });
    }

    throw redirect({
      to: "/surah/$surahSlug",
      params: { surahSlug: surahSlug(surahId) },
      search: { ayah: isNaN(verseNum) ? undefined : verseNum },
    });
  },
});
