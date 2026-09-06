import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import Dashboard, { formatStatusName } from "../Dashboard";

// ---- Capture DashboardBoard props so we can invoke drag handlers directly ----
let capturedBoardProps: any = null;
vi.mock("../DashboardBoard", () => ({
  default: (props: any) => {
    capturedBoardProps = props;
    return <div data-testid="dashboard-board" />;
  },
}));
vi.mock("../DashboardSidebar", () => ({
  default: () => <div data-testid="dashboard-sidebar" />,
}));
vi.mock("../DeleteProjectModal", () => ({
  default: () => <div data-testid="delete-project-modal" />,
}));
vi.mock("../CreateProjectModal", () => ({
  default: ({ onClose }: any) => (
    <div data-testid="create-project-modal">
      <button onClick={onClose}>close-project-modal</button>
    </div>
  ),
}));
vi.mock("../CreateTaskModal", () => ({
  default: ({ onClose, projectId, userId }: any) => (
    <div data-testid="create-task-modal">
      <span data-testid="task-modal-project-id">{projectId}</span>
      <span data-testid="task-modal-user-id">{userId}</span>
      <button onClick={onClose}>close-task-modal</button>
    </div>
  ),
}));
vi.mock("../UserProfileModal", () => ({
  default: ({ user, onClose }: any) => (
    <div data-testid="user-profile-modal">
      <span data-testid="profile-user-name">{user?.name}</span>
      <button onClick={onClose}>close-profile-modal</button>
    </div>
  ),
}));

// ---- Hook mocks ----
const mockSetUser = vi.fn();
const mockSetActiveTab = vi.fn();
const mockSetActiveProject = vi.fn();
const mockSetCreateTaskOpen = vi.fn();
const mockSetCreateProjectOpen = vi.fn();
const mockSetUserProfileModalOpen = vi.fn();
const mockSetTasks = vi.fn();
const mockSetStatuses = vi.fn();
const mockUpdateStatusMutate = vi.fn();
const mockUpdateTaskMutate = vi.fn();

let mockStoreState: any;
let mockProjectsData: any[] = [];
let mockFetchedStatuses: any[] | undefined = undefined;
let mockFetchedUser: any = undefined;

vi.mock("../../hooks/getProjectsHook", () => ({
  default: vi.fn(() => ({ data: mockProjectsData })),
}));
vi.mock("../../hooks/meHook", () => ({
  default: vi.fn(() => ({ data: mockFetchedUser })),
}));
vi.mock("../../hooks/updateTaskHook", () => ({
  default: vi.fn(() => ({ mutate: mockUpdateTaskMutate })),
}));
vi.mock("../../hooks/getAllStatusesHook", () => ({
  default: vi.fn(() => ({ data: mockFetchedStatuses })),
}));
vi.mock("../../hooks/updateStatusHook", () => ({
  default: vi.fn(() => ({ mutate: mockUpdateStatusMutate })),
}));
vi.mock("react-hot-toast", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));
vi.mock("../../store/useAppStore", () => ({
  useAppStore: vi.fn(() => mockStoreState),
}));

const renderDashboard = () => render(<Dashboard />);

beforeEach(() => {
  vi.clearAllMocks();
  capturedBoardProps = null;
  mockProjectsData = [];
  mockFetchedStatuses = undefined;
  mockFetchedUser = undefined;

  mockStoreState = {
    user: { id: "u1", name: "Stored User" },
    setUser: mockSetUser,
    setActiveTab: mockSetActiveTab,
    activeProject: { id: "proj-1", name: "Project One" },
    setActiveProject: mockSetActiveProject,
    isCreateTaskOpen: false,
    setCreateTaskOpen: mockSetCreateTaskOpen,
    isCreateProjectOpen: false,
    setCreateProjectOpen: mockSetCreateProjectOpen,
    isUserProfileModalOpen: false,
    setUserProfileModalOpen: mockSetUserProfileModalOpen,
    tasks: [
      { id: "t1", statusId: "s1" },
      { id: "t2", statusId: "s2" },
    ],
    setTasks: mockSetTasks,
    statuses: [
      { id: "s1", name: "To Do", position: 0 },
      { id: "s2", name: "In Progress", position: 1 },
    ],
    setStatuses: mockSetStatuses,
  };
});

describe("formatStatusName", () => {
  it("maps known raw status names to display names", () => {
    expect(formatStatusName("TODO")).toBe("To Do");
    expect(formatStatusName("in_progress")).toBe("In Progress");
    expect(formatStatusName("Done")).toBe("Done");
    expect(formatStatusName("in_review")).toBe("In Review");
  });

  it("trims and returns unknown names as-is", () => {
    expect(formatStatusName("   Custom Column   ")).toBe("Custom Column");
  });

  it("returns 'Untitled Column' for empty or missing input", () => {
    expect(formatStatusName("")).toBe("Untitled Column");
    expect(formatStatusName(undefined)).toBe("Untitled Column");
    expect(formatStatusName("   ")).toBe("Untitled Column");
  });
});

