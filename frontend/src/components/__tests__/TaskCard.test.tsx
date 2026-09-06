import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi, beforeEach } from "vitest";
import TaskCard from "../TaskCard";
import { useAppStore } from "../../store/useAppStore";
import { useDraggable } from "@dnd-kit/core";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

let mockIsDragging = false;
let mockTransform: any = null;

vi.mock("@dnd-kit/core", () => ({
  useDraggable: vi.fn(() => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: mockTransform,
    isDragging: mockIsDragging,
  })),
}));

let mockIsPending = false;
let mockDeleteData: any = { message: "Task deleted successfully!" };
const mockMutate = vi.fn();

vi.mock("../../hooks/deleteTaskHook", () => ({
  default: vi.fn(() => ({
    mutate: mockMutate,
    isPending: mockIsPending,
    data: mockDeleteData,
  })),
}));

vi.mock("react-hot-toast", () => ({
  toast: { success: vi.fn(), error: vi.fn(), dismiss: vi.fn() },
}));

const sampleTask = {
  id: "t1",
  projectId: "p1",
  name: "Fix login bug",
  description: "Resolve token expiration issue",
  priority: "HIGH" as const,
  statusName: "TODO",
  dueDate: new Date(Date.now() - 86400000).toISOString(), // Overdue
  estimatedTime: 45,
  creator: { id: "u1", name: "Aly", email: "aly@example.com" },
  createdBy: "u1",
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:00:00.000Z",
  statusId: "s1",
  assignees: [],
};

const renderTaskCard = (task = sampleTask) => {
  return render(
    <MemoryRouter>
      <TaskCard task={task} />
    </MemoryRouter>,
  );
};

beforeEach(() => {
  vi.clearAllMocks();
  mockIsPending = false;
  mockIsDragging = false;
  mockTransform = null;
  mockDeleteData = { message: "Task deleted successfully!" };
  useAppStore.setState({ userRole: "OWNER", user: { id: "u1" } as any });
});

