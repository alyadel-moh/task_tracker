import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProjectMemberService } from "../projectMemberService";
import { ProjectMemberRepository } from "../../repositories/projectMemberRepository";
import { TaskRepository } from "../../repositories/taskReposiotry";
import { AuthRepository } from "../../repositories/authRepository";
import { isMember, isOwner } from "../../utils/projectGaurds";
import sequelize from "../../models";

vi.mock("../../models", () => ({ default: { transaction: vi.fn() } }));
vi.mock("../../repositories/projectMemberRepository", () => ({
  ProjectMemberRepository: {
    getAll: vi.fn(),
    getMemberByProjectId: vi.fn(),
    countOwners: vi.fn(),
    addMember: vi.fn(),
    getPendingInvitation: vi.fn(),
    declineInvitation: vi.fn(),
    acceptInvitation: vi.fn(),
    getAssignedProjects: vi.fn(),
    getPendingInvitations: vi.fn(),
  },
}));
vi.mock("../../repositories/taskReposiotry", () => ({
  TaskRepository: { removeAssignedUserFromTask: vi.fn() },
}));
vi.mock("../../repositories/authRepository", () => ({
  AuthRepository: { getUserByEmail: vi.fn() },
}));
vi.mock("../../utils/projectGaurds", () => ({
  isMember: vi.fn(),
  isOwner: vi.fn(),
}));

