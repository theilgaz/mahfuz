import { createFileRoute } from "@tanstack/react-router";
import { LoginPageMinimal } from "~/components/minimal-ui/LoginPage";

export const Route = createFileRoute("/auth/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: (search.redirect as string) || "",
  }),
  component: () => {
    const { redirect } = Route.useSearch();
    return <LoginPageMinimal redirect={redirect} />;
  },
});

// Legacy LoginPage removed -- see git history if needed.
