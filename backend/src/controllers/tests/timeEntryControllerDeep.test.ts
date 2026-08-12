import { describe, it, expect, vi, beforeEach } from "vitest";
import { update } from "../timeEntryController";
import { Task, TimeEntry } from "../../models";
import * as historyService from "../../services/taskHistory";

vi.mock("../../models", () => ({
  Task: { findOne: vi.fn() },
  TimeEntry: { findOne: vi.fn() },
  TaskHistory: { findOne: vi.fn() },
  Project: {},
  User: {},
}));

vi.mock("../../services/taskHistory");

describe("TimeEntry Controller Deep Coverage", () => {
  let req: any;
  let res: any;
  let next: any;

  beforeEach(() => {
    vi.clearAllMocks();
    req = { user: { id: "u1" }, params: { id: "e1", taskId: "t1" }, body: {} };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    next = vi.fn();
  });

  describe("update() field mutations", () => {
    it("returns 400 for out-of-range durationMinutes", async () => {
      req.body = { durationMinutes: 2000 }; // Max is 1440
      await update(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("updates durationMinutes, entryDate, and note fields on time entry", async () => {
      req.body = {
        durationMinutes: 90,
        entryDate: "2026-08-15T00:00:00.000Z",
        note: "Updated note",
      };

      const mockEntry = {
        id: "e1",
        durationMinutes: 45,
        entryDate: new Date("2026-08-10"),
        note: "Initial note",
        save: vi.fn().mockResolvedValue(true),
      };

      vi.mocked(Task.findOne).mockResolvedValue({ id: "t1" } as never);
      vi.mocked(TimeEntry.findOne).mockResolvedValue(mockEntry as never);
      vi.mocked(historyService.recordTimeEntryUpdated).mockResolvedValue([
        { id: "h1" },
      ] as never);

      await update(req, res, next);

      expect(mockEntry.durationMinutes).toBe(90);
      expect(mockEntry.note).toBe("Updated note");
      expect(mockEntry.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});