describe("ProjectMemberService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("handles member list and role authorization", async () => {
    vi.mocked(isMember).mockResolvedValue(false as never);
    await expect(ProjectMemberService.getAll("p1", "u1")).rejects.toMatchObject(
      { status: 403 },
    );
    vi.mocked(isMember).mockResolvedValue({ role: "MEMBER" } as never);
    vi.mocked(ProjectMemberRepository.getAll).mockResolvedValue([
      { id: "m1" },
    ] as never);
    await expect(ProjectMemberService.getAll("p1", "u1")).resolves.toEqual([
      { id: "m1" },
    ]);
    vi.mocked(isOwner).mockResolvedValue(false as never);
    await expect(
      ProjectMemberService.updateRole("m1", "p1", "u1", "MEMBER" as never),
    ).rejects.toMatchObject({ status: 403 });
    vi.mocked(isOwner).mockResolvedValue(true as never);
    await expect(
      ProjectMemberService.updateRole("m1", "p1", "u1", "BAD" as never),
    ).rejects.toMatchObject({ status: 400 });
    vi.mocked(ProjectMemberRepository.getMemberByProjectId).mockResolvedValue(
      null,
    );
    await expect(
      ProjectMemberService.updateRole("m1", "p1", "u1", "OWNER" as never),
    ).rejects.toMatchObject({ status: 404 });
  });

  it("protects the only owner and updates valid roles", async () => {
    const member: any = {
      role: "OWNER",
      userId: "u2",
      update: vi.fn(),
      destroy: vi.fn(),
    };
    vi.mocked(isOwner).mockResolvedValue(true as never);
    vi.mocked(ProjectMemberRepository.getMemberByProjectId).mockResolvedValue(
      member,
    );
    vi.mocked(ProjectMemberRepository.countOwners).mockResolvedValue(1);
    await expect(
      ProjectMemberService.updateRole("m1", "p1", "u1", "MEMBER" as never),
    ).rejects.toMatchObject({ status: 400 });
    vi.mocked(ProjectMemberRepository.countOwners).mockResolvedValue(2);
    await expect(
      ProjectMemberService.updateRole("m1", "p1", "u1", "MEMBER" as never),
    ).resolves.toBeUndefined();
    expect(member.update).toHaveBeenCalledWith({ role: "MEMBER" });
  });

  it("covers line 40: updates role when member is not an owner or role is not member", async () => {
    vi.mocked(isOwner).mockResolvedValue(true as never);
    const member: any = {
      role: "MEMBER",
      userId: "u2",
      update: vi.fn(),
    };
    vi.mocked(ProjectMemberRepository.getMemberByProjectId).mockResolvedValue(
      member,
    );

    // Updating a MEMBER to OWNER (bypasses countOwners check)
    await expect(
      ProjectMemberService.updateRole("m1", "p1", "u1", "OWNER" as never),
    ).resolves.toBeUndefined();
    expect(member.update).toHaveBeenCalledWith({ role: "OWNER" });
  });

  it("adds members and handles invitation fallbacks", async () => {
    vi.mocked(isOwner).mockResolvedValue(true as never);
    vi.mocked(AuthRepository.getUserByEmail).mockResolvedValue(null);
    await expect(
      ProjectMemberService.addMember("p1", "x@x.com", "u1", "MEMBER" as never),
    ).rejects.toMatchObject({ status: 404 });
    const user = { id: "u2" };
    vi.mocked(AuthRepository.getUserByEmail).mockResolvedValue(user as never);
    vi.mocked(isMember).mockResolvedValue({ role: "MEMBER" } as never);
    await expect(
      ProjectMemberService.addMember("p1", "x@x.com", "u1", "MEMBER" as never),
    ).rejects.toMatchObject({ status: 400 });
    vi.mocked(isMember).mockResolvedValue(false as never);
    vi.mocked(ProjectMemberRepository.addMember).mockResolvedValue({
      id: "m1",
    } as never);
    await expect(
      ProjectMemberService.addMember("p1", "x@x.com", "u1", "MEMBER" as never),
    ).resolves.toEqual({ projectMember: { id: "m1" }, user });
    vi.mocked(ProjectMemberRepository.getAssignedProjects).mockResolvedValue(
      null as never,
    );
    vi.mocked(ProjectMemberRepository.getPendingInvitations).mockResolvedValue(
      undefined as never,
    );
    await expect(
      ProjectMemberService.getAssignedProjects("u1"),
    ).resolves.toEqual([]);
    await expect(
      ProjectMemberService.getPendingInvitations("u1"),
    ).resolves.toEqual([]);
  });

  it("handles leave, removal, cancellation, and invitation decisions", async () => {
    vi.mocked(isMember).mockResolvedValue(false as never);
    await expect(
      ProjectMemberService.leaveProject("p1", "u1"),
    ).rejects.toMatchObject({ status: 404 });
    const transaction = { commit: vi.fn(), rollback: vi.fn() };
    vi.mocked(sequelize.transaction).mockResolvedValue(transaction as never);
    const member: any = { role: "MEMBER", userId: "u1", destroy: vi.fn() };
    vi.mocked(isMember).mockResolvedValue(member);
    await expect(
      ProjectMemberService.leaveProject("p1", "u1"),
    ).resolves.toBeUndefined();
    vi.mocked(ProjectMemberRepository.getPendingInvitation).mockResolvedValue(
      null,
    );
    await expect(
      ProjectMemberService.cancelInvitation("u1", "p1", "m1"),
    ).rejects.toMatchObject({ status: 404 });
    vi.mocked(ProjectMemberRepository.declineInvitation).mockResolvedValue(
      0 as never,
    );
    await expect(
      ProjectMemberService.declineInvitation("p1", "u1"),
    ).rejects.toMatchObject({ status: 404 });
    vi.mocked(ProjectMemberRepository.acceptInvitation).mockResolvedValue({
      id: "m1",
    } as never);
    await expect(
      ProjectMemberService.acceptInvitation("p1", "u1"),
    ).resolves.toEqual({ id: "m1" });
    vi.mocked(ProjectMemberRepository.declineInvitation).mockResolvedValue(
      1 as never,
    );
    await expect(
      ProjectMemberService.declineInvitation("p1", "u1"),
    ).resolves.toBeUndefined();
    vi.mocked(ProjectMemberRepository.getPendingInvitation).mockResolvedValue({
      destroy: vi.fn(),
    } as never);
    await expect(
      ProjectMemberService.cancelInvitation("u1", "p1", "m1"),
    ).resolves.toBeUndefined();
  });

  it("protects owners and rolls back member removal", async () => {
    vi.mocked(isOwner).mockResolvedValue(true as never);
    const owner: any = { role: "OWNER", userId: "u2", destroy: vi.fn() };
    vi.mocked(ProjectMemberRepository.getMemberByProjectId).mockResolvedValue(
      owner,
    );
    vi.mocked(ProjectMemberRepository.countOwners).mockResolvedValue(1);
    await expect(
      ProjectMemberService.removeMember("m1", "p1", "u1"),
    ).rejects.toMatchObject({ status: 400 });
    vi.mocked(ProjectMemberRepository.countOwners).mockResolvedValue(2);
    const transaction = { commit: vi.fn(), rollback: vi.fn() };
    vi.mocked(sequelize.transaction).mockResolvedValue(transaction as never);
    vi.mocked(TaskRepository.removeAssignedUserFromTask).mockRejectedValue(
      new Error("failed"),
    );
    await expect(
      ProjectMemberService.removeMember("m1", "p1", "u1"),
    ).rejects.toThrow("failed");
    expect(transaction.rollback).toHaveBeenCalled();

    vi.mocked(isMember).mockResolvedValue({ role: "OWNER" } as never);
    vi.mocked(ProjectMemberRepository.countOwners).mockResolvedValue(1);
    await expect(
      ProjectMemberService.leaveProject("p1", "u1"),
    ).rejects.toMatchObject({ status: 400 });
  });

  it("covers line 127: allows owner to leave project when there are multiple owners", async () => {
    const transaction = { commit: vi.fn(), rollback: vi.fn() };
    vi.mocked(sequelize.transaction).mockResolvedValue(transaction as never);

    const ownerMember: any = {
      role: "OWNER",
      userId: "u1",
      destroy: vi.fn(),
    };
    vi.mocked(isMember).mockResolvedValue(ownerMember);
    vi.mocked(ProjectMemberRepository.countOwners).mockResolvedValue(2);
    vi.mocked(TaskRepository.removeAssignedUserFromTask).mockResolvedValue(
      undefined as never,
    );

    await expect(
      ProjectMemberService.leaveProject("p1", "u1"),
    ).resolves.toBeUndefined();
    expect(ownerMember.destroy).toHaveBeenCalledWith({ transaction });
    expect(transaction.commit).toHaveBeenCalled();
  });

  it("enforces owner checks and covers success paths for removeMember/addMember/cancelInvitation", async () => {
    // removeMember: not owner -> 403
    vi.mocked(isOwner).mockResolvedValue(false as never);
    await expect(
      ProjectMemberService.removeMember("m1", "p1", "u1"),
    ).rejects.toMatchObject({ status: 403 });

    // removeMember: member not found -> 404
    vi.mocked(isOwner).mockResolvedValue(true as never);
    vi.mocked(ProjectMemberRepository.getMemberByProjectId).mockResolvedValue(
      null,
    );
    await expect(
      ProjectMemberService.removeMember("m1", "p1", "u1"),
    ).rejects.toMatchObject({ status: 404 });

    // removeMember: full success path (destroy + commit)
    const member: any = { role: "MEMBER", userId: "u2", destroy: vi.fn() };
    vi.mocked(ProjectMemberRepository.getMemberByProjectId).mockResolvedValue(
      member,
    );
    const transaction = { commit: vi.fn(), rollback: vi.fn() };
    vi.mocked(sequelize.transaction).mockResolvedValue(transaction as never);
    vi.mocked(TaskRepository.removeAssignedUserFromTask).mockResolvedValue(
      undefined as never,
    );
    await expect(
      ProjectMemberService.removeMember("m1", "p1", "u1"),
    ).resolves.toBeUndefined();
    expect(member.destroy).toHaveBeenCalledWith({ transaction });
    expect(transaction.commit).toHaveBeenCalled();

    // addMember: not owner -> 403
    vi.mocked(isOwner).mockResolvedValue(false as never);
    await expect(
      ProjectMemberService.addMember("p1", "x@x.com", "u1", "MEMBER" as never),
    ).rejects.toMatchObject({ status: 403 });

    // cancelInvitation: not owner -> 403
    await expect(
      ProjectMemberService.cancelInvitation("u1", "p1", "m1"),
    ).rejects.toMatchObject({ status: 403 });
  });

  it("rolls back leaveProject on failure and passes through non-empty lists", async () => {
    const transaction = { commit: vi.fn(), rollback: vi.fn() };
    vi.mocked(sequelize.transaction).mockResolvedValue(transaction as never);
    const member: any = { role: "MEMBER", userId: "u1", destroy: vi.fn() };
    vi.mocked(isMember).mockResolvedValue(member);
    vi.mocked(TaskRepository.removeAssignedUserFromTask).mockRejectedValue(
      new Error("failed"),
    );
    await expect(ProjectMemberService.leaveProject("p1", "u1")).rejects.toThrow(
      "failed",
    );
    expect(transaction.rollback).toHaveBeenCalled();

    vi.mocked(ProjectMemberRepository.getAssignedProjects).mockResolvedValue([
      { id: "p1" },
    ] as never);
    await expect(
      ProjectMemberService.getAssignedProjects("u1"),
    ).resolves.toEqual([{ id: "p1" }]);

    vi.mocked(ProjectMemberRepository.getPendingInvitations).mockResolvedValue([
      { id: "inv1" },
    ] as never);
    await expect(
      ProjectMemberService.getPendingInvitations("u1"),
    ).resolves.toEqual([{ id: "inv1" }]);
  });
});
