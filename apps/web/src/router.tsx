import { createRouter } from "@tanstack/react-router";
import { routerWithQueryClient } from "@tanstack/react-router-with-query";
import { routeTree } from "./routeTree.gen";
import { createQueryClient } from "./lib/query";
import { RouteError } from "./components/RouteError";

export function getRouter() {
  const queryClient = createQueryClient();

  const router = routerWithQueryClient(
    createRouter({
      routeTree,
      scrollRestoration: true,
      defaultPreload: "intent",
      defaultPendingMinMs: 200,
      defaultErrorComponent: RouteError,
      context: { queryClient, session: null as any },
    }),
    queryClient,
  );

  return router;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
