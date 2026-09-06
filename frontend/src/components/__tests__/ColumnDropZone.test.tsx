import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ColumnDropZone from "../ColumnDropZone";

vi.mock("@dnd-kit/core", () => ({ useDroppable: vi.fn() }));
import { useDroppable } from "@dnd-kit/core";

describe("ColumnDropZone", () => {
  it("applies status styling and drag-over state", () => {
    vi.mocked(useDroppable).mockReturnValue({
      isOver: true,
      setNodeRef: vi.fn(),
      active: null,
      rect: null,
      node: { current: null },
    } as never);
    render(
      <ColumnDropZone status="done" statusColorKey="done">
        <span>Tasks</span>
      </ColumnDropZone>,
    );
    expect(screen.getByText("Tasks").parentElement).toHaveClass(
      "column-drop-zone-done",
      "column-drop-zone-over",
    );
  });
});
