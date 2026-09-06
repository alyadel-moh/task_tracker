import { beforeEach, describe, expect, it, vi } from "vitest";
import { TimeEntryService } from "../timeEntryService";
import { TaskRepository } from "../../repositories/taskReposiotry";
import { TimeEntryRepository } from "../../repositories/timeEntryRepository";
import { TaskHistoryRepository } from "../../repositories/taskHistoryRepository";
import { TaskHistoryService } from "../taskHistoryService";
import sequelize from "../../models";

vi.mock("../../models", () => ({
  default: { transaction: vi.fn() },
  Task: {},
  TimeEntry: {},
}));
vi.mock("../../repositories/taskReposiotry", () => ({
  TaskRepository: { getTaskWithAccess: vi.fn() },
}));
vi.mock("../../repositories/timeEntryRepository", () => ({
  TimeEntryRepository: {
    create: vi.fn(),
    getAll: vi.fn(),
    sumloggedTime: vi.fn(),
    getTimeEntrywithAccess: vi.fn(),
  },
}));
vi.mock("../../repositories/taskHistoryRepository", () => ({
  TaskHistoryRepository: { fetchHistoryWithActor: vi.fn() },
}));
vi.mock("../taskHistoryService", () => ({
  TaskHistoryService: {
    recordTimeEntryCreated: vi.fn(),
    recordTimeEntryUpdated: vi.fn(),
    recordTimeEntryDeleted: vi.fn(),
  },
}));

function makeTransaction() {
  return { commit: vi.fn(), rollback: vi.fn() };
}

