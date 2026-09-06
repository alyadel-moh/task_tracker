import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import CreateProjectModal from "../CreateProjectModal";

let mockIsPending = false;
const mutate = vi.fn();

vi.mock("../../hooks/createProjectHook", () => ({
  default: vi.fn(() => ({
    mutate,
    get isPending() {
      return mockIsPending;
    },
  })),
}));

vi.mock("react-hot-toast", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe("CreateProjectModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsPending = false;
  });

  it("validates empty name, triggers onInvalid toast, and displays validation message", async () => {
    const { toast } = await import("react-hot-toast");
    const onClose = vi.fn();
    render(<CreateProjectModal onClose={onClose} />);

    fireEvent.click(screen.getByRole("button", { name: "Create project" }));

    expect(
      await screen.findByText("Project name is required"),
    ).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith("Please enter a project name.");
    expect(mutate).not.toHaveBeenCalled();
  });

  it("submits trimmed name and empty description fallback, invoking fallback success message", async () => {
    const { toast } = await import("react-hot-toast");
    const onClose = vi.fn();

    mutate.mockImplementation((_payload, { onSuccess }) => {
      // Omit message to test fallback line 28
      onSuccess({});
    });

    render(<CreateProjectModal onClose={onClose} />);

    fireEvent.change(screen.getByPlaceholderText("e.g. Website redesign"), {
      target: { value: "  Website Redesign  " },
    });

    fireEvent.click(screen.getByRole("button", { name: "Create project" }));

    await waitFor(() =>
      expect(mutate).toHaveBeenCalledWith(
        { name: "Website Redesign", description: "" },
        expect.anything(),
      ),
    );

    expect(toast.success).toHaveBeenCalledWith("Project created successfully!");
    expect(onClose).toHaveBeenCalled();
  });

  it("handles submission with custom description and specific success message", async () => {
    const { toast } = await import("react-hot-toast");
    const onClose = vi.fn();

    mutate.mockImplementation((_payload, { onSuccess }) => {
      onSuccess({ message: "Custom success message" });
    });

    render(<CreateProjectModal onClose={onClose} />);

    fireEvent.change(screen.getByPlaceholderText("e.g. Website redesign"), {
      target: { value: "New App" },
    });
    fireEvent.change(
      screen.getByPlaceholderText("What is this project about?"),
      { target: { value: "Mobile application tracking" } },
    );

    fireEvent.click(screen.getByRole("button", { name: "Create project" }));

    await waitFor(() =>
      expect(mutate).toHaveBeenCalledWith(
        { name: "New App", description: "Mobile application tracking" },
        expect.anything(),
      ),
    );

    expect(toast.success).toHaveBeenCalledWith("Custom success message");
    expect(onClose).toHaveBeenCalled();
  });

  it("handles error callbacks with both response message and fallback error", async () => {
    const { toast } = await import("react-hot-toast");
    const onClose = vi.fn();

    // 1. Error with response message
    mutate.mockImplementationOnce((_payload, { onError }) => {
      onError({
        response: { data: { message: "Project name already exists" } },
      });
    });

    const { rerender } = render(<CreateProjectModal onClose={onClose} />);

    fireEvent.change(screen.getByPlaceholderText("e.g. Website redesign"), {
      target: { value: "Duplicate Project" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create project" }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Project name already exists"),
    );

    // 2. Error without response message (fallback line 29)
    mutate.mockImplementationOnce((_payload, { onError }) => {
      onError({});
    });

    rerender(<CreateProjectModal onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: "Create project" }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Failed to create project. Please try again.",
      ),
    );
  });

  it("renders pending loading state on the button", () => {
    mockIsPending = true;
    render(<CreateProjectModal onClose={vi.fn()} />);

    expect(screen.getByText("Creating...")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /creating\.\.\./i }),
    ).toBeDisabled();
  });

  it("closes on close button, Escape key, and backdrop click", () => {
    const onClose = vi.fn();
    render(<CreateProjectModal onClose={onClose} />);

    // Close button
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);

    // Escape key
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(2);

    // Non-escape key should do nothing
    fireEvent.keyDown(document, { key: "Enter" });
    expect(onClose).toHaveBeenCalledTimes(2);

    // Backdrop click
    fireEvent.click(screen.getByRole("dialog").parentElement as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(3);

    // Clicking inside the modal card does not trigger backdrop close
    fireEvent.click(screen.getByRole("dialog"));
    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it("removes the keydown listener on unmount", () => {
    const removeSpy = vi.spyOn(document, "removeEventListener");
    const onClose = vi.fn();
    const { unmount } = render(<CreateProjectModal onClose={onClose} />);

    unmount();

    expect(removeSpy).toHaveBeenCalledWith("keydown", expect.any(Function));

    // Escape after unmount should no longer call onClose
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();

    removeSpy.mockRestore();
  });
});
