import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import useRegister from "../registerHook"; // Adjust import path
import { axiosInstance } from "../../api-client";

vi.mock("../../api-client", () => ({
  axiosInstance: {
    post: vi.fn(),
  },
}));

describe("useRegister", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("registers user successfully", async () => {
    const mockResponse = { status: "SUCCESS", message: "Registered" };
    vi.mocked(axiosInstance.post).mockResolvedValueOnce({ data: mockResponse });

    const { result } = renderHook(() => useRegister(), { wrapper });

    const newUserData = { name: "Aly", email: "aly@example.com", password: "password123" };
    result.current.mutate(newUserData);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockResponse);
    expect(axiosInstance.post).toHaveBeenCalledWith("auth/register", newUserData);
  });
});