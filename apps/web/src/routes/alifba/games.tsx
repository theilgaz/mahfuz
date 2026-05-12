import { createFileRoute, Outlet } from "@tanstack/react-router";
import { staticHead } from "~/lib/seo";

export const Route = createFileRoute("/alifba/games")({
  head: () => staticHead("alifba-games"),
  component: () => <Outlet />,
});
