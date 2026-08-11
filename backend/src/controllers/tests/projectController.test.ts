import { describe, it, expect, vi, beforeEach } from "vitest";
import { create, getAll, update, remove } from "../projectController";
import { Project } from "../../models";

vi.mock("../../models", () => ({
  Project: {
    create: vi.fn(),
    findAll: vi.fn(),
    findOne: vi.fn(),
  },
}));

describe("Project Controller", () => {
  let req: any;
  let res: any;
  let next: any;

  beforeEach(() => {
    vi.clearAllMocks();
    req = { user: { id: "user-123" }, params: {}, body: {} };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    next = vi.fn();
  });

  describe("create()", () => {
    it("returns 400 if project name is missing or empty", async () => {
      req.body = { name: "   " };
      await create(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "BadRequest",
        message: "Project name is required",
      });
    });

    it("creates project and returns 201", async () => {
      req.body = { name: "New Project", description: "Desc" };
      const createdProject = { id: "p1", userId: "user-123", ...req.body };
      vi.mocked(Project.create).mockResolvedValue(createdProject as never);

      await create(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: "Project created successfully",
        project: createdProject,
      });
    });
  });

  describe("getAll()", () => {
    it("returns all user projects ordered by createdAt ASC", async () => {
      const mockProjects = [{ id: "p1" }, { id: "p2" }];
      vi.mocked(Project.findAll).mockResolvedValue(mockProjects as never);

      await getAll(req, res, next);

      expect(Project.findAll).toHaveBeenCalledWith({
        where: { userId: "user-123" },
        order: [["createdAt", "ASC"]],
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockProjects);
    });
  });

  describe("update()", () => {
    it("returns 404 if project not owned by user", async () => {
      req.params.id = "p99";
      vi.mocked(Project.findOne).mockResolvedValue(null);

      await update(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("updates fields and returns 200", async () => {
      req.params.id = "p1";
      req.body = { name: "Updated Name" };
      const mockProj = {
        name: "Old Name",
        save: vi.fn().mockResolvedValue(true),
      };
      vi.mocked(Project.findOne).mockResolvedValue(mockProj as never);

      await update(req, res, next);

      expect(mockProj.name).toBe("Updated Name");
      expect(mockProj.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("remove()", () => {
    it("deletes project successfully (200)", async () => {
      req.params.id = "p1";
      const mockProj = { destroy: vi.fn().mockResolvedValue(true) };
      vi.mocked(Project.findOne).mockResolvedValue(mockProj as never);

      await remove(req, res, next);

      expect(mockProj.destroy).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});
