import { beforeEach, describe, expect, it, vi } from "vitest";
import { StatusService } from "../statusService";
import { StatusRepository } from "../../repositories/statusRepository";
import { TaskRepository } from "../../repositories/taskReposiotry";
import { isMember } from "../../utils/projectGaurds";
import { Status, sequelize } from "../../models";

vi.mock("../../models", () => ({
  Status: { update: vi.fn() },
  sequelize: { transaction: vi.fn() },
}));
vi.mock("../../repositories/statusRepository", () => ({
  StatusRepository: {
    getByIdAndProjectId: vi.fn(),
    getMaximumPositionStatus: vi.fn(),
    create: vi.fn(),
    getAll: vi.fn(),
    decrementPositionsAfterDeletion: vi.fn(),
  },
}));
vi.mock("../../repositories/taskReposiotry", () => ({
  TaskRepository: { getTasksAssignedWithStatusId: vi.fn() },
}));
vi.mock("../../utils/projectGaurds", () => ({ isMember: vi.fn() }));

describe("StatusService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("validates membership and creates at the first or next position", async () => {
    await expect(StatusService.create("p1", "u1", " ")).rejects.toMatchObject({
      status: 400,
    });
    vi.mocked(isMember).mockResolvedValue(false as never);
    await expect(
      StatusService.create("p1", "u1", "Todo"),
    ).rejects.toMatchObject({ status: 403 });
    vi.mocked(isMember).mockResolvedValue({ id: "m1" } as never);
    vi.mocked(StatusRepository.getMaximumPositionStatus).mockResolvedValue(
      null,
    );
    vi.mocked(StatusRepository.create).mockResolvedValue({ id: "s1" } as never);
    await expect(StatusService.create("p1", "u1", " Todo ")).resolves.toEqual({
      id: "s1",
    });
    expect(StatusRepository.create).toHaveBeenCalledWith("p1", "Todo", 0);
    vi.mocked(StatusRepository.getMaximumPositionStatus).mockResolvedValue({
      position: 2,
    } as never);
    await expect(StatusService.create("p1", "u1", "Next")).resolves.toEqual({
      id: "s1",
    });
    expect(StatusRepository.create).toHaveBeenLastCalledWith("p1", "Next", 3);
  });

  it("updates names, reorders statuses, and rejects defaults", async () => {
    vi.mocked(isMember).mockResolvedValue(false as never);
    await expect(
      StatusService.update("p1", "s1", "u1", "Todo"),
    ).rejects.toMatchObject({ status: 403 });

    vi.mocked(isMember).mockResolvedValue({ id: "m1" } as never);
    vi.mocked(StatusRepository.getByIdAndProjectId).mockResolvedValue(null);
    await expect(
      StatusService.update("p1", "s1", "u1", "Todo"),
    ).rejects.toMatchObject({ status: 404 });

    const status: any = {
      id: "s1",
      name: "Old",
      position: 1,
      isDefault: false,
      save: vi.fn(),
      destroy: vi.fn(),
    };
    vi.mocked(StatusRepository.getByIdAndProjectId).mockResolvedValue(status);

    await expect(
      StatusService.update("p1", "s1", "u1", "   "),
    ).rejects.toMatchObject({ status: 400 });

    await expect(
      StatusService.update("p1", "s1", "u1", " New "),
    ).resolves.toMatchObject({ updatedFields: { name: "New" } });

    status.isDefault = true;
    await expect(
      StatusService.update("p1", "s1", "u1", "Newer"),
    ).rejects.toMatchObject({ status: 400 });

    status.isDefault = false;
    vi.mocked(StatusRepository.getAll).mockResolvedValue([
      { id: "s2" },
      status,
    ] as never);

    await expect(
      StatusService.update("p1", "s1", "u1", undefined, 0),
    ).resolves.toMatchObject({ updatedFields: { position: 0 } });
    expect(Status.update).toHaveBeenCalled();

    await expect(
      StatusService.update("p1", "s1", "u1", undefined, 0),
    ).resolves.toEqual({ updatedFields: {}, updatedLabels: [] });

    await expect(
      StatusService.update("p1", "s1", "u1", undefined, -1),
    ).resolves.toEqual({ updatedFields: {}, updatedLabels: [] });

    await expect(StatusService.update("p1", "s1", "u1")).resolves.toEqual({
      updatedFields: {},
      updatedLabels: [],
    });
  });

  it("removes statuses only when no tasks are assigned and commits or rolls back", async () => {
    vi.mocked(isMember).mockResolvedValue({ id: "m1" } as never);
    const status: any = {
      id: "s1",
      position: 1,
      isDefault: false,
      destroy: vi.fn(),
    };
    vi.mocked(StatusRepository.getByIdAndProjectId).mockResolvedValue(status);
    vi.mocked(TaskRepository.getTasksAssignedWithStatusId).mockResolvedValue([
      { id: "t1" },
    ] as never);
    await expect(StatusService.remove("p1", "s1", "u1")).rejects.toMatchObject({
      status: 400,
    });
    vi.mocked(TaskRepository.getTasksAssignedWithStatusId).mockResolvedValue(
      [] as never,
    );
    const transaction = { commit: vi.fn(), rollback: vi.fn() };
    vi.mocked(sequelize.transaction).mockResolvedValue(transaction as never);
    await expect(StatusService.remove("p1", "s1", "u1")).resolves.toMatchObject(
      { message: expect.stringContaining("deleted") },
    );
    vi.mocked(status.destroy).mockRejectedValue(new Error("rollback"));
    await expect(StatusService.remove("p1", "s1", "u1")).rejects.toThrow(
      "rollback",
    );
    expect(transaction.rollback).toHaveBeenCalled();
  });

  it("covers status removal guards and membership listing", async () => {
    // Line 95: non-member guard on remove
    vi.mocked(isMember).mockResolvedValue(false as never);
    await expect(StatusService.remove("p1", "s1", "u1")).rejects.toMatchObject({
      status: 403,
      message: "You are not a member of this project",
    });

    await expect(StatusService.getAll("p1", "u1")).rejects.toMatchObject({
      status: 403,
    });

    vi.mocked(isMember).mockResolvedValue({ id: "m1" } as never);
    vi.mocked(StatusRepository.getAll).mockResolvedValue([
      { id: "s1" },
    ] as never);
    await expect(StatusService.getAll("p1", "u1")).resolves.toEqual([
      { id: "s1" },
    ]);

    vi.mocked(StatusRepository.getByIdAndProjectId).mockResolvedValue(null);
    await expect(StatusService.remove("p1", "s1", "u1")).rejects.toMatchObject({
      status: 404,
    });

    vi.mocked(StatusRepository.getByIdAndProjectId).mockResolvedValue({
      isDefault: true,
    } as never);
    await expect(StatusService.remove("p1", "s1", "u1")).rejects.toMatchObject({
      status: 400,
    });
  });
});
