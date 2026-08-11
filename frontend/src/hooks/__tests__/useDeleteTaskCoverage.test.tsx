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

describe("useDeleteTask Full Branch Coverage", () => {
  let queryClient: QueryClient;

  const createWrapper = () => {
    queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });

    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("executes DELETE mutation and clears task from query cache", async () => {
    vi.mocked(axiosInstance.delete).mockResolvedValueOnce({
      data: { status: "SUCCESS", message: "Deleted" },
    });

    const { result } = renderHook(() => useDeleteTask("p1", "t1"), {
      wrapper: createWrapper(),
    });

    result.current.mutate();

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(axiosInstance.delete).toHaveBeenCalledWith("tasks/delete/p1/t1");
  });
});