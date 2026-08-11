import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import TaskHistoryDrawer from "../TaskHistoryDrawer";
import { axiosInstance } from "../../api-client";

vi.mock("../../api-client", () => ({
  axiosInstance: {
    get: vi.fn(),
  },
}));

describe("TaskHistoryDrawer", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem("token", "fake-token");
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  const renderComponent = (props: { isOpen: boolean; onClose: () => void; taskId: string }) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <TaskHistoryDrawer {...props} />
      </QueryClientProvider>
    );
  };

  it("fetches and renders audit history entries when drawer is open", async () => {
    const mockHistory = [
      {
        id: "h1",
        fieldChanged: "status",
        oldValue: "TODO",
        newValue: "IN_PROGRESS",
        createdAt: new Date().toISOString(),
      },
    ];

    vi.mocked(axiosInstance.get).mockResolvedValueOnce({ data: mockHistory });

    renderComponent({ isOpen: true, onClose: vi.fn(), taskId: "task-1" });

    await waitFor(() => {
      expect(screen.getByText(/status/i)).toBeInTheDocument();
    });
  });
});