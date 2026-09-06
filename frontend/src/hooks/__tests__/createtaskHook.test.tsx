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

describe("useCreateTask Hook Coverage", () => {
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

  it("calls API and updates task cache on successful task creation", async () => {
    const mockResponse = {
      newTask: {
        id: "t100",
        name: "New Integration Test Task",
        description: "Test Desc",
        status: "TODO",
        priority: "HIGH",
        projectId: "p1",
      },
      status: "SUCCESS",
      message: "Created",
    };

    vi.mocked(axiosInstance.post).mockResolvedValueOnce({ data: mockResponse });

    const { result } = renderHook(() => useCreateTask("p1"), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      name: "New Integration Test Task",
      description: "Test Desc",
      status: "TODO",
      priority: "HIGH",
      estimatedTime: 60,
      dueDate: "2026-08-15",
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(axiosInstance.post).toHaveBeenCalledWith("tasks/p1", {
      name: "New Integration Test Task",
      description: "Test Desc",
      status: "TODO",
      priority: "HIGH",
      estimatedTime: 60,
      dueDate: "2026-08-15",
    });
  });

  it("logs error on mutation failure", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(axiosInstance.post).mockRejectedValueOnce(new Error("API Error"));

    const { result } = renderHook(() => useCreateTask("p1"), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      name: "Failed Task",
      description: "",
      status: "TODO",
      priority: "LOW",
      estimatedTime: null,
      dueDate: null,
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
