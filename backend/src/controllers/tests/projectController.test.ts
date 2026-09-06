import { beforeEach, describe, expect, it, vi } from "vitest";
import * as controller from "../projectController";
import { ProjectService } from "../../services/projectService";
vi.mock("../../services/projectService", () => ({
  ProjectService: { create: vi.fn(), update: vi.fn(), remove: vi.fn() },
}));
const response = () => ({ status: vi.fn().mockReturnThis(), json: vi.fn() });
describe("projectController", () => {
  beforeEach(() => vi.clearAllMocks());
  it("forwards project operations", async () => {
    const req: any = {
      user: { id: "u1" },
      params: { id: "p1" },
      body: { name: "P" },
    };
    const res: any = response();
    const next = vi.fn();
    vi.mocked(ProjectService.create).mockResolvedValue({
      project: { id: "p1" },
      id: "m1",
    } as never);
    await controller.create(req, res, next);
    vi.mocked(ProjectService.update).mockResolvedValue({
      updatedField: { name: "P" },
      changedLabel: "Name",
    } as never);
    await controller.update(req, res, next);
    vi.mocked(ProjectService.remove).mockResolvedValue(undefined);
    await controller.remove(req, res, next);
    expect(ProjectService.create).toHaveBeenCalledWith("P", undefined, "u1");
    expect(res.status).toHaveBeenCalledWith(200);
  });
  it("defaults the update message label when changedLabel is falsy", async () => {
    const req: any = {
      user: { id: "u1" },
      params: { id: "p1" },
      body: { name: "P" },
    };
    const res: any = response();
    const next = vi.fn();
    vi.mocked(ProjectService.update).mockResolvedValue({
      updatedField: { name: "P" },
      changedLabel: undefined,
    } as never);
    await controller.update(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Project updated successfully",
      project: { name: "P" },
    });
  });
  it("maps typed and unexpected errors for every operation", async () => {
    const req: any = { user: { id: "u1" }, params: { id: "p1" }, body: {} };
    const res: any = response();
    const next = vi.fn();
    const cases: Array<[any, () => Promise<unknown>]> = [
      [ProjectService.create, () => controller.create(req, res, next)],
      [ProjectService.update, () => controller.update(req, res, next)],
      [ProjectService.remove, () => controller.remove(req, res, next)],
    ];
    for (const [method, invoke] of cases) {
      vi.mocked(method).mockRejectedValueOnce({ status: 400, message: "bad" });
      await invoke();
      vi.mocked(method).mockRejectedValueOnce(new Error("boom"));
      await invoke();
    }
    expect(next).toHaveBeenCalledTimes(3);
  });
});
