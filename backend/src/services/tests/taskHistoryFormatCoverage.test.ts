import { describe, it, expect, vi, beforeEach } from "vitest";
import { recordTaskUpdated } from "../taskHistory";
import { TaskHistory } from "../../models";

vi.mock("../../models", () => ({
  TaskHistory: {
    create: vi
      .fn()
      .mockImplementation((payload) =>
        Promise.resolve({ id: "history-1", ...payload }),
      ),
  },
}));

describe("taskHistory Service Date Formatter Edge Cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("formats string date representations cleanly and logs exact history entry", async () => {
    const before = {
      dueDate: "2026-08-01T12:00:00.000Z",
      status: "TODO",
    };

    const after = {
      dueDate: "2026-08-15T12:00:00.000Z",
      status: "TODO",
    };

    const results = await recordTaskUpdated(
      "t1",
      "u1",
      before as any,
      after as any,
    );

    // 1. Assert exact number of database writes
    expect(TaskHistory.create).toHaveBeenCalledTimes(1);

    // 2. Assert exact call payload (actor/task identifiers, eventType, fieldChanged, before/after values)
    expect(TaskHistory.create).toHaveBeenCalledWith({
      taskId: "t1",
      actorId: "u1",
      eventType: "FIELD_UPDATED",
      fieldChanged: "dueDate",
      oldValue: "2026-08-01",
      newValue: "2026-08-15",
    });

    // 3. Assert returned array structure and contents
    expect(results).toBeDefined();
    expect(results).toHaveLength(1);
    expect(results![0]).toEqual(
      expect.objectContaining({
        id: "history-1",
        taskId: "t1",
        actorId: "u1",
        eventType: "FIELD_UPDATED",
        fieldChanged: "dueDate",
        oldValue: "2026-08-01",
        newValue: "2026-08-15",
      }),
    );
  });
});
