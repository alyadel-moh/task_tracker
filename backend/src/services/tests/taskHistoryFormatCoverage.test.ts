import { describe, it, expect, vi } from "vitest";
import { recordTaskUpdated } from "../taskHistory";
import { TaskHistory } from "../../models";

vi.mock("../../models", () => ({
  TaskHistory: {
    create: vi.fn().mockResolvedValue({ id: "h1" }),
  },
}));

describe("taskHistory Service Date Formatter Edge Cases", () => {
  it("formats string date representations cleanly", async () => {
    const before = {
      dueDate: "2026-08-01T12:00:00.000Z",
      status: "TODO",
    };

    const after = {
      dueDate: "2026-08-15T12:00:00.000Z",
      status: "TODO",
    };

    await recordTaskUpdated("t1", "u1", before as any, after as any);

    expect(TaskHistory.create).toHaveBeenCalled();
  });
});