describe("TimeEntryService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------------------
  // create
  // ---------------------------------------------------------------------
  describe("create", () => {
    it("throws 404 when the task/access cannot be found", async () => {
      vi.mocked(TaskRepository.getTaskWithAccess).mockResolvedValue(null);
      await expect(
        TimeEntryService.create(30, "2026-09-01", "note", "t1", "u1"),
      ).rejects.toMatchObject({ status: 404 });
    });

    it("throws 404 when access exists but has no task", async () => {
      vi.mocked(TaskRepository.getTaskWithAccess).mockResolvedValue({
        task: null,
        isProjectMember: true,
        isAuthorized: true,
      } as never);
      await expect(
        TimeEntryService.create(30, "2026-09-01", "note", "t1", "u1"),
      ).rejects.toMatchObject({ status: 404 });
    });

    it("throws 403 when the user is not a project member", async () => {
      vi.mocked(TaskRepository.getTaskWithAccess).mockResolvedValue({
        task: { id: "t1" },
        isProjectMember: false,
        isAuthorized: true,
      } as never);
      await expect(
        TimeEntryService.create(30, "2026-09-01", "note", "t1", "u1"),
      ).rejects.toMatchObject({ status: 403 });
    });

    it("throws 403 naming only the ownership reason when not authorized as owner", async () => {
      vi.mocked(TaskRepository.getTaskWithAccess).mockResolvedValue({
        task: { id: "t1" },
        isProjectMember: true,
        isAuthorized: false,
        isProjectOwner: false,
        isTaskMember: true,
      } as never);
      await expect(
        TimeEntryService.create(30, "2026-09-01", "note", "t1", "u1"),
      ).rejects.toMatchObject({
        status: 403,
        message: expect.stringContaining("not the project owner"),
      });
    });

    it("throws 403 naming only the membership reason when not authorized as task member", async () => {
      vi.mocked(TaskRepository.getTaskWithAccess).mockResolvedValue({
        task: { id: "t1" },
        isProjectMember: true,
        isAuthorized: false,
        isProjectOwner: true,
        isTaskMember: false,
      } as never);
      await expect(
        TimeEntryService.create(30, "2026-09-01", "note", "t1", "u1"),
      ).rejects.toMatchObject({
        status: 403,
        message: expect.stringContaining("neither assigned to nor the creator"),
      });
    });

    it("throws 400 for a non-integer or out-of-range duration", async () => {
      vi.mocked(TaskRepository.getTaskWithAccess).mockResolvedValue({
        task: { id: "t1" },
        isProjectMember: true,
        isAuthorized: true,
      } as never);
      await expect(
        TimeEntryService.create(0, "2026-09-01", "note", "t1", "u1"),
      ).rejects.toMatchObject({ status: 400 });
      await expect(
        TimeEntryService.create(1.5, "2026-09-01", "note", "t1", "u1"),
      ).rejects.toMatchObject({ status: 400 });
      await expect(
        TimeEntryService.create(1441, "2026-09-01", "note", "t1", "u1"),
      ).rejects.toMatchObject({ status: 400 });
    });

    it("throws 400 when entryDate is missing or invalid", async () => {
      vi.mocked(TaskRepository.getTaskWithAccess).mockResolvedValue({
        task: { id: "t1" },
        isProjectMember: true,
        isAuthorized: true,
      } as never);
      await expect(
        TimeEntryService.create(30, "", "note", "t1", "u1"),
      ).rejects.toMatchObject({
        status: 400,
      });
      await expect(
        TimeEntryService.create(30, "not-a-date", "note", "t1", "u1"),
      ).rejects.toMatchObject({ status: 400 });
    });

    it("stores an undefined note when an empty string is provided", async () => {
      vi.mocked(TaskRepository.getTaskWithAccess).mockResolvedValue({
        task: { id: "t1", estimatedTime: 0 },
        isProjectMember: true,
        isAuthorized: true,
      } as never);
      const transaction = makeTransaction();
      vi.mocked(sequelize.transaction).mockResolvedValue(transaction as never);
      vi.mocked(TimeEntryRepository.create).mockResolvedValue({
        id: "e1",
      } as never);
      vi.mocked(TaskHistoryService.recordTimeEntryCreated).mockResolvedValue({
        id: "h1",
      } as never);
      vi.mocked(TaskHistoryRepository.fetchHistoryWithActor).mockResolvedValue({
        id: "h1",
      } as never);
      vi.mocked(TimeEntryRepository.sumloggedTime).mockResolvedValue(30);

      await TimeEntryService.create(30, "2026-09-01", "", "t1", "u1");

      expect(TaskHistoryService.recordTimeEntryCreated).toHaveBeenCalledWith(
        "t1",
        "u1",
        expect.objectContaining({ note: undefined }),
        transaction,
      );
    });

    it("computes overrun as false when the task has no estimate", async () => {
      vi.mocked(TaskRepository.getTaskWithAccess).mockResolvedValue({
        task: { id: "t1", estimatedTime: 0 },
        isProjectMember: true,
        isAuthorized: true,
      } as never);
      const transaction = makeTransaction();
      vi.mocked(sequelize.transaction).mockResolvedValue(transaction as never);
      vi.mocked(TimeEntryRepository.create).mockResolvedValue({
        id: "e1",
      } as never);
      vi.mocked(TaskHistoryService.recordTimeEntryCreated).mockResolvedValue({
        id: "h1",
      } as never);
      vi.mocked(TaskHistoryRepository.fetchHistoryWithActor).mockResolvedValue({
        id: "h1",
      } as never);
      vi.mocked(TimeEntryRepository.sumloggedTime).mockResolvedValue(999);

      const result = await TimeEntryService.create(
        30,
        "2026-09-01",
        "note",
        "t1",
        "u1",
      );
      expect(result.overrun).toBe(false);
    });

    it("computes overrun as false when logged time is within the estimate", async () => {
      vi.mocked(TaskRepository.getTaskWithAccess).mockResolvedValue({
        task: { id: "t1", estimatedTime: 120 },
        isProjectMember: true,
        isAuthorized: true,
      } as never);
      const transaction = makeTransaction();
      vi.mocked(sequelize.transaction).mockResolvedValue(transaction as never);
      vi.mocked(TimeEntryRepository.create).mockResolvedValue({
        id: "e1",
      } as never);
      vi.mocked(TaskHistoryService.recordTimeEntryCreated).mockResolvedValue({
        id: "h1",
      } as never);
      vi.mocked(TaskHistoryRepository.fetchHistoryWithActor).mockResolvedValue({
        id: "h1",
      } as never);
      vi.mocked(TimeEntryRepository.sumloggedTime).mockResolvedValue(60);

      const result = await TimeEntryService.create(
        30,
        "2026-09-01",
        "note",
        "t1",
        "u1",
      );
      expect(result.overrun).toBe(false);
    });

    it("computes overrun as true when logged time exceeds the estimate", async () => {
      vi.mocked(TaskRepository.getTaskWithAccess).mockResolvedValue({
        task: { id: "t1", estimatedTime: 60 },
        isProjectMember: true,
        isAuthorized: true,
      } as never);
      const transaction = makeTransaction();
      vi.mocked(sequelize.transaction).mockResolvedValue(transaction as never);
      vi.mocked(TimeEntryRepository.create).mockResolvedValue({
        id: "e1",
      } as never);
      vi.mocked(TaskHistoryService.recordTimeEntryCreated).mockResolvedValue({
        id: "h1",
      } as never);
      vi.mocked(TaskHistoryRepository.fetchHistoryWithActor).mockResolvedValue({
        id: "h1",
      } as never);
      vi.mocked(TimeEntryRepository.sumloggedTime).mockResolvedValue(90);

      const result = await TimeEntryService.create(
        30,
        "2026-09-01",
        "note",
        "t1",
        "u1",
      );
      expect(result.overrun).toBe(true);
      expect(transaction.commit).toHaveBeenCalled();
    });

    it("rolls back the transaction when creation fails", async () => {
      vi.mocked(TaskRepository.getTaskWithAccess).mockResolvedValue({
        task: { id: "t1", estimatedTime: 60 },
        isProjectMember: true,
        isAuthorized: true,
      } as never);
      const transaction = makeTransaction();
      vi.mocked(sequelize.transaction).mockResolvedValue(transaction as never);
      vi.mocked(TimeEntryRepository.create).mockRejectedValue(
        new Error("failed"),
      );

      await expect(
        TimeEntryService.create(30, "2026-09-01", "note", "t1", "u1"),
      ).rejects.toThrow("failed");
      expect(transaction.rollback).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------
  // getAll
  // ---------------------------------------------------------------------
  describe("getAll", () => {
    it("throws 404 when the task cannot be found", async () => {
      vi.mocked(TaskRepository.getTaskWithAccess).mockResolvedValue({
        task: null,
      } as never);
      await expect(TimeEntryService.getAll("t1", "u1")).rejects.toMatchObject({
        status: 404,
      });
    });

    it("throws 403 when the user is not a project member", async () => {
      vi.mocked(TaskRepository.getTaskWithAccess).mockResolvedValue({
        task: { id: "t1" },
        isProjectMember: false,
      } as never);
      await expect(TimeEntryService.getAll("t1", "u1")).rejects.toMatchObject({
        status: 403,
      });
    });

    it("returns entries and the total logged minutes", async () => {
      vi.mocked(TaskRepository.getTaskWithAccess).mockResolvedValue({
        task: { id: "t1" },
        isProjectMember: true,
      } as never);
      vi.mocked(TimeEntryRepository.getAll).mockResolvedValue([
        { id: "e1" },
      ] as never);
      vi.mocked(TimeEntryRepository.sumloggedTime).mockResolvedValue(45);

      await expect(TimeEntryService.getAll("t1", "u1")).resolves.toEqual({
        timeEntries: [{ id: "e1" }],
        totalMinutes: 45,
      });
    });
  });

  // ---------------------------------------------------------------------
  // update
  // ---------------------------------------------------------------------
  describe("update", () => {
    function makeEntry(overrides: Record<string, any> = {}) {
      return {
        durationMinutes: 10,
        entryDate: new Date("2026-01-01"),
        note: "old",
        save: vi.fn(),
        ...overrides,
      };
    }

    function mockAccess(timeEntry: any, overrides: Record<string, any> = {}) {
      vi.mocked(TimeEntryRepository.getTimeEntrywithAccess).mockResolvedValue({
        timeEntry,
        task: { estimatedTime: 20 },
        isProjectMember: true,
        isTaskMember: true,
        isProjectOwner: false,
        isAuthorized: true,
        ...overrides,
      } as never);
    }

    it("throws 404 when the access lookup returns nothing", async () => {
      vi.mocked(TimeEntryRepository.getTimeEntrywithAccess).mockResolvedValue(
        null,
      );
      await expect(
        TimeEntryService.update(10, "2026-01-01", "note", "t1", "u1", "e1"),
      ).rejects.toMatchObject({ status: 404 });
    });

    it("throws 403 when the user is not a project member", async () => {
      mockAccess(makeEntry(), { isProjectMember: false });
      await expect(
        TimeEntryService.update(10, "2026-01-01", "note", "t1", "u1", "e1"),
      ).rejects.toMatchObject({ status: 403 });
    });

    it("throws 403 naming only the ownership reason when applicable", async () => {
      mockAccess(makeEntry(), {
        isAuthorized: false,
        isProjectOwner: false,
        isTaskMember: true,
      });
      await expect(
        TimeEntryService.update(10, "2026-01-01", "note", "t1", "u1", "e1"),
      ).rejects.toMatchObject({
        status: 403,
        message: expect.stringContaining("not the project owner"),
      });
    });

    it("throws 403 naming only the membership reason when applicable", async () => {
      mockAccess(makeEntry(), {
        isAuthorized: false,
        isProjectOwner: true,
        isTaskMember: false,
      });
      await expect(
        TimeEntryService.update(10, "2026-01-01", "note", "t1", "u1", "e1"),
      ).rejects.toMatchObject({
        status: 403,
        message: expect.stringContaining("neither assigned to nor the creator"),
      });
    });

    it("throws 404 when the time entry itself is missing", async () => {
      mockAccess(null);
      await expect(
        TimeEntryService.update(10, "2026-01-01", "note", "t1", "u1", "e1"),
      ).rejects.toMatchObject({ status: 404, message: "Time entry not found" });
    });

    it("throws 400 for a non-integer or out-of-range duration", async () => {
      mockAccess(makeEntry());
      await expect(
        TimeEntryService.update(0, "2026-01-01", "old", "t1", "u1", "e1"),
      ).rejects.toMatchObject({ status: 400 });
      await expect(
        TimeEntryService.update(1.5, "2026-01-01", "old", "t1", "u1", "e1"),
      ).rejects.toMatchObject({ status: 400 });
    });

    it("throws 400 for an empty or invalid entryDate", async () => {
      mockAccess(makeEntry());
      await expect(
        TimeEntryService.update(10, "", "old", "t1", "u1", "e1"),
      ).rejects.toMatchObject({
        status: 400,
        message: "Entry date cannot be empty",
      });
      await expect(
        TimeEntryService.update(10, "bad", "old", "t1", "u1", "e1"),
      ).rejects.toMatchObject({
        status: 400,
        message: "Entry date cannot be empty",
      });
    });

    it("returns a no-op result when nothing actually changes", async () => {
      mockAccess(makeEntry());
      await expect(
        TimeEntryService.update(10, "2026-01-01", "old", "t1", "u1", "e1"),
      ).resolves.toEqual({
        updatedFields: {},
        detailedHistoryEntries: [],
        changedLabels: [],
        overrun: false,
      });
      expect(sequelize.transaction).not.toHaveBeenCalled();
    });

    it("allows individual fields to be omitted without triggering validation", async () => {
      const entry = makeEntry({ note: "old" });
      mockAccess(entry);
      const transaction = makeTransaction();
      vi.mocked(sequelize.transaction).mockResolvedValue(transaction as never);
      vi.mocked(TaskHistoryService.recordTimeEntryUpdated).mockResolvedValue(
        [] as never,
      );
      vi.mocked(TimeEntryRepository.sumloggedTime).mockResolvedValue(0);

      const result = await TimeEntryService.update(
        undefined as never,
        undefined as never,
        "new note",
        "t1",
        "u1",
        "e1",
      );
      expect(result.changedLabels).toEqual(["Note"]);
    });

    it("changes only the duration and computes overrun when it exceeds the task estimate", async () => {
      const entry = makeEntry({ durationMinutes: 10 });
      mockAccess(entry, { task: { estimatedTime: 20 } });
      const transaction = makeTransaction();
      vi.mocked(sequelize.transaction).mockResolvedValue(transaction as never);
      vi.mocked(TaskHistoryService.recordTimeEntryUpdated).mockResolvedValue([
        { id: "h1" },
      ] as never);
      vi.mocked(TaskHistoryRepository.fetchHistoryWithActor).mockResolvedValue({
        id: "h1",
      } as never);
      vi.mocked(TimeEntryRepository.sumloggedTime).mockResolvedValue(30);

      const result = await TimeEntryService.update(
        30,
        "2026-01-01",
        "old",
        "t1",
        "u1",
        "e1",
      );
      expect(result.changedLabels).toEqual(["Duration"]);
      expect(result.overrun).toBe(true);
    });

    it("does not flag overrun when duration changes but stays within the estimate", async () => {
      const entry = makeEntry({ durationMinutes: 10 });
      mockAccess(entry, { task: { estimatedTime: 100 } });
      const transaction = makeTransaction();
      vi.mocked(sequelize.transaction).mockResolvedValue(transaction as never);
      vi.mocked(TaskHistoryService.recordTimeEntryUpdated).mockResolvedValue(
        [] as never,
      );
      vi.mocked(TimeEntryRepository.sumloggedTime).mockResolvedValue(50);

      const result = await TimeEntryService.update(
        20,
        "2026-01-01",
        "old",
        "t1",
        "u1",
        "e1",
      );
      expect(result.overrun).toBe(false);
    });

    it("covers line 210: evaluates all permutations of duration change and estimatedTime presence", async () => {
      const transaction = makeTransaction();
      vi.mocked(sequelize.transaction).mockResolvedValue(transaction as never);
      vi.mocked(TaskHistoryService.recordTimeEntryUpdated).mockResolvedValue(
        [] as never,
      );

      // Permutation A: Duration changed + task has estimatedTime + totalMinutes <= estimatedTime
      const entryA = makeEntry({ durationMinutes: 10 });
      mockAccess(entryA, { task: { estimatedTime: 100 } });
      vi.mocked(TimeEntryRepository.sumloggedTime).mockResolvedValue(50);
      const resA = await TimeEntryService.update(
        20,
        "2026-01-01",
        "old",
        "t1",
        "u1",
        "e1",
      );
      expect(resA.overrun).toBe(false);

      // Permutation B: Duration changed + task has estimatedTime + totalMinutes > estimatedTime
      vi.mocked(TimeEntryRepository.sumloggedTime).mockResolvedValue(150);
      const resB = await TimeEntryService.update(
        30,
        "2026-01-01",
        "old",
        "t1",
        "u1",
        "e1",
      );
      expect(resB.overrun).toBe(true);

      // Permutation C: Duration changed + task has NO estimatedTime (null)
      const entryC = makeEntry({ durationMinutes: 10 });
      mockAccess(entryC, { task: { estimatedTime: null } });
      vi.mocked(TimeEntryRepository.sumloggedTime).mockResolvedValue(200);
      const resC = await TimeEntryService.update(
        40,
        "2026-01-01",
        "old",
        "t1",
        "u1",
        "e1",
      );
      expect(resC.overrun).toBe(false);

      // Permutation D: Duration UNCHANGED (only note changed) + task HAS estimatedTime
      const entryD = makeEntry({ durationMinutes: 10, note: "initial" });
      mockAccess(entryD, { task: { estimatedTime: 50 } });
      vi.mocked(TimeEntryRepository.sumloggedTime).mockResolvedValue(500);
      const resD = await TimeEntryService.update(
        10,
        "2026-01-01",
        "brand new note",
        "t1",
        "u1",
        "e1",
      );
      expect(resD.changedLabels).toEqual(["Note"]);
      expect(resD.overrun).toBe(false);
    });

    it("updates the entry date when it actually changes", async () => {
      const entry = makeEntry({ entryDate: new Date("2026-01-01") });
      mockAccess(entry);
      const transaction = makeTransaction();
      vi.mocked(sequelize.transaction).mockResolvedValue(transaction as never);
      vi.mocked(TaskHistoryService.recordTimeEntryUpdated).mockResolvedValue(
        [] as never,
      );
      vi.mocked(TimeEntryRepository.sumloggedTime).mockResolvedValue(0);

      const result = await TimeEntryService.update(
        10,
        "2026-02-02",
        "old",
        "t1",
        "u1",
        "e1",
      );
      expect(result.changedLabels).toEqual(["Entry date"]);
    });

    it("rolls back the transaction when saving fails", async () => {
      const entry = makeEntry({
        save: vi.fn().mockRejectedValue(new Error("save failed")),
      });
      mockAccess(entry);
      const transaction = makeTransaction();
      vi.mocked(sequelize.transaction).mockResolvedValue(transaction as never);

      await expect(
        TimeEntryService.update(30, "2026-01-01", "old", "t1", "u1", "e1"),
      ).rejects.toThrow("save failed");
      expect(transaction.rollback).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------
  // remove
  // ---------------------------------------------------------------------
  describe("remove", () => {
    function mockAccess(timeEntry: any, overrides: Record<string, any> = {}) {
      vi.mocked(TimeEntryRepository.getTimeEntrywithAccess).mockResolvedValue({
        timeEntry,
        task: { estimatedTime: 20 },
        isProjectMember: true,
        isTaskMember: true,
        isProjectOwner: false,
        isAuthorized: true,
        ...overrides,
      } as never);
    }

    it("throws 404 when the access lookup returns nothing", async () => {
      vi.mocked(TimeEntryRepository.getTimeEntrywithAccess).mockResolvedValue(
        null,
      );
      await expect(
        TimeEntryService.remove("t1", "u1", "e1"),
      ).rejects.toMatchObject({ status: 404 });
    });

    it("throws 403 when the user is not a project member", async () => {
      mockAccess(
        {
          durationMinutes: 10,
          entryDate: new Date(),
          note: "n",
          destroy: vi.fn(),
        },
        { isProjectMember: false },
      );
      await expect(
        TimeEntryService.remove("t1", "u1", "e1"),
      ).rejects.toMatchObject({ status: 403 });
    });

    it("throws 404 when the time entry itself is missing", async () => {
      mockAccess(null);
      await expect(
        TimeEntryService.remove("t1", "u1", "e1"),
      ).rejects.toMatchObject({
        status: 404,
        message: "Time entry not found",
      });
    });

    it("records history, destroys the entry, and commits the transaction", async () => {
      const entry = {
        durationMinutes: 10,
        entryDate: new Date("2026-01-01"),
        note: "n",
        destroy: vi.fn(),
      };
      mockAccess(entry);
      const transaction = makeTransaction();
      vi.mocked(sequelize.transaction).mockResolvedValue(transaction as never);
      vi.mocked(TaskHistoryService.recordTimeEntryDeleted).mockResolvedValue({
        id: "h2",
      } as never);
      vi.mocked(TaskHistoryRepository.fetchHistoryWithActor).mockResolvedValue({
        id: "h2",
      } as never);

      await expect(TimeEntryService.remove("t1", "u1", "e1")).resolves.toEqual({
        id: "h2",
      });
      expect(entry.destroy).toHaveBeenCalledWith({ transaction });
      expect(transaction.commit).toHaveBeenCalled();
    });

    it("omits the entryDate from history when the entry has none", async () => {
      const entry = {
        durationMinutes: 10,
        entryDate: null,
        note: "n",
        destroy: vi.fn(),
      };
      mockAccess(entry);
      const transaction = makeTransaction();
      vi.mocked(sequelize.transaction).mockResolvedValue(transaction as never);
      vi.mocked(TaskHistoryService.recordTimeEntryDeleted).mockResolvedValue({
        id: "h2",
      } as never);
      vi.mocked(TaskHistoryRepository.fetchHistoryWithActor).mockResolvedValue({
        id: "h2",
      } as never);

      await TimeEntryService.remove("t1", "u1", "e1");

      expect(TaskHistoryService.recordTimeEntryDeleted).toHaveBeenCalledWith(
        "t1",
        "u1",
        expect.objectContaining({ entryDate: undefined }),
        transaction,
      );
    });

    it("rolls back the transaction when deletion fails", async () => {
      const entry = {
        durationMinutes: 10,
        entryDate: new Date("2026-01-01"),
        note: "n",
        destroy: vi.fn().mockRejectedValue(new Error("failed")),
      };
      mockAccess(entry);
      const transaction = makeTransaction();
      vi.mocked(sequelize.transaction).mockResolvedValue(transaction as never);
      vi.mocked(TaskHistoryService.recordTimeEntryDeleted).mockResolvedValue({
        id: "h2",
      } as never);
      vi.mocked(TaskHistoryRepository.fetchHistoryWithActor).mockResolvedValue({
        id: "h2",
      } as never);

      await expect(TimeEntryService.remove("t1", "u1", "e1")).rejects.toThrow(
        "failed",
      );
      expect(transaction.rollback).toHaveBeenCalled();
    });
  });
});
