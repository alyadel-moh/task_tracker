import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import useCreateTask from "../createTaskHook";
import { axiosInstance } from "../../api-client";

vi.mock("../../api-client", () => ({
  axiosInstance: {
    post: vi.fn(),
  },
}));

describe("useCreateTask Full Branch Coverage", () => {
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

  it("updates tasks cache array on successful task creation", async () => {
    const mockTask = {
      id: "t100",
      name: "New Task",
      description: "Desc",
      status: "TODO",
      priority: "HIGH",
      estimatedTime: null,
      dueDate: null,
    };

    vi.mocked(axiosInstance.post).mockResolvedValueOnce({
      data: { newTask: mockTask, status: "SUCCESS", message: "Created" },
    });

    const { result } = renderHook(() => useCreateTask("p1"), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      name: "New Task",
      description: "Desc",
      status: "TODO",
      priority: "HIGH",
      estimatedTime: null,
      dueDate: null,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(axiosInstance.post).toHaveBeenCalledWith(
      "tasks/p1",
      expect.anything(),
    );
  });
});
