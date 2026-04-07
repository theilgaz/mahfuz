/**
 * Oyunlar layout — child route'lar için outlet.
 */

import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/games")({
  component: () => <Outlet />,
});
