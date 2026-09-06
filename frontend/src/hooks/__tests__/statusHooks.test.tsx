import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import useCreateStatus from "../createStatusHook";
import useDeleteStatus from "../deleteStatusHook";
import { axiosInstance } from "../../api-client";
import { Statuss } from "../../components/types";

vi.mock("../../api-client", () => ({
  axiosInstance: {
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("Status Hooks Branch Coverage", () => {
  let queryClient: QueryClient;
  const projectId = "p1";

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

  describe("useCreateStatus", () => {
    it("logs in onMutate and appends status when cache is an array", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      const initialStatuses: Statuss[] = [
        { id: "s1", projectId, name: "Todo", position: 0, isDefault: true },
      ];
      queryClient.setQueryData(["statuses", projectId], initialStatuses);

      const mockResponse = {
        newStatus: { id: "s2", projectId, name: "In Progress", position: 1, isDefault: false },
        status: "SUCCESS",
        message: "Status created",
      };

      vi.mocked(axiosInstance.post).mockResolvedValueOnce({ data: mockResponse });

      const { result } = renderHook(() => useCreateStatus(projectId), { wrapper });

      result.current.mutate({ name: "In Progress" });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(consoleSpy).toHaveBeenCalledWith("Creating status:", { name: "In Progress" });
      expect(axiosInstance.post).toHaveBeenCalledWith("/projects/statuses/p1", { name: "In Progress" });

      const cache = queryClient.getQueryData<Statuss[]>(["statuses", projectId]);
      expect(cache).toHaveLength(2);
      expect(cache?.[1].id).toBe("s2");

      consoleSpy.mockRestore();
    });

    it("initializes an array with the new status when cache is null", async () => {
      queryClient.setQueryData(["statuses", projectId], null);

      const mockResponse = {
        newStatus: { id: "s1", projectId, name: "Todo", position: 0, isDefault: true },
        status: "SUCCESS",
        message: "Status created",
      };

      vi.mocked(axiosInstance.post).mockResolvedValueOnce({ data: mockResponse });

      const { result } = renderHook(() => useCreateStatus(projectId), { wrapper });

      result.current.mutate({ name: "Todo" });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(queryClient.getQueryData(["statuses", projectId])).toEqual([mockResponse.newStatus]);
    });

    it("preserves cache when cache is not an array (fallback branch)", async () => {
      queryClient.setQueryData(["statuses", projectId], { malformed: true });

      const mockResponse = {
        newStatus: { id: "s1", projectId, name: "Todo", position: 0, isDefault: true },
        status: "SUCCESS",
        message: "Status created",
      };

      vi.mocked(axiosInstance.post).mockResolvedValueOnce({ data: mockResponse });

      const { result } = renderHook(() => useCreateStatus(projectId), { wrapper });

      result.current.mutate({ name: "Todo" });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(queryClient.getQueryData(["statuses", projectId])).toEqual({ malformed: true });
    });

    it("triggers onError logging branch when API fails", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      vi.mocked(axiosInstance.post).mockRejectedValueOnce(new Error("Failed to create status"));

      const { result } = renderHook(() => useCreateStatus(projectId), { wrapper });

      result.current.mutate({ name: "Broken" });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(consoleSpy).toHaveBeenCalledWith("Error creating status:", expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe("useDeleteStatus", () => {
    it("deletes status, removes matching item, and retains non-matching items", async () => {
      const initialStatuses: Statuss[] = [
        { id: "s1", projectId, name: "Todo", position: 0, isDefault: true },
        { id: "s2", projectId, name: "Done", position: 1, isDefault: false },
      ];
      queryClient.setQueryData(["statuses", projectId], initialStatuses);

      const mockResponse = { status: "SUCCESS", message: "Deleted" };
      vi.mocked(axiosInstance.delete).mockResolvedValueOnce({ data: mockResponse });

      const { result } = renderHook(() => useDeleteStatus(projectId), { wrapper });

      result.current.mutate("s1");

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(axiosInstance.delete).toHaveBeenCalledWith("/projects/statuses/p1/s1");

      const cache = queryClient.getQueryData<Statuss[]>(["statuses", projectId]);
      expect(cache).toHaveLength(1);
      expect(cache?.[0].id).toBe("s2");
    });

    it("returns empty array when cache is null or undefined", async () => {
      queryClient.setQueryData(["statuses", projectId], null);

      const mockResponse = { status: "SUCCESS", message: "Deleted" };
      vi.mocked(axiosInstance.delete).mockResolvedValueOnce({ data: mockResponse });

      const { result } = renderHook(() => useDeleteStatus(projectId), { wrapper });

      result.current.mutate("s1");

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(queryClient.getQueryData(["statuses", projectId])).toEqual([]);
    });

    it("triggers onError logging branch when delete API fails", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      vi.mocked(axiosInstance.delete).mockRejectedValueOnce(new Error("Failed to delete status"));

      const { result } = renderHook(() => useDeleteStatus(projectId), { wrapper });

      result.current.mutate("s1");

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(consoleSpy).toHaveBeenCalledWith("Error deleting status:", expect.any(Error));

      consoleSpy.mockRestore();
    });
  });
});