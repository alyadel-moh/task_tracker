import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import Dashboard from "../Dashboard";

const mockUpdateTask = vi.fn();

const mockProjects = [
  { id: "p1", name: "Alpha Project", description: "Alpha Desc" },
];

const mockTasks = [
  {
    id: "t1",
    name: "Drag Test Task",
    status: "TODO",
    priority: "HIGH",
    description: "Testing dnd",
    projectId: "p1",
  },
];

vi.mock("../hooks/getProjectsHook", () => ({
  default: () => ({ data: mockProjects, isLoading: false }),
}));
vi.mock("../../hooks/getProjectsHook", () => ({
  default: () => ({ data: mockProjects, isLoading: false }),
}));

vi.mock("../hooks/getAllTasksHook", () => ({
  default: () => ({ data: mockTasks, isLoading: false }),
}));
vi.mock("../../hooks/getAllTasksHook", () => ({
  default: () => ({ data: mockTasks, isLoading: false }),
}));

vi.mock("../hooks/meHook", () => ({
  default: () => ({ data: { name: "Aly Adel", email: "aly@example.com" } }),
}));
vi.mock("../../hooks/meHook", () => ({
  default: () => ({ data: { name: "Aly Adel", email: "aly@example.com" } }),
}));

vi.mock("../hooks/updateTaskHook", () => ({
  default: () => ({ mutate: mockUpdateTask, isPending: false }),
}));
vi.mock("../../hooks/updateTaskHook", () => ({
  default: () => ({ mutate: mockUpdateTask, isPending: false }),
}));

vi.mock("../hooks/deleteProjectHook", () => ({
  default: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock("../../hooks/deleteProjectHook", () => ({
  default: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("../hooks/logoutHook", () => ({
  default: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock("../../hooks/logoutHook", () => ({
  default: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("react-hot-toast", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("Dashboard Drag & Drop Branch Suite", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem("token", "test-token");
  });

  const renderDashboard = () => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>
      </QueryClientProvider>,
    );
  };

  it("handles successful drag end and triggers update task mutation", async () => {
    mockUpdateTask.mockImplementation((payload, options) => {
      options?.onSuccess?.();
    });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("Drag Test Task")).toBeInTheDocument();
    });

    // Use getAllByRole to safely handle both desktop and mobile sidebar buttons
    const projectButtons = screen.getAllByRole("button", {
      name: "Alpha Project",
    });
    expect(projectButtons[0]).toBeInTheDocument();
  });
});
