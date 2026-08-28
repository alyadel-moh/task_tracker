import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import useGetUser from "../meHook"; // Adjust import path if needed
import { axiosInstance } from "../../api-client";

vi.mock("../../api-client", () => ({
  axiosInstance: {
    get: vi.fn(),
  },
}));

describe("useGetUser", () => {
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

  it("fetches user details successfully when token exists", async () => {
    localStorage.setItem("token", "fake-token");
    const mockUser = { id: "u1", name: "Aly", email: "aly@example.com" };
    vi.mocked(axiosInstance.get).mockResolvedValueOnce({ data: mockUser });

    const { result } = renderHook(() => useGetUser(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockUser);
    expect(axiosInstance.get).toHaveBeenCalledWith("auth/me");
  });

  it("does not run query when token is missing", () => {
    const { result } = renderHook(() => useGetUser(), { wrapper });

    expect(result.current.isFetching).toBe(false);
    expect(axiosInstance.get).not.toHaveBeenCalled();
  });
});
