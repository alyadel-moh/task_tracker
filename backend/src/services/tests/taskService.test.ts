import { beforeEach, describe, expect, it, vi } from "vitest";
import { TaskService } from "../taskService";
import { TaskRepository } from "../../repositories/taskReposiotry";
import { StatusRepository } from "../../repositories/statusRepository";
import { TaskHistoryRepository } from "../../repositories/taskHistoryRepository";
import { TimeEntryRepository } from "../../repositories/timeEntryRepository";
import { TaskHistoryService } from "../taskHistoryService";
import { isMember } from "../../utils/projectGaurds";
import sequelize from "../../models";

vi.mock("../../models", () => ({ default: { transaction: vi.fn() } }));
vi.mock("../../utils/projectGaurds", () => ({ isMember: vi.fn() }));
vi.mock("../../repositories/taskReposiotry", () => ({
  TaskRepository: {
    create: vi.fn(),
    getByIdwithStatus: vi.fn(),
    getAll: vi.fn(),
    getTaskWithAccess: vi.fn(),
    getTaskWithAssigneesAndAccess: vi.fn(),
    updateAssignees: vi.fn(),
  },
}));
vi.mock("../../repositories/statusRepository", () => ({
  StatusRepository: {
    getByIdAndProjectId: vi.fn(),
    getDefaultStatusForProject: vi.fn(),
    getStatusesinProject: vi.fn(),
  },
}));
vi.mock("../../repositories/taskHistoryRepository", () => ({
  TaskHistoryRepository: { fetchHistoryWithActor: vi.fn() },
}));
vi.mock("../../repositories/timeEntryRepository", () => ({
  TimeEntryRepository: { sumloggedTime: vi.fn() },
}));
vi.mock("../taskHistoryService", () => ({
  TaskHistoryService: {
    recordTaskCreated: vi.fn(),
    recordTaskUpdated: vi.fn(),
  },
}));

function makeTransaction() {
  return { commit: vi.fn(), rollback: vi.fn() };
}

