import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import useGetTask from "../getTaskHook"; // Adjust import path
import { axiosInstance } from "../../api-client";

vi.mock("../../api-client", () => ({
  axiosInstance: {
    get: vi.fn(),
  },
}));

describe("useGetTask", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("fetches single task details when token is set", async () => {
    localStorage.setItem("token", "fake-token");
    const mockTask = { id: "t1", title: "Implement Unit Tests", status: "IN_PROGRESS" };
    vi.mocked(axiosInstance.get).mockResolvedValueOnce({ data: mockTask });

    const { result } = renderHook(() => useGetTask("proj-1", "t1"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockTask);
    expect(axiosInstance.get).toHaveBeenCalledWith("tasks/proj-1/t1");
  });
});