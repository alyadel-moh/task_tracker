import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import useLogin from "../loginHook"; // Adjust import path
import { axiosInstance } from "../../api-client";

vi.mock("../../api-client", () => ({
  axiosInstance: {
    post: vi.fn(),
  },
}));

describe("useLogin", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    queryClient = new QueryClient();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("logs in user and saves token to localStorage", async () => {
    const mockResponse = { status: "SUCCESS", message: "Logged in", token: "jwt-token-123" };
    vi.mocked(axiosInstance.post).mockResolvedValueOnce({ data: mockResponse });

    const { result } = renderHook(() => useLogin(), { wrapper });

    result.current.mutate({ email: "aly@example.com", password: "password123" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(localStorage.getItem("token")).toBe("jwt-token-123");
  });
});