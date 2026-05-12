import { createFileRoute, Outlet } from "@tanstack/react-router";
import { staticHead } from "~/lib/seo";

export const Route = createFileRoute("/alifba/exam")({
  head: () => staticHead("alifba-exam"),
  component: () => <Outlet />,
});
