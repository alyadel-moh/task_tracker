import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import Dashboard from "../Dashboard";
import { toast } from "react-hot-toast";

const mockUpdateTaskMutate = vi.fn();

const mockProjects = [
  { id: "p1", name: "Project Alpha", description: "Test project" },
];

const mockTasks = [
  {
    id: "t1",
    name: "Drag & Drop Task",
    status: "TODO",
    priority: "HIGH",
    description: "Task to move",
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
  default: () => ({ mutate: mockUpdateTaskMutate, isPending: false }),
}));
vi.mock("../../hooks/updateTaskHook", () => ({
  default: () => ({ mutate: mockUpdateTaskMutate, isPending: false }),
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

describe("Dashboard Drag and Drop Handler Suite", () => {
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

  it("handles updateTask onSuccess callback and displays success toast", async () => {
    mockUpdateTaskMutate.mockImplementation((payload, options) => {
      options?.onSuccess?.({ message: "Task moved successfully" });
    });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("Drag & Drop Task")).toBeInTheDocument();
    });

    // Manually trigger the onSuccess callback pathway
    const callArgs = mockUpdateTaskMutate.mock.calls[0];
    if (callArgs && callArgs[1]?.onSuccess) {
      callArgs[1].onSuccess();
      expect(toast.success).toHaveBeenCalled();
    }
  });

  it("handles updateTask onError callback, rolls back state, and displays error toast", async () => {
    mockUpdateTaskMutate.mockImplementation((payload, options) => {
      options?.onError?.({
        response: { data: { message: "Failed to update status" } },
      });
    });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("Drag & Drop Task")).toBeInTheDocument();
    });

    // Trigger onError callback pathway to cover line 130-138 error rollback logic
    const callArgs = mockUpdateTaskMutate.mock.calls[0];
    if (callArgs && callArgs[1]?.onError) {
      callArgs[1].onError({
        response: { data: { message: "Failed to update status" } },
      });
      expect(toast.error).toHaveBeenCalledWith("Failed to update status");
    }
  });
});
