import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import useDeleteTimeEntry from "../deleteTimeEntry"; // Adjust import path
import { axiosInstance } from "../../api-client";

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
      defaultOptions: { queries: { retry: false } },
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("deletes time entry, removes it from cache, and updates totalMinutes", async () => {
    queryClient.setQueryData(["time-entries", taskId], {
      timeEntries: [
        { id: "e1", durationMinutes: 30 },
        { id: "e2", durationMinutes: 20 },
      ],
      totalMinutes: 50,
    });

    queryClient.setQueryData(["task_history", taskId], []);

    const mockResponse = {
      status: "SUCCESS",
      message: "Deleted",
      historyEntry: { id: "h99", fieldChanged: "deleted_time_entry" },
    };

    vi.mocked(axiosInstance.delete).mockResolvedValueOnce({ data: mockResponse });

    const { result } = renderHook(() => useDeleteTimeEntry(taskId), { wrapper });

    result.current.mutate("e1");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const updatedCache = queryClient.getQueryData<any>(["time-entries", taskId]);
    expect(updatedCache.timeEntries).toHaveLength(1);
    expect(updatedCache.timeEntries[0].id).toBe("e2");
    expect(updatedCache.totalMinutes).toBe(20);

    const historyCache = queryClient.getQueryData<any[]>(["task_history", taskId]);
    expect(historyCache).toHaveLength(1);
    expect(historyCache?.[0].id).toBe("h99");
  });
});