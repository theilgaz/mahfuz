/**
 * Keşfet — /discover
 */

import { createFileRoute } from "@tanstack/react-router";
import { DiscoverPage } from "~/components/minimal-ui/DiscoverPage";

export const Route = createFileRoute("/discover")({
  component: DiscoverPage,
});
