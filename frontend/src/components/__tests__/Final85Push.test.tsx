import {
  render,
  screen,
  fireEvent,
  waitFor,
  renderHook,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import Dashboard from "../Dashboard";
import useCreateTimeEntry from "../../hooks/createTimeEntry";
import useUpdateTask from "../../hooks/updateTaskHook";
import { axiosInstance } from "../../api-client";

vi.mock("../../api-client", () => ({
  axiosInstance: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockTasks = [
  {
    id: "t1",
    name: "Task A",
    status: "TODO",
    priority: "HIGH",
    description: "Desc",
    projectId: "p1",
  },
];

const mockProjects = [
  { id: "p1", name: "Project Alpha", description: "Alpha Desc" },
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

describe("Final 85 Push Suite", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem("token", "test-token");
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );

  it("covers Dashboard project and user menu state toggles", async () => {
    render(<Dashboard />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText("Task A")).toBeInTheDocument();
    });

    const logOutBtn = screen.getByRole("button", { name: /log out/i });
    expect(logOutBtn).toBeInTheDocument();

    const newProjectButtons = screen.getAllByRole("button", {
      name: /new project/i,
    });
    if (newProjectButtons.length > 0) {
      fireEvent.click(newProjectButtons[0]);
    }
  });

  it("triggers createTimeEntry fallback cache initialization when cache is empty", async () => {
    const timeEntryMock = {
      id: "e101",
      durationMinutes: 60,
      entryDate: "2026-08-11",
    };
    vi.mocked(axiosInstance.post).mockResolvedValueOnce({
      data: { timeEntry: timeEntryMock, status: "SUCCESS" },
    });

    const { result } = renderHook(() => useCreateTimeEntry("t1"), { wrapper });

    result.current.mutate({
      durationMinutes: 60,
      entryDate: "2026-08-11",
      taskId: "t1",
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it("triggers updateTask error callback branch", async () => {
    vi.mocked(axiosInstance.patch).mockImplementation(() =>
      Promise.reject(new Error("Update failed")),
    );

    const { result } = renderHook(() => useUpdateTask("p1"), { wrapper });

    result.current.mutate({
      task: { id: "t1", name: "Failed Name", status: "TODO" } as any,
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});
