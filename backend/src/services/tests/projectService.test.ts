import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProjectService } from "../projectService";
import { ProjectRepository } from "../../repositories/projectRepository";
import { StatusRepository } from "../../repositories/statusRepository";
import { ProjectMemberRepository } from "../../repositories/projectMemberRepository";
import { sequelize } from "../../models";

vi.mock("../../models", () => ({ sequelize: { transaction: vi.fn() } }));
vi.mock("../../repositories/projectRepository", () => ({
  ProjectRepository: { create: vi.fn(), getProjectWithMember: vi.fn() },
}));
vi.mock("../../repositories/statusRepository", () => ({
  StatusRepository: { bulkCreateDefaultStatuses: vi.fn() },
}));
vi.mock("../../repositories/projectMemberRepository", () => ({
  ProjectMemberRepository: { addCreatorToProject: vi.fn() },
}));

describe("ProjectService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("validates project names", async () => {
    await expect(
      ProjectService.create(" ", "description", "u1"),
    ).rejects.toMatchObject({ status: 400 });
  });

  it("creates a project with defaults and rolls back failures", async () => {
    const transaction = { commit: vi.fn(), rollback: vi.fn() };
    vi.mocked(sequelize.transaction).mockResolvedValue(transaction as never);
    vi.mocked(ProjectRepository.create).mockResolvedValue({
      id: "p1",
    } as never);
    vi.mocked(ProjectMemberRepository.addCreatorToProject).mockResolvedValue({
      id: "m1",
    } as never);

    await expect(
      ProjectService.create(" Work ", "description", "u1"),
    ).resolves.toEqual({ project: { id: "p1" }, id: "m1" });

    expect(StatusRepository.bulkCreateDefaultStatuses).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ name: "TODO", position: 0 }),
        expect.objectContaining({ name: "DONE", position: 2 }),
      ]),
      transaction,
    );

    vi.mocked(ProjectRepository.create).mockRejectedValue(new Error("failed"));
    await expect(
      ProjectService.create("Work", "description", "u1"),
    ).rejects.toThrow("failed");
    expect(transaction.rollback).toHaveBeenCalled();
  });

  it("updates and removes only owned projects", async () => {
    // 404 when project not found on update
    vi.mocked(ProjectRepository.getProjectWithMember).mockResolvedValue(null);
    await expect(
      ProjectService.update("p1", "u1", { name: "New" }),
    ).rejects.toMatchObject({ status: 404 });

    // 403 when not owner on update
    vi.mocked(ProjectRepository.getProjectWithMember).mockResolvedValue({
      members: [{ role: "MEMBER" }],
    } as never);
    await expect(
      ProjectService.update("p1", "u1", { name: "New" }),
    ).rejects.toMatchObject({
      status: 403,
      message: "Access denied. Only project owners can edit project details.",
    });

    const project: any = {
      name: "Old",
      description: "old",
      members: [{ role: "OWNER" }],
      save: vi.fn(),
      destroy: vi.fn(),
    };

    // Valid name update (hits line 74: changedLabel = "Name")
    vi.mocked(ProjectRepository.getProjectWithMember).mockResolvedValue(
      project,
    );
    await expect(
      ProjectService.update("p1", "u1", { name: "  Brand New Name  " }),
    ).resolves.toEqual({
      updatedField: { name: "Brand New Name" },
      changedLabel: "Name",
    });
    expect(project.save).toHaveBeenCalled();

    // Valid description update
    await expect(
      ProjectService.update("p1", "u1", { description: "new" }),
    ).resolves.toEqual({
      updatedField: { description: "new" },
      changedLabel: "Description",
    });

    // Blank name rejected on update
    await expect(
      ProjectService.update("p1", "u1", { name: " " }),
    ).rejects.toMatchObject({ status: 400 });

    // Empty payload update
    await expect(ProjectService.update("p1", "u1", {})).resolves.toEqual({
      updatedField: {},
      changedLabel: "",
    });

    // 404 when project not found on remove
    vi.mocked(ProjectRepository.getProjectWithMember).mockResolvedValue(null);
    await expect(ProjectService.remove("p1", "u1")).rejects.toMatchObject({
      status: 404,
    });

    // 403 when not owner on remove (hits lines 87-89)
    vi.mocked(ProjectRepository.getProjectWithMember).mockResolvedValue({
      members: [{ role: "MEMBER" }],
    } as never);
    await expect(ProjectService.remove("p1", "u1")).rejects.toMatchObject({
      status: 403,
      message: "Access denied. Only project owners delete a project.",
    });

    // 403 when membership missing on remove
    vi.mocked(ProjectRepository.getProjectWithMember).mockResolvedValue({
      members: [],
    } as never);
    await expect(ProjectService.remove("p1", "u1")).rejects.toMatchObject({
      status: 403,
    });

    // Successful deletion with transaction commit
    vi.mocked(ProjectRepository.getProjectWithMember).mockResolvedValue(
      project,
    );
    const transaction = { commit: vi.fn(), rollback: vi.fn() };
    vi.mocked(sequelize.transaction).mockResolvedValue(transaction as never);
    await expect(ProjectService.remove("p1", "u1")).resolves.toBeUndefined();
    expect(project.destroy).toHaveBeenCalledWith({ transaction });
    expect(transaction.commit).toHaveBeenCalled();

    // Deletion failure triggering rollback
    project.destroy.mockRejectedValue(new Error("failed"));
    await expect(ProjectService.remove("p1", "u1")).rejects.toThrow("failed");
    expect(transaction.rollback).toHaveBeenCalled();
  });
});
