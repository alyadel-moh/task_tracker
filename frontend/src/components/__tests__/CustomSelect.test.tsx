import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import React from "react";
import { CustomSelect } from "../CustomSelect";

describe("CustomSelect 100% Branch Coverage", () => {
  it("opens, selects an option, and closes on outside click", () => {
    const onChange = vi.fn();
    render(
      <>
        <CustomSelect
          options={[
            { id: "todo", name: "Todo" },
            { id: "done", name: "Done" },
          ]}
          value="todo"
          onChange={onChange}
        />
        <div data-testid="outside" />
      </>,
    );

    expect(screen.getByText("Todo")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText("Done")).toBeInTheDocument();

    // Selects option and closes menu
    fireEvent.click(screen.getByText("Done"));
    expect(onChange).toHaveBeenCalledWith("done");
    expect(screen.queryByText("Done")).not.toBeInTheDocument();

    // Reopen and close via outside click
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText("Done")).toBeInTheDocument();
    fireEvent.mouseDown(screen.getByTestId("outside"));
    expect(screen.queryByText("Done")).not.toBeInTheDocument();
  });

  it("does not close on mousedown inside the container (Line 34)", () => {
    const { container } = render(
      <CustomSelect
        options={[
          { id: "1", name: "Option 1" },
          { id: "2", name: "Option 2" },
        ]}
        value="1"
        onChange={vi.fn()}
      />,
    );

    // Open dropdown
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText("Option 2")).toBeInTheDocument();

    // Mousedown inside the container (triggering contains === true branch)
    const selectContainer = container.querySelector(
      ".custom-select-container",
    )!;
    fireEvent.mouseDown(selectContainer);

    // Dropdown should still remain open
    expect(screen.getByText("Option 2")).toBeInTheDocument();
  });

  it("renders custom icon and placeholder fallback (Line 55)", () => {
    render(
      <CustomSelect
        options={[{ id: "opt-1", name: "Choice 1" }]}
        value=""
        onChange={vi.fn()}
        icon={<span data-testid="custom-icon">★</span>}
      />,
    );

    // Line 55: Icon rendered
    expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
    // Default placeholder fallback
    expect(screen.getByText("Select an option")).toBeInTheDocument();
  });

  it("shows explicit placeholder and error state class", () => {
    render(
      <CustomSelect
        options={[]}
        value=""
        onChange={vi.fn()}
        error
        placeholder="Choose"
      />,
    );

    expect(screen.getByText("Choose")).toBeInTheDocument();
    expect(screen.getByRole("button")).toHaveClass("input-error");
  });
});
