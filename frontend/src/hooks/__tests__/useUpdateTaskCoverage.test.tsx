import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import useUpdateTask from "../updateTaskHook";
import { axiosInstance } from "../../api-client";
import { Task, HistoryEntry } from "../../components/types";

vi.mock("../../api-client", () => ({
  axiosInstance: {
    patch: vi.fn(),
  },
}));

describe("useUpdateTask Full Branch Coverage", () => {
  let queryClient: QueryClient;
  const projectId = "proj-100";
  const taskId = "task-200";

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("updates task cache using fallback updatedAt when backend omits it and prepends history", async () => {
    const initialTasks: Task[] = [
      { id: taskId, name: "Old Title", updatedAt: "2026-01-01T00:00:00.000Z" } as Task,
      { id: "task-other", name: "Other Task", updatedAt: "2026-01-01T00:00:00.000Z" } as Task,
    ];
    queryClient.setQueryData(["tasks", projectId], initialTasks);
    queryClient.setQueryData(["task", projectId, taskId], initialTasks[0]);
    queryClient.setQueryData(["task_history", taskId], [{ id: "h1" }]);

    const mockResponse = {
      task: { name: "New Title" }, // Line 56: updatedAt omitted to trigger ?? fallback
      overrun: false,
      status: "SUCCESS",
      message: "Updated",
      historyEntries: [{ id: "h2", fieldChanged: "name" }] as HistoryEntry[],
    };

    vi.mocked(axiosInstance.patch).mockResolvedValueOnce({ data: mockResponse });

    const { result } = renderHook(() => useUpdateTask(projectId), { wrapper });

    result.current.mutate({ id: taskId, name: "New Title" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const tasksCache = queryClient.getQueryData<Task[]>(["tasks", projectId]);
    expect(tasksCache?.[0].name).toBe("New Title");
    expect(tasksCache?.[0].updatedAt).toBeDefined();
    expect(tasksCache?.[1].name).toBe("Other Task"); // Unmodified item branch

    const singleTaskCache = queryClient.getQueryData<Task>(["task", projectId, taskId]);
    expect(singleTaskCache?.name).toBe("New Title");

    const historyCache = queryClient.getQueryData<HistoryEntry[]>(["task_history", taskId]);
    expect(historyCache).toHaveLength(2);
    expect(historyCache?.[0].id).toBe("h2");
  });

  it("leaves history unchanged when historyEntries is empty or undefined (Line 79 false branch)", async () => {
    queryClient.setQueryData(["tasks", projectId], [{ id: taskId, name: "Task" }]);
    queryClient.setQueryData(["task", projectId, taskId], { id: taskId, name: "Task" });
    queryClient.setQueryData(["task_history", taskId], [{ id: "h1" }]);

    const mockResponse = {
      task: { name: "Updated Without History", updatedAt: "2026-05-01T00:00:00.000Z" },
      overrun: false,
      status: "SUCCESS",
      message: "Updated",
      historyEntries: [], // Triggers Line 79 false branch
    };

    vi.mocked(axiosInstance.patch).mockResolvedValueOnce({ data: mockResponse });

    const { result } = renderHook(() => useUpdateTask(projectId), { wrapper });

    result.current.mutate({ id: taskId, name: "Updated Without History" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const historyCache = queryClient.getQueryData<HistoryEntry[]>(["task_history", taskId]);
    expect(historyCache).toEqual([{ id: "h1" }]);
  });

  it("handles null and non-array caches without throwing", async () => {
    queryClient.setQueryData(["tasks", projectId], null);
    queryClient.setQueryData(["task", projectId, taskId], null);
    queryClient.setQueryData(["task_history", taskId], null);

    vi.mocked(axiosInstance.patch).mockResolvedValueOnce({
      data: {
        task: { name: "Name" },
        status: "SUCCESS",
        message: "Updated",
      },
    });

    const { result } = renderHook(() => useUpdateTask(projectId), { wrapper });

    result.current.mutate({ id: taskId, name: "Name" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(queryClient.getQueryData(["tasks", projectId])).toBeNull();
    expect(queryClient.getQueryData(["task", projectId, taskId])).toBeNull();
    expect(queryClient.getQueryData(["task_history", taskId])).toBeNull();

    // Non-array tasks cache
    queryClient.setQueryData(["tasks", projectId], { unexpectedObject: true });
    vi.mocked(axiosInstance.patch).mockResolvedValueOnce({
      data: { task: { name: "Name" }, status: "SUCCESS", message: "Updated" },
    });

    result.current.mutate({ id: taskId, name: "Name" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(queryClient.getQueryData(["tasks", projectId])).toEqual({ unexpectedObject: true });
  });
});