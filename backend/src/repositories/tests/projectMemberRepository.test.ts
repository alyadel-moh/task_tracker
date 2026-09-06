import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProjectMemberRepository } from "../projectMemberRepository";
import { ProjectMembers } from "../../models";

vi.mock("../../models", () => ({
  User: {},
  Project: {},
  ProjectMembers: {
    findAll: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
    destroy: vi.fn(),
  },
}));

describe("ProjectMemberRepository", () => {
  beforeEach(() => vi.clearAllMocks());

  it("queries members, invitations, assigned projects, and counts owners", async () => {
    vi.mocked(ProjectMembers.findAll).mockResolvedValue([] as never);
    vi.mocked(ProjectMembers.findOne).mockResolvedValue(null);
    vi.mocked(ProjectMembers.count).mockResolvedValue(2);
    await ProjectMemberRepository.getAll("p1");
    await ProjectMemberRepository.getPendingInvitations("u1");
    await ProjectMemberRepository.getAssignedProjects("u1");
    await ProjectMemberRepository.countOwners("p1");
    expect(ProjectMembers.findAll).toHaveBeenCalledTimes(3);
    expect(ProjectMembers.count).toHaveBeenCalledWith({
      where: { projectId: "p1", role: "OWNER" },
    });
  });

  it("creates and finds membership records", async () => {
    vi.mocked(ProjectMembers.create).mockResolvedValue({ id: "m1" } as never);
    await ProjectMemberRepository.addMember("p1", "u1", "MEMBER" as never);
    await ProjectMemberRepository.addCreatorToProject("p1", "u1");
    await ProjectMemberRepository.getMemberByProjectId({
      projectId: "p1",
      id: "m1",
    });
    await ProjectMemberRepository.getMembershipwithProject("u1", "p1");
    await ProjectMemberRepository.getPendingInvitation("m1");
    expect(ProjectMembers.create).toHaveBeenCalledTimes(2);
  });

  it("rejects missing pending invitations and accepts existing ones", async () => {
    vi.mocked(ProjectMembers.update).mockResolvedValue([0] as never);
    await expect(
      ProjectMemberRepository.acceptInvitation("u1", "p1"),
    ).rejects.toMatchObject({ status: 404 });
    vi.mocked(ProjectMembers.update).mockResolvedValue([1] as never);
    vi.mocked(ProjectMembers.findOne).mockResolvedValue({ id: "m1" } as never);
    await expect(
      ProjectMemberRepository.acceptInvitation("u1", "p1"),
    ).resolves.toEqual({ id: "m1" });
  });

  it("declines an invitation", async () => {
    vi.mocked(ProjectMembers.destroy).mockResolvedValue(1);
    await ProjectMemberRepository.declineInvitation("u1", "p1");
    expect(ProjectMembers.destroy).toHaveBeenCalledWith({
      where: { userId: "u1", projectId: "p1", membershipStatus: "PENDING" },
    });
  });
});
