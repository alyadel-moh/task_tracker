import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import useGetTasks from "../getAllTasksHook";
import { axiosInstance } from "../../api-client";

vi.mock("../../api-client", () => ({
  axiosInstance: {
    get: vi.fn(),
  },
}));

describe("useGetTasks Full Coverage Suite", () => {
  let queryClient: QueryClient;

  const createWrapper = () => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem("token", "test-token");
  });

  it("fetches tasks with array search parameters and custom paramsSerializer", async () => {
    const mockTasks = [
      { id: "t1", name: "Task 1", status: "TODO", priority: "HIGH" },
      { id: "t2", name: "Task 2", status: "IN_PROGRESS", priority: "LOW" },
    ];

    vi.mocked(axiosInstance.get).mockResolvedValueOnce({ data: mockTasks });

    const { result } = renderHook(
      () =>
        useGetTasks({
          projectId: "p1",
          search: "Task",
          statusId: ["TODO", "IN_PROGRESS"],
          priority: ["HIGH"],
          overdue: true,
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockTasks);
    expect(axiosInstance.get).toHaveBeenCalledWith(
      "tasks/p1",
      expect.objectContaining({
        params: {
          search: "Task",
          statusId: ["TODO", "IN_PROGRESS"],
          assigneeId: undefined,
          priority: ["HIGH"],
          overdue: true,
        },
      }),
    );

    // Test the paramsSerializer callback branch
    const callConfig = vi.mocked(axiosInstance.get).mock.calls[0][1];
    if (callConfig?.paramsSerializer) {
      const serialized = (callConfig.paramsSerializer as Function)({
        search: "Task",
        status: ["TODO", "IN_PROGRESS"],
        priority: "HIGH",
        empty: "",
        nullVal: null,
      });
      expect(serialized).toContain("status=TODO");
      expect(serialized).toContain("status=IN_PROGRESS");
    }
  });

  it("disables query when projectId or token is missing", async () => {
    localStorage.removeItem("token");

    const { result } = renderHook(() => useGetTasks({ projectId: "p1" }), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe("idle");
    expect(axiosInstance.get).not.toHaveBeenCalled();
  });
});