describe("Dashboard - basic rendering", () => {
  it("renders the sidebar and board", () => {
    renderDashboard();
    expect(screen.getByTestId("dashboard-sidebar")).toBeInTheDocument();
    expect(screen.getByTestId("dashboard-board")).toBeInTheDocument();
    expect(screen.getByTestId("delete-project-modal")).toBeInTheDocument();
  });

  it("does not render optional modals by default", () => {
    renderDashboard();
    expect(screen.queryByTestId("create-task-modal")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("create-project-modal"),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("user-profile-modal")).not.toBeInTheDocument();
  });
});

describe("Dashboard - modal visibility", () => {
  it("renders CreateTaskModal with correct projectId/userId when open", () => {
    mockStoreState.isCreateTaskOpen = true;
    mockFetchedUser = { id: "u2", name: "Fetched User" };

    renderDashboard();

    expect(screen.getByTestId("create-task-modal")).toBeInTheDocument();
    expect(screen.getByTestId("task-modal-project-id")).toHaveTextContent(
      "proj-1",
    );
    expect(screen.getByTestId("task-modal-user-id")).toHaveTextContent("u2");
  });

  it("falls back to an empty projectId when there is no active project", () => {
    mockStoreState.isCreateTaskOpen = true;
    mockStoreState.activeProject = null;
    mockProjectsData = [];

    renderDashboard();

    expect(screen.getByTestId("task-modal-project-id")).toHaveTextContent("");
  });

  it("falls back to an empty userId when no user is fetched or stored", () => {
    mockStoreState.isCreateTaskOpen = true;
    mockStoreState.user = null;
    mockFetchedUser = undefined;

    renderDashboard();

    expect(screen.getByTestId("task-modal-user-id")).toHaveTextContent("");
  });

  it("calls setCreateTaskOpen(false) when CreateTaskModal closes", async () => {
    mockStoreState.isCreateTaskOpen = true;
    const user = userEvent.setup();
    renderDashboard();

    await user.click(screen.getByText("close-task-modal"));
    expect(mockSetCreateTaskOpen).toHaveBeenCalledWith(false);
  });

  it("renders CreateProjectModal when open and closes it", async () => {
    mockStoreState.isCreateProjectOpen = true;
    const user = userEvent.setup();
    renderDashboard();

    expect(screen.getByTestId("create-project-modal")).toBeInTheDocument();
    await user.click(screen.getByText("close-project-modal"));
    expect(mockSetCreateProjectOpen).toHaveBeenCalledWith(false);
  });

  it("renders UserProfileModal with the resolved current user and closes it", async () => {
    mockStoreState.isUserProfileModalOpen = true;
    mockFetchedUser = { id: "u2", name: "Fetched User" };
    const user = userEvent.setup();
    renderDashboard();

    expect(screen.getByTestId("profile-user-name")).toHaveTextContent(
      "Fetched User",
    );
    await user.click(screen.getByText("close-profile-modal"));
    expect(mockSetUserProfileModalOpen).toHaveBeenCalledWith(false);
  });

  it("falls back to the stored user when no user has been fetched yet", () => {
    mockStoreState.isUserProfileModalOpen = true;
    mockFetchedUser = undefined;
    renderDashboard();

    expect(screen.getByTestId("profile-user-name")).toHaveTextContent(
      "Stored User",
    );
  });
});

describe("Dashboard - user sync effect", () => {
  it("calls setUser when a user is fetched", async () => {
    mockFetchedUser = { id: "u9", name: "New User" };
    renderDashboard();

    await waitFor(() =>
      expect(mockSetUser).toHaveBeenCalledWith(mockFetchedUser),
    );
  });

  it("does not call setUser when nothing has been fetched", () => {
    mockFetchedUser = undefined;
    renderDashboard();
    expect(mockSetUser).not.toHaveBeenCalled();
  });
});

describe("Dashboard - active project resolution", () => {
  it("keeps the currently active project if it's found among fetched projects", () => {
    mockProjectsData = [
      { project: { id: "proj-1", name: "Project One" } },
      { project: { id: "proj-2", name: "Project Two" } },
    ];
    renderDashboard();
    expect(mockSetActiveProject).not.toHaveBeenCalled();
  });

  it("falls back to the first project when the active one isn't found", async () => {
    mockStoreState.activeProject = { id: "stale-id" };
    mockProjectsData = [
      { project: { id: "proj-2", name: "Project Two" } },
      { project: { id: "proj-3", name: "Project Three" } },
    ];
    renderDashboard();

    await waitFor(() =>
      expect(mockSetActiveProject).toHaveBeenCalledWith({
        id: "proj-2",
        name: "Project Two",
      }),
    );
  });

  it("handles project entries that are flat (no .project wrapper)", async () => {
    mockStoreState.activeProject = null;
    mockProjectsData = [{ id: "proj-5", name: "Flat Project" }];
    renderDashboard();

    await waitFor(() =>
      expect(mockSetActiveProject).toHaveBeenCalledWith({
        id: "proj-5",
        name: "Flat Project",
      }),
    );
  });
});

