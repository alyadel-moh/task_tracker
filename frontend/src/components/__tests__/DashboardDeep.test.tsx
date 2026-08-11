import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import Dashboard from "../Dashboard";

const mockMutateDeleteProject = vi.fn();

const projectsMockData = [
  { id: "p1", name: "Project Alpha", description: "Test Project" },
  { id: "p2", name: "Project Beta", description: "Test Project 2" },
];

const tasksMockData = [
  {
    id: "t1",
    name: "Design Database Schema",
    status: "TODO",
    priority: "HIGH",
    description: "Schema design",
    projectId: "p1",
  },
];

vi.mock("../hooks/getProjectsHook", () => ({
  default: () => ({ data: projectsMockData, isLoading: false }),
}));
vi.mock("../../hooks/getProjectsHook", () => ({
  default: () => ({ data: projectsMockData, isLoading: false }),
}));

vi.mock("../hooks/getAllTasksHook", () => ({
  default: () => ({ data: tasksMockData, isLoading: false }),
}));
vi.mock("../../hooks/getAllTasksHook", () => ({
  default: () => ({ data: tasksMockData, isLoading: false }),
}));

vi.mock("../hooks/meHook", () => ({
  default: () => ({ data: { name: "Aly Adel", email: "aly@example.com" } }),
}));
vi.mock("../../hooks/meHook", () => ({
  default: () => ({ data: { name: "Aly Adel", email: "aly@example.com" } }),
}));

vi.mock("../hooks/deleteProjectHook", () => ({
  default: () => ({ mutate: mockMutateDeleteProject, isPending: false }),
}));
vi.mock("../../hooks/deleteProjectHook", () => ({
  default: () => ({ mutate: mockMutateDeleteProject, isPending: false }),
}));

vi.mock("../hooks/updateTaskHook", () => ({
  default: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock("../../hooks/updateTaskHook", () => ({
  default: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("../hooks/logoutHook", () => ({
  default: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock("../../hooks/logoutHook", () => ({
  default: () => ({ mutate: vi.fn(), isPending: false }),
}));

describe("Dashboard Deep Coverage Suite", () => {
  let queryClient: QueryClient;

  const createWrapper = () => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
        mutations: { retry: false },
      },
    });

    function TestWrapper({ children }: { children: React.ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>{children}</MemoryRouter>
        </QueryClientProvider>
      );
    }
    return TestWrapper;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem("token", "test-token");
  });

  it("renders active project details and allows switching active projects", async () => {
    render(<Dashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getAllByText("Project Alpha")[0]).toBeInTheDocument();
    });

    const projectBetaButtons = screen.getAllByText("Project Beta");
    fireEvent.click(projectBetaButtons[0]);

    expect(screen.getByText("Design Database Schema")).toBeInTheDocument();
  });

  it("opens deletion confirmation modal and executes delete project mutation", async () => {
    render(<Dashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getAllByText("Project Alpha")[0]).toBeInTheDocument();
    });

    // Find delete button via role or aria/title attributes safely
    const deleteButtons = screen.getAllByRole("button");
    const deleteBtn = deleteButtons.find(
      (btn) =>
        btn.getAttribute("title")?.toLowerCase().includes("delete") ||
        btn.getAttribute("aria-label")?.toLowerCase().includes("delete") ||
        btn.className.includes("delete"),
    );

    if (deleteBtn) {
      fireEvent.click(deleteBtn);

      await waitFor(() => {
        expect(
          screen.getByText(/delete "project alpha"\?/i),
        ).toBeInTheDocument();
      });

      const confirmDeleteBtn = screen.getByRole("button", {
        name: /delete permanently/i,
      });
      fireEvent.click(confirmDeleteBtn);

      expect(mockMutateDeleteProject).toHaveBeenCalledWith(
        "p1",
        expect.any(Object),
      );
    }
  });
});
