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
import useUpdateProject from "../../hooks/updateProjectHook";
import useLogout from "../../hooks/logoutHook";
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

describe("Final Push Coverage Suite", () => {
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

  it("covers Dashboard modal toggles and menu actions", async () => {
    render(<Dashboard />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText("Task A")).toBeInTheDocument();
    });

    // Mobile user menu toggle branch
    const userButtons = screen.getAllByRole("button", {
      name: /account menu|G|AA/i,
    });
    if (userButtons.length > 0) {
      fireEvent.click(userButtons[0]);
    }

    // Mobile project selector dropdown branch
    const projectSelectButtons = screen.getAllByRole("button", {
      name: /Project Alpha|Select a project/i,
    });
    if (projectSelectButtons.length > 0) {
      fireEvent.click(projectSelectButtons[0]);
    }
  });

  it("executes createTimeEntry optimistic cache mapping callbacks", async () => {
    const timeEntryMock = {
      id: "e1",
      durationMinutes: 45,
      entryDate: "2026-08-11",
    };
    vi.mocked(axiosInstance.post).mockResolvedValueOnce({
      data: { timeEntry: timeEntryMock, status: "SUCCESS" },
    });

    queryClient.setQueryData(["time_entries", "t1"], {
      timeEntries: [],
      totalMinutes: 0,
    });

    const { result } = renderHook(() => useCreateTimeEntry("t1"), { wrapper });

    result.current.mutate({
      durationMinutes: 45,
      entryDate: "2026-08-11",
      taskId: "t1",
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it("executes updateProjectHook cache update callbacks", async () => {
    const updatedProject = { id: "p1", name: "Alpha Updated" };
    vi.mocked(axiosInstance.patch).mockResolvedValueOnce({
      data: updatedProject,
    });

    queryClient.setQueryData(
      ["projects"],
      [{ id: "p1", name: "Project Alpha" }],
    );

    const { result } = renderHook(() => useUpdateProject("p1"), { wrapper });

    result.current.mutate({ name: "Alpha Updated" });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it("executes logoutHook mutation onError branch", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(axiosInstance.post).mockRejectedValueOnce(
      new Error("Logout error"),
    );

    const { result } = renderHook(() => useLogout(), { wrapper });

    result.current.mutate();

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
