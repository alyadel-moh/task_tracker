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

describe("TaskHistory Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("records task creation history entry", async () => {
    vi.mocked(TaskHistory.create).mockResolvedValue({ id: "h1" } as never);

    const result = await recordTaskCreated("t1", "u1");

    expect(TaskHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        taskId: "t1",
        actorId: "u1",
        fieldChanged: "created",
      })
    );
    expect(result).toEqual({ id: "h1" });
  });

  it("records task updates across multiple changed fields", async () => {
    vi.mocked(TaskHistory.create).mockResolvedValue({ id: "h2" } as never);

    const before = { name: "Old Name", priority: "LOW" };
    const after = { name: "New Name", priority: "HIGH" };

    const results = await recordTaskUpdated("t1", "u1", before as any, after as any);

    expect(TaskHistory.create).toHaveBeenCalledTimes(2);
    expect(results).toHaveLength(2);
  });

  it("records task deletion history entry", async () => {
    vi.mocked(TaskHistory.create).mockResolvedValue({ id: "h3" } as never);

    const result = await recordTaskDeleted("t1", "u1");

    expect(TaskHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        taskId: "t1",
        actorId: "u1",
        fieldChanged: "deleted",
      })
    );
    expect(result).toEqual({ id: "h3" });
  });

  it("records time entry creation, update, and deletion logs", async () => {
    vi.mocked(TaskHistory.create).mockResolvedValue({ id: "h4" } as never);

    await recordTimeEntryCreated("t1", "u1", { durationMinutes: 30 });
    await recordTimeEntryUpdated("t1", "u1", { durationMinutes: 30 }, { durationMinutes: 60 });
    await recordTimeEntryDeleted("t1", "u1", { durationMinutes: 60 });

    expect(TaskHistory.create).toHaveBeenCalled();
  });
});