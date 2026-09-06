import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import SortableColumn from "../SortableColumn";
import { toast } from "react-hot-toast";

// ---------------------------------------------------------------------------
// Dnd-kit mocks
// ---------------------------------------------------------------------------
let mockSortableState = {
  attributes: {},
  listeners: {},
  setNodeRef: vi.fn(),
  transform: null,
  transition: null,
  isDragging: false,
};

let capturedSortableArgs: any = null;

vi.mock("@dnd-kit/sortable", () => ({
  useSortable: (args: any) => {
    capturedSortableArgs = args;
    return mockSortableState;
  },
  SortableContext: ({ children }: any) => (
    <div data-testid="sortable-context">{children}</div>
  ),
  verticalListSortingStrategy: {},
}));

vi.mock("@dnd-kit/utilities", () => ({
  CSS: {
    Transform: {
      toString: () => "",
    },
    Translate: {
      toString: () => "",
    },
  },
}));

vi.mock("../InlineEditField", () => ({
  default: ({ value, onSave, onCancel, initialIsEditing }: any) => {
    return (
      <input
        data-testid="inline-edit-input"
        defaultValue={value}
        autoFocus={initialIsEditing}
        onBlur={(e) => {
          onSave?.(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            onSave?.(e.currentTarget.value);
          } else if (e.key === "Escape") {
            onCancel?.();
          }
        }}
      />
    );
  },
}));

vi.mock("../TaskCard", () => ({
  default: ({ task }: any) => (
    <div data-testid={`task-card-${task.id}`}>{task.name || task.title}</div>
  ),
}));

// ---------------------------------------------------------------------------
// Hook & Store Mocks
// ---------------------------------------------------------------------------
const mockUpdateStatusMutate = vi.fn();
vi.mock("../../hooks/updateStatusHook", () => ({
  default: () => ({
    mutate: mockUpdateStatusMutate,
    isPending: false,
  }),
}));

const mockDeleteStatusMutate = vi.fn();
let mockIsDeletePending = false;

vi.mock("../../hooks/deleteStatusHook", () => ({
  default: () => ({
    mutate: mockDeleteStatusMutate,
    isPending: mockIsDeletePending,
  }),
}));