describe("TaskService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------------------
  // create
  // ---------------------------------------------------------------------
  describe("create", () => {
    it("throws 403 when the user is not a project member", async () => {
      vi.mocked(isMember).mockResolvedValue(false as never);
      await expect(
        TaskService.create(
          "p1",
          "Task",
          "",
          "s1",
          30,
          null,
          "MEDIUM" as never,
          "u1",
          [],
        ),
      ).rejects.toMatchObject({ status: 403 });
    });

    it("throws 400 when the name is missing or blank", async () => {
      vi.mocked(isMember).mockResolvedValue({ id: "m1" } as never);
      await expect(
        TaskService.create(
          "p1",
          "",
          "",
          "s1",
          30,
          null,
          "MEDIUM" as never,
          "u1",
          [],
        ),
      ).rejects.toMatchObject({ status: 400 });
      await expect(
        TaskService.create(
          "p1",
          "   ",
          "",
          "s1",
          30,
          null,
          "MEDIUM" as never,
          "u1",
          [],
        ),
      ).rejects.toMatchObject({ status: 400 });
    });

    it("throws 400 for a non-integer or out-of-range estimatedTime", async () => {
      vi.mocked(isMember).mockResolvedValue({ id: "m1" } as never);
      await expect(
        TaskService.create(
          "p1",
          "Task",
          "",
          "s1",
          0,
          null,
          "MEDIUM" as never,
          "u1",
          [],
        ),
      ).rejects.toMatchObject({ status: 400 });
      await expect(
        TaskService.create(
          "p1",
          "Task",
          "",
          "s1",
          1.5,
          null,
          "MEDIUM" as never,
          "u1",
          [],
        ),
      ).rejects.toMatchObject({ status: 400 });
      await expect(
        TaskService.create(
          "p1",
          "Task",
          "",
          "s1",
          525601,
          null,
          "MEDIUM" as never,
          "u1",
          [],
        ),
      ).rejects.toMatchObject({ status: 400 });
    });

    it("allows estimatedTime to be omitted or null", async () => {
      vi.mocked(isMember).mockResolvedValue({ id: "m1" } as never);
      vi.mocked(StatusRepository.getByIdAndProjectId).mockResolvedValue({
        id: "s1",
      } as never);
      vi.mocked(TaskRepository.create).mockResolvedValue({ id: "t1" } as never);
      vi.mocked(TaskHistoryService.recordTaskCreated).mockResolvedValue({
        id: "h1",
      } as never);
      vi.mocked(sequelize.transaction).mockResolvedValue(
        makeTransaction() as never,
      );

      await expect(
        TaskService.create(
          "p1",
          "Task",
          "",
          "s1",
          undefined as never,
          null,
          "MEDIUM" as never,
          "u1",
          [],
        ),
      ).resolves.toEqual({ id: "t1" });
      await expect(
        TaskService.create(
          "p1",
          "Task",
          "",
          "s1",
          null as never,
          null,
          "MEDIUM" as never,
          "u1",
          [],
        ),
      ).resolves.toEqual({ id: "t1" });
    });

    it("throws 400 for an invalid ISO date string dueDate", async () => {
      vi.mocked(isMember).mockResolvedValue({ id: "m1" } as never);
      await expect(
        TaskService.create(
          "p1",
          "Task",
          "",
          "s1",
          30,
          "not-a-date",
          "MEDIUM" as never,
          "u1",
          [],
        ),
      ).rejects.toMatchObject({ status: 400 });
    });

    it("throws 400 for a non-string dueDate that parses to an invalid Date", async () => {
      vi.mocked(isMember).mockResolvedValue({ id: "m1" } as never);
      await expect(
        TaskService.create(
          "p1",
          "Task",
          "",
          "s1",
          30,
          new Date("invalid") as never,
          "MEDIUM" as never,
          "u1",
          [],
        ),
      ).rejects.toMatchObject({
        status: 400,
        message: "Invalid date format for dueDate",
      });
    });

    it("allows valid Date object instance for dueDate", async () => {
      vi.mocked(isMember).mockResolvedValue({ id: "m1" } as never);
      vi.mocked(StatusRepository.getByIdAndProjectId).mockResolvedValue({
        id: "s1",
      } as never);
      vi.mocked(TaskRepository.create).mockResolvedValue({ id: "t1" } as never);
      vi.mocked(TaskHistoryService.recordTaskCreated).mockResolvedValue({
        id: "h1",
      } as never);
      vi.mocked(sequelize.transaction).mockResolvedValue(
        makeTransaction() as never,
      );

      const validDateObj = new Date("2026-05-01T12:00:00.000Z");
      await expect(
        TaskService.create(
          "p1",
          "Task",
          "",
          "s1",
          30,
          validDateObj,
          "MEDIUM" as never,
          "u1",
          [],
        ),
      ).resolves.toEqual({ id: "t1" });

      expect(TaskRepository.create).toHaveBeenCalledWith(
        "p1",
        "Task",
        null,
        "s1",
        30,
        validDateObj,
        "MEDIUM",
        "u1",
        [],
        expect.anything(),
      );
    });

    it("allows dueDate to be omitted or null", async () => {
      vi.mocked(isMember).mockResolvedValue({ id: "m1" } as never);
      vi.mocked(StatusRepository.getByIdAndProjectId).mockResolvedValue({
        id: "s1",
      } as never);
      vi.mocked(TaskRepository.create).mockResolvedValue({ id: "t1" } as never);
      vi.mocked(TaskHistoryService.recordTaskCreated).mockResolvedValue({
        id: "h1",
      } as never);
      vi.mocked(sequelize.transaction).mockResolvedValue(
        makeTransaction() as never,
      );

      await expect(
        TaskService.create(
          "p1",
          "Task",
          "",
          "s1",
          30,
          undefined as never,
          "MEDIUM" as never,
          "u1",
          [],
        ),
      ).resolves.toEqual({ id: "t1" });
      await expect(
        TaskService.create(
          "p1",
          "Task",
          "",
          "s1",
          30,
          null,
          "MEDIUM" as never,
          "u1",
          [],
        ),
      ).resolves.toEqual({ id: "t1" });
    });

    it("throws 400 for an invalid priority value", async () => {
      vi.mocked(isMember).mockResolvedValue({ id: "m1" } as never);
      await expect(
        TaskService.create(
          "p1",
          "Task",
          "",
          "s1",
          30,
          null,
          "URGENT" as never,
          "u1",
          [],
        ),
      ).rejects.toMatchObject({ status: 400 });
    });

    it("defaults priority to MEDIUM when omitted", async () => {
      vi.mocked(isMember).mockResolvedValue({ id: "m1" } as never);
      vi.mocked(StatusRepository.getByIdAndProjectId).mockResolvedValue({
        id: "s1",
      } as never);
      vi.mocked(TaskRepository.create).mockResolvedValue({ id: "t1" } as never);
      vi.mocked(TaskHistoryService.recordTaskCreated).mockResolvedValue({
        id: "h1",
      } as never);
      vi.mocked(sequelize.transaction).mockResolvedValue(
        makeTransaction() as never,
      );

      await TaskService.create(
        "p1",
        "Task",
        "",
        "s1",
        30,
        null,
        undefined as never,
        "u1",
        [],
      );

      expect(TaskRepository.create).toHaveBeenCalledWith(
        "p1",
        "Task",
        null,
        "s1",
        30,
        null,
        "MEDIUM",
        "u1",
        [],
        expect.anything(),
      );
    });

    it("throws 400 when one or more assignees are not project members", async () => {
      vi.mocked(isMember)
        .mockResolvedValueOnce({ id: "m1" } as never)
        .mockResolvedValueOnce(true as never)
        .mockResolvedValueOnce(false as never);
      await expect(
        TaskService.create(
          "p1",
          "Task",
          "",
          "s1",
          30,
          null,
          "MEDIUM" as never,
          "u1",
          ["u2", "u3"],
        ),
      ).rejects.toMatchObject({ status: 400 });
    });

    it("dedupes for the membership check and accepts assignees who are all valid members", async () => {
      vi.mocked(isMember).mockResolvedValue(true as never);
      vi.mocked(StatusRepository.getByIdAndProjectId).mockResolvedValue({
        id: "s1",
      } as never);
      vi.mocked(TaskRepository.create).mockResolvedValue({ id: "t1" } as never);
      vi.mocked(TaskHistoryService.recordTaskCreated).mockResolvedValue({
        id: "h1",
      } as never);
      vi.mocked(sequelize.transaction).mockResolvedValue(
        makeTransaction() as never,
      );

      await expect(
        TaskService.create(
          "p1",
          "Task",
          "",
          "s1",
          30,
          null,
          "MEDIUM" as never,
          "u1",
          ["u2", "u2"],
        ),
      ).resolves.toEqual({ id: "t1" });
      expect(TaskRepository.create).toHaveBeenCalledWith(
        "p1",
        "Task",
        null,
        "s1",
        30,
        null,
        "MEDIUM",
        "u1",
        ["u2", "u2"],
        expect.anything(),
      );
    });

    it("throws 400 when the explicit statusId does not resolve to a column", async () => {
      vi.mocked(isMember).mockResolvedValue({ id: "m1" } as never);
      vi.mocked(StatusRepository.getByIdAndProjectId).mockResolvedValue(null);
      await expect(
        TaskService.create(
          "p1",
          "Task",
          "",
          "s1",
          30,
          null,
          "MEDIUM" as never,
          "u1",
          [],
        ),
      ).rejects.toMatchObject({ status: 400 });
    });

    it("falls back to the project's default status when statusId is not provided", async () => {
      vi.mocked(isMember).mockResolvedValue({ id: "m1" } as never);
      vi.mocked(StatusRepository.getDefaultStatusForProject).mockResolvedValue({
        id: "s-default",
      } as never);
      vi.mocked(TaskRepository.create).mockResolvedValue({ id: "t1" } as never);
      vi.mocked(TaskHistoryService.recordTaskCreated).mockResolvedValue({
        id: "h1",
      } as never);
      vi.mocked(sequelize.transaction).mockResolvedValue(
        makeTransaction() as never,
      );

      await expect(
        TaskService.create(
          "p1",
          "Task",
          "",
          "",
          30,
          null,
          "MEDIUM" as never,
          "u1",
          [],
        ),
      ).resolves.toEqual({ id: "t1" });
    });

    it("throws 400 when no default status exists for the project", async () => {
      vi.mocked(isMember).mockResolvedValue({ id: "m1" } as never);
      vi.mocked(StatusRepository.getDefaultStatusForProject).mockResolvedValue(
        null,
      );
      await expect(
        TaskService.create(
          "p1",
          "Task",
          "",
          "",
          30,
          null,
          "MEDIUM" as never,
          "u1",
          [],
        ),
      ).rejects.toMatchObject({ status: 400 });
    });

    it("trims the task name and commits the transaction", async () => {
      vi.mocked(isMember).mockResolvedValue({ id: "m1" } as never);
      vi.mocked(StatusRepository.getByIdAndProjectId).mockResolvedValue({
        id: "s1",
      } as never);
      vi.mocked(TaskRepository.create).mockResolvedValue({ id: "t1" } as never);
      vi.mocked(TaskHistoryService.recordTaskCreated).mockResolvedValue({
        id: "h1",
      } as never);
      const transaction = makeTransaction();
      vi.mocked(sequelize.transaction).mockResolvedValue(transaction as never);

      await expect(
        TaskService.create(
          "p1",
          "  Task  ",
          "",
          "s1",
          30,
          null,
          "MEDIUM" as never,
          "u1",
          [],
        ),
      ).resolves.toEqual({ id: "t1" });
      expect(TaskRepository.create).toHaveBeenCalledWith(
        "p1",
        "Task",
        null,
        "s1",
        30,
        null,
        "MEDIUM",
        "u1",
        [],
        transaction,
      );
      expect(transaction.commit).toHaveBeenCalled();
    });

    it("rolls back the transaction when creation fails", async () => {
      vi.mocked(isMember).mockResolvedValue({ id: "m1" } as never);
      vi.mocked(StatusRepository.getByIdAndProjectId).mockResolvedValue({
        id: "s1",
      } as never);
      vi.mocked(TaskRepository.create).mockRejectedValue(
        new Error("db failed"),
      );
      const transaction = makeTransaction();
      vi.mocked(sequelize.transaction).mockResolvedValue(transaction as never);

      await expect(
        TaskService.create(
          "p1",
          "Task",
          "",
          "s1",
          30,
          null,
          "MEDIUM" as never,
          "u1",
          [],
        ),
      ).rejects.toThrow("db failed");
      expect(transaction.rollback).toHaveBeenCalled();
      expect(transaction.commit).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------
  // getById
  // ---------------------------------------------------------------------
  describe("getById", () => {
    it("throws 403 when the user is not a project member", async () => {
      vi.mocked(isMember).mockResolvedValue(false as never);
      await expect(TaskService.getById("p1", "t1", "u1")).rejects.toMatchObject(
        { status: 403 },
      );
    });

    it("throws 404 when the task does not exist", async () => {
      vi.mocked(isMember).mockResolvedValue({ id: "m1" } as never);
      vi.mocked(TaskRepository.getByIdwithStatus).mockResolvedValue(null);
      await expect(TaskService.getById("p1", "t1", "u1")).rejects.toMatchObject(
        { status: 404 },
      );
    });

    it("returns the task when found", async () => {
      vi.mocked(isMember).mockResolvedValue({ id: "m1" } as never);
      vi.mocked(TaskRepository.getByIdwithStatus).mockResolvedValue({
        id: "t1",
      } as never);
      await expect(TaskService.getById("p1", "t1", "u1")).resolves.toEqual({
        id: "t1",
      });
    });
  });

  // ---------------------------------------------------------------------
  // getAll
  // ---------------------------------------------------------------------
  describe("getAll", () => {
    it("throws 403 when the user is not a project member", async () => {
      vi.mocked(isMember).mockResolvedValue(false as never);
      await expect(
        TaskService.getAll("p1", "", [], [], false, "u1", ""),
      ).rejects.toMatchObject({
        status: 403,
      });
    });

    it("delegates to the repository when the user is a member", async () => {
      vi.mocked(isMember).mockResolvedValue({ id: "m1" } as never);
      vi.mocked(TaskRepository.getAll).mockResolvedValue([
        { id: "t1" },
      ] as never);
      await expect(
        TaskService.getAll("p1", "bug", ["s1"], ["HIGH"], true, "u1", "u2"),
      ).resolves.toEqual([{ id: "t1" }]);
      expect(TaskRepository.getAll).toHaveBeenCalledWith(
        "p1",
        "bug",
        ["s1"],
        ["HIGH"],
        true,
        "u2",
      );
    });
  });

  // ---------------------------------------------------------------------
  // update
  // ---------------------------------------------------------------------
  describe("update", () => {
    function baseTask(overrides: Record<string, any> = {}) {
      return {
        id: "t1",
        projectId: "p1",
        name: "Task",
        description: null,
        statusId: "s1",
        estimatedTime: 10,
        dueDate: null,
        priority: "MEDIUM",
        assignees: [],
        save: vi.fn(),
        ...overrides,
      };
    }

    function mockAccess(task: any, overrides: Record<string, any> = {}) {
      vi.mocked(TaskRepository.getTaskWithAssigneesAndAccess).mockResolvedValue(
        {
          task,
          isProjectMember: true,
          isTaskMember: true,
          isProjectOwner: false,
          isAuthorized: true,
          ...overrides,
        } as never,
      );
    }

    it("throws 404 when access lookup returns nothing", async () => {
      vi.mocked(TaskRepository.getTaskWithAssigneesAndAccess).mockResolvedValue(
        null,
      );
      await expect(
        TaskService.update(
          "p1",
          "t1",
          "Task",
          null,
          null,
          null,
          null,
          undefined as never,
          "u1",
          null,
        ),
      ).rejects.toMatchObject({ status: 404 });
    });

    it("throws 404 when the access object has no task", async () => {
      vi.mocked(TaskRepository.getTaskWithAssigneesAndAccess).mockResolvedValue(
        {
          task: null,
          isProjectMember: true,
          isAuthorized: true,
        } as never,
      );
      await expect(
        TaskService.update(
          "p1",
          "t1",
          "Task",
          null,
          null,
          null,
          null,
          undefined as never,
          "u1",
          null,
        ),
      ).rejects.toMatchObject({ status: 404 });
    });

    it("throws 404 when the task belongs to a different project", async () => {
      mockAccess(baseTask({ projectId: "other-project" }));
      await expect(
        TaskService.update(
          "p1",
          "t1",
          "Task",
          null,
          null,
          null,
          null,
          undefined as never,
          "u1",
          null,
        ),
      ).rejects.toMatchObject({ status: 404 });
    });

    it("throws 403 when the user is not a project member", async () => {
      mockAccess(baseTask(), { isProjectMember: false });
      await expect(
        TaskService.update(
          "p1",
          "t1",
          "Task",
          null,
          null,
          null,
          null,
          undefined as never,
          "u1",
          null,
        ),
      ).rejects.toMatchObject({ status: 403 });
    });

    it("throws 403 naming only the ownership reason when merely not the owner", async () => {
      mockAccess(baseTask(), {
        isAuthorized: false,
        isProjectOwner: false,
        isTaskMember: true,
      });
      await expect(
        TaskService.update(
          "p1",
          "t1",
          "Task",
          null,
          null,
          null,
          null,
          undefined as never,
          "u1",
          null,
        ),
      ).rejects.toMatchObject({
        status: 403,
        message: "Access denied: you are not the project owner.",
      });
    });

    it("throws 403 naming only the membership reason when merely not a task member", async () => {
      mockAccess(baseTask(), {
        isAuthorized: false,
        isProjectOwner: true,
        isTaskMember: false,
      });
      await expect(
        TaskService.update(
          "p1",
          "t1",
          "Task",
          null,
          null,
          null,
          null,
          undefined as never,
          "u1",
          null,
        ),
      ).rejects.toMatchObject({
        status: 403,
        message:
          "Access denied: you are neither assigned to nor the creator of this task.",
      });
    });

    it("covers line 222: throws 403 joining both reasons when neither owner nor task member", async () => {
      mockAccess(baseTask(), {
        isAuthorized: false,
        isProjectOwner: false,
        isTaskMember: false,
      });
      await expect(
        TaskService.update(
          "p1",
          "t1",
          "Task",
          null,
          null,
          null,
          null,
          undefined as never,
          "u1",
          null,
        ),
      ).rejects.toMatchObject({
        status: 403,
        message:
          "Access denied: you are not the project owner and neither assigned to nor the creator of this task.",
      });
    });

    it("throws 400 when the trimmed new name is empty", async () => {
      mockAccess(baseTask());
      await expect(
        TaskService.update(
          "p1",
          "t1",
          "   ",
          null,
          null,
          null,
          null,
          undefined as never,
          "u1",
          null,
        ),
      ).rejects.toMatchObject({ status: 400 });
    });

    it("normalizes an empty-string description to null", async () => {
      const task = baseTask({ description: "old" });
      mockAccess(task);
      const transaction = makeTransaction();
      vi.mocked(sequelize.transaction).mockResolvedValue(transaction as never);
      vi.mocked(TaskHistoryService.recordTaskUpdated).mockResolvedValue(
        [] as never,
      );
      vi.mocked(TimeEntryRepository.sumloggedTime).mockResolvedValue(0);

      const result = await TaskService.update(
        "p1",
        "t1",
        "Task",
        "",
        "s1",
        10,
        null,
        "MEDIUM" as never,
        "u1",
        null,
      );
      expect(result.changedLabels).toContain("Description");
      expect(result.updatedFields.description).toBeNull();
    });

    it("returns a no-op result when nothing actually changes", async () => {
      mockAccess(baseTask());
      await expect(
        TaskService.update(
          "p1",
          "t1",
          "Task",
          null,
          "s1",
          10,
          null,
          "MEDIUM" as never,
          "u1",
          null,
        ),
      ).resolves.toEqual({
        updatedFields: {},
        detailedHistoryEntries: [],
        changedLabels: [],
        overrun: false,
      });
      expect(sequelize.transaction).not.toHaveBeenCalled();
    });

    it("throws 400 when the new statusId cannot be found in the project", async () => {
      mockAccess(baseTask());
      vi.mocked(StatusRepository.getStatusesinProject).mockResolvedValue(
        [] as never,
      );
      await expect(
        TaskService.update(
          "p1",
          "t1",
          "Task",
          null,
          "s2",
          10,
          null,
          "MEDIUM" as never,
          "u1",
          null,
        ),
      ).rejects.toMatchObject({ status: 400 });
    });

    it("throws 400 for an out-of-range estimatedTime", async () => {
      mockAccess(baseTask());
      await expect(
        TaskService.update(
          "p1",
          "t1",
          "Task",
          null,
          "s1",
          0,
          null,
          "MEDIUM" as never,
          "u1",
          null,
        ),
      ).rejects.toMatchObject({ status: 400 });
    });

    it("throws 400 for an invalid ISO dueDate string", async () => {
      mockAccess(baseTask());
      await expect(
        TaskService.update(
          "p1",
          "t1",
          "Task",
          null,
          "s1",
          10,
          "bad",
          "MEDIUM" as never,
          "u1",
          null,
        ),
      ).rejects.toMatchObject({ status: 400 });
    });

    it("throws 400 for a non-string dueDate that parses to an invalid Date", async () => {
      mockAccess(baseTask());
      await expect(
        TaskService.update(
          "p1",
          "t1",
          "Task",
          null,
          "s1",
          10,
          new Date("invalid") as never,
          "MEDIUM" as never,
          "u1",
          null,
        ),
      ).rejects.toMatchObject({
        status: 400,
        message: "Invalid date format for dueDate",
      });
    });

    it("throws 400 for an invalid priority", async () => {
      mockAccess(baseTask());
      await expect(
        TaskService.update(
          "p1",
          "t1",
          "Task",
          null,
          "s1",
          10,
          null,
          "URGENT" as never,
          "u1",
          null,
        ),
      ).rejects.toMatchObject({ status: 400 });
    });

    it("throws 400 when a new assignee is not a project member", async () => {
      mockAccess(baseTask());
      vi.mocked(isMember).mockResolvedValue(false as never);
      await expect(
        TaskService.update(
          "p1",
          "t1",
          "Task",
          null,
          "s1",
          10,
          null,
          "MEDIUM" as never,
          "u1",
          ["u2"],
        ),
      ).rejects.toMatchObject({ status: 400 });
    });

    it("changes the status, capturing the old status name in history", async () => {
      const task = baseTask({ statusId: "s1" });
      mockAccess(task);
      vi.mocked(StatusRepository.getStatusesinProject).mockResolvedValue([
        { id: "s1", name: "To Do" },
        { id: "s2", name: "Done" },
      ] as never);
      const transaction = makeTransaction();
      vi.mocked(sequelize.transaction).mockResolvedValue(transaction as never);
      vi.mocked(TaskHistoryService.recordTaskUpdated).mockResolvedValue([
        { id: "h1" },
      ] as never);
      vi.mocked(TaskHistoryRepository.fetchHistoryWithActor).mockResolvedValue({
        id: "h1",
      } as never);
      vi.mocked(TimeEntryRepository.sumloggedTime).mockResolvedValue(0);

      const result = await TaskService.update(
        "p1",
        "t1",
        "Task",
        null,
        "s2",
        10,
        null,
        "MEDIUM" as never,
        "u1",
        null,
      );
      expect(result.changedLabels).toContain("Status");
      expect(TaskHistoryService.recordTaskUpdated).toHaveBeenCalledWith(
        "t1",
        "u1",
        expect.objectContaining({ statusName: "To Do" }),
        expect.objectContaining({ statusName: "Done" }),
        transaction,
        undefined,
        undefined,
      );
    });

    it("leaves the previous status name undefined when the task had no prior status", async () => {
      const task = baseTask({ statusId: null });
      mockAccess(task);
      vi.mocked(StatusRepository.getStatusesinProject).mockResolvedValue([
        { id: "s2", name: "Done" },
      ] as never);
      const transaction = makeTransaction();
      vi.mocked(sequelize.transaction).mockResolvedValue(transaction as never);
      vi.mocked(TaskHistoryService.recordTaskUpdated).mockResolvedValue(
        [] as never,
      );
      vi.mocked(TimeEntryRepository.sumloggedTime).mockResolvedValue(0);

      await TaskService.update(
        "p1",
        "t1",
        "Task",
        null,
        "s2",
        10,
        null,
        "MEDIUM" as never,
        "u1",
        null,
      );
      expect(TaskHistoryService.recordTaskUpdated).toHaveBeenCalledWith(
        "t1",
        "u1",
        expect.objectContaining({ statusName: undefined }),
        expect.anything(),
        transaction,
        undefined,
        undefined,
      );
    });

    it("allows estimatedTime to be cleared to null", async () => {
      const task = baseTask({ estimatedTime: 10 });
      mockAccess(task);
      const transaction = makeTransaction();
      vi.mocked(sequelize.transaction).mockResolvedValue(transaction as never);
      vi.mocked(TaskHistoryService.recordTaskUpdated).mockResolvedValue(
        [] as never,
      );
      vi.mocked(TimeEntryRepository.sumloggedTime).mockResolvedValue(0);

      const result = await TaskService.update(
        "p1",
        "t1",
        "Task",
        null,
        "s1",
        null,
        null,
        "MEDIUM" as never,
        "u1",
        null,
      );
      expect(result.changedLabels).toContain("Estimated time");
      expect(result.overrun).toBe(false);
    });

    it("updates the due date and records history when it changes", async () => {
      const task = baseTask({ dueDate: null });
      mockAccess(task);
      const transaction = makeTransaction();
      vi.mocked(sequelize.transaction).mockResolvedValue(transaction as never);
      vi.mocked(TaskHistoryService.recordTaskUpdated).mockResolvedValue(
        [] as never,
      );
      vi.mocked(TimeEntryRepository.sumloggedTime).mockResolvedValue(0);

      const result = await TaskService.update(
        "p1",
        "t1",
        "Task",
        null,
        "s1",
        10,
        "2026-05-01",
        "MEDIUM" as never,
        "u1",
        null,
      );
      expect(result.changedLabels).toContain("Due date");
    });

    it("clears the due date back to null when requested", async () => {
      const task = baseTask({ dueDate: new Date("2026-01-01") });
      mockAccess(task);
      const transaction = makeTransaction();
      vi.mocked(sequelize.transaction).mockResolvedValue(transaction as never);
      vi.mocked(TaskHistoryService.recordTaskUpdated).mockResolvedValue(
        [] as never,
      );
      vi.mocked(TimeEntryRepository.sumloggedTime).mockResolvedValue(0);

      const result = await TaskService.update(
        "p1",
        "t1",
        "Task",
        null,
        "s1",
        10,
        null,
        "MEDIUM" as never,
        "u1",
        null,
      );
      expect(result.changedLabels).toContain("Due date");
      expect(result.updatedFields.dueDate).toBeNull();
    });

    it("changes the priority", async () => {
      const task = baseTask({ priority: "MEDIUM" });
      mockAccess(task);
      const transaction = makeTransaction();
      vi.mocked(sequelize.transaction).mockResolvedValue(transaction as never);
      vi.mocked(TaskHistoryService.recordTaskUpdated).mockResolvedValue(
        [] as never,
      );
      vi.mocked(TimeEntryRepository.sumloggedTime).mockResolvedValue(0);

      const result = await TaskService.update(
        "p1",
        "t1",
        "Task",
        null,
        "s1",
        10,
        null,
        "HIGH" as never,
        "u1",
        null,
      );
      expect(result.changedLabels).toContain("Priority");
    });

    it("clears all assignees without requiring a membership check", async () => {
      const task = baseTask({ assignees: [{ id: "u2" }] });
      mockAccess(task);
      const transaction = makeTransaction();
      vi.mocked(sequelize.transaction).mockResolvedValue(transaction as never);
      vi.mocked(TaskRepository.updateAssignees).mockResolvedValue([] as never);
      vi.mocked(TaskHistoryService.recordTaskUpdated).mockResolvedValue(
        [] as never,
      );
      vi.mocked(TimeEntryRepository.sumloggedTime).mockResolvedValue(0);

      const result = await TaskService.update(
        "p1",
        "t1",
        "Task",
        null,
        "s1",
        10,
        null,
        "MEDIUM" as never,
        "u1",
        [],
      );
      expect(result.changedLabels).toContain("Assignees");
      expect(isMember).not.toHaveBeenCalled();
      expect(TaskRepository.updateAssignees).toHaveBeenCalledWith(
        "t1",
        "p1",
        [],
        ["u2"],
        transaction,
      );
    });

    it("does not flag assignees as changed when the same set is resent", async () => {
      const task = baseTask({ assignees: [{ id: "u2" }] });
      mockAccess(task);
      vi.mocked(isMember).mockResolvedValue(true as never);
      const transaction = makeTransaction();
      vi.mocked(sequelize.transaction).mockResolvedValue(transaction as never);
      vi.mocked(TaskHistoryService.recordTaskUpdated).mockResolvedValue(
        [] as never,
      );
      vi.mocked(TimeEntryRepository.sumloggedTime).mockResolvedValue(0);

      const result = await TaskService.update(
        "p1",
        "t1",
        "Changed name",
        null,
        "s1",
        10,
        null,
        "MEDIUM" as never,
        "u1",
        ["u2"],
      );
      expect(result.changedLabels).not.toContain("Assignees");
      expect(TaskRepository.updateAssignees).not.toHaveBeenCalled();
    });

    it("covers line 432: handles historyEntries returning undefined or null", async () => {
      const task = baseTask({ name: "Old Task" });
      mockAccess(task);
      const transaction = makeTransaction();
      vi.mocked(sequelize.transaction).mockResolvedValue(transaction as never);

      vi.mocked(TaskHistoryService.recordTaskUpdated).mockResolvedValue(
        undefined as never,
      );
      vi.mocked(TimeEntryRepository.sumloggedTime).mockResolvedValue(0);

      const result = await TaskService.update(
        "p1",
        "t1",
        "New Name",
        undefined as never,
        undefined as never,
        undefined as never,
        undefined as never,
        undefined as never,
        "u1",
        null,
      );

      expect(result.detailedHistoryEntries).toEqual([]);
      expect(result.changedLabels).toEqual(["Task name"]);
    });

    it("covers lines 407-408, 412, 414: fills after snapshot with null task fallbacks", async () => {
      const task = baseTask({
        name: "Old Task",
        description: null,
        statusId: null,
        estimatedTime: null,
        dueDate: null,
        priority: "LOW",
      });
      mockAccess(task);
      const transaction = makeTransaction();
      vi.mocked(sequelize.transaction).mockResolvedValue(transaction as never);

      vi.mocked(TaskHistoryService.recordTaskUpdated).mockResolvedValue([]);
      vi.mocked(TimeEntryRepository.sumloggedTime).mockResolvedValue(0);

      const result = await TaskService.update(
        "p1",
        "t1",
        "New Name",
        undefined as never,
        undefined as never,
        undefined as never,
        undefined as never,
        undefined as never,
        "u1",
        null,
      );

      expect(result.changedLabels).toEqual(["Task name"]);
      expect(TaskHistoryService.recordTaskUpdated).toHaveBeenCalledWith(
        "t1",
        "u1",
        expect.anything(),
        expect.objectContaining({
          name: "New Name",
          description: undefined,
          statusId: undefined,
          estimatedTime: undefined,
          dueDate: undefined,
          priority: "LOW",
        }),
        transaction,
        undefined,
        undefined,
      );
    });

    it("fills the history 'after' snapshot from existing task values when fields are omitted", async () => {
      const task = baseTask({
        name: "Existing name",
        description: "Existing description",
        statusId: "s1",
        estimatedTime: 10,
        priority: "LOW",
        dueDate: new Date("2026-08-01"),
      });
      mockAccess(task);
      const transaction = makeTransaction();
      vi.mocked(sequelize.transaction).mockResolvedValue(transaction as never);
      vi.mocked(TaskHistoryService.recordTaskUpdated).mockResolvedValue(
        [] as never,
      );
      vi.mocked(TimeEntryRepository.sumloggedTime).mockResolvedValue(0);

      await TaskService.update(
        "p1",
        "t1",
        undefined as never,
        undefined as never,
        undefined as never,
        undefined as never,
        undefined as never,
        "HIGH" as never,
        "u1",
        null,
      );

      expect(TaskHistoryService.recordTaskUpdated).toHaveBeenCalledWith(
        "t1",
        "u1",
        expect.objectContaining({ priority: "LOW" }),
        expect.objectContaining({
          name: "Existing name",
          description: "Existing description",
          statusId: "s1",
          estimatedTime: 10,
          priority: "HIGH",
          dueDate: expect.any(Date),
        }),
        transaction,
        undefined,
        undefined,
      );
    });

    it("computes overrun as true when logged time exceeds the estimate", async () => {
      const task = baseTask({ estimatedTime: 10 });
      mockAccess(task);
      const transaction = makeTransaction();
      vi.mocked(sequelize.transaction).mockResolvedValue(transaction as never);
      vi.mocked(TaskHistoryService.recordTaskUpdated).mockResolvedValue([
        { id: "h1" },
      ] as never);
      vi.mocked(TaskHistoryRepository.fetchHistoryWithActor).mockResolvedValue({
        id: "h1",
      } as never);
      vi.mocked(TimeEntryRepository.sumloggedTime).mockResolvedValue(50);

      const result = await TaskService.update(
        "p1",
        "t1",
        "Renamed",
        null,
        "s1",
        10,
        null,
        "MEDIUM" as never,
        "u1",
        null,
      );
      expect(result.overrun).toBe(true);
    });

    it("computes overrun as false when the task has no estimate", async () => {
      const task = baseTask({ estimatedTime: null });
      mockAccess(task);
      const transaction = makeTransaction();
      vi.mocked(sequelize.transaction).mockResolvedValue(transaction as never);
      vi.mocked(TaskHistoryService.recordTaskUpdated).mockResolvedValue(
        [] as never,
      );
      vi.mocked(TimeEntryRepository.sumloggedTime).mockResolvedValue(500);

      const result = await TaskService.update(
        "p1",
        "t1",
        "Renamed",
        null,
        "s1",
        null,
        null,
        "MEDIUM" as never,
        "u1",
        null,
      );
      expect(result.overrun).toBe(false);
    });

    it("rolls back the transaction when saving fails", async () => {
      const task = baseTask({
        save: vi.fn().mockRejectedValue(new Error("save failed")),
      });
      mockAccess(task);
      const transaction = makeTransaction();
      vi.mocked(sequelize.transaction).mockResolvedValue(transaction as never);

      await expect(
        TaskService.update(
          "p1",
          "t1",
          "Renamed",
          null,
          "s1",
          10,
          null,
          "MEDIUM" as never,
          "u1",
          null,
        ),
      ).rejects.toThrow("save failed");
      expect(transaction.rollback).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------
  // remove
  // ---------------------------------------------------------------------
  describe("remove", () => {
    function mockRemoveAccess(task: any, overrides: Record<string, any> = {}) {
      vi.mocked(TaskRepository.getTaskWithAccess).mockResolvedValue({
        task: task || { id: "t1", projectId: "p1", destroy: vi.fn() },
        isProjectMember: true,
        isTaskMember: true,
        isProjectOwner: false,
        isAuthorized: true,
        ...overrides,
      } as never);
    }

    it("throws 404 when the task is not found", async () => {
      vi.mocked(TaskRepository.getTaskWithAccess).mockResolvedValue(null);
      await expect(TaskService.remove("u1", "p1", "t1")).rejects.toMatchObject({
        status: 404,
      });
    });

    it("throws 404 when access has no task", async () => {
      vi.mocked(TaskRepository.getTaskWithAccess).mockResolvedValue({
        task: null,
        isProjectMember: true,
        isAuthorized: true,
      } as never);
      await expect(TaskService.remove("u1", "p1", "t1")).rejects.toMatchObject({
        status: 404,
      });
    });

    it("throws 404 when the task belongs to a different project", async () => {
      mockRemoveAccess({ id: "t1", projectId: "other", destroy: vi.fn() });
      await expect(TaskService.remove("u1", "p1", "t1")).rejects.toMatchObject({
        status: 404,
      });
    });

    it("throws 403 when the user is not a project member", async () => {
      mockRemoveAccess(
        { id: "t1", projectId: "p1", destroy: vi.fn() },
        { isProjectMember: false },
      );
      await expect(TaskService.remove("u1", "p1", "t1")).rejects.toMatchObject({
        status: 403,
      });
    });

    it("covers line 222 in remove: user is not project owner but IS task member", async () => {
      mockRemoveAccess(
        { id: "t1", projectId: "p1", destroy: vi.fn() },
        {
          isAuthorized: false,
          isProjectOwner: false,
          isTaskMember: true,
        },
      );

      await expect(TaskService.remove("u1", "p1", "t1")).rejects.toMatchObject({
        status: 403,
        message: "Access denied: you are not the project owner.",
      });
    });

    it("covers line 222 in remove: user IS project owner but is NOT task member", async () => {
      mockRemoveAccess(
        { id: "t1", projectId: "p1", destroy: vi.fn() },
        {
          isAuthorized: false,
          isProjectOwner: true,
          isTaskMember: false,
        },
      );

      await expect(TaskService.remove("u1", "p1", "t1")).rejects.toMatchObject({
        status: 403,
        message:
          "Access denied: you are neither assigned to nor the creator of this task.",
      });
    });

    it("covers line 222 in remove: throws 403 joining both reasons when neither owner nor member", async () => {
      mockRemoveAccess(
        { id: "t1", projectId: "p1", destroy: vi.fn() },
        { isAuthorized: false, isProjectOwner: false, isTaskMember: false },
      );
      await expect(TaskService.remove("u1", "p1", "t1")).rejects.toMatchObject({
        status: 403,
        message:
          "Access denied: you are not the project owner and neither assigned to nor the creator of this task.",
      });
    });

    it("rolls back the transaction when destroy fails", async () => {
      const task = {
        id: "t1",
        projectId: "p1",
        destroy: vi.fn().mockRejectedValue(new Error("failed")),
      };
      mockRemoveAccess(task, { isProjectOwner: true });
      const transaction = makeTransaction();
      vi.mocked(sequelize.transaction).mockResolvedValue(transaction as never);

      await expect(TaskService.remove("u1", "p1", "t1")).rejects.toThrow(
        "failed",
      );
      expect(transaction.rollback).toHaveBeenCalled();
    });

    it("commits the transaction on successful removal", async () => {
      const task = {
        id: "t1",
        projectId: "p1",
        destroy: vi.fn().mockResolvedValue(undefined),
      };
      mockRemoveAccess(task, { isProjectOwner: true });
      const transaction = makeTransaction();
      vi.mocked(sequelize.transaction).mockResolvedValue(transaction as never);

      await expect(
        TaskService.remove("u1", "p1", "t1"),
      ).resolves.toBeUndefined();
      expect(transaction.commit).toHaveBeenCalled();
    });
  });
});
