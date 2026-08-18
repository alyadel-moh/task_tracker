import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import useCreateTimeEntry from "../createTimeEntry";
import { axiosInstance } from "../../api-client";

vi.mock("../../api-client", () => ({
  axiosInstance: {
    post: vi.fn(),
  },
}));

describe("useCreateTimeEntry", () => {
  let queryClient: QueryClient;
  const taskId = "task-123";

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("creates time entry and appends entry to cache", async () => {
    queryClient.setQueryData(["time-entries", taskId], {
      timeEntries: [{ id: "e1", durationMinutes: 15 }],
      totalMinutes: 15,
    });

    const mockResponse = {
      timeEntry: { id: "e2", durationMinutes: 30, entryDate: "2026-08-11" },
      status: "SUCCESS",
      message: "Entry created",
    };

    vi.mocked(axiosInstance.post).mockResolvedValueOnce({ data: mockResponse });

    const { result } = renderHook(() => useCreateTimeEntry(taskId), { wrapper });

    result.current.mutate({ durationMinutes: 30, entryDate: "2026-08-11", taskId });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const updatedCache = queryClient.getQueryData<any>(["time-entries", taskId]);
    expect(updatedCache.timeEntries).toHaveLength(2);
    expect(updatedCache.totalMinutes).toBe(45);
  });
});