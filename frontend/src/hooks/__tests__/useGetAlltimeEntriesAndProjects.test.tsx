import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import useGetAlltimeEntries from "../getAlltimeEntries";
import useGetProjects from "../getProjectsHook";
import { axiosInstance } from "../../api-client";

vi.mock("../../api-client", () => ({
  axiosInstance: {
    get: vi.fn(),
  },
}));

describe("useGetAlltimeEntries & useGetProjects", () => {
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

  it("fetches all time entries when token is present", async () => {
    localStorage.setItem("token", "fake-token");
    const mockEntries = [{ id: "e1", durationMinutes: 60 }];
    vi.mocked(axiosInstance.get).mockResolvedValueOnce({ data: mockEntries });

    const { result } = renderHook(() => useGetAlltimeEntries("task-1"), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockEntries);
    expect(axiosInstance.get).toHaveBeenCalledWith("time-entries/task-1");
  });

  it("fetches projects list when token is present", async () => {
    localStorage.setItem("token", "fake-token");
    const mockProjects = [{ id: "p1", name: "Backend Logging" }];
    vi.mocked(axiosInstance.get).mockResolvedValueOnce({ data: mockProjects });

    const { result } = renderHook(() => useGetProjects(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockProjects);
    expect(axiosInstance.get).toHaveBeenCalledWith("projects");
  });
});
