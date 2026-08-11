import { describe, it, expect, vi, beforeEach } from "vitest";
import { create, getAll, update, remove } from "../timeEntryController";
import { Task, TimeEntry } from "../../models";
import * as historyService from "../../services/taskHistory";

vi.mock("../../models", () => ({
  Task: { findOne: vi.fn() },
  TimeEntry: { create: vi.fn(), findAll: vi.fn(), findOne: vi.fn() },
  TaskHistory: { findOne: vi.fn() },
  Project: {},
  User: {},
}));

vi.mock("../../services/taskHistory");

describe("Time Entry Controller", () => {
  let req: any;
  let res: any;
  let next: any;

  beforeEach(() => {
    vi.clearAllMocks();
    req = {
      user: { id: "user-123" },
      params: { taskId: "task-123" },
      body: {},
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    next = vi.fn();
  });

  describe("create()", () => {
    it("returns 400 if durationMinutes is negative or zero", async () => {
      req.body = { durationMinutes: -10, entryDate: "2026-08-11" };
      await create(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("creates time entry and returns 201", async () => {
      req.body = {
        durationMinutes: 45,
        entryDate: "2026-08-11",
        note: "Coding",
      };
      vi.mocked(Task.findOne).mockResolvedValue({ id: "task-123" } as never);
      vi.mocked(TimeEntry.create).mockResolvedValue({
        id: "e1",
        ...req.body,
      } as never);
      vi.mocked(historyService.recordTimeEntryCreated).mockResolvedValue({
        id: "h1",
      } as never);

      await create(req, res, next);

      expect(TimeEntry.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe("getAll()", () => {
    it("calculates totalMinutes correctly and returns entries (200)", async () => {
      vi.mocked(Task.findOne).mockResolvedValue({ id: "task-123" } as never);
      vi.mocked(TimeEntry.findAll).mockResolvedValue([
        { durationMinutes: 30 },
        { durationMinutes: 45 },
      ] as never);

      await getAll(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        timeEntries: expect.any(Array),
        totalMinutes: 75,
      });
    });
  });

  describe("remove()", () => {
    it("deletes entry and records history (200)", async () => {
      req.params.id = "entry-123";
      const mockEntry = {
        durationMinutes: 45,
        entryDate: new Date(),
        note: "Test",
        destroy: vi.fn().mockResolvedValue(true),
      };

      vi.mocked(Task.findOne).mockResolvedValue({ id: "task-123" } as never);
      vi.mocked(TimeEntry.findOne).mockResolvedValue(mockEntry as never);
      vi.mocked(historyService.recordTimeEntryDeleted).mockResolvedValue({
        id: "h1",
      } as never);

      await remove(req, res, next);

      expect(mockEntry.destroy).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});
