import { describe, it, expect, vi, beforeEach } from "vitest";
import { create, update, remove } from "../taskController";
import { Task, Project } from "../../models";
import * as historyService from "../../services/taskHistory";

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

vi.mock("../../services/taskHistory");

describe("Task Controller", () => {
  let req: any;
  let res: any;
  let next: any;

  beforeEach(() => {
    vi.clearAllMocks();
    req = {
      user: { id: "user-123" },
      params: { projectId: "project-123" },
      body: {},
      query: {},
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    next = vi.fn();
  });

  describe("create()", () => {
    it("returns 400 if task name is missing", async () => {
      req.body = { name: "" };
      await create(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 403 if project is not owned by user", async () => {
      req.body = { name: "Task Name", priority: "MEDIUM" };
      vi.mocked(Project.findOne).mockResolvedValue(null);

      await create(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("creates task and records history (201)", async () => {
      req.body = { name: "Valid Task", priority: "HIGH", status: "TODO" };
      vi.mocked(Project.findOne).mockResolvedValue({
        id: "project-123",
      } as never);
      vi.mocked(Task.create).mockResolvedValue({
        id: "task-123",
        ...req.body,
      } as never);
      vi.mocked(historyService.recordTaskCreated).mockResolvedValue({
        id: "hist-1",
      } as never);

      await create(req, res, next);

      expect(Task.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe("update()", () => {
    it("updates task priority and records history (200)", async () => {
      req.params.id = "task-123";
      req.body = { priority: "HIGH" };

      const mockTaskInstance = {
        id: "task-123",
        name: "Task 1",
        priority: "MEDIUM",
        status: "TODO",
        save: vi.fn().mockResolvedValue(true),
      };

      vi.mocked(Project.findOne).mockResolvedValue({
        id: "project-123",
      } as never);
      vi.mocked(Task.findOne).mockResolvedValue(mockTaskInstance as never);
      vi.mocked(historyService.recordTaskUpdated).mockResolvedValue([
        { id: "h1" },
      ] as never);

      await update(req, res, next);

      expect(mockTaskInstance.priority).toBe("HIGH");
      expect(mockTaskInstance.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("remove()", () => {
    it("destroys task and returns 200", async () => {
      req.params.id = "task-123";
      const mockTaskInstance = {
        id: "task-123",
        destroy: vi.fn().mockResolvedValue(true),
      };

      vi.mocked(Project.findOne).mockResolvedValue({
        id: "project-123",
      } as never);
      vi.mocked(Task.findOne).mockResolvedValue(mockTaskInstance as never);

      await remove(req, res, next);

      expect(mockTaskInstance.destroy).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});