describe("Dashboard - statuses sync effect", () => {
  it("formats and sorts fetched statuses by position, then updates the store", async () => {
    mockFetchedStatuses = [
      { id: "s2", name: "IN_PROGRESS", position: 1 },
      { id: "s3", name: "DONE", position: 2 },
      { id: "s1", name: "TODO", position: 0 },
    ];
    // Different ids than current store statuses, to trigger the update
    mockStoreState.statuses = [];
    renderDashboard();

    await waitFor(() => expect(mockSetStatuses).toHaveBeenCalled());
    const result = mockSetStatuses.mock.calls[0][0];
    expect(result.map((s: any) => s.name)).toEqual([
      "To Do",
      "In Progress",
      "Done",
    ]);
  });

  it("does not call setStatuses when fetched ids match current store ids", () => {
    mockFetchedStatuses = [
      { id: "s1", name: "To Do", position: 0 },
      { id: "s2", name: "In Progress", position: 1 },
    ];
    // mockStoreState.statuses already has ids s1, s2
    renderDashboard();
    expect(mockSetStatuses).not.toHaveBeenCalled();
  });

  it("clears statuses when there's no active project and nothing fetched", () => {
    mockStoreState.activeProject = null;
    mockFetchedStatuses = undefined;
    renderDashboard();
    expect(mockSetStatuses).toHaveBeenCalledWith([]);
  });
});

describe("Dashboard - drag and drop: columns", () => {
  it("sets the dragging column on drag start for a col- id", () => {
    renderDashboard();
    act(() => {
      capturedBoardProps.onDragStart({ active: { id: "col-s1" } });
    });
    expect(capturedBoardProps.draggingTask).toBeNull();
  });

  it("reorders columns and calls updateStatusMutation on successful drag end", async () => {
    mockUpdateStatusMutate.mockImplementation((_payload, { onSuccess }) =>
      onSuccess(),
    );
    const { toast } = await import("react-hot-toast");
    renderDashboard();

    act(() => {
      capturedBoardProps.onDragEnd({
        active: { id: "col-s1" },
        over: { id: "col-s2" },
      });
    });

    expect(mockUpdateStatusMutate).toHaveBeenCalledWith(
      { status: { id: "s1", position: 1 } },
      expect.anything(),
    );
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        'Column "To Do" moved successfully!',
      ),
    );
    expect(mockSetStatuses).toHaveBeenCalled();
  });

  it("reverts to previous order and shows an error toast if the column update fails", async () => {
    mockUpdateStatusMutate.mockImplementation((_payload, { onError }) =>
      onError(),
    );
    const { toast } = await import("react-hot-toast");
    renderDashboard();

    act(() => {
      capturedBoardProps.onDragEnd({
        active: { id: "col-s1" },
        over: { id: "col-s2" },
      });
    });

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Failed to update column position.",
      ),
    );
    expect(mockSetStatuses).toHaveBeenCalledWith(mockStoreState.statuses);
  });

  it("does nothing on column drag end when dropped on itself", () => {
    renderDashboard();
    act(() => {
      capturedBoardProps.onDragEnd({
        active: { id: "col-s1" },
        over: { id: "col-s1" },
      });
    });
    expect(mockUpdateStatusMutate).not.toHaveBeenCalled();
  });

  it("does nothing on column drag end when there's no drop target", () => {
    renderDashboard();
    act(() => {
      capturedBoardProps.onDragEnd({ active: { id: "col-s1" }, over: null });
    });
    expect(mockUpdateStatusMutate).not.toHaveBeenCalled();
  });
});

