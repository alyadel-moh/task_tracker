import { describe, it, expect, vi, beforeEach } from "vitest";
import { create, getAll, getById, update, remove } from "../taskController";
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

describe("taskController Coverage Push", () => {
  let req: any;
  let res: any;
  let next: any;

  beforeEach(() => {
    vi.clearAllMocks();
    req = { user: { id: "u1" }, params: { projectId: "p1" }, body: {}, query: {} };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    next = vi.fn();
  });

  describe("create() validation branches", () => {
    it("returns 400 when dueDate is invalid ISO string", async () => {
      req.body = { name: "Task", dueDate: "not-a-date" };
      vi.mocked(Project.findOne).mockResolvedValue({ id: "p1" } as never);

      await create(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringMatching(/dueDate/i) })
      );
    });

    it("passes error to next() when creation throws unexpected error", async () => {
      req.body = { name: "Task" };
      vi.mocked(Project.findOne).mockRejectedValue(new Error("DB Error") as never);

      await create(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("getById() branches", () => {
    it("returns 403 if project is not owned", async () => {
      req.params = { id: "t1", projectId: "p1" };
      vi.mocked(Project.findOne).mockResolvedValue(null);

      await getById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("returns 404 if task is not found in project", async () => {
      req.params = { id: "t99", projectId: "p1" };
      vi.mocked(Project.findOne).mockResolvedValue({ id: "p1" } as never);
      vi.mocked(Task.findOne).mockResolvedValue(null);

      await getById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("returns 200 with task data when found", async () => {
      req.params = { id: "t1", projectId: "p1" };
      const mockTask = { id: "t1", name: "Task 1" };
      vi.mocked(Project.findOne).mockResolvedValue({ id: "p1" } as never);
      vi.mocked(Task.findOne).mockResolvedValue(mockTask as never);

      await getById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockTask);
    });
  });

  describe("getAll() complex query builder branches", () => {
    it("handles single status string, single priority string, and overdue false flag", async () => {
      req.query = {
        search: "  ",
        status: "TODO",
        priority: "HIGH",
        overdue: "false",
      };

      vi.mocked(Project.findOne).mockResolvedValue({ id: "p1" } as never);
      vi.mocked(Task.findAll).mockResolvedValue([] as never);

      await getAll(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("handles overdue true flag when status filter is already defined", async () => {
      req.query = {
        status: "IN_PROGRESS",
        overdue: true,
      };

      vi.mocked(Project.findOne).mockResolvedValue({ id: "p1" } as never);
      vi.mocked(Task.findAll).mockResolvedValue([] as never);

      await getAll(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("update() field change detection branches", () => {
    it("returns 400 when task name is empty string", async () => {
      req.params = { id: "t1", projectId: "p1" };
      req.body = { name: "   " };

      vi.mocked(Project.findOne).mockResolvedValue({ id: "p1" } as never);
      vi.mocked(Task.findOne).mockResolvedValue({ id: "t1", name: "Existing" } as never);

      await update(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 400 for invalid estimatedTime range", async () => {
      req.params = { id: "t1", projectId: "p1" };
      req.body = { estimatedTime: 0 };

      vi.mocked(Project.findOne).mockResolvedValue({ id: "p1" } as never);
      vi.mocked(Task.findOne).mockResolvedValue({ id: "t1" } as never);

      await update(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 400 for invalid dueDate string format", async () => {
      req.params = { id: "t1", projectId: "p1" };
      req.body = { dueDate: "invalid-date" };

      vi.mocked(Project.findOne).mockResolvedValue({ id: "p1" } as never);
      vi.mocked(Task.findOne).mockResolvedValue({ id: "t1" } as never);

      await update(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 'No changes made' message when no fields are modified", async () => {
      req.params = { id: "t1", projectId: "p1" };
      req.body = { name: "Existing Name", description: null };

      const mockTask = {
        id: "t1",
        name: "Existing Name",
        description: null,
        status: "TODO",
        priority: "LOW",
        estimatedTime: null,
        dueDate: null,
        save: vi.fn().mockResolvedValue(true),
      };

      vi.mocked(Project.findOne).mockResolvedValue({ id: "p1" } as never);
      vi.mocked(Task.findOne).mockResolvedValue(mockTask as never);

      await update(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "No changes made" })
      );
    });
  });

  describe("remove() error handling", () => {
    it("returns 403 if project is not owned on delete", async () => {
      req.params = { id: "t1", projectId: "p1" };
      vi.mocked(Project.findOne).mockResolvedValue(null);

      await remove(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("returns 404 if task is not found on delete", async () => {
      req.params = { id: "t1", projectId: "p1" };
      vi.mocked(Project.findOne).mockResolvedValue({ id: "p1" } as never);
      vi.mocked(Task.findOne).mockResolvedValue(null);

      await remove(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});