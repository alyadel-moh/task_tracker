import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CreateTaskModal from "../CreateTaskModal";

const mockMutate = vi.fn();
let mockIsPending = false;
const mockOnClose = vi.fn();

let mockStatuses: any[] = [
  { id: "status-1", name: "TODO", isDefault: true },
  { id: "status-2", name: "IN_PROGRESS", isDefault: false },
  { id: "status-3", name: "DONE", isDefault: false },
  { id: "status-4", name: "backlog_tasks", isDefault: false },
];

let mockMembers: any[] = [
  { id: "mem-1", userId: "user-1", name: "Alice", email: "alice@test.com" },
  { id: "mem-2", userId: "user-2", name: "Bob", email: "bob@test.com" },
  {
    id: "mem-3",
    userId: "current-user",
    name: "Current User",
    email: "current@test.com",
  },
];

vi.mock("../../hooks/createTaskHook", () => ({
  default: vi.fn(() => ({
    mutate: mockMutate,
    get isPending() {
      return mockIsPending;
    },
  })),
}));

vi.mock("../../hooks/getAllStatusesHook", () => ({
  default: vi.fn(() => ({ data: mockStatuses })),
}));

vi.mock("../../hooks/getAllprojectMembers", () => ({
  default: vi.fn(() => ({ data: mockMembers })),
}));

