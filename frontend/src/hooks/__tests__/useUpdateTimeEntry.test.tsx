import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import useUpdateTimeEntry from "../updateTimeEntry"; // Adjust import path
import { axiosInstance } from "../../api-client";

vi.mock("../../api-client", () => ({
  axiosInstance: {
    patch: vi.fn(),
  },
}));

describe("useUpdateTimeEntry", () => {
  let queryClient: QueryClient;
  const taskId = "task-100";

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("updates time entry and recalculates total minutes in cache", async () => {
    queryClient.setQueryData(["time-entries", taskId], {
      timeEntries: [
        { id: "e1", durationMinutes: 30, note: "Old note" },
        { id: "e2", durationMinutes: 20, note: "Keep note" },
      ],
      totalMinutes: 50,
    });

    queryClient.setQueryData(["task_history", taskId], [{ id: "h1" }]);

    const mockResponse = {
      timeEntry: { id: "e1", note: "Updated note", durationMinutes: 45 },
      status: "SUCCESS",
      message: "Updated",
      historyEntries: [{ id: "h2", fieldChanged: "note" }],
    };

    vi.mocked(axiosInstance.patch).mockResolvedValueOnce({ data: mockResponse });

    const { result } = renderHook(() => useUpdateTimeEntry(taskId), { wrapper });

    result.current.mutate({ id: "e1", note: "Updated note" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const updatedCache = queryClient.getQueryData<any>(["time-entries", taskId]);
    expect(updatedCache.totalMinutes).toBe(65); // 45 + 20
    expect(updatedCache.timeEntries[0].note).toBe("Updated note");

    const updatedHistory = queryClient.getQueryData<any[]>(["task_history", taskId]);
    expect(updatedHistory).toHaveLength(2);
    expect(updatedHistory?.[0].id).toBe("h2");
  });
});