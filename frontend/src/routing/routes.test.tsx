import { Suspense } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";

// ---------------------------------------------------------------------------
// Mocks — every page/guard component is replaced with a small stand-in that
// renders a recognizable testid (and its children, for wrapper components).
// ---------------------------------------------------------------------------

vi.mock("../components/Dashboard", () => ({
  default: () => <div data-testid="dashboard-page">Dashboard</div>,
}));

vi.mock("../components/PublicOnlyRoute", () => ({
  default: ({ children }: any) => (
    <div data-testid="public-only-route">{children}</div>
  ),
}));

vi.mock("../components/ProjectManagementPage", () => ({
  ProjectManagementPage: () => (
    <div data-testid="project-management-page">Project Management</div>
  ),
}));

vi.mock("../components/ProtectedRoute", () => ({
  default: ({ children }: any) => (
    <div data-testid="protected-route">{children}</div>
  ),
}));

vi.mock("../components/TaskDetailsPage", () => ({
  default: () => <div data-testid="task-details-page">Task Details</div>,
}));

vi.mock("../components/Signup", () => ({
  default: () => <div data-testid="signup-page">Signup</div>,
}));

vi.mock("../components/Login", () => ({
  default: () => <div data-testid="login-page">Login</div>,
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Fresh import of the router module, honoring the current localStorage mock. */
async function loadRouter() {
  vi.resetModules();
  const mod = await import("./routes");
  return mod.default;
}

function findRoute(routes: any[], path: string) {
  const route = routes.find((r) => r.path === path);
  if (!route) {
    throw new Error(
      `No route found for path "${path}". Available paths: ${routes
        .map((r) => r.path)
        .join(", ")}`,
    );
  }
  return route;
}

/** Renders a route's `element` inside a Suspense boundary (needed for lazy() routes). */
function renderElement(element: React.ReactElement) {
  return render(
    <Suspense fallback={<div>loading...</div>}>{element}</Suspense>,
  );
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

const originalGetItem = Storage.prototype.getItem;

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  Storage.prototype.getItem = originalGetItem;
});

// ---------------------------------------------------------------------------
// Route table shape
// ---------------------------------------------------------------------------

describe("router — route table", () => {
  it("defines exactly the expected paths", async () => {
    const router = await loadRouter();
    const paths = router.routes.map((r: any) => r.path).sort();

    expect(paths).toEqual(
      [
        "/",
        "/signup",
        "/login",
        "/projects",
        "/projects/:projectId/task/:taskId",
        "/projects/:projectId/memberships",
      ].sort(),
    );
  });
});

// ---------------------------------------------------------------------------
// Root "/" redirect
// ---------------------------------------------------------------------------

describe("router — root redirect", () => {
  it("redirects to /projects when a token is present in localStorage", async () => {
    Storage.prototype.getItem = vi.fn((key: string) =>
      key === "token" ? "fake-token" : null,
    );

    const router = await loadRouter();
    const root = findRoute(router.routes, "/");

    expect(root.element.props.to).toBe("/projects");
  });

  it("redirects to /login when no token is present in localStorage", async () => {
    Storage.prototype.getItem = vi.fn(() => null);

    const router = await loadRouter();
    const root = findRoute(router.routes, "/");

    expect(root.element.props.to).toBe("/login");
  });
});

// ---------------------------------------------------------------------------
// Public routes
// ---------------------------------------------------------------------------

describe("router — public routes", () => {
  it("wraps /signup in PublicOnlyRoute and renders the Signup page", async () => {
    const router = await loadRouter();
    const route = findRoute(router.routes, "/signup");

    renderElement(route.element);

    expect(await screen.findByTestId("public-only-route")).toBeInTheDocument();
    expect(await screen.findByTestId("signup-page")).toBeInTheDocument();
  });

  it("wraps /login in PublicOnlyRoute and renders the Login page", async () => {
    const router = await loadRouter();
    const route = findRoute(router.routes, "/login");

    renderElement(route.element);

    expect(await screen.findByTestId("public-only-route")).toBeInTheDocument();
    expect(await screen.findByTestId("login-page")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Protected routes
// ---------------------------------------------------------------------------

describe("router — protected routes", () => {
  it("wraps /projects in ProtectedRoute and renders the Dashboard", async () => {
    const router = await loadRouter();
    const route = findRoute(router.routes, "/projects");

    renderElement(route.element);

    expect(await screen.findByTestId("protected-route")).toBeInTheDocument();
    expect(await screen.findByTestId("dashboard-page")).toBeInTheDocument();
  });

  it("wraps /projects/:projectId/task/:taskId in ProtectedRoute and renders TaskDetailsPage", async () => {
    const router = await loadRouter();
    const route = findRoute(router.routes, "/projects/:projectId/task/:taskId");

    renderElement(route.element);

    expect(await screen.findByTestId("protected-route")).toBeInTheDocument();
    expect(await screen.findByTestId("task-details-page")).toBeInTheDocument();
  });

  it("wraps /projects/:projectId/memberships in ProtectedRoute and renders ProjectManagementPage", async () => {
    const router = await loadRouter();
    const route = findRoute(router.routes, "/projects/:projectId/memberships");

    renderElement(route.element);

    expect(await screen.findByTestId("protected-route")).toBeInTheDocument();
    expect(
      await screen.findByTestId("project-management-page"),
    ).toBeInTheDocument();
  });
});
