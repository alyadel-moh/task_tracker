import { beforeEach, describe, expect, it, vi } from "vitest";
import * as controller from "../projectMembersController";
import { ProjectMemberService } from "../../services/projectMemberService";
vi.mock("../../services/projectMemberService", () => ({
  ProjectMemberService: {
    getAll: vi.fn(),
    updateRole: vi.fn(),
    removeMember: vi.fn(),
    addMember: vi.fn(),
    leaveProject: vi.fn(),
    cancelInvitation: vi.fn(),
    acceptInvitation: vi.fn(),
    declineInvitation: vi.fn(),
    getAssignedProjects: vi.fn(),
    getPendingInvitations: vi.fn(),
  },
}));
const response = () => ({ status: vi.fn().mockReturnThis(), json: vi.fn() });
describe("projectMembersController", () => {
  beforeEach(() => vi.clearAllMocks());
  it("forwards all membership operations", async () => {
    const req: any = {
      user: { id: "u1" },
      params: { projectId: "p1", id: "m1" },
      body: { email: "a@x.com", role: "MEMBER" },
    };
    const res: any = response();
    const next = vi.fn();
    vi.mocked(ProjectMemberService.getAll).mockResolvedValue([] as never);
    await controller.getAll(req, res, next);
    vi.mocked(ProjectMemberService.updateRole).mockResolvedValue(undefined);
    await controller.updateRole(req, res, next);
    vi.mocked(ProjectMemberService.removeMember).mockResolvedValue(undefined);
    await controller.removeMember(req, res, next);
    vi.mocked(ProjectMemberService.addMember).mockResolvedValue({
      projectMember: { id: "m1" },
      user: { id: "u2", name: "B", email: "b@x.com" },
    } as never);
    await controller.addMember(req, res, next);
    vi.mocked(ProjectMemberService.leaveProject).mockResolvedValue(undefined);
    await controller.leaveProject(req, res, next);
    vi.mocked(ProjectMemberService.cancelInvitation).mockResolvedValue(
      undefined,
    );
    await controller.cancelInvitation(req, res, next);
    vi.mocked(ProjectMemberService.acceptInvitation).mockResolvedValue({
      id: "m1",
    } as never);
    await controller.acceptInvitation(req, res, next);
    vi.mocked(ProjectMemberService.declineInvitation).mockResolvedValue(
      undefined,
    );
    await controller.declineInvitation(req, res, next);
    vi.mocked(ProjectMemberService.getAssignedProjects).mockResolvedValue(
      [] as never,
    );
    await controller.getAssignedProjects(req, res, next);
    vi.mocked(ProjectMemberService.getPendingInvitations).mockResolvedValue(
      [] as never,
    );
    await controller.getPendingInvitations(req, res, next);
    expect(res.status).toHaveBeenCalled();
  });
  it("maps typed and unexpected errors across membership operations", async () => {
    const req: any = {
      user: { id: "u1" },
      params: { projectId: "p1", id: "m1" },
      body: {},
    };
    const res: any = response();
    const next = vi.fn();
    const cases: Array<[any, () => Promise<unknown>]> = [
      [ProjectMemberService.getAll, () => controller.getAll(req, res, next)],
      [
        ProjectMemberService.updateRole,
        () => controller.updateRole(req, res, next),
      ],
      [
        ProjectMemberService.removeMember,
        () => controller.removeMember(req, res, next),
      ],
      [
        ProjectMemberService.addMember,
        () => controller.addMember(req, res, next),
      ],
      [
        ProjectMemberService.leaveProject,
        () => controller.leaveProject(req, res, next),
      ],
      [
        ProjectMemberService.cancelInvitation,
        () => controller.cancelInvitation(req, res, next),
      ],
      [
        ProjectMemberService.acceptInvitation,
        () => controller.acceptInvitation(req, res, next),
      ],
      [
        ProjectMemberService.declineInvitation,
        () => controller.declineInvitation(req, res, next),
      ],
      [
        ProjectMemberService.getAssignedProjects,
        () => controller.getAssignedProjects(req, res, next),
      ],
      [
        ProjectMemberService.getPendingInvitations,
        () => controller.getPendingInvitations(req, res, next),
      ],
    ];
    for (const [method, invoke] of cases) {
      vi.mocked(method).mockRejectedValueOnce({ status: 400, message: "bad" });
      await invoke();
      vi.mocked(method).mockRejectedValueOnce(new Error("boom"));
      await invoke();
    }
    expect(next).toHaveBeenCalledTimes(10);
  });
});
