import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import useDeleteTask from "../deleteTaskHook";
import { axiosInstance } from "../../api-client";
import { Task, HistoryEntry } from "../../components/types";

vi.mock("../../api-client", () => ({
  axiosInstance: {
    delete: vi.fn(),
  },
}));

describe("useDeleteTask Hook Coverage", () => {
  let queryClient: QueryClient;

  const createWrapper = () => {
    queryClient = new QueryClient({
      defaultOptions: {
        mutations: { retry: false },
        queries: { retry: false },
      },
    });

    function Wrapper({ children }: { children: React.ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    }
    return Wrapper;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes task and prepends historyEntry to existing history cache", async () => {
    const wrapper = createWrapper();
    const projectId = "p1";
    const taskId = "t100";

    const initialTasks: Task[] = [
      { id: "t100", name: "Task 1" } as Task,
      { id: "t200", name: "Task 2" } as Task,
    ];
    const initialHistory: HistoryEntry[] = [
      { id: "h1", eventType: "CREATED" } as HistoryEntry,
    ];

    queryClient.setQueryData(["tasks", projectId], initialTasks);
    queryClient.setQueryData(["task_history", taskId], initialHistory);

    const mockResponse = {
      status: "SUCCESS",
      message: "Task deleted",
      historyEntry: { id: "h99", eventType: "DELETED" } as HistoryEntry,
    };

    vi.mocked(axiosInstance.delete).mockResolvedValueOnce({
      data: mockResponse,
    });

    const { result } = renderHook(() => useDeleteTask(projectId, taskId), {
      wrapper,
    });

    result.current.mutate();

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(axiosInstance.delete).toHaveBeenCalledWith(
      `tasks/${projectId}/${taskId}`,
    );

    const updatedTasks = queryClient.getQueryData<Task[]>(["tasks", projectId]);
    expect(updatedTasks).toHaveLength(1);
    expect(updatedTasks?.[0].id).toBe("t200");

    const updatedHistory = queryClient.getQueryData<HistoryEntry[]>([
      "task_history",
      taskId,
    ]);
    expect(updatedHistory).toHaveLength(2);
    expect(updatedHistory?.[0].id).toBe("h99");
  });

  it("handles empty or non-array caches and missing historyEntry in response", async () => {
    const wrapper = createWrapper();
    const projectId = "p1";
    const taskId = "t100";

    // Non-array task cache & null history cache
    queryClient.setQueryData(["tasks", projectId], { invalid: true });
    queryClient.setQueryData(["task_history", taskId], null);

    const mockResponse = {
      status: "SUCCESS",
      message: "Task deleted",
      // historyEntry omitted to test false branch
    };

    vi.mocked(axiosInstance.delete).mockResolvedValueOnce({
      data: mockResponse,
    });

    const { result } = renderHook(() => useDeleteTask(projectId, taskId), {
      wrapper,
    });

    result.current.mutate();

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(queryClient.getQueryData(["tasks", projectId])).toEqual({
      invalid: true,
    });
    expect(queryClient.getQueryData(["task_history", taskId])).toBeNull();
  });

  it("handles null task cache and populated history without new historyEntry", async () => {
    const wrapper = createWrapper();
    const projectId = "p1";
    const taskId = "t100";

    queryClient.setQueryData(["tasks", projectId], null);
    queryClient.setQueryData(["task_history", taskId], [{ id: "h1" }]);

    vi.mocked(axiosInstance.delete).mockResolvedValueOnce({
      data: { status: "SUCCESS", message: "Task deleted" },
    });

    const { result } = renderHook(() => useDeleteTask(projectId, taskId), {
      wrapper,
    });

    result.current.mutate();

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(queryClient.getQueryData(["tasks", projectId])).toBeNull();
    expect(
      queryClient.getQueryData<any[]>(["task_history", taskId]),
    ).toHaveLength(1);
  });

  it("logs error message when delete task API fails", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(axiosInstance.delete).mockRejectedValueOnce(
      new Error("Network delete failure"),
    );

    const { result } = renderHook(() => useDeleteTask("p1", "t100"), {
      wrapper: createWrapper(),
    });

    result.current.mutate();

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      "Error deleting task:",
      expect.any(Error),
    );
    consoleSpy.mockRestore();
  });
});