describe("TaskCard", () => {
  it("renders task metadata, badges, and due labels successfully", () => {
    renderTaskCard();

    expect(screen.getByText("Fix login bug")).toBeInTheDocument();
    expect(
      screen.getByText("Resolve token expiration issue"),
    ).toBeInTheDocument();
    expect(screen.getByText("High")).toBeInTheDocument();
    expect(screen.getByText("Overdue")).toBeInTheDocument();
    expect(screen.getByText("45")).toBeInTheDocument();
  });

  it("navigates to the task details page when clicked and not dragging", async () => {
    const user = userEvent.setup();
    renderTaskCard();

    await user.click(screen.getByText("Fix login bug"));
    expect(mockNavigate).toHaveBeenCalledWith("/projects/p1/task/t1");
  });

  it("does not navigate when task card is clicked while dragging", async () => {
    mockIsDragging = true;
    mockTransform = { x: 20, y: 30 };
    vi.mocked(useDraggable).mockReturnValue({
      attributes: {},
      listeners: {},
      setNodeRef: vi.fn(),
      transform: mockTransform,
      isDragging: true,
    } as any);

    const user = userEvent.setup();
    const { container } = renderTaskCard();

    expect(container.querySelector(".task-card-dragging")).toBeInTheDocument();

    await user.click(screen.getByText("Fix login bug"));
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("covers due label calculation branches: today, tomorrow, and future days (Lines 72-74)", () => {
    const now = new Date();

    // 1. Due today
    const dueToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      0,
    ).toISOString();
    const { rerender } = renderTaskCard({ ...sampleTask, dueDate: dueToday });
    expect(screen.getByText("Due today")).toBeInTheDocument();

    // 2. Due tomorrow
    const dueTomorrow = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      12,
      0,
      0,
    ).toISOString();
    rerender(
      <MemoryRouter>
        <TaskCard task={{ ...sampleTask, dueDate: dueTomorrow }} />
      </MemoryRouter>,
    );
    expect(screen.getByText("Due tomorrow")).toBeInTheDocument();

    // 3. Due in 5 days
    const dueIn5Days = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 5,
      12,
      0,
      0,
    ).toISOString();
    rerender(
      <MemoryRouter>
        <TaskCard task={{ ...sampleTask, dueDate: dueIn5Days }} />
      </MemoryRouter>,
    );
    expect(screen.getByText("Due in 5d")).toBeInTheDocument();
  });

  it("handles tasks in DONE status and tasks without due date (Lines 82-83)", () => {
    const { container } = renderTaskCard({
      ...sampleTask,
      statusName: "DONE",
      dueDate: new Date(Date.now() - 86400000).toISOString(),
    });

    expect(container.querySelector(".task-card-done")).toBeInTheDocument();
    expect(screen.queryByText("Overdue")).not.toBeInTheDocument();
  });

  it("renders priority labels for MEDIUM and LOW and handles missing optional fields", () => {
    const { rerender } = renderTaskCard({
      ...sampleTask,
      priority: "MEDIUM",
      description: null as any,
      dueDate: null as any,
      estimatedTime: null as any,
    });
    expect(screen.getByText("Medium")).toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <TaskCard
          task={{
            ...sampleTask,
            priority: "LOW",
            description: null as any,
            dueDate: null as any,
            estimatedTime: null as any,
          }}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText("Low")).toBeInTheDocument();
  });

  it("opens the delete confirmation modal when delete button is clicked", async () => {
    const user = userEvent.setup();
    renderTaskCard();

    const deleteButton = screen.getByRole("button", {
      name: /delete fix login bug/i,
    });
    await user.click(deleteButton);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText('Delete "Fix login bug"?')).toBeInTheDocument();
  });

  it("closes modal on cancel button, modal close X icon, and overlay click (Line 196)", async () => {
    const user = userEvent.setup();
    renderTaskCard();

    // 1. Close via Cancel button
    await user.click(
      screen.getByRole("button", { name: /delete fix login bug/i }),
    );
    await user.click(screen.getByRole("button", { name: /^cancel$/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // 2. Close via Top-Right X button
    await user.click(
      screen.getByRole("button", { name: /delete fix login bug/i }),
    );
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // 3. Line 196: Close via overlay backdrop click
    await user.click(
      screen.getByRole("button", { name: /delete fix login bug/i }),
    );
    const overlay = document.querySelector(".modal-overlay")!;
    fireEvent.click(overlay);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // 4. Modal card click stops propagation
    await user.click(
      screen.getByRole("button", { name: /delete fix login bug/i }),
    );
    const modalCard = document.querySelector(".modal-card")!;
    fireEvent.click(modalCard);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("calls the delete mutation and handles success with fallback message", async () => {
    const user = userEvent.setup();
    const { toast } = await import("react-hot-toast");

    mockDeleteData = null; // Test fallback string "Task deleted successfully!"
    mockMutate.mockImplementation((_, { onSuccess }) => {
      onSuccess();
    });

    renderTaskCard();

    await user.click(
      screen.getByRole("button", { name: /delete fix login bug/i }),
    );
    await user.click(
      screen.getByRole("button", { name: /delete permanently/i }),
    );

    expect(mockMutate).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith("Task deleted successfully!");
  });

  it("handles delete mutation error with fallback message", async () => {
    const user = userEvent.setup();
    const { toast } = await import("react-hot-toast");

    mockMutate.mockImplementation((_, { onError }) => {
      onError({});
    });

    renderTaskCard();

    await user.click(
      screen.getByRole("button", { name: /delete fix login bug/i }),
    );
    await user.click(
      screen.getByRole("button", { name: /delete permanently/i }),
    );

    expect(toast.error).toHaveBeenCalledWith(
      "Failed to delete task. Please try again.",
    );
  });

  it("renders pending state when isPending is true (Line 212)", async () => {
    mockIsPending = true;
    const user = userEvent.setup();
    renderTaskCard();

    await user.click(
      screen.getByRole("button", { name: /delete fix login bug/i }),
    );

    expect(screen.getByText(/deleting.../i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^cancel$/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /deleting.../i })).toBeDisabled();
  });

  it("hides delete button for non-owners who did not create the task", () => {
    useAppStore.setState({ userRole: "MEMBER", user: { id: "u2" } as any });
    renderTaskCard({ ...sampleTask, createdBy: "u1" });

    expect(
      screen.queryByRole("button", { name: /delete/i }),
    ).not.toBeInTheDocument();
  });

  it("shows delete button for non-owners if they are the task creator", () => {
    useAppStore.setState({ userRole: "MEMBER", user: { id: "u1" } as any });
    renderTaskCard({ ...sampleTask, createdBy: "u1" });

    expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument();
  });
});
