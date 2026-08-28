import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import CreateTaskModal from "../CreateTaskmodal";
import { axiosInstance } from "../../api-client";

vi.mock("../../api-client", () => ({
  axiosInstance: {
    post: vi.fn(),
  },
}));

describe("CreateTaskModal Component", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  const renderComponent = (props: { onClose: () => void; projectId: string }) =>
    render(
      <QueryClientProvider client={queryClient}>
        <CreateTaskModal onClose={props.onClose} projectId={props.projectId} />
      </QueryClientProvider>,
    );

  it("submits valid form data and triggers API request", async () => {
    const onClose = vi.fn();
    vi.mocked(axiosInstance.post).mockResolvedValueOnce({
      data: {
        task: { id: "t99", name: "New Task Title", status: "TODO" },
        status: "SUCCESS",
      },
    });

    renderComponent({ onClose, projectId: "p1" });

    const nameInput = document.querySelector(
      'input[name="name"]',
    ) as HTMLInputElement;

    await act(async () => {
      fireEvent.change(nameInput, { target: { value: "New Task Title" } });
    });

    const submitBtn = screen.getByRole("button", { name: /create task/i });

    await act(async () => {
      fireEvent.click(submitBtn);
    });

    await waitFor(() => {
      expect(axiosInstance.post).toHaveBeenCalledWith(
        "tasks/create/p1",
        expect.objectContaining({
          name: "New Task Title",
          status: "TODO",
          priority: "MEDIUM",
        }),
      );
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("closes modal on Escape key press", () => {
    const onClose = vi.fn();
    renderComponent({ onClose, projectId: "p1" });

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });
});