vi.mock("react-hot-toast", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockSetStatuses = vi.fn();
let mockStoreState: any = {};

vi.mock("../../store/useAppStore", () => ({
  useAppStore: () => mockStoreState,
}));

// ---------------------------------------------------------------------------
// Fixtures & Helpers
// ---------------------------------------------------------------------------
const defaultColumn = {
  id: "col-1",
  projectId: "proj-1",
  name: "To Do",
  position: 0,
  isDefault: true,
};

const customColumn = {
  id: "col-2",
  projectId: "proj-1",
  name: "Review",
  position: 1,
  isDefault: false,
};

const sampleTasks = [
  { id: "t1", statusId: "col-1", name: "Task One" },
  { id: "t2", statusId: "col-1", name: "Task Two" },
];

const renderColumn = (props: any = {}) => {
  return render(
    <SortableColumn
      column={defaultColumn}
      tasks={[]}
      isFilteredActive={false}
      {...props}
    />,
  );
};

beforeEach(() => {
  vi.clearAllMocks();
  mockIsDeletePending = false;
  capturedSortableArgs = null;
  mockSortableState = {
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  };
  mockStoreState = {
    activeTab: "col-1",
    activeProject: { id: "proj-1", name: "Project One" },
    statuses: [defaultColumn, customColumn],
    setStatuses: mockSetStatuses,
    userRole: "OWNER",
  };
});

// ---------------------------------------------------------------------------
// Test Suites
// ---------------------------------------------------------------------------
describe("SortableColumn — rendering", () => {
  it("renders a static (non-editable) name for default columns and hides the delete button", () => {
    const { container } = renderColumn({ column: defaultColumn });

    expect(screen.getByText("To Do")).toBeInTheDocument();
    expect(
      container.querySelector(".column-delete-btn"),
    ).not.toBeInTheDocument();
  });

  it("handles is_default snake_case property fallback", () => {
    const snakeCaseCol = {
      id: "col-snake",
      name: "Default Snake",
      is_default: true,
    } as any;
    renderColumn({ column: snakeCaseCol });
    expect(screen.getByText("Default Snake")).toBeInTheDocument();
    expect(
      document.querySelector(".column-delete-btn"),
    ).not.toBeInTheDocument();
  });

  it("renders an editable InlineEditField and a delete button for non-default columns", () => {
    const { container } = renderColumn({ column: customColumn });

    expect(screen.getByTestId("inline-edit-input")).toBeInTheDocument();
    expect(container.querySelector(".column-delete-btn")).toBeInTheDocument();
  });

  it("shows the correct task count", () => {
    renderColumn({ column: defaultColumn, tasks: sampleTasks });
    expect(screen.getByText("2")).toHaveClass("column-count");
  });

  it("renders a TaskCard for each task", () => {
    renderColumn({ column: defaultColumn, tasks: sampleTasks });

    expect(screen.getByTestId("task-card-t1")).toBeInTheDocument();
    expect(screen.getByTestId("task-card-t2")).toBeInTheDocument();
  });

  it("shows 'Drop a task here' when there are no tasks and no filters are active", () => {
    renderColumn({ tasks: [], isFilteredActive: false });
    expect(screen.getByText(/drop a task here/i)).toBeInTheDocument();
  });

  it("shows 'No matching tasks' when there are no tasks and filters are active", () => {
    renderColumn({ tasks: [], isFilteredActive: true });
    expect(screen.getByText(/no matching tasks/i)).toBeInTheDocument();
  });

  it("marks the column active when activeTab matches the column id", () => {
    const { container } = renderColumn({ column: defaultColumn });
    expect(container.firstChild).toHaveClass("column-active");
  });

  it("does not mark the column active when activeTab differs", () => {
    mockStoreState.activeTab = "different-id";
    const { container } = renderColumn({ column: defaultColumn });
    expect(container.firstChild).not.toHaveClass("column-active");
  });
});

describe("SortableColumn — status color mapping", () => {
  it("maps column name 'To Do' and 'to-do' to color key 'todo'", () => {
    const { container, rerender } = renderColumn({
      column: { ...defaultColumn, name: "To Do" },
    });
    expect(container.querySelector(".status-dot-todo")).toBeInTheDocument();

    rerender(
      <SortableColumn
        column={{ ...defaultColumn, name: "to-do" }}
        tasks={[]}
        isFilteredActive={false}
      />,
    );
    expect(container.querySelector(".status-dot-todo")).toBeInTheDocument();
  });

  it("maps column name 'In Progress' and 'in_progress' to color key 'in-progress'", () => {
    const { container, rerender } = renderColumn({
      column: { ...defaultColumn, name: "In Progress" },
    });
    expect(
      container.querySelector(".status-dot-in-progress"),
    ).toBeInTheDocument();

    rerender(
      <SortableColumn
        column={{ ...defaultColumn, name: "in_progress" }}
        tasks={[]}
        isFilteredActive={false}
      />,
    );
    expect(
      container.querySelector(".status-dot-in-progress"),
    ).toBeInTheDocument();
  });

  it("maps column name 'Done' to color key 'done'", () => {
    const { container } = renderColumn({
      column: { ...defaultColumn, name: "Done" },
    });
    expect(container.querySelector(".status-dot-done")).toBeInTheDocument();
  });

  it("maps column name 'Blocked' and empty name to color key 'custom'", () => {
    const { container, rerender } = renderColumn({
      column: { ...defaultColumn, name: "Blocked" },
    });
    expect(container.querySelector(".status-dot-custom")).toBeInTheDocument();

    rerender(
      <SortableColumn
        column={{ ...defaultColumn, name: "" }}
        tasks={[]}
        isFilteredActive={false}
      />,
    );
    expect(container.querySelector(".status-dot-custom")).toBeInTheDocument();
  });
});

describe("SortableColumn — rename & event propagation (Line 173)", () => {
  it("opens edit mode and stops propagation on title wrapper interaction events (Line 173)", () => {
    const { container } = renderColumn({ column: customColumn });
    const wrapper = container.querySelector(".column-title-inline-wrapper")!;

    fireEvent.pointerDown(wrapper);
    fireEvent.mouseDown(wrapper);
    fireEvent.touchStart(wrapper);
    fireEvent.click(wrapper);

    const input = screen.getByTestId("inline-edit-input");
    expect(input).toBeInTheDocument();
  });

  it("calls update mutation and handles statuses being null in store", async () => {
    mockStoreState.statuses = null;
    mockUpdateStatusMutate.mockImplementation((_payload, { onSuccess }) => {
      onSuccess();
    });

    renderColumn({ column: customColumn });
    const input = screen.getByTestId("inline-edit-input");

    fireEvent.change(input, { target: { value: "New Column Name" } });
    fireEvent.blur(input);

    expect(mockUpdateStatusMutate).toHaveBeenCalledWith(
      {
        status: {
          id: "col-2",
          name: "New Column Name",
        },
      },
      expect.any(Object),
    );
    expect(toast.success).toHaveBeenCalledWith(
      "Column renamed to New Column Name successfully!",
    );
  });

  it("updates local statuses in store and shows toast on rename success", async () => {
    mockUpdateStatusMutate.mockImplementation((_payload, { onSuccess }) => {
      onSuccess();
    });

    renderColumn({ column: customColumn });
    const input = screen.getByTestId("inline-edit-input");

    fireEvent.change(input, { target: { value: "Ready for Prod" } });
    fireEvent.blur(input);

    await waitFor(() => {
      expect(mockSetStatuses).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith(
        "Column renamed to Ready for Prod successfully!",
      );
    });
  });

  it("shows an error toast when rename fails with custom or fallback message", async () => {
    mockUpdateStatusMutate.mockImplementationOnce((_payload, { onError }) => {
      onError({ response: { data: { message: "Name collision" } } });
    });

    renderColumn({ column: customColumn });
    const input = screen.getByTestId("inline-edit-input");

    fireEvent.change(input, { target: { value: "Duplicate" } });
    fireEvent.blur(input);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Name collision");
    });

    mockUpdateStatusMutate.mockImplementationOnce((_payload, { onError }) => {
      onError({});
    });
    fireEvent.change(input, { target: { value: "Other Duplicate" } });
    fireEvent.blur(input);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to rename column");
    });
  });

  it("does not call mutation when name is blank or unchanged or on cancel", () => {
    renderColumn({ column: customColumn });
    const input = screen.getByTestId("inline-edit-input");

    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.blur(input);
    expect(mockUpdateStatusMutate).not.toHaveBeenCalled();

    fireEvent.change(input, { target: { value: "Review" } });
    fireEvent.blur(input);
    expect(mockUpdateStatusMutate).not.toHaveBeenCalled();

    fireEvent.keyDown(input, { key: "Escape" });
    expect(mockUpdateStatusMutate).not.toHaveBeenCalled();
  });
});

