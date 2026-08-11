import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import useDeleteTask from "../deleteTaskHook";
import { axiosInstance } from "../../api-client";

vi.mock("../../api-client", () => ({
  axiosInstance: {
    delete: vi.fn(),
  },
}));

describe("useDeleteTask Hook Coverage", () => {
  let queryClient: QueryClient;

  const createWrapper = () => {
    queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
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

  it("deletes task by calling tasks/delete/projectId/taskId endpoint", async () => {
    const mockResponse = {
      status: "SUCCESS",
      message: "Task deleted",
    };

    vi.mocked(axiosInstance.delete).mockResolvedValueOnce({
      data: mockResponse,
    });

    const { result } = renderHook(() => useDeleteTask("p1", "t100"), {
      wrapper: createWrapper(),
    });

    result.current.mutate();

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(axiosInstance.delete).toHaveBeenCalledWith("tasks/delete/p1/t100");
  });

  it("handles delete task error branch", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(axiosInstance.delete).mockRejectedValueOnce(
      new Error("Delete failed"),
    );

    const { result } = renderHook(() => useDeleteTask("p1", "t100"), {
      wrapper: createWrapper(),
    });

    result.current.mutate();

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
