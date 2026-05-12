/**
 * Oyunlar layout — child route'lar için outlet.
 */

import { createFileRoute, Outlet } from "@tanstack/react-router";
import { staticHead } from "~/lib/seo";

export const Route = createFileRoute("/games")({
  head: () => staticHead("games"),
  component: () => <Outlet />,
});