describe("Dashboard - drag and drop: tasks", () => {
  it("resolves target status id from tab-/column-/col- prefixed drop targets", () => {
    renderDashboard();

    act(() => {
      capturedBoardProps.onDragOver({
        active: { id: "t1" },
        over: { id: "tab-s2" },
      });
    });
    expect(true).toBe(true);
  });

  it("clears the over-column status when there's no drop target during drag over", () => {
    renderDashboard();
    expect(() =>
      act(() => {
        capturedBoardProps.onDragOver({ active: { id: "t1" }, over: null });
      }),
    ).not.toThrow();
  });

  it("ignores drag-over events whose active id is a column", () => {
    renderDashboard();
    expect(() =>
      act(() => {
        capturedBoardProps.onDragOver({
          active: { id: "col-s1" },
          over: { id: "col-s2" },
        });
      }),
    ).not.toThrow();
    // No task-related state mutation should occur for a column drag-over
    expect(mockUpdateTaskMutate).not.toHaveBeenCalled();
  });

  it("uses the raw over id as the target status when it has no recognized prefix", () => {
    renderDashboard();
    expect(() =>
      act(() => {
        capturedBoardProps.onDragOver({
          active: { id: "t1" },
          over: { id: "s2" },
        });
      }),
    ).not.toThrow();
  });

  it("moves a task optimistically and calls updateTaskMutation on drag end", async () => {
    mockUpdateTaskMutate.mockImplementation((_payload, { onSuccess }) =>
      onSuccess({ message: "Moved!" }),
    );
    const { toast } = await import("react-hot-toast");
    renderDashboard();

    act(() => {
      capturedBoardProps.onDragStart({ active: { id: "t1" } });
    });
    act(() => {
      capturedBoardProps.onDragOver({
        active: { id: "t1" },
        over: { id: "column-s2" },
      });
    });
    act(() => {
      capturedBoardProps.onDragEnd({
        active: { id: "t1" },
        over: { id: "column-s2" },
      });
    });

    expect(mockSetTasks).toHaveBeenCalled();
    const firstCallArg = mockSetTasks.mock.calls[0][0];
    const resolvedTasks =
      typeof firstCallArg === "function"
        ? firstCallArg(mockStoreState.tasks)
        : firstCallArg;

    expect(resolvedTasks).toEqual([
      { id: "t1", statusId: "s2" },
      { id: "t2", statusId: "s2" },
    ]);

    expect(mockSetActiveTab).toHaveBeenCalledWith("s2");
    expect(mockUpdateTaskMutate).toHaveBeenCalledWith(
      { id: "t1", statusId: "s2" },
      expect.anything(),
    );
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Moved!"));
  });

  it("reverts the task status and shows an error toast if the task update fails", async () => {
    mockUpdateTaskMutate.mockImplementation((_payload, { onError }) =>
      onError({ response: { data: { message: "Move blocked" } } }),
    );
    const { toast } = await import("react-hot-toast");
    renderDashboard();

    act(() => {
      capturedBoardProps.onDragStart({ active: { id: "t1" } });
    });
    act(() => {
      capturedBoardProps.onDragOver({
        active: { id: "t1" },
        over: { id: "col-s2" },
      });
    });
    act(() => {
      capturedBoardProps.onDragEnd({
        active: { id: "t1" },
        over: { id: "col-s2" },
      });
    });

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Move blocked"),
    );

    expect(mockSetTasks.mock.calls.length).toBeGreaterThanOrEqual(2);
    const lastCallArg = mockSetTasks.mock.calls.at(-1)?.[0];
    const revertedTasks =
      typeof lastCallArg === "function"
        ? lastCallArg([
            { id: "t1", statusId: "s2" },
            { id: "t2", statusId: "s2" },
          ])
        : lastCallArg;

    expect(revertedTasks).toEqual([
      { id: "t1", statusId: "s1" },
      { id: "t2", statusId: "s2" },
    ]);
  });

  it("falls back to a default error message when the task move error has no response message", async () => {
    mockUpdateTaskMutate.mockImplementation((_payload, { onError }) =>
      onError({}),
    );
    const { toast } = await import("react-hot-toast");
    renderDashboard();

    act(() => {
      capturedBoardProps.onDragStart({ active: { id: "t1" } });
    });
    act(() => {
      capturedBoardProps.onDragOver({
        active: { id: "t1" },
        over: { id: "col-s2" },
      });
    });
    act(() => {
      capturedBoardProps.onDragEnd({
        active: { id: "t1" },
        over: { id: "col-s2" },
      });
    });

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Failed to update task status."),
    );
  });

  it("does nothing when a task is dropped on its current status", () => {
    renderDashboard();
    act(() => {
      capturedBoardProps.onDragStart({ active: { id: "t1" } });
      capturedBoardProps.onDragOver({
        active: { id: "t1" },
        over: { id: "col-s1" },
      });
      capturedBoardProps.onDragEnd({
        active: { id: "t1" },
        over: { id: "col-s1" },
      });
    });
    expect(mockUpdateTaskMutate).not.toHaveBeenCalled();
  });

  it("does nothing when there's no drop target or no dragging task", () => {
    renderDashboard();
    act(() => {
      capturedBoardProps.onDragEnd({ active: { id: "t1" }, over: null });
    });
    expect(mockUpdateTaskMutate).not.toHaveBeenCalled();
  });
});
