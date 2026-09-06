import { beforeEach, describe, expect, it, vi } from "vitest";
import * as controller from "../statusController";
import { StatusService } from "../../services/statusService";
vi.mock("../../services/statusService", () => ({
  StatusService: {
    update: vi.fn(),
    create: vi.fn(),
    remove: vi.fn(),
    getAll: vi.fn(),
  },
}));
const response = () => ({ status: vi.fn().mockReturnThis(), json: vi.fn() });
describe("statusController", () => {
  beforeEach(() => vi.clearAllMocks());
  it("forwards all status operations", async () => {
    const req: any = {
      user: { id: "u1" },
      params: { projectId: "p1", id: "s1" },
      body: { name: "Todo", position: 1 },
    };
    const res: any = response();
    const next = vi.fn();
    vi.mocked(StatusService.update).mockResolvedValue({
      updatedFields: { name: "Todo" },
    } as never);
    await controller.update(req, res, next);
    vi.mocked(StatusService.create).mockResolvedValue({ id: "s1" } as never);
    await controller.create(req, res, next);
    vi.mocked(StatusService.remove).mockResolvedValue(undefined);
    await controller.remove(req, res, next);
    vi.mocked(StatusService.getAll).mockResolvedValue([] as never);
    await controller.getAll(req, res, next);
    expect(res.status).toHaveBeenCalled();
  });
  it("maps typed and unexpected errors", async () => {
    const req: any = {
      user: { id: "u1" },
      params: { projectId: "p1", id: "s1" },
      body: {},
    };
    const res: any = response();
    const next = vi.fn();
    const cases: Array<[any, () => Promise<unknown>]> = [
      [StatusService.update, () => controller.update(req, res, next)],
      [StatusService.create, () => controller.create(req, res, next)],
      [StatusService.remove, () => controller.remove(req, res, next)],
      [StatusService.getAll, () => controller.getAll(req, res, next)],
    ];
    for (const [method, invoke] of cases) {
      vi.mocked(method).mockRejectedValueOnce({ status: 400, message: "bad" });
      await invoke();
      vi.mocked(method).mockRejectedValueOnce(new Error("boom"));
      await invoke();
    }
    expect(next).toHaveBeenCalledTimes(4);
  });
});
