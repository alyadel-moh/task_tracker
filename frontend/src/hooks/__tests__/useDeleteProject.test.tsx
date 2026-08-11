import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import useDeleteProject from "../deleteProjectHook";
import { axiosInstance } from "../../api-client";

vi.mock("../../api-client", () => ({
  axiosInstance: {
    delete: vi.fn(),
  },
}));

describe("useDeleteProject", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("deletes a project and removes it from projects cache", async () => {
    queryClient.setQueryData(["projects"], [
      { id: "p1", name: "Project One" },
      { id: "p2", name: "Project Two" },
    ]);

    const mockResponse = { status: "SUCCESS", message: "Deleted" };
    vi.mocked(axiosInstance.delete).mockResolvedValueOnce({ data: mockResponse });

    const { result } = renderHook(() => useDeleteProject(), { wrapper });

    result.current.mutate("p1");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const updatedProjects = queryClient.getQueryData<any[]>(["projects"]);
    expect(updatedProjects).toHaveLength(1);
    expect(updatedProjects?.[0].id).toBe("p2");
  });
});