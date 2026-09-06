import { beforeEach, describe, expect, it, vi } from "vitest";
import { TaskHistoryService } from "../taskHistoryService";
import { TaskHistoryRepository } from "../../repositories/taskHistoryRepository";
import { TaskRepository } from "../../repositories/taskReposiotry";

vi.mock("../../models", () => ({ TaskHistory: {}, User: {} }));
vi.mock("../../repositories/taskHistoryRepository", () => ({
  TaskHistoryRepository: { logTaskHistory: vi.fn(), fetchTaskHistory: vi.fn() },
}));
vi.mock("../../repositories/taskReposiotry", () => ({
  TaskRepository: { getTaskWithAccess: vi.fn() },
}));

describe("TaskHistoryService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(TaskHistoryRepository.logTaskHistory).mockResolvedValue({
      id: "h1",
    } as never);
  });

  // ---------------------------------------------------------------------
  // recordTaskCreated
  // ---------------------------------------------------------------------
  describe("recordTaskCreated", () => {
    it("logs a TASK_CREATED event and forwards the transaction", async () => {
      const transaction = {} as never;
      await expect(
        TaskHistoryService.recordTaskCreated("t1", "u1", transaction),
      ).resolves.toEqual({ id: "h1" });
      expect(TaskHistoryRepository.logTaskHistory).toHaveBeenCalledWith(
        { taskId: "t1", actorId: "u1", eventType: "TASK_CREATED" },
        transaction,
      );
    });
  });

  // ---------------------------------------------------------------------
  // recordTaskUpdated — scalar fields
  // ---------------------------------------------------------------------
  describe("recordTaskUpdated — scalar field diffing", () => {
    it("logs nothing when every comparable field is identical", async () => {
      const same: any = {
        name: "A",
        description: null,
        priority: "LOW",
        estimatedTime: null,
        dueDate: "invalid",
        statusId: "s1",
      };
      const result = await TaskHistoryService.recordTaskUpdated(
        "t1",
        "u1",
        same,
        same,
        {} as never,
      );
      expect(result).toHaveLength(0);
      expect(TaskHistoryRepository.logTaskHistory).not.toHaveBeenCalled();
    });

    it("logs a FIELD_UPDATED entry per changed scalar field, in field order", async () => {
      const before: any = {
        name: "A",
        description: "old",
        priority: "LOW",
        estimatedTime: 10,
        dueDate: "2026-01-01",
        statusId: "s1",
        statusName: "Todo",
      };
      const after: any = {
        name: "B",
        description: "new",
        priority: "HIGH",
        estimatedTime: 20,
        dueDate: new Date("2026-01-02"),
        statusId: "s2",
        statusName: "Doing",
      };
      const result = await TaskHistoryService.recordTaskUpdated(
        "t1",
        "u1",
        before,
        after,
        {} as never,
      );
      expect(result).toHaveLength(6);

      const calls = vi.mocked(TaskHistoryRepository.logTaskHistory).mock.calls;
      expect(calls[0][0]).toMatchObject({
        fieldChanged: "name",
        oldValue: "A",
        newValue: "B",
      });
      expect(calls[1][0]).toMatchObject({
        fieldChanged: "description",
        oldValue: "old",
        newValue: "new",
      });
      expect(calls[2][0]).toMatchObject({
        fieldChanged: "priority",
        oldValue: "LOW",
        newValue: "HIGH",
      });
      expect(calls[3][0]).toMatchObject({
        fieldChanged: "estimatedTime",
        oldValue: "10",
        newValue: "20",
      });
      expect(calls[4][0]).toMatchObject({
        fieldChanged: "dueDate",
        oldValue: "2026-01-01",
        newValue: "2026-01-02",
      });
      expect(calls[5][0]).toMatchObject({
        eventType: "STATUS_CHANGED",
        oldValue: "Todo",
        newValue: "Doing",
      });
    });

    it("treats a null and an undefined value as equal (no diff logged)", async () => {
      const before: any = { name: "A", description: null };
      const after: any = { name: "A", description: undefined };
      const result = await TaskHistoryService.recordTaskUpdated(
        "t1",
        "u1",
        before,
        after,
        {} as never,
      );
      expect(result).toHaveLength(0);
    });

    it("logs a status change and preserves undefined status names when absent", async () => {
      const before: any = { statusId: "s1" };
      const after: any = { statusId: "s2" };
      await TaskHistoryService.recordTaskUpdated(
        "t1",
        "u1",
        before,
        after,
        {} as never,
      );
      expect(TaskHistoryRepository.logTaskHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: "STATUS_CHANGED",
          fieldChanged: "status",
          oldValue: undefined,
          newValue: undefined,
        }),
        expect.anything(),
      );
    });

    it("does not log a status change when statusId is unchanged", async () => {
      const before: any = { statusId: "s1" };
      const after: any = { statusId: "s1" };
      const result = await TaskHistoryService.recordTaskUpdated(
        "t1",
        "u1",
        before,
        after,
        {} as never,
      );
      expect(result).toHaveLength(0);
    });
  });

  // ---------------------------------------------------------------------
  // recordTaskUpdated — assignee diffing
  // ---------------------------------------------------------------------
  describe("recordTaskUpdated — assignee diffing", () => {
    it("skips the assignee block entirely when both lists are undefined", async () => {
      const result = await TaskHistoryService.recordTaskUpdated(
        "t1",
        "u1",
        {} as never,
        {} as never,
        {} as never,
        undefined,
        undefined,
      );
      expect(result).toHaveLength(0);
      expect(TaskHistoryRepository.logTaskHistory).not.toHaveBeenCalled();
    });

    it("enters the assignee block when only 'before' is provided, even if it's empty", async () => {
      const result = await TaskHistoryService.recordTaskUpdated(
        "t1",
        "u1",
        {} as never,
        {} as never,
        {} as never,
        [],
        undefined,
      );
      expect(result).toHaveLength(1);
      expect(TaskHistoryRepository.logTaskHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: "ASSIGNEES_CHANGED",
          oldValue: null,
          newValue: null,
        }),
        expect.anything(),
      );
    });

    it("enters the assignee block when only 'after' is provided, even if it's empty", async () => {
      const result = await TaskHistoryService.recordTaskUpdated(
        "t1",
        "u1",
        {} as never,
        {} as never,
        {} as never,
        undefined,
        [],
      );
      expect(result).toHaveLength(1);
      expect(TaskHistoryRepository.logTaskHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: "ASSIGNEES_CHANGED",
          oldValue: null,
          newValue: null,
        }),
        expect.anything(),
      );
    });

    it("filters out null/falsy entries before mapping and sorting", async () => {
      const result = await TaskHistoryService.recordTaskUpdated(
        "t1",
        "u1",
        {} as never,
        {} as never,
        {} as never,
        [null as never, { id: "u2", name: "B" } as never],
        [{ userId: "u1", email: "a@x.com" } as never, undefined as never],
      );
      expect(result).toHaveLength(1);
      const [payload] = vi.mocked(TaskHistoryRepository.logTaskHistory).mock
        .calls[0];
      expect(JSON.parse(payload.oldValue)).toEqual([
        { id: "u2", name: "B", email: "", photoUrl: null },
      ]);
      expect(JSON.parse(payload.newValue)).toEqual([
        { id: "u1", name: "", email: "a@x.com", photoUrl: null },
      ]);
    });

    it("maps an assignee with none of id/userId/name/email/photoUrl to all-blank defaults", async () => {
      const result = await TaskHistoryService.recordTaskUpdated(
        "t1",
        "u1",
        {} as never,
        {} as never,
        {} as never,
        undefined,
        [{} as never],
      );
      expect(result).toHaveLength(1);
      const [payload] = vi.mocked(TaskHistoryRepository.logTaskHistory).mock
        .calls[0];
      expect(JSON.parse(payload.newValue)).toEqual([
        { id: "", name: "", email: "", photoUrl: null },
      ]);
    });

    it("sorts multi-element before/after assignee lists by id", async () => {
      const result = await TaskHistoryService.recordTaskUpdated(
        "t1",
        "u1",
        {} as never,
        {} as never,
        {} as never,
        [
          { id: "u3", name: "Carol" } as never,
          { id: "u1", name: "Alice" } as never,
          { id: "u2", name: "Bob" } as never,
        ],
        [
          { id: "u9", name: "Zed" } as never,
          { id: "u4", name: "Dan" } as never,
        ],
      );
      expect(result).toHaveLength(1);
      const [payload] = vi.mocked(TaskHistoryRepository.logTaskHistory).mock
        .calls[0];
      const before = JSON.parse(payload.oldValue);
      const after = JSON.parse(payload.newValue);
      expect(before.map((a: any) => a.id)).toEqual(["u1", "u2", "u3"]);
      expect(after.map((a: any) => a.id)).toEqual(["u4", "u9"]);
    });

    it("produces both a scalar field entry and an assignee entry in the same call", async () => {
      const before: any = { name: "A" };
      const after: any = { name: "B" };
      const result = await TaskHistoryService.recordTaskUpdated(
        "t1",
        "u1",
        before,
        after,
        {} as never,
        [{ id: "u1" } as never],
        [{ id: "u1" } as never, { id: "u2" } as never],
      );
      expect(result).toHaveLength(2);
    });
  });

  // ---------------------------------------------------------------------
  // toComparable / formatDate coverage
  // ---------------------------------------------------------------------
  describe("date/value comparison edge cases", () => {
    it("treats a Date instance and its matching ISO string as equal (no diff)", async () => {
      const before: any = { dueDate: "2026-03-15" };
      const after: any = { dueDate: new Date("2026-03-15T00:00:00.000Z") };
      const result = await TaskHistoryService.recordTaskUpdated(
        "t1",
        "u1",
        before,
        after,
        {} as never,
      );
      expect(result).toHaveLength(0);
    });

    it("falls back to raw-string formatting for an unparsable ISO-shaped due date", async () => {
      const before: any = { dueDate: "2026-01-01" };
      const after: any = { dueDate: "2026-99-99" };
      const result = await TaskHistoryService.recordTaskUpdated(
        "t1",
        "u1",
        before,
        after,
        {} as never,
      );
      expect(result).toHaveLength(1);
      expect(TaskHistoryRepository.logTaskHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          fieldChanged: "dueDate",
          newValue: "2026-99-99",
        }),
        expect.anything(),
      );
    });

    it("stringifies non-date scalar values directly", async () => {
      const before: any = { estimatedTime: 5, priority: "LOW" };
      const after: any = { estimatedTime: 15, priority: "not-a-real-priority" };
      const result = await TaskHistoryService.recordTaskUpdated(
        "t1",
        "u1",
        before,
        after,
        {} as never,
      );
      expect(result).toHaveLength(2);
      expect(TaskHistoryRepository.logTaskHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          fieldChanged: "estimatedTime",
          oldValue: "5",
          newValue: "15",
        }),
        expect.anything(),
      );
    });
  });

  // ---------------------------------------------------------------------
  // recordTimeEntryCreated
  // ---------------------------------------------------------------------
  describe("recordTimeEntryCreated", () => {
    it("renders an empty newValue when durationMinutes is 0/falsy", async () => {
      await TaskHistoryService.recordTimeEntryCreated("t1", "u1", {
        durationMinutes: 0,
      });
      expect(TaskHistoryRepository.logTaskHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: "TIME_ENTRY_CREATED",
          newValue: "",
        }),
        undefined,
      );
    });

    it("renders 'X mins' when durationMinutes is truthy, and forwards the transaction", async () => {
      const transaction = {} as never;
      await TaskHistoryService.recordTimeEntryCreated(
        "t1",
        "u1",
        { durationMinutes: 15 },
        transaction,
      );
      expect(TaskHistoryRepository.logTaskHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: "TIME_ENTRY_CREATED",
          newValue: "15 mins",
        }),
        transaction,
      );
    });
  });

  // ---------------------------------------------------------------------
  // recordTimeEntryUpdated
  // ---------------------------------------------------------------------
  describe("recordTimeEntryUpdated", () => {
    it("logs nothing when note, entryDate, and durationMinutes are all unchanged", async () => {
      const same = { note: "a", entryDate: "2026-01-01", durationMinutes: 5 };
      const result = await TaskHistoryService.recordTimeEntryUpdated(
        "t1",
        "u1",
        same,
        same,
      );
      expect(result).toHaveLength(0);
    });

    it("logs a note change, normalizing undefined/missing notes to null", async () => {
      const result = await TaskHistoryService.recordTimeEntryUpdated(
        "t1",
        "u1",
        { note: "old" },
        { note: undefined },
      );
      expect(result).toHaveLength(1);
      expect(TaskHistoryRepository.logTaskHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          fieldChanged: "note",
          oldValue: "old",
          newValue: null,
        }),
        undefined,
      );
    });

    it("logs an entryDate change using formatDate for both sides", async () => {
      const result = await TaskHistoryService.recordTimeEntryUpdated(
        "t1",
        "u1",
        { entryDate: "2026-01-01" },
        { entryDate: new Date("2026-01-02T00:00:00.000Z") },
      );
      expect(result).toHaveLength(1);
      expect(TaskHistoryRepository.logTaskHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          fieldChanged: "entryDate",
          oldValue: "2026-01-01",
          newValue: "2026-01-02",
        }),
        undefined,
      );
    });

    it("falls back to raw-string formatting when entryDate is not a valid date", async () => {
      const result = await TaskHistoryService.recordTimeEntryUpdated(
        "t1",
        "u1",
        { entryDate: "2026-01-01" },
        { entryDate: "not-a-date" },
      );
      expect(result).toHaveLength(1);
      expect(TaskHistoryRepository.logTaskHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          fieldChanged: "entryDate",
          oldValue: "2026-01-01",
          newValue: "not-a-date",
        }),
        undefined,
      );
    });

    it("formats a null entryDate as an empty string", async () => {
      const result = await TaskHistoryService.recordTimeEntryUpdated(
        "t1",
        "u1",
        { entryDate: "2026-01-01" },
        { entryDate: null },
      );
      expect(result).toHaveLength(1);
      expect(TaskHistoryRepository.logTaskHistory).toHaveBeenCalledWith(
        expect.objectContaining({ fieldChanged: "entryDate", newValue: "" }),
        undefined,
      );
    });

    it("logs a durationMinutes change from a truthy value to 0 (null newValue branch)", async () => {
      const result = await TaskHistoryService.recordTimeEntryUpdated(
        "t1",
        "u1",
        { durationMinutes: 20 },
        { durationMinutes: 0 },
      );
      expect(result).toHaveLength(1);
      expect(TaskHistoryRepository.logTaskHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          fieldChanged: "durationMinutes",
          oldValue: "20 mins",
          newValue: null,
        }),
        undefined,
      );
    });

    it("logs a durationMinutes change from 0 to a truthy value (null oldValue branch)", async () => {
      const result = await TaskHistoryService.recordTimeEntryUpdated(
        "t1",
        "u1",
        { durationMinutes: 0 },
        { durationMinutes: 25 },
      );
      expect(result).toHaveLength(1);
      expect(TaskHistoryRepository.logTaskHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          fieldChanged: "durationMinutes",
          oldValue: null,
          newValue: "25 mins",
        }),
        undefined,
      );
    });

    it("logs all three field diffs at once and forwards the transaction", async () => {
      const transaction = {} as never;
      const result = await TaskHistoryService.recordTimeEntryUpdated(
        "t1",
        "u1",
        { note: "a", entryDate: "2026-01-01", durationMinutes: 1 },
        { note: "b", entryDate: null, durationMinutes: 2 },
        transaction,
      );
      expect(result).toHaveLength(3);
      for (const call of vi.mocked(TaskHistoryRepository.logTaskHistory).mock
        .calls) {
        expect(call[1]).toBe(transaction);
      }
    });
  });

  // ---------------------------------------------------------------------
  // recordTimeEntryDeleted (covers line 180)
  // ---------------------------------------------------------------------
  describe("recordTimeEntryDeleted", () => {
    it("renders a null oldValue when durationMinutes is 0/missing and transaction is omitted", async () => {
      await TaskHistoryService.recordTimeEntryDeleted("t1", "u1", {});
      expect(TaskHistoryRepository.logTaskHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: "TIME_ENTRY_DELETED",
          oldValue: null,
        }),
        undefined,
      );
    });

    it("covers line 180: handles 0 duration and explicit undefined transaction", async () => {
      await TaskHistoryService.recordTimeEntryDeleted(
        "t1",
        "u1",
        { durationMinutes: 0 },
        undefined,
      );
      expect(TaskHistoryRepository.logTaskHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: "TIME_ENTRY_DELETED",
          oldValue: null,
        }),
        undefined,
      );
    });

    it("renders 'X mins' when durationMinutes is truthy, and forwards the transaction", async () => {
      const transaction = {} as never;
      await TaskHistoryService.recordTimeEntryDeleted(
        "t1",
        "u1",
        { durationMinutes: 15 },
        transaction,
      );
      expect(TaskHistoryRepository.logTaskHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: "TIME_ENTRY_DELETED",
          oldValue: "15 mins",
        }),
        transaction,
      );
    });
  });

  // ---------------------------------------------------------------------
  // getTaskHistory
  // ---------------------------------------------------------------------
  describe("getTaskHistory", () => {
    it("throws 404 when the user has no access to the task", async () => {
      vi.mocked(TaskRepository.getTaskWithAccess).mockResolvedValue(
        null as never,
      );
      await expect(
        TaskHistoryService.getTaskHistory("t1", "u1"),
      ).rejects.toMatchObject({
        status: 404,
        message: "Task not found or you do not have permission to access it",
      });
      expect(TaskHistoryRepository.fetchTaskHistory).not.toHaveBeenCalled();
    });

    it("returns the fetched history when access is granted", async () => {
      vi.mocked(TaskRepository.getTaskWithAccess).mockResolvedValue({
        task: { id: "t1" },
      } as never);
      vi.mocked(TaskHistoryRepository.fetchTaskHistory).mockResolvedValue([
        { id: "h1" },
      ] as never);
      await expect(
        TaskHistoryService.getTaskHistory("t1", "u1"),
      ).resolves.toEqual([{ id: "h1" }]);
      expect(TaskHistoryRepository.fetchTaskHistory).toHaveBeenCalledWith("t1");
    });
  });
});
