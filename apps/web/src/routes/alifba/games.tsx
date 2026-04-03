import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/alifba/games")({
  component: () => <Outlet />,
});
