import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  recordTaskCreated,
  recordTaskUpdated,
  recordTaskDeleted,
  recordTimeEntryCreated,
  recordTimeEntryUpdated,
  recordTimeEntryDeleted,
} from "../taskHistory";
import { TaskHistory } from "../../models";

vi.mock("../../models", () => ({
  TaskHistory: {
    create: vi.fn(),
  },
}));

describe("TaskHistory Service Unit Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("recordTaskCreated()", () => {
    it("logs TASK_CREATED event correctly", async () => {
      const mockRecord = {
        id: "h1",
        taskId: "t1",
        actorId: "u1",
        eventType: "TASK_CREATED",
      };
      vi.mocked(TaskHistory.create).mockResolvedValue(mockRecord as never);

      const result = await recordTaskCreated("t1", "u1");

      expect(TaskHistory.create).toHaveBeenCalledWith({
        taskId: "t1",
        actorId: "u1",
        eventType: "TASK_CREATED",
        fieldChanged: undefined,
        oldValue: null,
        newValue: null,
      });
      expect(result).toEqual(mockRecord);
    });
  });

  describe("recordTaskDeleted()", () => {
    it("logs TASK_DELETED event correctly", async () => {
      const mockRecord = {
        id: "h2",
        taskId: "t1",
        actorId: "u1",
        eventType: "TASK_DELETED",
      };
      vi.mocked(TaskHistory.create).mockResolvedValue(mockRecord as never);

      const result = await recordTaskDeleted("t1", "u1");

      expect(TaskHistory.create).toHaveBeenCalledWith({
        taskId: "t1",
        actorId: "u1",
        eventType: "TASK_DELETED",
        fieldChanged: undefined,
        oldValue: null,
        newValue: null,
      });
      expect(result).toEqual(mockRecord);
    });
  });

  describe("recordTaskUpdated()", () => {
    it("records field updates and status changes across modified fields", async () => {
      vi.mocked(TaskHistory.create).mockResolvedValue({ id: "h3" } as never);

      const dateBefore = new Date("2026-08-01T00:00:00.000Z");
      const dateAfter = new Date("2026-08-15T00:00:00.000Z");

      const before = {
        name: "Old Name",
        description: "Old Desc",
        priority: "LOW",
        estimatedTime: 60,
        dueDate: dateBefore,
        status: "TODO",
      };

      const after = {
        name: "New Name",
        description: "New Desc",
        priority: "HIGH",
        estimatedTime: 120,
        dueDate: dateAfter,
        status: "IN_PROGRESS",
      };

      const results = await recordTaskUpdated(
        "t1",
        "u1",
        before as any,
        after as any,
      );

      expect(results).toBeDefined();
      expect(TaskHistory.create).toHaveBeenCalled();
    });

    it("handles null/undefined date inputs and unparseable values gracefully in formatDate/toComparable", async () => {
      vi.mocked(TaskHistory.create).mockResolvedValue({ id: "h4" } as never);

      const before = {
        dueDate: "invalid-date-string",
        status: "TODO",
        estimatedTime: null,
      };

      const after = {
        dueDate: null,
        status: "TODO",
        estimatedTime: 45,
      };

      await recordTaskUpdated("t1", "u1", before as any, after as any);

      expect(TaskHistory.create).toHaveBeenCalled();
    });

    it("handles matching values without triggering update logs", async () => {
      const state = {
        name: "Same Task",
        priority: "MEDIUM",
        estimatedTime: 30,
      };

      const results = await recordTaskUpdated(
        "t1",
        "u1",
        state as any,
        state as any,
      );
      expect(results).toHaveLength(0);
      expect(TaskHistory.create).not.toHaveBeenCalled();
    });
  });

  describe("recordTimeEntryCreated()", () => {
    it("logs TIME_ENTRY_CREATED event with formatted duration string", async () => {
      vi.mocked(TaskHistory.create).mockResolvedValue({ id: "h5" } as never);

      await recordTimeEntryCreated("t1", "u1", { durationMinutes: 45 });

      expect(TaskHistory.create).toHaveBeenCalledWith({
        taskId: "t1",
        actorId: "u1",
        eventType: "TIME_ENTRY_CREATED",
        fieldChanged: undefined,
        oldValue: null,
        newValue: "45 mins",
      });
    });

    it("handles missing durationMinutes in creation log", async () => {
      vi.mocked(TaskHistory.create).mockResolvedValue({ id: "h6" } as never);

      await recordTimeEntryCreated("t1", "u1", {});

      expect(TaskHistory.create).toHaveBeenCalledWith({
        taskId: "t1",
        actorId: "u1",
        eventType: "TIME_ENTRY_CREATED",
        fieldChanged: undefined,
        oldValue: null,
        newValue: "",
      });
    });
  });

  describe("recordTimeEntryUpdated()", () => {
    it("detects changes in note, entryDate, and durationMinutes", async () => {
      vi.mocked(TaskHistory.create).mockResolvedValue({ id: "h7" } as never);

      const before = {
        note: "Initial note",
        entryDate: new Date("2026-08-01"),
        durationMinutes: 30,
      };

      const after = {
        note: "Updated note",
        entryDate: new Date("2026-08-02"),
        durationMinutes: 60,
      };

      const results = await recordTimeEntryUpdated("t1", "u1", before, after);

      expect(results).toHaveLength(3);
      expect(TaskHistory.create).toHaveBeenCalledTimes(3);
    });

    it("does not create entries when before and after values are identical", async () => {
      const sameState = {
        note: "Same note",
        entryDate: "2026-08-11",
        durationMinutes: 45,
      };

      const results = await recordTimeEntryUpdated(
        "t1",
        "u1",
        sameState,
        sameState,
      );

      expect(results).toHaveLength(0);
      expect(TaskHistory.create).not.toHaveBeenCalled();
    });
  });

  describe("recordTimeEntryDeleted()", () => {
    it("logs TIME_ENTRY_DELETED event with old value", async () => {
      vi.mocked(TaskHistory.create).mockResolvedValue({ id: "h8" } as never);

      await recordTimeEntryDeleted("t1", "u1", { durationMinutes: 90 });

      expect(TaskHistory.create).toHaveBeenCalledWith({
        taskId: "t1",
        actorId: "u1",
        eventType: "TIME_ENTRY_DELETED",
        fieldChanged: undefined,
        oldValue: "90 mins",
        newValue: null,
      });
    });

    it("logs TIME_ENTRY_DELETED event with null when durationMinutes is missing", async () => {
      vi.mocked(TaskHistory.create).mockResolvedValue({ id: "h9" } as never);

      await recordTimeEntryDeleted("t1", "u1", {});

      expect(TaskHistory.create).toHaveBeenCalledWith({
        taskId: "t1",
        actorId: "u1",
        eventType: "TIME_ENTRY_DELETED",
        fieldChanged: undefined,
        oldValue: null,
        newValue: null,
      });
    });
  });
});
