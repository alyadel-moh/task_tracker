import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import useCreateProject from "../createProjectHook";
import { axiosInstance } from "../../api-client";

vi.mock("../../api-client", () => ({
  axiosInstance: {
    post: vi.fn(),
  },
}));

describe("useCreateProject", () => {
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

  it("creates a new project and updates project list cache", async () => {
    queryClient.setQueryData(["projects"], [{ id: "p1", name: "Existing" }]);

    const mockResponse = {
      project: { id: "p2", name: "New Project" },
      status: "SUCCESS",
      message: "Created",
    };

    vi.mocked(axiosInstance.post).mockResolvedValueOnce({ data: mockResponse });

    const { result } = renderHook(() => useCreateProject(), { wrapper });

    result.current.mutate({ name: "New Project" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const updatedProjects = queryClient.getQueryData<any[]>(["projects"]);
    expect(updatedProjects).toHaveLength(2);
    expect(updatedProjects?.[1].name).toBe("New Project");
  });
});