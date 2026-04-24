import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  server: {
    port: 3001,
    watch: {
      ignored: ["**/routeTree.gen.ts"],
    },
  },
  plugins: [
    tsConfigPaths(),
    tanstackStart(),
    viteReact(),
    tailwindcss(),
  ],
  worker: {
    format: "es",
  },
  build: {
    chunkSizeWarningLimit: 300,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // React core
          if (id.includes("node_modules/react/") || id.includes("node_modules/react-dom/")) {
            return "react";
          }
          // TanStack framework
          if (id.includes("@tanstack/react-router") || id.includes("@tanstack/router-core") || id.includes("@tanstack/react-start")) {
            return "router";
          }
          if (id.includes("@tanstack/react-query") || id.includes("@tanstack/query-core")) {
            return "query";
          }
          // State management
          if (id.includes("node_modules/zustand/")) {
            return "zustand";
          }
          // Better Auth
          if (id.includes("better-auth") || id.includes("better-call")) {
            return "auth";
          }
          // Drizzle ORM
          if (id.includes("drizzle-orm") || id.includes("@libsql/")) {
            return "db";
          }
        },
      },
    },
  },
  optimizeDeps: {
    exclude: ["onnxruntime-web"],
    include: [
      "react",
      "react-dom",
      "react-dom/client",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-router",
      "@tanstack/react-query",
      "@tanstack/router-core",
      "@tanstack/router-core/ssr/client",
      "zustand",
      "zustand/middleware",
    ],
  },
});
