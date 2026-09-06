import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import useDeleteTimeEntry from "../deleteTimeEntry";
import { axiosInstance } from "../../api-client";
import { HistoryEntry, TimeEntry } from "../../components/types";

vi.mock("../../api-client", () => ({
  axiosInstance: {
    delete: vi.fn(),
  },
}));

describe("useDeleteTimeEntry", () => {
  let queryClient: QueryClient;
  const taskId = "task-55";

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

  it("deletes time entry, recalculates totalMinutes, and prepends historyEntry", async () => {
    queryClient.setQueryData(["time-entries", taskId], {
      timeEntries: [
        { id: "e1", durationMinutes: 30 } as TimeEntry,
        { id: "e2", durationMinutes: 20 } as TimeEntry,
      ],
      totalMinutes: 50,
    });

    queryClient.setQueryData(["task_history", taskId], [{ id: "h1" }]);

    const mockResponse = {
      status: "SUCCESS",
      message: "Deleted",
      historyEntry: {
        id: "h99",
        fieldChanged: "deleted_time_entry",
      } as HistoryEntry,
    };

    vi.mocked(axiosInstance.delete).mockResolvedValueOnce({
      data: mockResponse,
    });

    const { result } = renderHook(() => useDeleteTimeEntry(taskId), {
      wrapper,
    });

    result.current.mutate("e1");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const updatedCache = queryClient.getQueryData<any>([
      "time-entries",
      taskId,
    ]);
    expect(updatedCache.timeEntries).toHaveLength(1);
    expect(updatedCache.timeEntries[0].id).toBe("e2");
    expect(updatedCache.totalMinutes).toBe(20);

    const historyCache = queryClient.getQueryData<any[]>([
      "task_history",
      taskId,
    ]);
    expect(historyCache).toHaveLength(2);
    expect(historyCache?.[0].id).toBe("h99");
  });

  it("handles deleted entry with no durationMinutes and updates totalMinutes safely", async () => {
    // Deleted entry has null durationMinutes -> tests false branch of durationMinutes check
    queryClient.setQueryData(["time-entries", taskId], {
      timeEntries: [
        { id: "e1", durationMinutes: null } as any,
        { id: "e2", durationMinutes: 15 } as TimeEntry,
      ],
      totalMinutes: 15,
    });

    queryClient.setQueryData(["task_history", taskId], [{ id: "h1" }]);

    vi.mocked(axiosInstance.delete).mockResolvedValueOnce({
      data: { status: "SUCCESS", message: "Deleted" }, // No historyEntry
    });

    const { result } = renderHook(() => useDeleteTimeEntry(taskId), {
      wrapper,
    });

    result.current.mutate("e1");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const updatedCache = queryClient.getQueryData<any>([
      "time-entries",
      taskId,
    ]);
    expect(updatedCache.timeEntries).toHaveLength(1);
    expect(updatedCache.totalMinutes).toBe(15);

    // History unchanged since data.historyEntry was undefined
    const historyCache = queryClient.getQueryData<any[]>([
      "task_history",
      taskId,
    ]);
    expect(historyCache).toHaveLength(1);
    expect(historyCache?.[0].id).toBe("h1");
  });

  it("handles null and malformed cache structures safely", async () => {
    // 1. null oldData & null oldHistory
    queryClient.setQueryData(["time-entries", taskId], null);
    queryClient.setQueryData(["task_history", taskId], null);

    vi.mocked(axiosInstance.delete).mockResolvedValueOnce({
      data: {
        status: "SUCCESS",
        message: "Deleted",
        historyEntry: { id: "h10" } as HistoryEntry,
      },
    });

    const { result } = renderHook(() => useDeleteTimeEntry(taskId), {
      wrapper,
    });

    result.current.mutate("e1");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(queryClient.getQueryData(["time-entries", taskId])).toBeNull();
    expect(queryClient.getQueryData(["task_history", taskId])).toBeNull();

    // 2. non-array timeEntries in oldData
    queryClient.setQueryData(["time-entries", taskId], {
      timeEntries: "invalid",
      totalMinutes: 0,
    });

    vi.mocked(axiosInstance.delete).mockResolvedValueOnce({
      data: { status: "SUCCESS", message: "Deleted" },
    });

    result.current.mutate("e1");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(queryClient.getQueryData(["time-entries", taskId])).toEqual({
      timeEntries: "invalid",
      totalMinutes: 0,
    });
  });

  it("logs error message when API call fails", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(axiosInstance.delete).mockRejectedValueOnce(
      new Error("Failed to delete entry"),
    );

    const { result } = renderHook(() => useDeleteTimeEntry(taskId), {
      wrapper,
    });

    result.current.mutate("e1");

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(consoleSpy).toHaveBeenCalledWith(
      "Error deleting time entry:",
      expect.any(Error),
    );
    consoleSpy.mockRestore();
  });
});
