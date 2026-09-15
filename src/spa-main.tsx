import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  Outlet,
  RouterProvider,
  createHashHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { AppErrorComponent } from "@/lib/error-component";
import { CatalogPage } from "@/routes/catalog";
import { Home } from "@/routes/index";
import { NewTransfer } from "@/routes/new";
import { EditTransfer } from "@/routes/t.$id";
import "./styles.css";

const rootRoute = createRootRoute({
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Home,
});

const newRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/new",
  component: NewTransfer,
});

const catalogRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/catalog",
  component: CatalogPage,
});

const transferRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/t/$id",
  component: EditTransfer,
});

const routeTree = rootRoute.addChildren([indexRoute, newRoute, catalogRoute, transferRoute]);

const router = createRouter({
  routeTree,
  history: createHashHistory(),
  defaultErrorComponent: AppErrorComponent,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root");

createRoot(root).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
