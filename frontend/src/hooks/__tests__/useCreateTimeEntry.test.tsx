import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import useCreateTimeEntry from "../createTimeEntry";
import { axiosInstance } from "../../api-client";
import { TimeEntry, HistoryEntry } from "../../components/types";

vi.mock("../../api-client", () => ({
  axiosInstance: {
    post: vi.fn(),
  },
}));

describe("useCreateTimeEntry Complete 100% Branch Coverage", () => {
  let queryClient: QueryClient;
  const taskId = "task-isolated-cte";

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

  it("appends to existing time entries and prepends history entry", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    queryClient.setQueryData(["time-entries", taskId], {
      timeEntries: [{ id: "te-1", durationMinutes: 15 }],
      totalMinutes: 15,
    });
    queryClient.setQueryData(["task_history", taskId], [{ id: "h1" }]);

    const mockResponse = {
      status: "SUCCESS",
      overrun: false,
      message: "Created",
      timeEntry: { id: "te-2", durationMinutes: 30 } as TimeEntry,
      historyEntry: { id: "h2" } as HistoryEntry,
    };

    vi.mocked(axiosInstance.post).mockResolvedValueOnce({ data: mockResponse });

    const { result } = renderHook(() => useCreateTimeEntry(taskId), {
      wrapper,
    });
    result.current.mutate({ taskId, durationMinutes: 30 });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(consoleSpy).toHaveBeenCalledWith("Creating time entry:", {
      taskId,
      durationMinutes: 30,
    });

    const timeCache = queryClient.getQueryData<any>(["time-entries", taskId]);
    expect(timeCache.timeEntries).toHaveLength(2);
    expect(timeCache.totalMinutes).toBe(45);

    const histCache = queryClient.getQueryData<HistoryEntry[]>([
      "task_history",
      taskId,
    ]);
    expect(histCache).toHaveLength(2);
    expect(histCache?.[0].id).toBe("h2");

    consoleSpy.mockRestore();
  });

  it("initializes timeEntries when cache is null and sets fallback totalMinutes to 0", async () => {
    queryClient.setQueryData(["time-entries", taskId], null);
    queryClient.setQueryData(["task_history", taskId], null);

    const mockResponse = {
      status: "SUCCESS",
      overrun: false,
      message: "Created",
      timeEntry: { id: "te-null-dur", durationMinutes: null } as any,
    };

    vi.mocked(axiosInstance.post).mockResolvedValueOnce({ data: mockResponse });

    const { result } = renderHook(() => useCreateTimeEntry(taskId), {
      wrapper,
    });
    result.current.mutate({ taskId });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(queryClient.getQueryData(["time-entries", taskId])).toEqual({
      timeEntries: [mockResponse.timeEntry],
      totalMinutes: 0,
    });
    expect(queryClient.getQueryData(["task_history", taskId])).toBeNull();
  });

  it("covers Line 45 (non-array timeEntries) and Line 57 (omitted historyEntry)", async () => {
    // Line 45: oldTimeEntries is truthy, but .timeEntries is not an array
    const malformedCache = { timeEntries: "not-an-array", totalMinutes: 10 };
    queryClient.setQueryData(["time-entries", taskId], malformedCache);

    // Line 57: oldHistory is truthy, but response omits historyEntry
    queryClient.setQueryData(
      ["task_history", taskId],
      [{ id: "existing-hist" }],
    );

    const mockResponse = {
      status: "SUCCESS",
      overrun: false,
      message: "Created",
      timeEntry: { id: "te-3", durationMinutes: 20 } as TimeEntry,
      // historyEntry is undefined
    };

    vi.mocked(axiosInstance.post).mockResolvedValueOnce({ data: mockResponse });

    const { result } = renderHook(() => useCreateTimeEntry(taskId), {
      wrapper,
    });
    result.current.mutate({ taskId, durationMinutes: 20 });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Validates Line 45: return oldTimeEntries
    expect(queryClient.getQueryData(["time-entries", taskId])).toEqual(
      malformedCache,
    );

    // Validates Line 57: return oldHistory
    expect(queryClient.getQueryData(["task_history", taskId])).toEqual([
      { id: "existing-hist" },
    ]);
  });

  it("covers onError branch when API call fails", async () => {
    const consoleErr = vi.spyOn(console, "error").mockImplementation(() => {});

    vi.mocked(axiosInstance.post).mockRejectedValueOnce(new Error("API Error"));

    const { result } = renderHook(() => useCreateTimeEntry(taskId), {
      wrapper,
    });
    result.current.mutate({ taskId });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(consoleErr).toHaveBeenCalledWith(
      "Error creating time entry:",
      expect.any(Error),
    );
    consoleErr.mockRestore();
  });
});
