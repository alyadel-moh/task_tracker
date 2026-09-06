import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import TaskOverlay from "../TaskOverlay";

describe("TaskOverlay", () => {
  it("renders task title and human-readable priority", () => {
    render(
      <TaskOverlay
        task={{ id: "t1", name: "Fix login", priority: "HIGH" } as never}
      />,
    );
    expect(screen.getByText("Fix login")).toBeInTheDocument();
    expect(screen.getByText("High")).toBeInTheDocument();
    expect(screen.getByText("High")).toHaveClass("badge-HIGH");
  });
});
