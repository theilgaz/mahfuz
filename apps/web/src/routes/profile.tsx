/**
 * Profil sayfası — kullanıcı bilgisi, ezber durumu, yer imleri, keşfet.
 */

import { createFileRoute, redirect } from "@tanstack/react-router";
import { AccountPage } from "~/components/minimal-ui/AccountPage";

export const Route = createFileRoute("/profile")({
  beforeLoad: ({ context }) => {
    if (!context.session) {
      throw redirect({ to: "/auth/login", search: { redirect: "/profile" } });
    }
  },
  component: ProfilePageWrapper,
});

function ProfilePageWrapper() {
  const { session } = Route.useRouteContext();
  const user = session!.user;

  return <AccountPage user={user} />;
}

// Legacy ProfilePage kept below for reference
