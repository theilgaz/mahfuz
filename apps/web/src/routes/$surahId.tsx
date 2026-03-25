/**
 * Shorthand surah route — /33 → /surah/al-ahzab
 */

import { createFileRoute, redirect } from "@tanstack/react-router";
import { surahSlug } from "~/lib/surah-slugs";

export const Route = createFileRoute("/$surahId")({
  beforeLoad: ({ params }) => {
    const surahId = parseInt(params.surahId, 10);

    if (isNaN(surahId) || surahId < 1 || surahId > 114) {
      // Not a valid surah number — let it 404
      throw redirect({ to: "/" });
    }

    throw redirect({
      to: "/surah/$surahSlug",
      params: { surahSlug: surahSlug(surahId) },
      search: { ayah: undefined },
    });
  },
});
