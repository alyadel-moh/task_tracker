import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AddColumnInline from "../AddColumnInline";
import { useAppStore } from "../../store/useAppStore";
import { toast } from "react-hot-toast";

const mutate = vi.fn();
const createStatusHook = vi.fn(() => ({ mutate }));
vi.mock("../../hooks/createStatusHook", () => ({
  default: (...args: any[]) => createStatusHook(...args),
}));
vi.mock("react-hot-toast", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe("AddColumnInline", () => {
  beforeEach(() => {
    mutate.mockClear();
    createStatusHook.mockClear();
    useAppStore.setState({ activeProject: undefined as never });
  });

  it("opens the editor, trims the name, and invokes success callback", () => {
    useAppStore.setState({ activeProject: { id: "p1" } as never });
    const onSuccess = vi.fn();
    render(<AddColumnInline onSuccess={onSuccess} />);
    fireEvent.click(screen.getByRole("button", { name: /Add column/ }));
    const input = screen.getByPlaceholderText("Column name...");
    fireEvent.change(input, { target: { value: "  Review  " } });
    fireEvent.mouseDown(
      document.querySelector("button.inline-field-save") as HTMLElement,
    );
    expect(mutate).toHaveBeenCalledWith({ name: "Review" }, expect.anything());
    mutate.mock.calls.at(-1)?.[1].onSuccess({ message: "Created" });
    expect(onSuccess).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith("Created");
  });

  it("falls back to an empty project id when there is no active project", () => {
    render(<AddColumnInline />);
    expect(createStatusHook).toHaveBeenCalledWith("");
  });

  it("shows a default success message when the response has no message", () => {
    useAppStore.setState({ activeProject: { id: "p1" } as never });
    render(<AddColumnInline />);
    fireEvent.click(screen.getByRole("button", { name: /Add column/ }));
    fireEvent.change(screen.getByPlaceholderText("Column name..."), {
      target: { value: "Review" },
    });
    fireEvent.mouseDown(
      document.querySelector("button.inline-field-save") as HTMLElement,
    );
    mutate.mock.calls.at(-1)?.[1].onSuccess({});
    expect(toast.success).toHaveBeenCalledWith("Column added successfully!");
  });

  it("does not create an empty column", () => {
    render(<AddColumnInline />);
    fireEvent.click(screen.getByRole("button", { name: /Add column/ }));
    fireEvent.mouseDown(
      document.querySelector("button.inline-field-save") as HTMLElement,
    );
    expect(mutate).not.toHaveBeenCalled();
    expect(
      screen.queryByPlaceholderText("Column name..."),
    ).not.toBeInTheDocument();
  });

  it("shows the server error message on failure", () => {
    useAppStore.setState({ activeProject: { id: "p1" } as never });
    render(<AddColumnInline />);
    fireEvent.click(screen.getByRole("button", { name: /Add column/ }));
    fireEvent.change(screen.getByPlaceholderText("Column name..."), {
      target: { value: "Review" },
    });
    fireEvent.mouseDown(
      document.querySelector("button.inline-field-save") as HTMLElement,
    );
    mutate.mock.calls.at(-1)?.[1].onError({
      response: { data: { message: "Name already exists" } },
    });
    expect(toast.error).toHaveBeenCalledWith("Name already exists");
  });

  it("falls back to a default error message when none is provided", () => {
    useAppStore.setState({ activeProject: { id: "p1" } as never });
    render(<AddColumnInline />);
    fireEvent.click(screen.getByRole("button", { name: /Add column/ }));
    fireEvent.change(screen.getByPlaceholderText("Column name..."), {
      target: { value: "Review" },
    });
    fireEvent.mouseDown(
      document.querySelector("button.inline-field-save") as HTMLElement,
    );
    mutate.mock.calls.at(-1)?.[1].onError({});
    expect(toast.error).toHaveBeenCalledWith("Failed to create column");
  });

  it("closes the editor without creating a column on cancel", () => {
    useAppStore.setState({ activeProject: { id: "p1" } as never });
    render(<AddColumnInline />);
    fireEvent.click(screen.getByRole("button", { name: /Add column/ }));
    expect(screen.getByPlaceholderText("Column name...")).toBeInTheDocument();
    fireEvent.mouseDown(
      document.querySelector("button.inline-field-cancel") as HTMLElement,
    );
    expect(mutate).not.toHaveBeenCalled();
    expect(
      screen.queryByPlaceholderText("Column name..."),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Add column/ }),
    ).toBeInTheDocument();
  });
});
