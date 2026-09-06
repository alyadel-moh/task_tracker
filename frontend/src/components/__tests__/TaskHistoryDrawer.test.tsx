import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import React from "react";
import TaskHistoryDrawer from "../TaskHistoryDrawer";
import { useAppStore } from "../../store/useAppStore";
import type { HistoryEntry } from "../types";

vi.mock("../../hooks/getTaskHistoryHook", () => ({
  default: vi.fn(),
}));
import useGetTaskHistory from "../../hooks/getTaskHistoryHook";

describe("TaskHistoryDrawer 100% Branch Coverage", () => {
  const mockOnClose = vi.fn();
  const taskId = "task-100";

  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState({
      user: {
        id: "u-current",
        name: "Current User",
        email: "current@example.com",
      } as any,
    });
  });

  describe("Drawer State & Visibility", () => {
    it("renders with open classes when isOpen is true", () => {
      vi.mocked(useGetTaskHistory).mockReturnValue({
        data: [],
        isLoading: false,
      } as any);

      const { container } = render(
        <TaskHistoryDrawer
          isOpen={true}
          onClose={mockOnClose}
          taskId={taskId}
        />,
      );

      expect(
        container.querySelector(".history-drawer-open"),
      ).toBeInTheDocument();
      expect(
        container.querySelector(".history-drawer-overlay-open"),
      ).toBeInTheDocument();
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("does not have open classes when isOpen is false", () => {
      vi.mocked(useGetTaskHistory).mockReturnValue({
        data: [],
        isLoading: false,
      } as any);

      const { container } = render(
        <TaskHistoryDrawer
          isOpen={false}
          onClose={mockOnClose}
          taskId={taskId}
        />,
      );

      expect(
        container.querySelector(".history-drawer-open"),
      ).not.toBeInTheDocument();
      expect(
        container.querySelector(".history-drawer-overlay-open"),
      ).not.toBeInTheDocument();
    });

    it("triggers onClose when clicking close button and backdrop overlay", async () => {
      const user = userEvent.setup();
      vi.mocked(useGetTaskHistory).mockReturnValue({
        data: [],
        isLoading: false,
      } as any);

      const { container } = render(
        <TaskHistoryDrawer
          isOpen={true}
          onClose={mockOnClose}
          taskId={taskId}
        />,
      );

      await user.click(screen.getByRole("button", { name: /close/i }));
      expect(mockOnClose).toHaveBeenCalledTimes(1);

      const overlay = container.querySelector(
        ".history-drawer-overlay",
      ) as HTMLElement;
      await user.click(overlay);
      expect(mockOnClose).toHaveBeenCalledTimes(2);
    });
  });

  describe("Loading & Empty States", () => {
    it("displays loading spinner and text while fetching history", () => {
      vi.mocked(useGetTaskHistory).mockReturnValue({
        data: undefined,
        isLoading: true,
      } as any);

      render(
        <TaskHistoryDrawer
          isOpen={true}
          onClose={mockOnClose}
          taskId={taskId}
        />,
      );

      expect(screen.getByText("Loading timeline...")).toBeInTheDocument();
      expect(
        screen.queryByText("No activity recorded yet."),
      ).not.toBeInTheDocument();
    });

    it("displays empty state placeholder when no entries exist", () => {
      vi.mocked(useGetTaskHistory).mockReturnValue({
        data: [],
        isLoading: false,
      } as any);

      render(
        <TaskHistoryDrawer
          isOpen={true}
          onClose={mockOnClose}
          taskId={taskId}
        />,
      );

      expect(screen.getByText("No activity recorded yet.")).toBeInTheDocument();
      expect(screen.queryByText("Loading timeline...")).not.toBeInTheDocument();
    });
  });

  describe("History Events & Formatters (Lines 369, 396, 434-442, 457, 468)", () => {
    it("renders task creation, field updates, and formatting helpers", () => {
      const entries: HistoryEntry[] = [
        {
          id: "h1",
          eventType: "TASK_CREATED",
          actor: { name: "Aly Adel" },
          createdAt: new Date().toISOString(),
        } as any,
        {
          id: "h2",
          eventType: "FIELD_UPDATED",
          fieldChanged: "priority",
          oldValue: "LOW",
          newValue: "HIGH",
          actor: { name: "Sarah" },
          createdAt: new Date().toISOString(),
        } as any,
        {
          id: "h3",
          eventType: "FIELD_UPDATED",
          fieldChanged: "dueDate",
          oldValue: null,
          newValue: "2026-09-15T00:00:00Z on Tuesday",
          actor: { name: "Sarah" },
          createdAt: new Date().toISOString(),
        } as any,
        {
          id: "h4",
          eventType: "FIELD_UPDATED",
          fieldChanged: "custom_status",
          oldValue: "DRAFT",
          newValue: "UNDER_REVIEW",
          actor: { name: "Sarah" },
          createdAt: new Date().toISOString(),
        } as any,
        {
          id: "h5",
          eventType: "FIELD_UPDATED",
          fieldChanged: "custom_notes",
          oldValue: "Old text",
          newValue: null,
          actor: { name: "Sarah" },
          createdAt: new Date().toISOString(),
        } as any,
      ];

      vi.mocked(useGetTaskHistory).mockReturnValue({
        data: entries,
        isLoading: false,
      } as any);

      render(
        <TaskHistoryDrawer
          isOpen={true}
          onClose={mockOnClose}
          taskId={taskId}
        />,
      );

      expect(screen.getByText("5")).toHaveClass("history-drawer-count");
      expect(screen.getByText("Aly Adel")).toBeInTheDocument();
      expect(screen.getByText("Priority")).toBeInTheDocument();
      expect(screen.getByText("Low")).toBeInTheDocument();
      expect(screen.getByText("High")).toBeInTheDocument();
      expect(screen.getByText("Due Date")).toBeInTheDocument();
      expect(screen.getByText("custom_status")).toBeInTheDocument();
      expect(screen.getByText("Under Review")).toBeInTheDocument();
      expect(screen.getByText("custom_notes")).toBeInTheDocument();
      expect(
        screen.getByText(
          (_c, el) =>
            el?.classList.contains("history-line") &&
            el.textContent?.includes("cleared custom_notes"),
        ),
      ).toBeInTheDocument();
    });

    it("hits line 369: status changed with empty old value and fieldChanged='status'", () => {
      const entries: HistoryEntry[] = [
        {
          id: "h-status-none",
          eventType: "STATUS_CHANGED",
          fieldChanged: "status",
          oldValue: null,
          newValue: "TODO",
          actor: { name: "Aly" },
          createdAt: new Date().toISOString(),
        } as any,
        {
          id: "h-status-from-field-updated",
          eventType: "FIELD_UPDATED",
          fieldChanged: "status",
          oldValue: "TODO",
          newValue: "DONE",
          actor: { name: "Aly" },
          createdAt: new Date().toISOString(),
        } as any,
      ];

      vi.mocked(useGetTaskHistory).mockReturnValue({
        data: entries,
        isLoading: false,
      } as any);

      render(
        <TaskHistoryDrawer
          isOpen={true}
          onClose={mockOnClose}
          taskId={taskId}
        />,
      );

      expect(
        screen.getByText(
          (_c, el) =>
            el?.classList.contains("history-line") &&
            el.textContent?.includes("moved this task from None to To Do"),
        ),
      ).toBeInTheDocument();

      expect(
        screen.getByText(
          (_c, el) =>
            el?.classList.contains("history-line") &&
            el.textContent?.includes("moved this task from To Do to Done"),
        ),
      ).toBeInTheDocument();
    });

    it("hits line 396: TIME_ENTRY_ENTRY_UPDATED and TIME_ENTRY_UPDATED all 3 formatting branches", () => {
      const entries: HistoryEntry[] = [
        // 1. fieldName && oldVal && newVal
        {
          id: "h-entry-updated-from-to",
          eventType: "TIME_ENTRY_ENTRY_UPDATED",
          fieldChanged: "note",
          oldValue: "Draft",
          newValue: "Final note",
          actor: { name: "Bob" },
          createdAt: new Date().toISOString(),
        } as any,
        // 2. fieldName && !oldVal && newVal
        {
          id: "h-entry-updated-to-only",
          eventType: "TIME_ENTRY_ENTRY_UPDATED",
          fieldChanged: "note",
          oldValue: null,
          newValue: "Added note",
          actor: { name: "Bob" },
          createdAt: new Date().toISOString(),
        } as any,
        // 3. !fieldName || (!oldVal && !newVal)
        {
          id: "h-entry-updated-generic",
          eventType: "TIME_ENTRY_ENTRY_UPDATED",
          fieldChanged: null,
          oldValue: null,
          newValue: null,
          actor: { name: "Bob" },
          createdAt: new Date().toISOString(),
        } as any,
      ];

      vi.mocked(useGetTaskHistory).mockReturnValue({
        data: entries,
        isLoading: false,
      } as any);

      render(
        <TaskHistoryDrawer
          isOpen={true}
          onClose={mockOnClose}
          taskId={taskId}
        />,
      );

      expect(
        screen.getByText(
          (_c, el) =>
            el?.classList.contains("history-line") &&
            el.textContent?.includes(
              "Bob updated time entry Note from Draft to Final note",
            ),
        ),
      ).toBeInTheDocument();

      expect(
        screen.getByText(
          (_c, el) =>
            el?.classList.contains("history-line") &&
            el.textContent?.includes(
              "Bob updated time entry Note to Added note",
            ),
        ),
      ).toBeInTheDocument();

      expect(
        screen.getByText(
          (_c, el) =>
            el?.classList.contains("history-line") &&
            el.textContent?.includes("Bob updated a time entry"),
        ),
      ).toBeInTheDocument();
    });

    it("covers lines 434-442: TIME_ENTRY_UPDATED field formatting permutations", () => {
      const entries: HistoryEntry[] = [
        {
          id: "h-time-update-to-only",
          eventType: "TIME_ENTRY_UPDATED",
          fieldChanged: "durationMinutes",
          oldValue: null,
          newValue: "40 mins",
          actor: { name: "Bob" },
          createdAt: new Date().toISOString(),
        } as any,
        {
          id: "h-time-update-generic",
          eventType: "TIME_ENTRY_UPDATED",
          fieldChanged: null,
          oldValue: null,
          newValue: null,
          actor: { name: "Bob" },
          createdAt: new Date().toISOString(),
        } as any,
      ];

      vi.mocked(useGetTaskHistory).mockReturnValue({
        data: entries,
        isLoading: false,
      } as any);

      render(
        <TaskHistoryDrawer
          isOpen={true}
          onClose={mockOnClose}
          taskId={taskId}
        />,
      );

      expect(
        screen.getByText((_content, element) => {
          return (
            element?.classList.contains("history-line") &&
            element.textContent?.includes(
              "Bob updated time entry Duration to 40 mins",
            )
          );
        }),
      ).toBeInTheDocument();

      expect(
        screen.getByText((_content, element) => {
          return (
            element?.classList.contains("history-line") &&
            element.textContent?.includes("Bob updated a time entry")
          );
        }),
      ).toBeInTheDocument();
    });

    it("covers line 457: field updated without oldValue (updated field to newValue)", () => {
      const entries: HistoryEntry[] = [
        {
          id: "h-field-to-only",
          eventType: "FIELD_UPDATED",
          fieldChanged: "description",
          oldValue: null,
          newValue: "New Description",
          actor: { name: "Alice" },
          createdAt: new Date().toISOString(),
        } as any,
      ];

      vi.mocked(useGetTaskHistory).mockReturnValue({
        data: entries,
        isLoading: false,
      } as any);

      render(
        <TaskHistoryDrawer
          isOpen={true}
          onClose={mockOnClose}
          taskId={taskId}
        />,
      );

      expect(
        screen.getByText((_content, element) => {
          return (
            element?.classList.contains("history-line") &&
            element.textContent?.includes(
              "Alice updated Description to New Description",
            )
          );
        }),
      ).toBeInTheDocument();
    });

    it("covers line 468 & fallback icons: unknown event and task deleted", () => {
      const entries: HistoryEntry[] = [
        {
          id: "h-unknown",
          eventType: "UNKNOWN_EVENT_TYPE",
          actor: null,
          createdAt: new Date().toISOString(),
        } as any,
        {
          id: "h-deleted",
          eventType: "TASK_DELETED",
          actor: { name: "Moderator" },
          createdAt: new Date().toISOString(),
        } as any,
      ];

      vi.mocked(useGetTaskHistory).mockReturnValue({
        data: entries,
        isLoading: false,
      } as any);

      render(
        <TaskHistoryDrawer
          isOpen={true}
          onClose={mockOnClose}
          taskId={taskId}
        />,
      );

      const updatedElements = screen.getAllByText((_content, element) => {
        return (
          element?.classList.contains("history-line") &&
          element.textContent?.includes("updated the task")
        );
      });
      expect(updatedElements.length).toBe(2);

      expect(screen.getByText("A user")).toBeInTheDocument();
      expect(screen.getByText("Moderator")).toBeInTheDocument();
    });
  });

  describe("Assignees Changes Full Branch Coverage (Lines 135, 146, 261, 356)", () => {
    it("hits line 135: parseAssigneeList returns empty array when value is null, empty string, or non-array JSON", () => {
      const entries: HistoryEntry[] = [
        {
          id: "h-null-val",
          eventType: "ASSIGNEES_CHANGED",
          actor: { id: "u-1", name: "Aly" },
          oldValue: null,
          newValue: "",
          createdAt: new Date().toISOString(),
        } as any,
        {
          id: "h-non-array-json",
          eventType: "ASSIGNEES_CHANGED",
          actor: { id: "u-1", name: "Aly" },
          oldValue: JSON.stringify({ notAnArray: true }),
          newValue: JSON.stringify(123),
          createdAt: new Date().toISOString(),
        } as any,
      ];

      vi.mocked(useGetTaskHistory).mockReturnValue({
        data: entries,
        isLoading: false,
      } as any);

      render(
        <TaskHistoryDrawer
          isOpen={true}
          onClose={mockOnClose}
          taskId={taskId}
        />,
      );

      const updatedLines = screen.getAllByText(
        (_c, el) =>
          el?.classList.contains("history-line") &&
          el.textContent?.includes("Aly updated assignees"),
      );
      expect(updatedLines.length).toBe(2);
    });

    it("hits line 146 & 261: missing id/name/email/photoUrl and unassigned 'None' badge", () => {
      const entries: HistoryEntry[] = [
        {
          id: "h-empty-props",
          eventType: "ASSIGNEES_CHANGED",
          actor: { id: "u-admin", name: "Admin" },
          oldValue: JSON.stringify([
            {}, // lacks id, userId, name -> id becomes "", name becomes "Unknown user", photoUrl becomes null
          ]),
          newValue: JSON.stringify([
            {
              id: "u-no-email",
              name: "No Email",
              email: undefined,
              photoUrl: null,
            }, // no email, no photo
          ]),
          createdAt: new Date().toISOString(),
        } as any,
      ];

      vi.mocked(useGetTaskHistory).mockReturnValue({
        data: entries,
        isLoading: false,
      } as any);

      const { container } = render(
        <TaskHistoryDrawer
          isOpen={true}
          onClose={mockOnClose}
          taskId={taskId}
        />,
      );

      expect(screen.getByText("Unknown user")).toBeInTheDocument();
      expect(screen.getByText("No Email")).toBeInTheDocument();
      // Email span not rendered
      expect(
        container.querySelector(".history-assignee-card-email"),
      ).not.toBeInTheDocument();
    });

    it("hits line 356: granular diff with photoUrl, fallback userId, and You tag", () => {
      const entries: HistoryEntry[] = [
        {
          id: "h-diff-both-full",
          eventType: "ASSIGNEES_CHANGED",
          actor: { id: "u-admin", name: "Admin" },
          oldValue: JSON.stringify([
            {
              userId: "u-removed-user",
              name: "Old Person",
              email: "old@test.com",
            },
          ]),
          newValue: JSON.stringify([
            {
              id: "u-current",
              name: "Current User",
              email: "current@test.com",
              photoUrl: "https://avatar.com/me.png",
            },
          ]),
          createdAt: new Date().toISOString(),
        } as any,
      ];

      vi.mocked(useGetTaskHistory).mockReturnValue({
        data: entries,
        isLoading: false,
      } as any);

      const { container } = render(
        <TaskHistoryDrawer
          isOpen={true}
          onClose={mockOnClose}
          taskId={taskId}
        />,
      );

      expect(
        container.querySelector(".history-granular-diff"),
      ).toBeInTheDocument();
      expect(screen.getByText("+ Added")).toBeInTheDocument();
      expect(screen.getByText("− Removed")).toBeInTheDocument();
      expect(screen.getByText("Current User")).toBeInTheDocument();
      expect(screen.getByText("You")).toBeInTheDocument();
      expect(screen.getByText("Old Person")).toBeInTheDocument();

      const img = screen.getByRole("img", { name: "Current User" });
      expect(img).toHaveAttribute("src", "https://avatar.com/me.png");
    });

    it("handles assignee no-op change, self removal, and single/multiple additions and removals", () => {
      const entries: HistoryEntry[] = [
        {
          id: "h-no-op",
          eventType: "ASSIGNEES_CHANGED",
          actor: { id: "u-1", name: "Aly" },
          oldValue: JSON.stringify([{ id: "u-1", name: "Aly" }]),
          newValue: JSON.stringify([{ id: "u-1", name: "Aly" }]),
          createdAt: new Date().toISOString(),
        } as any,
        {
          id: "h-self-remove",
          eventType: "ASSIGNEES_CHANGED",
          actor: { id: "u-1", name: "Aly" },
          oldValue: JSON.stringify([{ id: "u-1", name: "Aly" }]),
          newValue: JSON.stringify([]),
          createdAt: new Date().toISOString(),
        } as any,
        {
          id: "h-multi-add",
          eventType: "ASSIGNEES_CHANGED",
          actor: { id: "u-admin", name: "Admin" },
          oldValue: JSON.stringify([]),
          newValue: JSON.stringify([
            { id: "u-2", name: "Dev 1" },
            { id: "u-3", name: "Dev 2" },
          ]),
          createdAt: new Date().toISOString(),
        } as any,
        {
          id: "h-multi-remove",
          eventType: "ASSIGNEES_CHANGED",
          actor: { id: "u-admin", name: "Admin" },
          oldValue: JSON.stringify([
            { id: "u-2", name: "Dev 1" },
            { id: "u-3", name: "Dev 2" },
          ]),
          newValue: JSON.stringify([]),
          createdAt: new Date().toISOString(),
        } as any,
        {
          id: "h-single-other-add",
          eventType: "ASSIGNEES_CHANGED",
          actor: { id: "u-admin", name: "Admin" },
          oldValue: JSON.stringify([]),
          newValue: JSON.stringify([{ id: "u-4", name: "Dev 3" }]),
          createdAt: new Date().toISOString(),
        } as any,
        {
          id: "h-single-other-remove",
          eventType: "ASSIGNEES_CHANGED",
          actor: { id: "u-admin", name: "Admin" },
          oldValue: JSON.stringify([{ id: "u-4", name: "Dev 3" }]),
          newValue: JSON.stringify([]),
          createdAt: new Date().toISOString(),
        } as any,
      ];

      vi.mocked(useGetTaskHistory).mockReturnValue({
        data: entries,
        isLoading: false,
      } as any);

      render(
        <TaskHistoryDrawer
          isOpen={true}
          onClose={mockOnClose}
          taskId={taskId}
        />,
      );

      expect(
        screen.getByText(
          (_c, el) =>
            el?.classList.contains("history-line") &&
            el.textContent?.includes("Aly updated assignees"),
        ),
      ).toBeInTheDocument();

      expect(
        screen.getByText(
          (_c, el) =>
            el?.classList.contains("history-line") &&
            el.textContent?.includes("Aly removed themselves from this task"),
        ),
      ).toBeInTheDocument();

      expect(
        screen.getByText(
          (_c, el) =>
            el?.classList.contains("history-line") &&
            el.textContent?.includes("Admin assigned 2 people to this task:"),
        ),
      ).toBeInTheDocument();

      expect(
        screen.getByText(
          (_c, el) =>
            el?.classList.contains("history-line") &&
            el.textContent?.includes("Admin removed 2 assignees:"),
        ),
      ).toBeInTheDocument();

      expect(
        screen.getByText(
          (_c, el) =>
            el?.classList.contains("history-line") &&
            el.textContent?.includes("Admin assigned someone to this task:"),
        ),
      ).toBeInTheDocument();

      expect(
        screen.getByText(
          (_c, el) =>
            el?.classList.contains("history-line") &&
            el.textContent?.includes("Admin removed an assignee:"),
        ),
      ).toBeInTheDocument();
    });

    it("handles legacy string fallback for assignee lists", () => {
      const entries: HistoryEntry[] = [
        {
          id: "h-legacy",
          eventType: "ASSIGNEES_CHANGED",
          actor: { id: "u-admin", name: "Admin" },
          oldValue: "",
          newValue: "Legacy Name",
          createdAt: new Date().toISOString(),
        } as any,
      ];

      vi.mocked(useGetTaskHistory).mockReturnValue({
        data: entries,
        isLoading: false,
      } as any);

      render(
        <TaskHistoryDrawer
          isOpen={true}
          onClose={mockOnClose}
          taskId={taskId}
        />,
      );

      expect(screen.getByText("Legacy Name")).toBeInTheDocument();
    });
  });

  describe("Date Grouping, Older Years & Catch Fallbacks", () => {
    it("groups dates from older years including the year in the group label", () => {
      const entries: HistoryEntry[] = [
        {
          id: "h-past-year",
          eventType: "TASK_CREATED",
          actor: { name: "System" },
          createdAt: "2024-05-12T10:00:00Z",
        } as any,
      ];

      vi.mocked(useGetTaskHistory).mockReturnValue({
        data: entries,
        isLoading: false,
      } as any);

      render(
        <TaskHistoryDrawer
          isOpen={true}
          onClose={mockOnClose}
          taskId={taskId}
        />,
      );

      expect(screen.getByText(/2024/)).toBeInTheDocument();
    });

    it("hits catch blocks in formatTime, formatFullTimestamp, and getGroupLabel", () => {
      const originalToLocaleString = Date.prototype.toLocaleString;
      const originalToLocaleDateString = Date.prototype.toLocaleDateString;

      Date.prototype.toLocaleString = vi.fn().mockImplementation(() => {
        throw new Error("Date string format error");
      });
      Date.prototype.toLocaleDateString = vi.fn().mockImplementation(() => {
        throw new Error("Date label format error");
      });

      const entries: HistoryEntry[] = [
        {
          id: "h-invalid-date",
          eventType: "TASK_CREATED",
          actor: { name: "System" },
          createdAt: "RAW_FALLBACK_STRING",
        } as any,
      ];

      vi.mocked(useGetTaskHistory).mockReturnValue({
        data: entries,
        isLoading: false,
      } as any);

      render(
        <TaskHistoryDrawer
          isOpen={true}
          onClose={mockOnClose}
          taskId={taskId}
        />,
      );

      expect(
        screen.getAllByText("RAW_FALLBACK_STRING").length,
      ).toBeGreaterThanOrEqual(1);

      Date.prototype.toLocaleString = originalToLocaleString;
      Date.prototype.toLocaleDateString = originalToLocaleDateString;
    });
  });
});
