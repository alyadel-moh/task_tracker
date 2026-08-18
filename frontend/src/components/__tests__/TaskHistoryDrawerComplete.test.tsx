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

const mockHistory = [
  {
    id: "h1",
    fieldChanged: "status",
    oldValue: "TODO",
    newValue: "IN_PROGRESS",
    createdAt: "2026-08-11T12:00:00.000Z",
  },
];

describe("TaskHistoryDrawer Complete Coverage", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem("token", "fake-token");
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  it("fetches and displays activity logs when drawer is open", async () => {
    vi.mocked(axiosInstance.get).mockResolvedValueOnce({ data: mockHistory });

    render(
      <QueryClientProvider client={queryClient}>
        <TaskHistoryDrawer isOpen={true} onClose={vi.fn()} taskId="t1" />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(axiosInstance.get).toHaveBeenCalledWith("task_history/t1");
      expect(screen.getByText(/status/i)).toBeInTheDocument();
    });
  });

  it("handles drawer close trigger", () => {
    const onClose = vi.fn();
    render(
      <QueryClientProvider client={queryClient}>
        <TaskHistoryDrawer isOpen={true} onClose={onClose} taskId="t1" />
      </QueryClientProvider>,
    );

    const closeBtn = screen.getByRole("button", { name: /close/i });
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });
});
