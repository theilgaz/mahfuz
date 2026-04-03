/**
 * Elifba modülü layout — /alifba ve alt rotalar için kabuk.
 * /alifba → /alifba/ (index) yönlendirmesi yapılır.
 */

import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/alifba")({
  beforeLoad: ({ location }) => {
    if (location.pathname === "/alifba") {
      throw redirect({ to: "/alifba/" as never, replace: true });
    }
  },
  component: () => <Outlet />,
});
