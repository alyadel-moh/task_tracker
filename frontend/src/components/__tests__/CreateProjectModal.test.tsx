import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import CreateProjectModal from "../CreateProjectModal";
import { axiosInstance } from "../../api-client";

vi.mock("../../api-client", () => ({
  axiosInstance: {
    post: vi.fn(),
  },
}));

describe("CreateProjectModal Component", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  const renderComponent = (props: { isOpen: boolean; onClose: () => void }) =>
    render(
      <QueryClientProvider client={queryClient}>
        <CreateProjectModal {...props} />
      </QueryClientProvider>,
    );

  it("renders input fields and submits new project form", async () => {
    const onClose = vi.fn();
    vi.mocked(axiosInstance.post).mockResolvedValueOnce({
      data: {
        project: { id: "p10", name: "New Architecture" },
        status: "SUCCESS",
      },
    });

    renderComponent({ isOpen: true, onClose });

    const input =
      screen.getByRole("textbox", { name: /name/i }) ||
      document.querySelector('input[name="name"]');
    fireEvent.change(input!, { target: { value: "New Architecture" } });

    const submitBtn = screen.getByRole("button", { name: /create project/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(axiosInstance.post).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });
});
