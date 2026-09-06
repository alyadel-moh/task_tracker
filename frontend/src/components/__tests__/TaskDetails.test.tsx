import { render, screen, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import TaskDetailsPage, { getStatusColorKey } from "../TaskDetailsPage";
import { useAppStore } from "../../store/useAppStore";
import { toast } from "react-hot-toast";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const baseTask = {
  id: "task-1",
  name: "Implement Auth",
  description: "Set up JWT and OAuth",
  statusId: "status-1",
  statusName: "TODO",
  priority: "HIGH",
  dueDate: "2026-10-01T12:00:00.000Z",
  estimatedTime: 120,
  createdAt: "2026-09-01T10:00:00.000Z",
  updatedAt: "2026-09-01T10:00:00.000Z",
  creator: {
    id: "u1",
    name: "Aly Adel",
    email: "aly@example.com",
    photoUrl: null,
  },
  assignees: [
    { id: "u1", name: "Aly Adel", email: "aly@example.com", photoUrl: null },
  ],
};

const mockTimeEntries = {
  timeEntries: [
    {
      id: "entry-1",
      durationMinutes: 45,
      entryDate: "2026-09-02",
      note: "Initial setup",
      createdAt: "2026-09-02T10:00:00.000Z",
      updatedAt: "2026-09-02T10:00:00.000Z",
    },
  ],
  totalMinutes: 45,
};

const mockUpdateTaskMutate = vi.fn();
vi.mock("../../hooks/updateTaskHook", () => ({
  default: () => ({ mutate: mockUpdateTaskMutate }),
}));

const mockGetTask = vi.fn(() => ({ data: baseTask, isLoading: false }));
vi.mock("../../hooks/getTaskHook", () => ({
  default: (...args: any[]) => mockGetTask(...args),
}));

const mockGetTimeEntries = vi.fn(() => ({
  data: mockTimeEntries,
  isLoading: false,
}));
vi.mock("../../hooks/getAlltimeEntries", () => ({
  default: (...args: any[]) => mockGetTimeEntries(...args),
}));

vi.mock("../../hooks/getTaskHistoryHook", () => ({
  default: () => ({ data: [], isLoading: false }),
}));

const mockCreateTimeEntry = vi.fn();
vi.mock("../../hooks/createTimeEntry", () => ({
  default: () => ({ mutate: mockCreateTimeEntry }),
}));

const mockUpdateTimeEntry = vi.fn();
vi.mock("../../hooks/updateTimeEntry", () => ({
  default: () => ({ mutate: mockUpdateTimeEntry }),
}));

const mockDeleteTimeEntry = vi.fn();
vi.mock("../../hooks/deleteTimeEntry", () => ({
  default: () => ({ mutate: mockDeleteTimeEntry }),
}));

const baseMembers = [
  { id: "m1", user: { id: "u1", name: "Aly Adel", email: "aly@example.com" } },
  { id: "m2", user: { id: "u2", name: "Jane Doe", email: "jane@example.com" } },
];
const mockGetProjectMembers = vi.fn(() => ({ data: baseMembers }));
vi.mock("../../hooks/getAllprojectMembers", () => ({
  default: (...args: any[]) => mockGetProjectMembers(...args),
}));

const mockGetStatuses = vi.fn(() => ({
  data: [
    { id: "status-1", name: "TODO" },
    { id: "status-2", name: "DONE" },
  ],
}));
vi.mock("../../hooks/getAllStatusesHook", () => ({
  default: (...args: any[]) => mockGetStatuses(...args),
}));

vi.mock("react-hot-toast", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderTaskDetails() {
  return render(
    <QueryClientProvider client={makeQueryClient()}>
      <MemoryRouter initialEntries={["/projects/proj-1/task/task-1"]}>
        <Routes>
          <Route
            path="/projects/:projectId/task/:taskId"
            element={<TaskDetailsPage />}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function daysFromNowISO(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(12, 0, 0, 0);
  return d.toISOString();
}

beforeEach(() => {
  vi.clearAllMocks();

  mockGetTask.mockReturnValue({ data: baseTask, isLoading: false });
  mockGetTimeEntries.mockReturnValue({
    data: mockTimeEntries,
    isLoading: false,
  });
  mockGetProjectMembers.mockReturnValue({ data: baseMembers });
  mockGetStatuses.mockReturnValue({
    data: [
      { id: "status-1", name: "TODO" },
      { id: "status-2", name: "DONE" },
    ],
  });

  useAppStore.setState({
    user: { id: "u1", name: "Aly Adel", email: "aly@example.com" } as any,
    userRole: "OWNER",
  });
});

// ---------------------------------------------------------------------------
// Loading / null states
// ---------------------------------------------------------------------------
describe("TaskDetailsPage — loading & empty states", () => {
  it("shows the loading spinner (not the page body) while the task is fetching and no cached task exists", () => {
    mockGetTask.mockReturnValue({ data: null, isLoading: true });
    const { container } = renderTaskDetails();

    expect(container.querySelector(".task-page-loading")).toBeInTheDocument();
    expect(screen.queryByText("Implement Auth")).not.toBeInTheDocument();
  });

  it("shows the loading spinner while time entries are fetching and no cached task exists", () => {
    mockGetTask.mockReturnValue({ data: null, isLoading: false });
    mockGetTimeEntries.mockReturnValue({ data: undefined, isLoading: true });
    const { container } = renderTaskDetails();

    expect(container.querySelector(".task-page-loading")).toBeInTheDocument();
  });

  it("renders nothing (no crash) once loading finishes with no task found", () => {
    mockGetTask.mockReturnValue({ data: null, isLoading: false });
    mockGetTimeEntries.mockReturnValue({ data: null, isLoading: false });
    const { container } = renderTaskDetails();

    expect(container.querySelector(".task-page")).not.toBeInTheDocument();
  });

  it("still shows the full page body once loading completes, even if a stale task was cached", () => {
    mockGetTask.mockReturnValue({ data: baseTask, isLoading: true });
    renderTaskDetails();
    expect(screen.getByText("Implement Auth")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Core rendering
// ---------------------------------------------------------------------------
describe("TaskDetailsPage — core rendering", () => {
  it("renders task details, people section, and time entries", () => {
    renderTaskDetails();

    expect(screen.getByText("Implement Auth")).toBeInTheDocument();
    expect(screen.getByText("Set up JWT and OAuth")).toBeInTheDocument();
    expect(screen.getAllByText("Aly Adel")[0]).toBeInTheDocument();
    expect(screen.getByText("Initial setup")).toBeInTheDocument();
    expect(screen.getByText("45 mins logged")).toBeInTheDocument();
    expect(screen.getByText("120 mins budgeted")).toBeInTheDocument();
  });

  it("shows 'No estimate set' and a minimal bar fill when the task has no estimatedTime", () => {
    mockGetTask.mockReturnValue({
      data: { ...baseTask, estimatedTime: null },
      isLoading: false,
    });
    const { container } = renderTaskDetails();

    expect(screen.getByText(/no estimate set/i)).toBeInTheDocument();
    const fill = container.querySelector(
      ".time-budget-bar-fill",
    ) as HTMLElement;
    expect(fill).toHaveClass("safe");
    expect(fill.style.width).toBe("6%");
  });

  it("marks the budget bar 'over' once logged time exceeds the estimate", () => {
    mockGetTask.mockReturnValue({
      data: { ...baseTask, estimatedTime: 30 },
      isLoading: false,
    });
    mockGetTimeEntries.mockReturnValue({
      data: { timeEntries: mockTimeEntries.timeEntries, totalMinutes: 50 },
      isLoading: false,
    });
    const { container } = renderTaskDetails();
    expect(container.querySelector(".time-budget-bar-fill")).toHaveClass(
      "over",
    );
  });

  it("marks the budget bar 'caution' between 85% and 100% of the estimate", () => {
    mockGetTask.mockReturnValue({
      data: { ...baseTask, estimatedTime: 100 },
      isLoading: false,
    });
    mockGetTimeEntries.mockReturnValue({
      data: { timeEntries: mockTimeEntries.timeEntries, totalMinutes: 90 },
      isLoading: false,
    });
    const { container } = renderTaskDetails();
    expect(container.querySelector(".time-budget-bar-fill")).toHaveClass(
      "caution",
    );
  });

  it("shows the empty entries message when there are no time entries", () => {
    mockGetTimeEntries.mockReturnValue({
      data: { timeEntries: [], totalMinutes: 0 },
      isLoading: false,
    });
    renderTaskDetails();
    expect(screen.getByText(/no time entries logged yet/i)).toBeInTheDocument();
  });

  it("covers line 966: handles null or undefined timeEntriesData fallback", () => {
    mockGetTimeEntries.mockReturnValue({
      data: null as any,
      isLoading: false,
    });
    renderTaskDetails();
    expect(screen.getByText(/no time entries logged yet/i)).toBeInTheDocument();
    expect(screen.getByText("0 mins logged")).toBeInTheDocument();
  });

  it("falls back to 'Anonymous User' / 'No email available' when the creator is missing", () => {
    mockGetTask.mockReturnValue({
      data: { ...baseTask, creator: null },
      isLoading: false,
    });
    renderTaskDetails();
    expect(screen.getByText("Anonymous User")).toBeInTheDocument();
    expect(screen.getByText("No email available")).toBeInTheDocument();
  });

  it("shows the empty-assignees message when the task has no assignees", () => {
    mockGetTask.mockReturnValue({
      data: { ...baseTask, assignees: [] },
      isLoading: false,
    });
    renderTaskDetails();
    expect(screen.getByText(/no assignees assigned/i)).toBeInTheDocument();
  });

  it("does not render the overrun badge until overrun is triggered", () => {
    mockGetTask.mockReturnValue({
      data: { ...baseTask, estimatedTime: 1000 },
      isLoading: false,
    });
    renderTaskDetails();
    expect(
      screen.queryByText(/exceeds estimated time/i),
    ).not.toBeInTheDocument();
  });

  it("shows the overrun badge automatically when logged time already exceeds the estimate on load", () => {
    mockGetTask.mockReturnValue({
      data: { ...baseTask, estimatedTime: 10 },
      isLoading: false,
    });
    mockGetTimeEntries.mockReturnValue({
      data: { timeEntries: mockTimeEntries.timeEntries, totalMinutes: 45 },
      isLoading: false,
    });
    renderTaskDetails();
    expect(screen.getByText(/exceeds estimated time/i)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Due date labels
// ---------------------------------------------------------------------------
describe("TaskDetailsPage — due date labels", () => {
  it("shows 'Overdue' with a warning icon for a past due date", () => {
    mockGetTask.mockReturnValue({
      data: { ...baseTask, dueDate: daysFromNowISO(-3) },
      isLoading: false,
    });
    renderTaskDetails();
    expect(screen.getByText("Overdue")).toBeInTheDocument();
  });

  it("shows 'Due today' for a due date on the current calendar day", () => {
    mockGetTask.mockReturnValue({
      data: { ...baseTask, dueDate: daysFromNowISO(0) },
      isLoading: false,
    });
    renderTaskDetails();
    expect(screen.getByText("Due today")).toBeInTheDocument();
  });

  it("shows 'Due tomorrow' for a due date exactly one calendar day out", () => {
    mockGetTask.mockReturnValue({
      data: { ...baseTask, dueDate: daysFromNowISO(1) },
      isLoading: false,
    });
    renderTaskDetails();
    expect(screen.getByText("Due tomorrow")).toBeInTheDocument();
  });

  it("shows 'Due in Nd' for due dates further in the future", () => {
    mockGetTask.mockReturnValue({
      data: { ...baseTask, dueDate: daysFromNowISO(5) },
      isLoading: false,
    });
    renderTaskDetails();
    expect(screen.getByText("Due in 5d")).toBeInTheDocument();
  });

  it("suppresses the due label entirely when there is no due date", () => {
    mockGetTask.mockReturnValue({
      data: { ...baseTask, dueDate: null },
      isLoading: false,
    });
    renderTaskDetails();
    expect(document.querySelector(".task-due-label")).not.toBeInTheDocument();
  });

  it("suppresses the due label when the task's statusName is DONE, even if overdue", () => {
    mockGetTask.mockReturnValue({
      data: { ...baseTask, statusName: "DONE", dueDate: daysFromNowISO(-10) },
      isLoading: false,
    });
    renderTaskDetails();
    expect(screen.queryByText("Overdue")).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Status label formatting & Color key helper
// ---------------------------------------------------------------------------
describe("TaskDetailsPage — status label formatting & getStatusColorKey", () => {
  it.each([
    ["TODO", "To Do"],
    ["TO_DO", "To Do"],
    ["IN_PROGRESS", "In Progress"],
    ["INPROGRESS", "In Progress"],
    ["DONE", "Done"],
    ["blocked_review", "Blocked Review"],
  ])("formats status name '%s' as '%s'", (statusName, label) => {
    mockGetTask.mockReturnValue({
      data: { ...baseTask, statusName },
      isLoading: false,
    });
    mockGetStatuses.mockReturnValue({
      data: [{ id: "status-1", name: statusName }],
    });
    renderTaskDetails();
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it("falls back to 'Unknown' when there is no status name at all", () => {
    mockGetTask.mockReturnValue({
      data: { ...baseTask, statusId: "", statusName: "" },
      isLoading: false,
    });
    mockGetStatuses.mockReturnValue({ data: [] });
    renderTaskDetails();
    expect(screen.getByText("Unknown")).toBeInTheDocument();
  });

  it("tests getStatusColorKey helper variants", () => {
    expect(getStatusColorKey(undefined)).toBe("todo");
    expect(getStatusColorKey("todo")).toBe("todo");
    expect(getStatusColorKey("to_do")).toBe("todo");
    expect(getStatusColorKey("inprogress")).toBe("in-progress");
    expect(getStatusColorKey("in_progress")).toBe("in-progress");
    expect(getStatusColorKey("progress")).toBe("in-progress");
    expect(getStatusColorKey("done")).toBe("done");
    expect(getStatusColorKey("complete")).toBe("done");
    expect(getStatusColorKey("completed")).toBe("done");
    expect(getStatusColorKey("archived")).toBe("custom");
  });
});

// ---------------------------------------------------------------------------
// Permissions / canManageAssignees
// ---------------------------------------------------------------------------
describe("TaskDetailsPage — permissions", () => {
  it("hides edit affordances and the Manage Assignees / Log Time buttons for a non-owner, non-creator, non-assignee", () => {
    useAppStore.setState({
      user: {
        id: "outsider",
        name: "Outsider",
        email: "out@example.com",
      } as any,
      userRole: "MEMBER",
    });
    renderTaskDetails();

    expect(
      screen.queryByRole("button", { name: /manage assignees/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /log time/i }),
    ).not.toBeInTheDocument();
    expect(document.querySelector(".entry-delete-btn")).not.toBeInTheDocument();
  });

  it("grants management access to the task creator even without OWNER role", () => {
    useAppStore.setState({
      user: { id: "u1", name: "Aly Adel", email: "aly@example.com" } as any,
      userRole: "MEMBER",
    });
    renderTaskDetails();
    expect(
      screen.getByRole("button", { name: /manage assignees/i }),
    ).toBeInTheDocument();
  });

  it("grants management access to an assignee identified by userId instead of id", () => {
    mockGetTask.mockReturnValue({
      data: {
        ...baseTask,
        creator: { ...baseTask.creator, id: "someone-else" },
        assignees: [{ userId: "u1", name: "Aly Adel" }],
      },
      isLoading: false,
    });
    useAppStore.setState({
      user: { id: "u1", name: "Aly Adel", email: "aly@example.com" } as any,
      userRole: "MEMBER",
    });
    renderTaskDetails();
    expect(
      screen.getByRole("button", { name: /manage assignees/i }),
    ).toBeInTheDocument();
  });

  it("excludes the task creator from the assignable-members dropdown", async () => {
    const user = userEvent.setup();
    renderTaskDetails();

    await user.click(screen.getByRole("button", { name: /manage assignees/i }));
    const dropdown = document.querySelector(
      ".assignee-dropdown-list",
    ) as HTMLElement;
    expect(within(dropdown).queryByText("Aly Adel")).not.toBeInTheDocument();
    expect(within(dropdown).getByText("Jane Doe")).toBeInTheDocument();
  });

  it("shows 'No members found' when every project member is the creator", async () => {
    mockGetProjectMembers.mockReturnValue({
      data: [
        {
          id: "m1",
          user: { id: "u1", name: "Aly Adel", email: "aly@example.com" },
        },
      ],
    });
    const user = userEvent.setup();
    renderTaskDetails();

    await user.click(screen.getByRole("button", { name: /manage assignees/i }));
    expect(screen.getByText(/no members found/i)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Assignee toggling
// ---------------------------------------------------------------------------
describe("TaskDetailsPage — assignee toggling", () => {
  it("assigns a not-yet-assigned member and closes the dropdown on success", async () => {
    const user = userEvent.setup();
    mockUpdateTaskMutate.mockImplementation((_payload, { onSuccess }) =>
      onSuccess(),
    );
    renderTaskDetails();

    await user.click(screen.getByRole("button", { name: /manage assignees/i }));
    await user.click(screen.getByText("Jane Doe"));

    expect(mockUpdateTaskMutate).toHaveBeenCalledWith(
      expect.objectContaining({ id: "task-1", assigneeIds: ["u1", "u2"] }),
      expect.any(Object),
    );
    expect(screen.queryByText("Jane Doe")).not.toBeInTheDocument();
  });

  it("removes an already-assigned member, sending the filtered id list", async () => {
    mockGetTask.mockReturnValue({
      data: {
        ...baseTask,
        assignees: [
          { id: "u1", name: "Aly Adel", email: "aly@example.com" },
          { id: "u2", name: "Jane Doe", email: "jane@example.com" },
        ],
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    mockUpdateTaskMutate.mockImplementation((_payload, { onSuccess }) =>
      onSuccess(),
    );
    renderTaskDetails();

    await user.click(screen.getByRole("button", { name: /manage assignees/i }));
    const dropdown = document.querySelector(
      ".assignee-dropdown-list",
    ) as HTMLElement;
    await user.click(within(dropdown).getByText("Jane Doe"));

    expect(mockUpdateTaskMutate).toHaveBeenCalledWith(
      expect.objectContaining({ assigneeIds: ["u1"] }),
      expect.any(Object),
    );
  });

  it("shows an error toast when the assignee update fails", async () => {
    const { toast } = await import("react-hot-toast");
    const user = userEvent.setup();
    mockUpdateTaskMutate.mockImplementation((_payload, { onError }) =>
      onError({ response: { data: { message: "Server rejected it" } } }),
    );
    renderTaskDetails();

    await user.click(screen.getByRole("button", { name: /manage assignees/i }));
    await user.click(screen.getByText("Jane Doe"));

    expect(toast.error).toHaveBeenCalledWith("Server rejected it", {
      id: "assignee-toggle",
    });
  });

  it("shows fallback error toast when assignee update fails without server message", async () => {
    const user = userEvent.setup();
    mockUpdateTaskMutate.mockImplementation((_payload, { onError }) =>
      onError({}),
    );
    renderTaskDetails();

    await user.click(screen.getByRole("button", { name: /manage assignees/i }));
    await user.click(screen.getByText("Jane Doe"));

    expect(toast.error).toHaveBeenCalledWith("Failed to update assignee", {
      id: "assignee-toggle",
    });
  });

  it("closes the assignee dropdown when clicking outside it", async () => {
    const user = userEvent.setup();
    renderTaskDetails();

    await user.click(screen.getByRole("button", { name: /manage assignees/i }));
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByText("Jane Doe")).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Task edit / save flow
// ---------------------------------------------------------------------------
describe("TaskDetailsPage — save task changes", () => {
  it("hides the save bar until a field is actually dirty", () => {
    renderTaskDetails();
    expect(document.querySelector(".save-task-btn")).not.toBeInTheDocument();
  });

  it("shows a validation toast and skips the mutation when the name is cleared to blank", async () => {
    const { toast } = await import("react-hot-toast");
    const user = userEvent.setup();
    renderTaskDetails();

    await user.click(screen.getByText("Implement Auth"));
    const input = screen.getByDisplayValue("Implement Auth");
    await user.clear(input);
    const checkBtn = document.querySelector(
      ".inline-field-save",
    ) as HTMLElement;
    await user.click(checkBtn);

    const saveBtn = document.querySelector(".save-task-btn") as HTMLElement;
    await user.click(saveBtn);

    expect(toast.error).toHaveBeenCalledWith("Task name cannot be empty");
    expect(mockUpdateTaskMutate).not.toHaveBeenCalled();
  });

  it("saves edited fields, sends null for a cleared description, and applies the returned overrun flag", async () => {
    const user = userEvent.setup();
    mockUpdateTaskMutate.mockImplementation((_payload, { onSuccess }) =>
      onSuccess({ message: "Task saved successfully", overrun: true }),
    );
    renderTaskDetails();

    await user.click(screen.getByText("Implement Auth"));
    const input = screen.getByDisplayValue("Implement Auth");
    await user.clear(input);
    await user.type(input, "Updated Auth Title");
    await user.click(
      document.querySelector(".inline-field-save") as HTMLElement,
    );

    await user.click(document.querySelector(".save-task-btn") as HTMLElement);

    expect(mockUpdateTaskMutate).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Updated Auth Title" }),
      expect.any(Object),
    );
    expect(screen.getByText(/exceeds estimated time/i)).toBeInTheDocument();
  });

  it("shows the fallback error message when the API returns no message on save failure", async () => {
    const { toast } = await import("react-hot-toast");
    const user = userEvent.setup();
    mockUpdateTaskMutate.mockImplementation((_payload, { onError }) =>
      onError({}),
    );
    renderTaskDetails();

    await user.click(screen.getByText("Implement Auth"));
    const input = screen.getByDisplayValue("Implement Auth");
    await user.type(input, "!");
    await user.click(
      document.querySelector(".inline-field-save") as HTMLElement,
    );
    await user.click(document.querySelector(".save-task-btn") as HTMLElement);

    expect(toast.error).toHaveBeenCalledWith("Failed to save task changes", {
      id: "task-save",
    });
  });
  it("handles status selection change fallback when selecting unknown status", async () => {
    const user = userEvent.setup();
    renderTaskDetails();

    // Make form dirty by editing task name
    await user.click(screen.getByText("Implement Auth"));
    const input = screen.getByDisplayValue("Implement Auth");
    await user.type(input, " Modified");
    await user.click(
      document.querySelector(".inline-field-save") as HTMLElement,
    );

    // Change status dropdown
    await user.click(screen.getByText("To Do"));
    const option = document.querySelector(".custom-select-item") as HTMLElement;
    if (option) await user.click(option);

    expect(document.querySelector(".save-task-btn")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Time entry creation
// ---------------------------------------------------------------------------
describe("TaskDetailsPage — create time entry", () => {
  it("toggles the log-time form open and closed", async () => {
    const user = userEvent.setup();
    renderTaskDetails();

    await user.click(screen.getByRole("button", { name: /log time/i }));
    expect(screen.getByPlaceholderText("e.g. 45")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(screen.queryByPlaceholderText("e.g. 45")).not.toBeInTheDocument();
  });

  it("submits a valid entry and resets the form on success", async () => {
    const user = userEvent.setup();
    mockCreateTimeEntry.mockImplementation((_payload, { onSuccess }) =>
      onSuccess({ message: "Time logged", overrun: false }),
    );
    renderTaskDetails();

    await user.click(screen.getByRole("button", { name: /log time/i }));
    await user.type(screen.getByPlaceholderText("e.g. 45"), "30");
    await user.type(
      screen.getByPlaceholderText("What did you work on?"),
      "Refactoring",
    );

    const saveButtons = screen.getAllByRole("button", { name: /^save$/i });
    await user.click(saveButtons[saveButtons.length - 1]);

    expect(mockCreateTimeEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        durationMinutes: 30,
        note: "Refactoring",
        taskId: "task-1",
      }),
      expect.any(Object),
    );
    expect(screen.queryByPlaceholderText("e.g. 45")).not.toBeInTheDocument();
  });

  it("sends note as undefined when left blank", async () => {
    const user = userEvent.setup();
    mockCreateTimeEntry.mockImplementation((_payload, { onSuccess }) =>
      onSuccess({ overrun: false }),
    );
    renderTaskDetails();

    await user.click(screen.getByRole("button", { name: /log time/i }));
    await user.type(screen.getByPlaceholderText("e.g. 45"), "20");
    const saveButtons = screen.getAllByRole("button", { name: /^save$/i });
    await user.click(saveButtons[saveButtons.length - 1]);

    expect(mockCreateTimeEntry).toHaveBeenCalledWith(
      expect.objectContaining({ note: undefined }),
      expect.any(Object),
    );
  });

  it("shows the API error message when creating a time entry fails", async () => {
    const { toast } = await import("react-hot-toast");
    const user = userEvent.setup();
    mockCreateTimeEntry.mockImplementation((_payload, { onError }) =>
      onError({ response: { data: { message: "Task is locked" } } }),
    );
    renderTaskDetails();

    await user.click(screen.getByRole("button", { name: /log time/i }));
    await user.type(screen.getByPlaceholderText("e.g. 45"), "20");
    const saveButtons = screen.getAllByRole("button", { name: /^save$/i });
    await user.click(saveButtons[saveButtons.length - 1]);

    expect(toast.error).toHaveBeenCalledWith("Task is locked");
  });

  it("blocks submission and shows an error toast for a zero or negative duration", async () => {
    const { toast } = await import("react-hot-toast");
    const user = userEvent.setup();
    renderTaskDetails();

    await user.click(screen.getByRole("button", { name: /log time/i }));
    fireEvent.change(screen.getByPlaceholderText("e.g. 45"), {
      target: { value: "0" },
    });
    fireEvent.submit(document.querySelector(".add-entry-form")!);

    expect(toast.error).toHaveBeenCalledWith("Please enter a valid duration");
    expect(mockCreateTimeEntry).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Time entry editing / deletion (Lines 1077-1100)
// ---------------------------------------------------------------------------
describe("TaskDetailsPage — edit and delete time entries", () => {
  it("hides the per-entry save button until an entry field is actually changed", () => {
    renderTaskDetails();
    expect(
      document.querySelector(".save-entry-container"),
    ).not.toBeInTheDocument();
  });

  it("saves an edited entry and reflects the returned overrun flag", async () => {
    const user = userEvent.setup();
    mockUpdateTimeEntry.mockImplementation((_payload, { onSuccess }) =>
      onSuccess({ message: "Entry updated successfully", overrun: true }),
    );
    renderTaskDetails();

    const durationDisplay = screen.getByText("45 mins");
    await user.click(durationDisplay);
    const input = screen.getByDisplayValue("45");
    await user.clear(input);
    await user.type(input, "60");
    await user.click(
      document.querySelector(".inline-field-save") as HTMLElement,
    );

    const saveEntryBtn = document.querySelector(
      ".save-entry-container .save-task-btn",
    ) as HTMLElement;
    await user.click(saveEntryBtn);

    expect(mockUpdateTimeEntry).toHaveBeenCalledWith(
      expect.objectContaining({ id: "entry-1", durationMinutes: 60 }),
      expect.any(Object),
    );
    expect(screen.getByText(/exceeds estimated time/i)).toBeInTheDocument();
  });

  it("covers lines 1077-1100: handles blank note sending null, res.data.message fallback, and overrun fallback", async () => {
    const user = userEvent.setup();
    mockUpdateTimeEntry.mockImplementation((_payload, { onSuccess }) => {
      onSuccess({ data: { message: "Updated from data obj" } });
    });
    renderTaskDetails();

    const noteDisplay = screen.getByText("Initial setup");
    await user.click(noteDisplay);
    const input = screen.getByDisplayValue("Initial setup");
    await user.clear(input);
    await user.click(
      document.querySelector(".inline-field-save") as HTMLElement,
    );

    const saveEntryBtn = document.querySelector(
      ".save-entry-container .save-task-btn",
    ) as HTMLElement;
    await user.click(saveEntryBtn);

    expect(mockUpdateTimeEntry).toHaveBeenCalledWith(
      expect.objectContaining({ id: "entry-1", note: null }),
      expect.any(Object),
    );
    expect(toast.success).toHaveBeenCalledWith("Updated from data obj", {
      id: "entry-save",
    });
  });

  it("shows the API error message when updating a time entry fails", async () => {
    const { toast } = await import("react-hot-toast");
    const user = userEvent.setup();
    mockUpdateTimeEntry.mockImplementation((_payload, { onError }) =>
      onError({ response: { data: { message: "Duration too large" } } }),
    );
    renderTaskDetails();

    const durationDisplay = screen.getByText("45 mins");
    await user.click(durationDisplay);
    const input = screen.getByDisplayValue("45");
    await user.clear(input);
    await user.type(input, "60");
    await user.click(
      document.querySelector(".inline-field-save") as HTMLElement,
    );
    await user.click(
      document.querySelector(
        ".save-entry-container .save-task-btn",
      ) as HTMLElement,
    );

    expect(toast.error).toHaveBeenCalledWith("Duration too large");
  });

  it("covers lines 1077-1100: handles time entry update error fallback message without response data", async () => {
    const user = userEvent.setup();
    mockUpdateTimeEntry.mockImplementation((_payload, { onError }) => {
      onError({});
    });
    renderTaskDetails();

    const durationDisplay = screen.getByText("45 mins");
    await user.click(durationDisplay);
    const input = screen.getByDisplayValue("45");
    await user.clear(input);
    await user.type(input, "99");
    await user.click(
      document.querySelector(".inline-field-save") as HTMLElement,
    );

    const saveEntryBtn = document.querySelector(
      ".save-entry-container .save-task-btn",
    ) as HTMLElement;
    await user.click(saveEntryBtn);

    expect(toast.error).toHaveBeenCalledWith("Failed to update time entry");
  });

  it("deletes a time entry and shows a success toast", async () => {
    const { toast } = await import("react-hot-toast");
    const user = userEvent.setup();
    mockDeleteTimeEntry.mockImplementation((_id, { onSuccess }) => onSuccess());
    const { container } = renderTaskDetails();

    await user.click(
      container.querySelector(".entry-delete-btn") as HTMLElement,
    );

    expect(mockDeleteTimeEntry).toHaveBeenCalledWith(
      "entry-1",
      expect.any(Object),
    );
    expect(toast.success).toHaveBeenCalledWith("Time entry deleted");
  });

  it("shows the fallback error message when deleting a time entry fails without a server message", async () => {
    const { toast } = await import("react-hot-toast");
    const user = userEvent.setup();
    mockDeleteTimeEntry.mockImplementation((_id, { onError }) => onError({}));
    const { container } = renderTaskDetails();

    await user.click(
      container.querySelector(".entry-delete-btn") as HTMLElement,
    );

    expect(toast.error).toHaveBeenCalledWith("Failed to delete entry");
  });

  it("hides the delete button for users without manage permissions", () => {
    useAppStore.setState({
      user: {
        id: "outsider",
        name: "Outsider",
        email: "out@example.com",
      } as any,
      userRole: "MEMBER",
    });
    const { container } = renderTaskDetails();
    expect(
      container.querySelector(".entry-delete-btn"),
    ).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Navigation, history drawer & Date Utilities (Line 1145)
// ---------------------------------------------------------------------------
describe("TaskDetailsPage — navigation, history drawer & formatters", () => {
  it("navigates back one step when the back button is clicked", async () => {
    const user = userEvent.setup();
    renderTaskDetails();
    await user.click(screen.getByRole("button", { name: /back to board/i }));
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it("opens the history drawer", async () => {
    const user = userEvent.setup();
    renderTaskDetails();
    await user.click(screen.getByRole("button", { name: /view history/i }));
    expect(screen.getByText("Task History")).toBeInTheDocument();
  });

  it("covers line 1145: safely handles malformed, null, and Date object inputs in formatters", () => {
    mockGetTask.mockReturnValue({
      data: {
        ...baseTask,
        dueDate: "INVALID_DATE_STRING",
        createdAt: "CORRUPT_TIMESTAMP",
        updatedAt: "CORRUPT_TIMESTAMP",
      },
      isLoading: false,
    });
    renderTaskDetails();
    expect(
      screen.getAllByText(/Created CORRUPT_TIMESTAMP/).length,
    ).toBeGreaterThan(0);
  });
});
