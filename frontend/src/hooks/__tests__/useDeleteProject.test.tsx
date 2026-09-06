import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import useDeleteProject from "../deleteProjectHook";
import { axiosInstance } from "../../api-client";

vi.mock("../../api-client", () => ({
  axiosInstance: {
    delete: vi.fn(),
  },
}));

describe("useDeleteProject Hook", () => {
  let queryClient: QueryClient;

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

  it("deletes a project and removes it from assigned-projects cache", async () => {
    queryClient.setQueryData(
      ["assigned-projects"],
      [
        { project: { id: "p1", name: "Project One" } },
        { project: { id: "p2", name: "Project Two" } },
      ],
    );

    const mockResponse = { status: "SUCCESS", message: "Deleted" };
    vi.mocked(axiosInstance.delete).mockResolvedValueOnce({
      data: mockResponse,
    });

    const { result } = renderHook(() => useDeleteProject(), { wrapper });

    result.current.mutate("p1");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const updatedProjects = queryClient.getQueryData<any[]>([
      "assigned-projects",
    ]);
    expect(updatedProjects).toHaveLength(1);
    expect(updatedProjects?.[0].project.id).toBe("p2");
    expect(axiosInstance.delete).toHaveBeenCalledWith("projects/p1");
  });

  it("returns empty array when assigned-projects cache is null or undefined", async () => {
    queryClient.setQueryData(["assigned-projects"], null);

    vi.mocked(axiosInstance.delete).mockResolvedValueOnce({
      data: { status: "SUCCESS", message: "Deleted" },
    });

    const { result } = renderHook(() => useDeleteProject(), { wrapper });

    result.current.mutate("p1");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(queryClient.getQueryData(["assigned-projects"])).toEqual([]);
  });

  it("logs error when delete project mutation fails", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(axiosInstance.delete).mockRejectedValueOnce(
      new Error("Delete project failed"),
    );

    const { result } = renderHook(() => useDeleteProject(), { wrapper });

    result.current.mutate("p1");

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(consoleSpy).toHaveBeenCalledWith(
      "Error deleting project:",
      expect.any(Error),
    );
    consoleSpy.mockRestore();
  });
});
