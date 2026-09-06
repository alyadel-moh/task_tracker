import { beforeEach, describe, expect, it, vi } from "vitest";
import * as controller from "../taskController";
import { TaskService } from "../../services/taskService";
vi.mock("../../services/taskService", () => ({
  TaskService: {
    create: vi.fn(),
    getById: vi.fn(),
    getAll: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));
const response = () => ({ status: vi.fn().mockReturnThis(), json: vi.fn() });
describe("taskController", () => {
  beforeEach(() => vi.clearAllMocks());
  it("forwards task operations and response data", async () => {
    const req: any = {
      user: { id: "u1" },
      params: { projectId: "p1", id: "t1" },
      body: { name: "Task" },
      query: {},
    };
    const res: any = response();
    const next = vi.fn();
    vi.mocked(TaskService.create).mockResolvedValue({ id: "t1" } as never);
    await controller.create(req, res, next);
    vi.mocked(TaskService.getById).mockResolvedValue({ id: "t1" } as never);
    await controller.getById(req, res, next);
    vi.mocked(TaskService.getAll).mockResolvedValue([] as never);
    await controller.getAll(req, res, next);
    req.query = { overdue: "true" };
    await controller.getAll(req, res, next);
    vi.mocked(TaskService.update).mockResolvedValue({
      updatedFields: { name: "Task" },
      changedLabels: ["Name"],
      detailedHistoryEntries: [],
      overrun: false,
    } as never);
    await controller.update(req, res, next);
    vi.mocked(TaskService.remove).mockResolvedValue(undefined);
    await controller.remove(req, res, next);
    expect(TaskService.getById).toHaveBeenCalledWith("p1", "t1", "u1");
    expect(res.status).toHaveBeenCalled();
  });
  it("maps typed and unexpected errors for all task operations", async () => {
    const req: any = {
      user: { id: "u1" },
      params: { projectId: "p1", id: "t1" },
      body: {},
      query: {},
    };
    const res: any = response();
    const next = vi.fn();
    const cases: Array<[any, () => Promise<unknown>]> = [
      [TaskService.create, () => controller.create(req, res, next)],
      [TaskService.getById, () => controller.getById(req, res, next)],
      [TaskService.getAll, () => controller.getAll(req, res, next)],
      [TaskService.update, () => controller.update(req, res, next)],
      [TaskService.remove, () => controller.remove(req, res, next)],
    ];
    for (const [method, invoke] of cases) {
      vi.mocked(method).mockRejectedValueOnce({ status: 400, message: "bad" });
      await invoke();
      vi.mocked(method).mockRejectedValueOnce(new Error("boom"));
      await invoke();
    }
    expect(next).toHaveBeenCalledTimes(5);
  });
});
