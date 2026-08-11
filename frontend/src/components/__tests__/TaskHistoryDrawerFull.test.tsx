import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import TaskHistoryDrawer from "../TaskHistoryDrawer";
import { axiosInstance } from "../../api-client";

vi.mock("../../api-client", () => ({
  axiosInstance: {
    get: vi.fn(),
  },
}));

describe("TaskHistoryDrawer Full Coverage", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem("token", "fake-token");
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  it("handles drawer close button and renders empty state gracefully", async () => {
    const onClose = vi.fn();
    vi.mocked(axiosInstance.get).mockResolvedValueOnce({ data: [] });

    render(
      <QueryClientProvider client={queryClient}>
        <TaskHistoryDrawer isOpen={true} onClose={onClose} taskId="t1" />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(axiosInstance.get).toHaveBeenCalledWith("task_history/t1");
    });

    const closeBtn = screen.getByRole("button", { name: /close/i });
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });
});
