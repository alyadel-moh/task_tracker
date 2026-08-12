import { describe, it, expect, vi, beforeEach } from "vitest";
import { create, getAll, update, remove } from "../taskController";
import { Task, Project } from "../../models";

vi.mock("../../models", () => ({
  Task: {
    create: vi.fn(),
    findOne: vi.fn(),
    findAll: vi.fn(),
  },
  Project: {
    findOne: vi.fn(),
  },
  TaskHistory: {
    findOne: vi.fn(),
  },
  User: {},
}));

vi.mock("../../services/taskHistory", () => ({
  recordTaskCreated: vi.fn().mockResolvedValue({ id: "h1" }),
  recordTaskUpdated: vi.fn().mockResolvedValue([{ id: "h2" }]),
  recordTaskDeleted: vi.fn().mockResolvedValue({ id: "h3" }),
}));

describe("taskController Deep Edge Cases", () => {
  let req: any;
  let res: any;
  let next: any;

  beforeEach(() => {
    vi.clearAllMocks();
    req = {
      user: { id: "u1" },
      params: { projectId: "p1" },
      body: {},
      query: {},
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    next = vi.fn();
  });

  describe("create() boundary edge cases", () => {
    it("returns 400 when estimatedTime exceeds 525600 minutes", async () => {
      req.body = { name: "Task", estimatedTime: 600000 };
      vi.mocked(Project.findOne).mockResolvedValue({ id: "p1" } as never);

      await create(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message:
            "estimatedTime must be a positive number of minutes (minimum 1)",
        }),
      );
    });
  });

  describe("update() date reset and status change branches", () => {
    it("resets dueDate to null when passed null in update body", async () => {
      req.params = { id: "t1", projectId: "p1" };
      req.body = { dueDate: null };

      const mockTask = {
        id: "t1",
        name: "Existing Name",
        description: null,
        status: "TODO",
        priority: "LOW",
        estimatedTime: null,
        dueDate: new Date("2026-08-01"),
        save: vi.fn().mockResolvedValue(true),
      };

      vi.mocked(Project.findOne).mockResolvedValue({ id: "p1" } as never);
      vi.mocked(Task.findOne).mockResolvedValue(mockTask as never);

      await update(req, res, next);

      expect(mockTask.dueDate).toBeNull();
      expect(mockTask.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("catches error and forwards to next() on update failure", async () => {
      req.params = { id: "t1", projectId: "p1" };
      req.body = { name: "New Name" };

      vi.mocked(Project.findOne).mockRejectedValue(
        new Error("Database Failure") as never,
      );

      await update(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("remove() catch handler", () => {
    it("forwards error to next() on deletion failure", async () => {
      req.params = { id: "t1", projectId: "p1" };
      vi.mocked(Project.findOne).mockRejectedValue(
        new Error("Deletion Failure") as never,
      );

      await remove(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
