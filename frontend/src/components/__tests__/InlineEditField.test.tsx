import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import InlineEditField from "../InlineEditField";

describe("InlineEditField", () => {
  it("edits and saves text, or cancels with the original value", () => {
    const onSave = vi.fn();
    const onCancel = vi.fn();
    render(<InlineEditField value="Old" onSave={onSave} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole("button"));
    const input = screen.getByDisplayValue("Old");
    fireEvent.change(input, { target: { value: "New" } });
    fireEvent.mouseDown(
      document.querySelector("button.inline-field-save") as HTMLElement,
    );
    expect(onSave).toHaveBeenCalledWith("New");
    fireEvent.click(screen.getByRole("button"));
    fireEvent.mouseDown(
      document.querySelector("button.inline-field-cancel") as HTMLElement,
    );
    expect(onCancel).toHaveBeenCalled();
  });

  it("supports select values and locked empty display", () => {
    const onSave = vi.fn();
    const { rerender } = render(
      <InlineEditField
        value="todo"
        type="select"
        options={[
          { value: "todo", label: "Todo" },
          { value: "done", label: "Done" },
        ]}
        initialIsEditing
        onSave={onSave}
      />,
    );
    fireEvent.click(screen.getByText("Todo").closest("button") as HTMLElement);
    fireEvent.click(screen.getByText("Done"));
    fireEvent.mouseDown(
      document.querySelector("button.inline-field-save") as HTMLElement,
    );
    expect(onSave).toHaveBeenCalledWith("done");
    rerender(<InlineEditField value="" onSave={onSave} readOnly />);
    expect(screen.getByText("No description provided")).toBeInTheDocument();
  });
});
