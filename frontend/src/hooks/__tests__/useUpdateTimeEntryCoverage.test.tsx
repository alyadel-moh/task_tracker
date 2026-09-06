import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import useUpdateTimeEntry from "../updateTimeEntry";
import { axiosInstance } from "../../api-client";
import { TimeEntry, HistoryEntry } from "../../components/types";

vi.mock("../../api-client", () => ({
  axiosInstance: {
    patch: vi.fn(),
  },
}));

describe("useUpdateTimeEntry Full Branch Coverage", () => {
  let queryClient: QueryClient;
  const taskId = "task-300";
  const entryId = "entry-400";

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

  it("recalculates total minutes and falls back to entryData when timeEntry in response is missing", async () => {
    queryClient.setQueryData(["time-entries", taskId], {
      timeEntries: [
        { id: entryId, note: "Original", durationMinutes: 30 } as TimeEntry,
        { id: "other-entry", note: "Other", durationMinutes: null } as any, // Tests || 0 fallback
      ],
      totalMinutes: 30,
    });
    queryClient.setQueryData(["task_history", taskId], [{ id: "h1" }]);

    const mockResponse = {
      timeEntry: null, // Triggers fallback `data.timeEntry ?? entryData`
      status: "SUCCESS",
      overrun: false,
      message: "Updated",
      historyEntries: undefined, // Triggers false branch on history update
    };

    vi.mocked(axiosInstance.patch).mockResolvedValueOnce({ data: mockResponse });

    const { result } = renderHook(() => useUpdateTimeEntry(taskId), { wrapper });

    result.current.mutate({ id: entryId, note: "New Note", estimatedMinutes: 45 });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const cache = queryClient.getQueryData<any>(["time-entries", taskId]);
    expect(cache.timeEntries[0].note).toBe("New Note");
    expect(cache.totalMinutes).toBe(30);

    const history = queryClient.getQueryData<HistoryEntry[]>(["task_history", taskId]);
    expect(history).toEqual([{ id: "h1" }]);
  });

  it("handles null or malformed time-entries cache", async () => {
    queryClient.setQueryData(["time-entries", taskId], null);
    queryClient.setQueryData(["task_history", taskId], null);

    vi.mocked(axiosInstance.patch).mockResolvedValueOnce({
      data: {
        timeEntry: { id: entryId, note: "Updated" },
        status: "SUCCESS",
        message: "Updated",
      },
    });

    const { result } = renderHook(() => useUpdateTimeEntry(taskId), { wrapper });

    result.current.mutate({ id: entryId, note: "Updated" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(queryClient.getQueryData(["time-entries", taskId])).toBeNull();
    expect(queryClient.getQueryData(["task_history", taskId])).toBeNull();

    // Malformed timeEntries
    queryClient.setQueryData(["time-entries", taskId], { timeEntries: "invalid" });
    vi.mocked(axiosInstance.patch).mockResolvedValueOnce({
      data: {
        timeEntry: { id: entryId, note: "Updated" },
        status: "SUCCESS",
        message: "Updated",
      },
    });

    result.current.mutate({ id: entryId, note: "Updated" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(queryClient.getQueryData(["time-entries", taskId])).toEqual({ timeEntries: "invalid" });
  });

  it("logs error when update mutation fails (Line 81)", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    vi.mocked(axiosInstance.patch).mockRejectedValueOnce(
      new Error("Server error updating time entry"),
    );

    const { result } = renderHook(() => useUpdateTimeEntry(taskId), { wrapper });

    result.current.mutate({ id: entryId, note: "Broken" });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(consoleSpy).toHaveBeenCalledWith(
      "Error updating time entry:",
      expect.any(Error),
    );
    consoleSpy.mockRestore();
  });
});