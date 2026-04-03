/**
 * Elifba modülü layout — /alifba ve alt rotalar için kabuk.
 */

import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/alifba")({
  component: () => <Outlet />,
});
