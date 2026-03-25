/**
 * Cüz route'u — /cuz/1 ... /cuz/30
 * İlk sayfaya yönlendirir (cüzün başlangıç sayfası).
 */

import { createFileRoute, redirect } from "@tanstack/react-router";
import { getAyahsByJuz } from "~/lib/quran-service";

export const Route = createFileRoute("/juz/$juzId")({
  beforeLoad: async ({ params }) => {
    const juzNumber = parseInt(params.juzId, 10);
    if (isNaN(juzNumber) || juzNumber < 1 || juzNumber > 30) {
      throw redirect({ to: "/" });
    }

    // Cüzün ilk ayetini bul ve o sayfaya yönlendir
    const ayahs = await getAyahsByJuz({ data: juzNumber });
    if (ayahs.length > 0) {
      throw redirect({
        to: "/page/$pageNumber",
        params: { pageNumber: String(ayahs[0].pageNumber) },
        search: { ayah: undefined },
      });
    }

    throw redirect({ to: "/" });
  },
});