vi.mock("react-hot-toast", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("CreateTaskModal", () => {
  const userId = "current-user";
  const projectId = "proj-1";

  beforeEach(() => {
    vi.clearAllMocks();
    mockMutate.mockReset();
    mockIsPending = false;
    mockStatuses = [
      { id: "status-1", name: "TODO", isDefault: true },
      { id: "status-2", name: "IN_PROGRESS", isDefault: false },
      { id: "status-3", name: "DONE", isDefault: false },
      { id: "status-4", name: "backlog_tasks", isDefault: false },
    ];
    mockMembers = [
      { id: "mem-1", userId: "user-1", name: "Alice", email: "alice@test.com" },
      { id: "mem-2", userId: "user-2", name: "Bob", email: "bob@test.com" },
      {
        id: "mem-3",
        userId: "current-user",
        name: "Current User",
        email: "current@test.com",
      },
    ];
  });

  it("renders modal structure and fields", () => {
    render(
      <CreateTaskModal
        projectId={projectId}
        onClose={mockOnClose}
        userId={userId}
      />,
    );

    expect(
      screen.getByRole("heading", { name: /new task/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/design landing page hero/i),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/add more detail/i)).toBeInTheDocument();
    expect(screen.getByText("To Do")).toBeInTheDocument();
    expect(screen.getByText("Medium")).toBeInTheDocument();
  });

  describe("CreateTaskModal - custom dropdowns", () => {
    it("toggles multiple assignees on and off", async () => {
      const user = userEvent.setup();

      render(
        <CreateTaskModal
          projectId={projectId}
          onClose={mockOnClose}
          userId={userId}
        />,
      );

      const assigneeField = screen
        .getByText(/^assignees/i)
        .closest(".field") as HTMLElement;
      expect(assigneeField).toBeInTheDocument();

      const trigger = assigneeField.querySelector(
        ".custom-select-trigger",
      ) as HTMLElement;
      await user.click(trigger);

      const menu = assigneeField.querySelector(
        ".custom-select-menu",
      ) as HTMLElement;
      expect(menu).toBeInTheDocument();

      const aliceOption = within(menu).getByText("Alice");
      await user.click(aliceOption);

      const bobOption = within(menu).getByText("Bob");
      await user.click(bobOption);

      expect(
        assigneeField.querySelectorAll(".custom-select-item.selected"),
      ).toHaveLength(2);

      await user.click(within(menu).getByText("Alice"));

      expect(
        assigneeField.querySelectorAll(".custom-select-item.selected"),
      ).toHaveLength(1);
    });

    it("changes status from dropdown", async () => {
      const user = userEvent.setup();

      render(
        <CreateTaskModal
          projectId={projectId}
          onClose={mockOnClose}
          userId={userId}
        />,
      );

      const statusField = screen
        .getByText(/^status$/i)
        .closest(".field") as HTMLElement;
      const trigger = statusField.querySelector(
        ".custom-select-trigger",
      ) as HTMLElement;

      await user.click(trigger);

      const menu = statusField.querySelector(
        ".custom-select-menu",
      ) as HTMLElement;
      const inProgressOption = within(menu).getByText("In Progress");
      await user.click(inProgressOption);

      expect(within(statusField).getByText("In Progress")).toBeInTheDocument();
    });

    it("changes priority from dropdown", async () => {
      const user = userEvent.setup();

      render(
        <CreateTaskModal
          projectId={projectId}
          onClose={mockOnClose}
          userId={userId}
        />,
      );

      const priorityField = screen
        .getByText(/^priority$/i)
        .closest(".field") as HTMLElement;
      const trigger = priorityField.querySelector(
        ".custom-select-trigger",
      ) as HTMLElement;

      await user.click(trigger);

      const menu = priorityField.querySelector(
        ".custom-select-menu",
      ) as HTMLElement;
      const highOption = within(menu).getByText("High");
      await user.click(highOption);

      expect(within(priorityField).getByText("High")).toBeInTheDocument();
    });

    it("formats DONE and unrecognized status names correctly", async () => {
      const user = userEvent.setup();

      render(
        <CreateTaskModal
          projectId={projectId}
          onClose={mockOnClose}
          userId={userId}
        />,
      );

      const statusField = screen
        .getByText(/^status$/i)
        .closest(".field") as HTMLElement;
      const trigger = statusField.querySelector(
        ".custom-select-trigger",
      ) as HTMLElement;

      await user.click(trigger);
      let menu = statusField.querySelector(
        ".custom-select-menu",
      ) as HTMLElement;
      await user.click(within(menu).getByText("Done"));
      expect(within(statusField).getByText("Done")).toBeInTheDocument();

      await user.click(trigger);
      menu = statusField.querySelector(".custom-select-menu") as HTMLElement;
      await user.click(within(menu).getByText("Backlog Tasks"));
      expect(
        within(statusField).getByText("Backlog Tasks"),
      ).toBeInTheDocument();
    });

    it("falls back to the first status when none is marked default", () => {
      mockStatuses = [
        { id: "s1", name: "BACKLOG", isDefault: false },
        { id: "s2", name: "DONE", isDefault: false },
      ];

      render(
        <CreateTaskModal
          projectId={projectId}
          onClose={mockOnClose}
          userId={userId}
        />,
      );

      const statusField = screen
        .getByText(/^status$/i)
        .closest(".field") as HTMLElement;
      expect(within(statusField).getByText("Backlog")).toBeInTheDocument();
    });

    it("closes an open dropdown when clicking outside of it", async () => {
      const user = userEvent.setup();

      render(
        <CreateTaskModal
          projectId={projectId}
          onClose={mockOnClose}
          userId={userId}
        />,
      );

      const statusField = screen
        .getByText(/^status$/i)
        .closest(".field") as HTMLElement;
      const trigger = statusField.querySelector(
        ".custom-select-trigger",
      ) as HTMLElement;
      await user.click(trigger);
      expect(
        statusField.querySelector(".custom-select-menu"),
      ).toBeInTheDocument();

      await user.click(document.body);

      expect(
        statusField.querySelector(".custom-select-menu"),
      ).not.toBeInTheDocument();
    });

    it("shows an empty state when there are no assignable members", async () => {
      mockMembers = [];
      const user = userEvent.setup();

      render(
        <CreateTaskModal
          projectId={projectId}
          onClose={mockOnClose}
          userId={userId}
        />,
      );

      const assigneeField = screen
        .getByText(/^assignees/i)
        .closest(".field") as HTMLElement;
      const trigger = assigneeField.querySelector(
        ".custom-select-trigger",
      ) as HTMLElement;
      await user.click(trigger);

      expect(screen.getByText("No members found")).toBeInTheDocument();
    });

    it("resolves member id, name, and email through nested and fallback shapes, filtering the current user", async () => {
      mockMembers = [
        {
          id: "raw-1",
          user: { id: "user-1", name: "Alice", email: "alice@test.com" },
        },
        { id: "raw-2" },
        { id: "raw-3", userId: "current-user" },
      ];
      const user = userEvent.setup();

      render(
        <CreateTaskModal
          projectId={projectId}
          onClose={mockOnClose}
          userId={userId}
        />,
      );

      const assigneeField = screen
        .getByText(/^assignees/i)
        .closest(".field") as HTMLElement;
      const trigger = assigneeField.querySelector(
        ".custom-select-trigger",
      ) as HTMLElement;
      await user.click(trigger);

      const menu = assigneeField.querySelector(
        ".custom-select-menu",
      ) as HTMLElement;
      expect(within(menu).getByText("Alice")).toBeInTheDocument();
      expect(within(menu).getByText("Member")).toBeInTheDocument();
      expect(menu.querySelectorAll(".custom-select-item")).toHaveLength(2);
    });
  });

  describe("Form submissions", () => {
    it("submits the form with valid payload", async () => {
      const user = userEvent.setup();

      render(
        <CreateTaskModal
          projectId={projectId}
          onClose={mockOnClose}
          userId={userId}
        />,
      );

      const titleInput = screen.getByPlaceholderText(
        /design landing page hero/i,
      );
      await user.type(titleInput, "Refactor REST APIs");

      const submitBtn = screen.getByRole("button", { name: /create task/i });
      await user.click(submitBtn);

      expect(mockMutate).toHaveBeenCalledTimes(1);
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Refactor REST APIs",
          statusId: "status-1",
          priority: "MEDIUM",
          assignees: [],
          dueDate: null,
          estimatedTime: null,
        }),
        expect.any(Object),
      );
    });

    it("prevents submission and displays validation error when title is empty", async () => {
      const user = userEvent.setup();

      render(
        <CreateTaskModal
          projectId={projectId}
          onClose={mockOnClose}
          userId={userId}
        />,
      );

      const submitBtn = screen.getByRole("button", { name: /create task/i });
      await user.click(submitBtn);

      expect(mockMutate).not.toHaveBeenCalled();
      expect(
        await screen.findByText(/task title is required/i),
      ).toBeInTheDocument();
    });

    it("shows a validation error when estimated time is negative", async () => {
      const user = userEvent.setup();

      render(
        <CreateTaskModal
          projectId={projectId}
          onClose={mockOnClose}
          userId={userId}
        />,
      );

      await user.type(
        screen.getByPlaceholderText(/design landing page hero/i),
        "Task with bad estimate",
      );
      await user.type(screen.getByPlaceholderText(/e.g. 120/i), "-5");
      await user.click(screen.getByRole("button", { name: /create task/i }));

      expect(mockMutate).not.toHaveBeenCalled();
      expect(screen.getByPlaceholderText(/e.g. 120/i)).toHaveClass(
        "input-error",
      );
    });

    it("submits a converted ISO due date when one is chosen", async () => {
      const user = userEvent.setup();

      render(
        <CreateTaskModal
          projectId={projectId}
          onClose={mockOnClose}
          userId={userId}
        />,
      );

      await user.type(
        screen.getByPlaceholderText(/design landing page hero/i),
        "Task with due date",
      );

      const dueDateInput = document.querySelector(
        ".due-date-input",
      ) as HTMLInputElement;
      fireEventChange(dueDateInput, "2030-01-01T10:00");

      await user.click(screen.getByRole("button", { name: /create task/i }));

      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          dueDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
        }),
        expect.any(Object),
      );
    });

    it("calls showPicker when clicking the due date field, swallowing errors when unsupported", async () => {
      const original = (HTMLInputElement.prototype as any).showPicker;
      (HTMLInputElement.prototype as any).showPicker = () => {
        throw new Error("not supported in this environment");
      };
      const user = userEvent.setup();

      render(
        <CreateTaskModal
          projectId={projectId}
          onClose={mockOnClose}
          userId={userId}
        />,
      );

      const dueDateInput = document.querySelector(
        ".due-date-input",
      ) as HTMLInputElement;

      await expect(user.click(dueDateInput)).resolves.not.toThrow();

      (HTMLInputElement.prototype as any).showPicker = original;
    });

    it("invokes showPicker successfully when supported", async () => {
      const showPicker = vi.fn();
      (HTMLInputElement.prototype as any).showPicker = showPicker;
      const user = userEvent.setup();

      render(
        <CreateTaskModal
          projectId={projectId}
          onClose={mockOnClose}
          userId={userId}
        />,
      );

      const dueDateInput = document.querySelector(
        ".due-date-input",
      ) as HTMLInputElement;
      await user.click(dueDateInput);

      expect(showPicker).toHaveBeenCalled();
      delete (HTMLInputElement.prototype as any).showPicker;
    });

    it("shows the default success message, resets, and closes on success", async () => {
      const { toast } = await import("react-hot-toast");
      mockMutate.mockImplementation((_payload, { onSuccess }) => {
        onSuccess({});
      });
      const user = userEvent.setup();

      render(
        <CreateTaskModal
          projectId={projectId}
          onClose={mockOnClose}
          userId={userId}
        />,
      );

      await user.type(
        screen.getByPlaceholderText(/design landing page hero/i),
        "Task done",
      );
      await user.click(screen.getByRole("button", { name: /create task/i }));

      expect(toast.success).toHaveBeenCalledWith("Task created successfully!");
      expect(mockOnClose).toHaveBeenCalled();
    });

    it("shows a custom success message when provided", async () => {
      const { toast } = await import("react-hot-toast");
      mockMutate.mockImplementation((_payload, { onSuccess }) => {
        onSuccess({ message: "Custom task success" });
      });
      const user = userEvent.setup();

      render(
        <CreateTaskModal
          projectId={projectId}
          onClose={mockOnClose}
          userId={userId}
        />,
      );

      await user.type(
        screen.getByPlaceholderText(/design landing page hero/i),
        "Task done",
      );
      await user.click(screen.getByRole("button", { name: /create task/i }));

      expect(toast.success).toHaveBeenCalledWith("Custom task success");
    });

    it("shows the server error message on failure", async () => {
      const { toast } = await import("react-hot-toast");
      mockMutate.mockImplementation((_payload, { onError }) => {
        onError({
          response: { data: { message: "Task name already exists" } },
        });
      });
      const user = userEvent.setup();

      render(
        <CreateTaskModal
          projectId={projectId}
          onClose={mockOnClose}
          userId={userId}
        />,
      );

      await user.type(
        screen.getByPlaceholderText(/design landing page hero/i),
        "Duplicate task",
      );
      await user.click(screen.getByRole("button", { name: /create task/i }));

      expect(toast.error).toHaveBeenCalledWith("Task name already exists");
    });

    it("falls back to a default error message when none is provided", async () => {
      const { toast } = await import("react-hot-toast");
      mockMutate.mockImplementation((_payload, { onError }) => {
        onError({});
      });
      const user = userEvent.setup();

      render(
        <CreateTaskModal
          projectId={projectId}
          onClose={mockOnClose}
          userId={userId}
        />,
      );

      await user.type(
        screen.getByPlaceholderText(/design landing page hero/i),
        "Task",
      );
      await user.click(screen.getByRole("button", { name: /create task/i }));

      expect(toast.error).toHaveBeenCalledWith(
        "Failed to create task. Please try again.",
      );
    });
  });

  describe("Modal chrome", () => {
    it("renders the pending loading state on the submit button", () => {
      mockIsPending = true;

      render(
        <CreateTaskModal
          projectId={projectId}
          onClose={mockOnClose}
          userId={userId}
        />,
      );

      expect(screen.getByText("Creating...")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /creating\.\.\./i }),
      ).toBeDisabled();
    });

    it("closes on close button, Escape key, and backdrop click", () => {
      render(
        <CreateTaskModal
          projectId={projectId}
          onClose={mockOnClose}
          userId={userId}
        />,
      );

      fireClick(screen.getByRole("button", { name: "Close" }));
      expect(mockOnClose).toHaveBeenCalledTimes(1);

      fireKeyDown(document, "Escape");
      expect(mockOnClose).toHaveBeenCalledTimes(2);

      fireKeyDown(document, "Enter");
      expect(mockOnClose).toHaveBeenCalledTimes(2);

      fireClick(screen.getByRole("dialog").parentElement as HTMLElement);
      expect(mockOnClose).toHaveBeenCalledTimes(3);

      fireClick(screen.getByRole("dialog"));
      expect(mockOnClose).toHaveBeenCalledTimes(3);
    });

    it("removes the keydown listener on unmount", () => {
      const removeSpy = vi.spyOn(document, "removeEventListener");

      const { unmount } = render(
        <CreateTaskModal
          projectId={projectId}
          onClose={mockOnClose}
          userId={userId}
        />,
      );

      unmount();

      expect(removeSpy).toHaveBeenCalledWith("keydown", expect.any(Function));

      fireKeyDown(document, "Escape");
      expect(mockOnClose).not.toHaveBeenCalled();

      removeSpy.mockRestore();
    });
  });
});

function fireClick(element: HTMLElement) {
  element.dispatchEvent(
    new MouseEvent("click", { bubbles: true, cancelable: true }),
  );
}

function fireKeyDown(target: Document, key: string) {
  target.dispatchEvent(
    new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }),
  );
}

function fireEventChange(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value",
  )?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}
