/**
 * Keşfet — /discover
 */

import { createFileRoute } from "@tanstack/react-router";
import { DiscoverPage } from "~/components/minimal-ui/DiscoverPage";
import { staticHead } from "~/lib/seo";

export const Route = createFileRoute("/discover")({
  head: () => staticHead("discover"),
  component: DiscoverPage,
});
