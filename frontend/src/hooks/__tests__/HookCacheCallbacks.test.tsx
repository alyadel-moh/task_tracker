import { renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import useUpdateTask from "../updateTaskHook";
import useCreateTask from "../createtaskHook";
import useDeleteTask from "../deleteTaskHook";
import useCreateTimeEntry from "../createTimeEntry";
import { axiosInstance } from "../../api-client";

vi.mock("../../api-client", () => ({
  axiosInstance: {
    patch: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("Hook Cache Callbacks Deep Coverage", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        mutations: { retry: false },
        queries: { retry: false },
      },
    });
  });

  const createWrapper = () => {
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  it("exercises task optimistic cache mapping in useUpdateTask", async () => {
    const mockTask = {
      id: "t1",
      name: "Updated Task Name",
      status: "IN_PROGRESS",
      priority: "HIGH",
    };

    vi.mocked(axiosInstance.patch).mockResolvedValueOnce({
      data: { task: mockTask, status: "SUCCESS", message: "Updated" },
    });

    queryClient.setQueryData(
      ["tasks", "p1"],
      [{ id: "t1", name: "Old Name", status: "TODO" }],
    );

    const { result } = renderHook(() => useUpdateTask("p1"), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      task: {
        id: "t1",
        name: "Updated Task Name",
        status: "IN_PROGRESS",
      } as any,
    });

    await vi.waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it("exercises task creation cache mapping in useCreateTask", async () => {
    const newCreatedTask = {
      id: "t100",
      name: "Brand New Task",
      status: "TODO",
    };

    vi.mocked(axiosInstance.post).mockResolvedValueOnce({
      data: {
        task: newCreatedTask,
        status: "SUCCESS",
        message: "Created",
        historyEntry: { id: "h1", fieldChanged: "created" },
      },
    });

    queryClient.setQueryData(["tasks", "p1"], []);
    queryClient.setQueryData(["task_history", "t100"], []);

    const { result } = renderHook(() => useCreateTask("p1"), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      name: "Brand New Task",
      description: "",
      status: "TODO",
      priority: "LOW",
      estimatedTime: null,
      dueDate: null,
    });

    await vi.waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it("exercises task deletion cache removal in useDeleteTask", async () => {
    vi.mocked(axiosInstance.delete).mockResolvedValueOnce({
      data: {
        status: "SUCCESS",
        message: "Deleted",
        historyEntry: { id: "h2", fieldChanged: "deleted" },
      },
    });

    queryClient.setQueryData(
      ["tasks", "p1"],
      [
        { id: "t1", name: "Task 1" },
        { id: "t2", name: "Task 2" },
      ],
    );
    queryClient.setQueryData(["task_history", "t1"], []);

    const { result } = renderHook(() => useDeleteTask("p1", "t1"), {
      wrapper: createWrapper(),
    });

    result.current.mutate();

    await vi.waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it("exercises time entry creation cache updater in useCreateTimeEntry", async () => {
    const newTimeEntry = {
      id: "e100",
      durationMinutes: 45,
      entryDate: "2026-08-11",
    };

    vi.mocked(axiosInstance.post).mockResolvedValueOnce({
      data: { timeEntry: newTimeEntry, status: "SUCCESS" },
    });

    queryClient.setQueryData(["time_entries", "t1"], {
      timeEntries: [],
      totalMinutes: 0,
    });

    const { result } = renderHook(() => useCreateTimeEntry("t1"), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      durationMinutes: 45,
      entryDate: "2026-08-11",
      taskId: "t1",
    });

    await vi.waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });
});
