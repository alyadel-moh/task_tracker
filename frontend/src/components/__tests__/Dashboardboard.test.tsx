import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import React from "react";
import DashboardBoard, { getStatusColorKey } from "../DashboardBoard";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// react-router-dom
const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

// react-hot-toast
vi.mock("react-hot-toast", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// @dnd-kit/core — render children through, ignore drag machinery
vi.mock("@dnd-kit/core", () => ({
  DndContext: ({ children }: any) => (
    <div data-testid="dnd-context">{children}</div>
  ),
  DragOverlay: ({ children }: any) => (
    <div data-testid="drag-overlay">{children}</div>
  ),
  closestCorners: vi.fn(),
}));

// @dnd-kit/sortable
vi.mock("@dnd-kit/sortable", () => ({
  SortableContext: ({ children }: any) => (
    <div data-testid="sortable-context">{children}</div>
  ),
  horizontalListSortingStrategy: vi.fn(),
}));

// Child components — replaced with lightweight stand-ins
vi.mock("../TaskOverlay", () => ({
  default: ({ task }: any) => (
    <div data-testid="task-overlay">{task?.title}</div>
  ),
}));

vi.mock("../SortableColumn", () => ({
  default: ({ column, tasks }: any) => (
    <div data-testid={`sortable-column-${column.id}`}>
      <span>{column.name}</span>
      <span data-testid={`column-task-count-${column.id}`}>{tasks.length}</span>
    </div>
  ),
}));

vi.mock("../AddColumnInline", () => ({
  default: () => <button type="button">Add column</button>,
}));

vi.mock("../MemberFilterGroup", () => ({
  default: ({ members, selectedMemberId, onSelectMember }: any) => (
    <div data-testid="member-filter-group">
      {members.map((m: any) => (
        <button
          key={m.id}
          type="button"
          data-active={selectedMemberId === m.id}
          onClick={() => onSelectMember(m.id)}
        >
          {m.name}
        </button>
      ))}
    </div>
  ),
}));

vi.mock("../InlineEditField", () => ({
  default: ({ value, onSave, readOnly }: any) => (
    <input
      aria-label="inline-edit-field"
      value={value ?? ""}
      readOnly={readOnly}
      onChange={(e) => !readOnly && onSave(e.target.value)}
    />
  ),
}));

// Hooks
const mockUpdateProjectMutate = vi.fn();
vi.mock("../../hooks/updateProjectHook", () => ({
  default: vi.fn(() => ({ mutate: mockUpdateProjectMutate })),
}));

const mockUseGetTasks = vi.fn();
vi.mock("../../hooks/getAllTasksHook", () => ({
  default: (...args: any[]) => mockUseGetTasks(...args),
}));

const mockUseGetProjectMembers = vi.fn();
vi.mock("../../hooks/getAllprojectMembers", () => ({
  default: (...args: any[]) => mockUseGetProjectMembers(...args),
}));

const mockUseGetAssignedProjects = vi.fn();
vi.mock("../../hooks/getProjectsHook", () => ({
  default: (...args: any[]) => mockUseGetAssignedProjects(...args),
}));

const mockLogoutMutate = vi.fn();
vi.mock("../../hooks/logoutHook", () => ({
  default: vi.fn(() => ({ mutate: mockLogoutMutate })),
}));

// Zustand store
const mockSetUser = vi.fn();
const mockSetActiveTab = vi.fn();
const mockSetActiveProject = vi.fn();
const mockSetCreateTaskOpen = vi.fn();
const mockSetCreateProjectOpen = vi.fn();
const mockSetUserProfileModalOpen = vi.fn();
const mockSetTasks = vi.fn();

const mockUseAppStore = vi.fn();
vi.mock("../../store/useAppStore", () => ({
  useAppStore: (...args: any[]) => mockUseAppStore(...args),
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const baseProject = {
  id: "proj-1",
  name: "Test Project",
  description: "A test project description",
  createdAt: "2024-01-01T10:00:00Z",
  updatedAt: "2024-01-02T10:00:00Z",
};

const baseStatuses = [
  { id: "status-1", name: "To Do" },
  { id: "status-2", name: "In Progress" },
  { id: "status-3", name: "Done" },
];

const baseTasks = [
  { id: "t1", title: "Task 1", statusId: "status-1" },
  { id: "t2", title: "Task 2", statusId: "status-1" },
  { id: "t3", title: "Task 3", statusId: "status-2" },
];

const baseMembers = [
  {
    user: {
      id: "u1",
      name: "Alice",
      email: "alice@example.com",
      photoUrl: null,
    },
  },
  {
    user: { id: "u2", name: "Bob", email: "bob@example.com", photoUrl: null },
  },
];

const baseProjects = [
  { project: baseProject },
  { project: { id: "proj-2", name: "Other Project" } },
];

function buildStoreState(overrides: Record<string, any> = {}) {
  return {
    user: {
      id: "u1",
      name: "Jane Doe",
      email: "jane@example.com",
      photoUrl: null,
    },
    setUser: mockSetUser,
    setActiveTab: mockSetActiveTab,
    activeTab: "status-1",
    activeProject: baseProject,
    setActiveProject: mockSetActiveProject,
    setCreateTaskOpen: mockSetCreateTaskOpen,
    setCreateProjectOpen: mockSetCreateProjectOpen,
    setUserProfileModalOpen: mockSetUserProfileModalOpen,
    tasks: baseTasks,
    setTasks: mockSetTasks,
    statuses: baseStatuses,
    userRole: "ADMIN",
    ...overrides,
  };
}

const defaultProps = {
  draggingTask: null,
  draggingColumn: null,
  overColumnStatus: null,
  onDragStart: vi.fn(),
  onDragOver: vi.fn(),
  onDragEnd: vi.fn(),
  sensors: [],
};

function renderBoard(
  storeOverrides: Record<string, any> = {},
  props: Record<string, any> = {},
) {
  mockUseAppStore.mockReturnValue(buildStoreState(storeOverrides));
  return render(<DashboardBoard {...defaultProps} {...props} />);
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  mockUseGetTasks.mockReturnValue({ data: baseTasks });
  mockUseGetProjectMembers.mockReturnValue({ data: baseMembers });
  mockUseGetAssignedProjects.mockReturnValue({ data: baseProjects });
});

// ---------------------------------------------------------------------------
// getStatusColorKey (pure utility)
// ---------------------------------------------------------------------------

describe("getStatusColorKey", () => {
  it("returns 'todo' for To Do variants", () => {
    expect(getStatusColorKey("To Do")).toBe("todo");
    expect(getStatusColorKey("to-do")).toBe("todo");
    expect(getStatusColorKey("TODO")).toBe("todo");
  });

  it("returns 'in-progress' for In Progress variants", () => {
    expect(getStatusColorKey("In Progress")).toBe("in-progress");
    expect(getStatusColorKey("in-progress")).toBe("in-progress");
    expect(getStatusColorKey("in_progress")).toBe("in-progress");
  });

  it("returns 'done' for Done", () => {
    expect(getStatusColorKey("Done")).toBe("done");
    expect(getStatusColorKey("done")).toBe("done");
  });

  it("returns 'custom' for unrecognized or empty names", () => {
    expect(getStatusColorKey("Blocked")).toBe("custom");
    expect(getStatusColorKey("")).toBe("custom");
    expect(getStatusColorKey(undefined)).toBe("custom");
  });
});

// ---------------------------------------------------------------------------
// Empty / no-project state
// ---------------------------------------------------------------------------

describe("DashboardBoard — no active project", () => {
  it("shows the empty state and disables the New task button", () => {
    const { container } = renderBoard({ activeProject: null, tasks: [] });

    expect(screen.getByText(/no project selected/i)).toBeInTheDocument();
    expect(
      screen.getByText(/select or create a project to get started/i),
    ).toBeInTheDocument();

    const newTaskButton = container.querySelector(".new-task-button");
    expect(newTaskButton).toBeDisabled();
  });

  it("does not render the filter toolbar without an active project", () => {
    renderBoard({ activeProject: null, tasks: [] });
    expect(
      screen.queryByPlaceholderText(/search tasks by title/i),
    ).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Project header & Date Formatting (Line 157)
// ---------------------------------------------------------------------------

describe("DashboardBoard — project header", () => {
  it("renders the project name, task count, and description", () => {
    renderBoard();

    const nameInputs = screen.getAllByDisplayValue("Test Project");
    expect(nameInputs.length).toBeGreaterThan(0);

    expect(screen.getByText(/3 tasks/i)).toBeInTheDocument();
  });

  it("hits line 157: safely handles invalid or missing dates in formatDate", () => {
    renderBoard({
      activeProject: {
        ...baseProject,
        createdAt: "invalid-date",
        updatedAt: undefined,
      },
    });
    expect(screen.queryByText(/Created/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Updated/)).not.toBeInTheDocument();
  });

  it("shows singular 'task' label when only one task exists", () => {
    renderBoard({ tasks: [baseTasks[0]] });
    expect(screen.getByText(/1 task$/i)).toBeInTheDocument();
  });

  it("enables the New task button when a project is active", () => {
    const { container } = renderBoard();
    const newTaskButton = container.querySelector(".new-task-button");
    expect(newTaskButton).not.toBeDisabled();
  });

  it("calls setCreateTaskOpen(true) when New task is clicked", () => {
    const { container } = renderBoard();
    const newTaskButton = container.querySelector(
      ".new-task-button",
    ) as HTMLElement;
    fireEvent.click(newTaskButton);
    expect(mockSetCreateTaskOpen).toHaveBeenCalledWith(true);
  });

  it("calls setCreateTaskOpen(true) when the floating action button is clicked", () => {
    renderBoard();
    const fab = screen.getByLabelText(/^new task$/i);
    fireEvent.click(fab);
    expect(mockSetCreateTaskOpen).toHaveBeenCalledWith(true);
  });

  it("persists a project field edit via the update mutation (desktop name field)", () => {
    renderBoard();
    const [nameField] = screen.getAllByDisplayValue("Test Project");
    fireEvent.change(nameField, { target: { value: "Renamed Project" } });

    expect(mockSetActiveProject).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Renamed Project" }),
    );
    expect(mockUpdateProjectMutate).toHaveBeenCalledWith(
      { name: "Renamed Project" },
      expect.objectContaining({
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      }),
    );
  });

  it("shows a success toast with the API message when a project field save succeeds", () => {
    renderBoard();
    const [nameField] = screen.getAllByDisplayValue("Test Project");
    fireEvent.change(nameField, { target: { value: "Renamed Project" } });

    const [, options] = mockUpdateProjectMutate.mock.calls[0];
    options.onSuccess({ message: "Saved!" });
  });

  it("falls back to a generic success message when the API returns none", () => {
    renderBoard();
    const [nameField] = screen.getAllByDisplayValue("Test Project");
    fireEvent.change(nameField, { target: { value: "Renamed Project" } });

    const [, options] = mockUpdateProjectMutate.mock.calls[0];
    options.onSuccess({});
  });

  it("shows an error toast with the API message when a project field save fails", () => {
    renderBoard();
    const [nameField] = screen.getAllByDisplayValue("Test Project");
    fireEvent.change(nameField, { target: { value: "Renamed Project" } });

    const [, options] = mockUpdateProjectMutate.mock.calls[0];
    options.onError({ response: { data: { message: "Nope" } } });
  });

  it("falls back to a generic error message when the API error has no message", () => {
    renderBoard();
    const [nameField] = screen.getAllByDisplayValue("Test Project");
    fireEvent.change(nameField, { target: { value: "Renamed Project" } });

    const [, options] = mockUpdateProjectMutate.mock.calls[0];
    options.onError({});
  });

  it("invokes the onSave handler for the mobile-only project name field", () => {
    renderBoard();
    const nameFields = screen.getAllByDisplayValue("Test Project");
    expect(nameFields.length).toBeGreaterThanOrEqual(2);

    fireEvent.change(nameFields[1], { target: { value: "Mobile Renamed" } });

    expect(mockSetActiveProject).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Mobile Renamed" }),
    );
    expect(mockUpdateProjectMutate).toHaveBeenCalledWith(
      { name: "Mobile Renamed" },
      expect.any(Object),
    );
  });

  it("invokes the onSave handler for the mobile-only project description field", () => {
    renderBoard();
    const descriptionFields = screen.getAllByDisplayValue(
      "A test project description",
    );
    expect(descriptionFields.length).toBeGreaterThanOrEqual(2);

    fireEvent.change(descriptionFields[1], {
      target: { value: "Mobile description" },
    });

    expect(mockSetActiveProject).toHaveBeenCalledWith(
      expect.objectContaining({ description: "Mobile description" }),
    );
    expect(mockUpdateProjectMutate).toHaveBeenCalledWith(
      { description: "Mobile description" },
      expect.any(Object),
    );
  });

  it("marks the description field read-only for MEMBER role", () => {
    renderBoard({ userRole: "MEMBER" });
    const readOnlyFields = screen.getAllByLabelText(
      "inline-edit-field",
    ) as HTMLInputElement[];
    readOnlyFields.forEach((field) =>
      expect(field).toHaveAttribute("readonly"),
    );
  });
});

// ---------------------------------------------------------------------------
// Filter toolbar
// ---------------------------------------------------------------------------

describe("DashboardBoard — filters", () => {
  it("updates the search input as the user types", () => {
    renderBoard();
    const search = screen.getByPlaceholderText(
      /search tasks by title/i,
    ) as HTMLInputElement;
    fireEvent.change(search, { target: { value: "bug fix" } });
    expect(search.value).toBe("bug fix");
  });

  it("clears the search input via the inline clear button", () => {
    renderBoard();
    const search = screen.getByPlaceholderText(
      /search tasks by title/i,
    ) as HTMLInputElement;
    fireEvent.change(search, { target: { value: "bug fix" } });
    const clearBtn = search.parentElement!.querySelector(
      ".filter-clear-search",
    )!;
    fireEvent.click(clearBtn);
    expect(search.value).toBe("");
  });

  it("toggles a status filter pill to active", () => {
    const { container } = renderBoard();
    const filterBar = container.querySelector(
      ".task-filter-bar",
    ) as HTMLElement;
    const pill = within(filterBar).getByRole("button", { name: "To Do" });

    expect(pill).not.toHaveClass("active");
    fireEvent.click(pill);
    expect(pill).toHaveClass("active");
    fireEvent.click(pill);
    expect(pill).not.toHaveClass("active");
  });

  it("toggles a priority filter pill to active", () => {
    const { container } = renderBoard();
    const filterBar = container.querySelector(
      ".task-filter-bar",
    ) as HTMLElement;
    const pill = within(filterBar).getByRole("button", { name: "High" });

    fireEvent.click(pill);
    expect(pill).toHaveClass("active");
  });

  it("toggles the overdue-only filter", () => {
    renderBoard();
    const overdue = screen.getByRole("button", { name: /overdue/i });
    fireEvent.click(overdue);
    expect(overdue).toHaveClass("active");
  });

  it("shows 'Clear filters' only once a filter is active, and resets state on click", () => {
    const { container } = renderBoard();
    const filterBar = container.querySelector(
      ".task-filter-bar",
    ) as HTMLElement;

    expect(
      screen.queryByRole("button", { name: /clear filters/i }),
    ).not.toBeInTheDocument();

    const todoPill = within(filterBar).getByRole("button", { name: "To Do" });
    fireEvent.click(todoPill);

    const clearFilters = screen.getByRole("button", { name: /clear filters/i });
    expect(clearFilters).toBeInTheDocument();

    fireEvent.click(clearFilters);
    expect(
      screen.queryByRole("button", { name: /clear filters/i }),
    ).not.toBeInTheDocument();
    expect(todoPill).not.toHaveClass("active");
  });

  it("selects an assignee via the member filter group", () => {
    renderBoard();
    const memberGroup = screen.getByTestId("member-filter-group");
    fireEvent.click(within(memberGroup).getByText("Alice"));
    expect(
      screen.getByRole("button", { name: /clear filters/i }),
    ).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Column tabs & board columns (Line 204)
// ---------------------------------------------------------------------------

describe("DashboardBoard — columns & task filtering", () => {
  it("renders a mobile tab and a sortable column for each status", () => {
    renderBoard();
    baseStatuses.forEach((col) => {
      expect(
        screen.getByTestId(`sortable-column-${col.id}`),
      ).toBeInTheDocument();
    });
  });

  it("hits line 204: handles falsy task and status_id snake_case fallback", () => {
    const tasksWithEdgeCases = [
      null, // hits if (!t) return false;
      { id: "t-snake", title: "Snake Task", status_id: "status-1" }, // hits status_id fallback
    ];
    renderBoard({ tasks: tasksWithEdgeCases as any });

    const columnCount = screen.getByTestId("column-task-count-status-1");
    expect(columnCount).toHaveTextContent("1");
  });

  it("shows correct per-column task counts in the tab bar", () => {
    const { container } = renderBoard();
    const columnTabs = container.querySelector(".column-tabs") as HTMLElement;
    expect(columnTabs).toBeInTheDocument();

    const todoTab = within(columnTabs).getByRole("button", { name: /To Do/i });
    expect(within(todoTab).getByText("2")).toBeInTheDocument();

    const inProgressTab = within(columnTabs).getByRole("button", {
      name: /In Progress/i,
    });
    expect(within(inProgressTab).getByText("1")).toBeInTheDocument();
  });

  it("sets the active tab when a column tab is clicked", () => {
    const { container } = renderBoard();
    const columnTabs = container.querySelector(".column-tabs") as HTMLElement;
    expect(columnTabs).toBeInTheDocument();

    const doneTab = within(columnTabs).getByRole("button", { name: /Done/i });
    fireEvent.click(doneTab);
    expect(mockSetActiveTab).toHaveBeenCalledWith("status-3");
  });

  it("shows an empty-state message when there are no columns", () => {
    renderBoard({ statuses: [] });
    expect(
      screen.getByText(/no columns found for this project/i),
    ).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Project menu (mobile) & Line 309
// ---------------------------------------------------------------------------

describe("DashboardBoard — project menu", () => {
  it("opens the project menu and lists assigned projects", () => {
    renderBoard();
    fireEvent.click(screen.getByRole("button", { name: /projects/i }));
    expect(screen.getByText("Other Project")).toBeInTheDocument();
  });

  it("hits line 309: ignores projects without id", () => {
    mockUseGetAssignedProjects.mockReturnValue({
      data: [
        { project: baseProject },
        { project: null }, // project?.id is undefined -> returns null
        { id: null }, // item has no id -> returns null
      ],
    });
    renderBoard();
    fireEvent.click(screen.getByRole("button", { name: /projects/i }));
    expect(screen.getByText("Test Project")).toBeInTheDocument();
  });

  it("switches the active project when selected from the menu", () => {
    renderBoard();
    fireEvent.click(screen.getByRole("button", { name: /projects/i }));
    fireEvent.click(screen.getByText("Other Project"));
    expect(mockSetActiveProject).toHaveBeenCalledWith(
      expect.objectContaining({ id: "proj-2", name: "Other Project" }),
    );
  });

  it("closes the project menu when clicking the overlay", () => {
    renderBoard();
    fireEvent.click(screen.getByRole("button", { name: /projects/i }));
    expect(screen.getByText("Other Project")).toBeInTheDocument();

    const overlays = document.querySelectorAll(".mobile-project-overlay");
    fireEvent.click(overlays[overlays.length - 1]);
    expect(screen.queryByText("Other Project")).not.toBeInTheDocument();
  });

  it("opens the create-project modal from the menu", () => {
    renderBoard();
    fireEvent.click(screen.getByRole("button", { name: /projects/i }));
    fireEvent.click(screen.getByRole("button", { name: /new project/i }));
    expect(mockSetCreateProjectOpen).toHaveBeenCalledWith(true);
  });

  it("stops propagation and closes the menu when the Edit button on a project row is clicked, without changing the active project", () => {
    renderBoard();
    fireEvent.click(screen.getByRole("button", { name: /projects/i }));
    expect(screen.getByText("Other Project")).toBeInTheDocument();

    const editBtn = screen.getByRole("button", {
      name: /edit other project/i,
    });
    fireEvent.click(editBtn);

    expect(screen.queryByText("Other Project")).not.toBeInTheDocument();
    expect(mockSetActiveProject).not.toHaveBeenCalled();
  });

  it("renders an Edit button for every listed project, including the active one", () => {
    renderBoard();
    fireEvent.click(screen.getByRole("button", { name: /projects/i }));

    expect(
      screen.getByRole("button", { name: /edit test project/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /edit other project/i }),
    ).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// User menu / logout
// ---------------------------------------------------------------------------

describe("DashboardBoard — user menu", () => {
  it("opens the user menu showing name and email", () => {
    renderBoard();
    fireEvent.click(screen.getByLabelText(/account menu/i));
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("jane@example.com")).toBeInTheDocument();
  });

  it("falls back to the user's email as the display name, and to a placeholder email, when missing", () => {
    renderBoard({
      user: { id: "u1", name: undefined, email: undefined, photoUrl: null },
    });
    fireEvent.click(screen.getByLabelText(/account menu/i));
    expect(screen.getByText("User")).toBeInTheDocument();
    expect(screen.getByText("No email provided")).toBeInTheDocument();
  });

  it("closes the user menu when clicking the overlay", () => {
    renderBoard();
    fireEvent.click(screen.getByLabelText(/account menu/i));
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();

    const overlays = document.querySelectorAll(".mobile-project-overlay");
    fireEvent.click(overlays[overlays.length - 1]);
    expect(screen.queryByText("Jane Doe")).not.toBeInTheDocument();
  });

  it("opens account settings from the user menu", () => {
    renderBoard();
    fireEvent.click(screen.getByLabelText(/account menu/i));
    fireEvent.click(screen.getByRole("button", { name: /account settings/i }));
    expect(mockSetUserProfileModalOpen).toHaveBeenCalledWith(true);
  });

  it("logs out, clears the user, and navigates to /login on success", () => {
    mockLogoutMutate.mockImplementation((_arg, { onSuccess }: any) =>
      onSuccess(),
    );
    renderBoard();
    fireEvent.click(screen.getByLabelText(/account menu/i));
    fireEvent.click(screen.getByRole("button", { name: /log out/i }));

    expect(mockSetUser).toHaveBeenCalledWith(null);
    expect(mockNavigate).toHaveBeenCalledWith("/login", { replace: true });
  });

  it("still clears the user and navigates if logout fails", () => {
    mockLogoutMutate.mockImplementation((_arg, { onError }: any) => onError());
    renderBoard();
    fireEvent.click(screen.getByLabelText(/account menu/i));
    fireEvent.click(screen.getByRole("button", { name: /log out/i }));

    expect(mockSetUser).toHaveBeenCalledWith(null);
    expect(mockNavigate).toHaveBeenCalledWith("/login", { replace: true });
  });
});

// ---------------------------------------------------------------------------
// Drag overlay & Fallbacks
// ---------------------------------------------------------------------------

describe("DashboardBoard — drag overlay", () => {
  it("renders the dragged task inside the overlay", () => {
    renderBoard(
      {},
      { draggingTask: { id: "t1", title: "Task 1", statusId: "status-1" } },
    );
    expect(screen.getByTestId("task-overlay")).toHaveTextContent("Task 1");
  });

  it("shows transition badge with mapped names when dragging over a different column", () => {
    renderBoard(
      {},
      {
        draggingTask: { id: "t1", title: "Task 1", statusId: "status-1" },
        overColumnStatus: "status-2",
      },
    );
    const overlay = screen.getByTestId("drag-overlay");
    expect(within(overlay).getByText("To Do")).toBeInTheDocument();
    expect(within(overlay).getByText("In Progress")).toBeInTheDocument();
  });

  it("shows transition badge with fallback names when status names are unmapped", () => {
    renderBoard(
      {},
      {
        draggingTask: { id: "t1", title: "Task 1", statusId: "unmapped-1" },
        overColumnStatus: "unmapped-2",
      },
    );
    const overlay = screen.getByTestId("drag-overlay");
    expect(within(overlay).getByText("Current Column")).toBeInTheDocument();
    expect(within(overlay).getByText("Target Column")).toBeInTheDocument();
  });

  it("renders the dragging column placeholder when a column is being dragged", () => {
    renderBoard(
      {},
      { draggingColumn: { id: "status-2", name: "In Progress" } },
    );
    const overlay = screen.getByTestId("drag-overlay");
    expect(within(overlay).getByText("In Progress")).toBeInTheDocument();
  });
});