describe("SortableColumn — delete (Line 146 & event stop propagation)", () => {
  it("blocks deletion when tasks exist", async () => {
    const user = userEvent.setup();
    const { container } = renderColumn({
      column: customColumn,
      tasks: sampleTasks,
    });
    const deleteBtn = container.querySelector(
      ".column-delete-btn",
    ) as HTMLElement;

    await user.click(deleteBtn);
    expect(mockDeleteStatusMutate).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith(
      "Cannot delete a column that contains tasks.",
    );
  });

  it("stops propagation on delete button events", () => {
    const { container } = renderColumn({ column: customColumn, tasks: [] });
    const deleteBtn = container.querySelector(".column-delete-btn")!;

    fireEvent.pointerDown(deleteBtn);
    fireEvent.mouseDown(deleteBtn);
    fireEvent.touchStart(deleteBtn);
    fireEvent.click(deleteBtn);

    expect(mockDeleteStatusMutate).toHaveBeenCalledWith(
      "col-2",
      expect.any(Object),
    );
  });

  it("deletes successfully and updates store statuses or handles statuses being null", async () => {
    mockDeleteStatusMutate.mockImplementation((_id, { onSuccess }) => {
      onSuccess();
    });

    const { container } = renderColumn({ column: customColumn, tasks: [] });
    const deleteBtn = container.querySelector(
      ".column-delete-btn",
    ) as HTMLElement;
    fireEvent.click(deleteBtn);

    expect(mockSetStatuses).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith(
      'Column "Review" deleted successfully!',
    );

    mockStoreState.statuses = null;
    fireEvent.click(deleteBtn);
    expect(toast.success).toHaveBeenCalled();
  });

  it("hits line 146: handles delete error with fallback string when API message is absent", async () => {
    mockDeleteStatusMutate.mockImplementationOnce((_id, { onError }) => {
      onError({});
    });

    const { container } = renderColumn({ column: customColumn, tasks: [] });
    const deleteBtn = container.querySelector(
      ".column-delete-btn",
    ) as HTMLElement;
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to delete column");
    });
  });

  it("disables delete button and shows spinner while isPending is true", () => {
    mockIsDeletePending = true;
    const { container } = renderColumn({ column: customColumn, tasks: [] });
    const deleteBtn = container.querySelector(".column-delete-btn");

    expect(deleteBtn).toBeDisabled();
    expect(container.querySelector(".spin")).toBeInTheDocument();
  });
});

describe("SortableColumn — dnd-kit attributes & styles", () => {
  it("calls useSortable with namespaced column id", () => {
    renderColumn({ column: customColumn });
    expect(capturedSortableArgs.id).toBe("col-col-2");
  });

  it("applies dragging opacity style", () => {
    mockSortableState.isDragging = true;
    const { container } = renderColumn({ column: customColumn });
    expect(container.firstChild).toHaveStyle({ opacity: 0.35 });
  });

  it("handles empty activeProject fallback", () => {
    mockStoreState.activeProject = null;
    renderColumn({ column: customColumn, tasks: [] });
    expect(screen.getByTestId("inline-edit-input")).toHaveValue("Review");
  });
});
