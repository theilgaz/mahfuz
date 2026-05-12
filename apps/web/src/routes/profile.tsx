/**
 * Profil sayfası — kullanıcı bilgisi, ezber durumu, yer imleri, keşfet.
 */

import { createFileRoute, redirect } from "@tanstack/react-router";
import { AccountPage } from "~/components/minimal-ui/AccountPage";
import { staticHead } from "~/lib/seo";

export const Route = createFileRoute("/profile")({
  head: () => staticHead("profile"),
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

  return <AccountPage user={{ id: user.id, name: user.name, email: user.email, image: user.image ?? null }} />;
}

// Legacy ProfilePage kept below for reference
