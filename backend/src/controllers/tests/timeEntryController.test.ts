import { beforeEach, describe, expect, it, vi } from "vitest";
import * as controller from "../timeEntryController";
import { TimeEntryService } from "../../services/timeEntryService";
vi.mock("../../services/timeEntryService", () => ({
  TimeEntryService: {
    create: vi.fn(),
    getAll: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));
const response = () => ({ status: vi.fn().mockReturnThis(), json: vi.fn() });
describe("timeEntryController", () => {
  beforeEach(() => vi.clearAllMocks());
  it("forwards time-entry operations", async () => {
    const req: any = {
      user: { id: "u1" },
      params: { taskId: "t1", id: "e1" },
      body: { durationMinutes: 30, entryDate: "2026-01-01", note: "n" },
    };
    const res: any = response();
    const next = vi.fn();
    vi.mocked(TimeEntryService.create).mockResolvedValue({
      timeEntry: { id: "e1" },
      taskHistoryEntry: { id: "h1" },
      overrun: false,
    } as never);
    await controller.create(req, res, next);
    vi.mocked(TimeEntryService.getAll).mockResolvedValue({
      timeEntries: [],
      totalMinutes: 0,
    } as never);
    await controller.getAll(req, res, next);
    vi.mocked(TimeEntryService.update).mockResolvedValue({
      updatedFields: {},
      detailedHistoryEntries: [],
      changedLabels: [],
      overrun: false,
    } as never);
    await controller.update(req, res, next);
    vi.mocked(TimeEntryService.remove).mockResolvedValue({ id: "h1" } as never);
    await controller.remove(req, res, next);
    expect(TimeEntryService.getAll).toHaveBeenCalledWith("t1", "u1");
    expect(res.status).toHaveBeenCalled();
  });
  it("maps typed and unexpected errors for every operation", async () => {
    const req: any = {
      user: { id: "u1" },
      params: { taskId: "t1", id: "e1" },
      body: {},
    };
    const res: any = response();
    const next = vi.fn();
    const cases: Array<[any, () => Promise<unknown>]> = [
      [TimeEntryService.create, () => controller.create(req, res, next)],
      [TimeEntryService.getAll, () => controller.getAll(req, res, next)],
      [TimeEntryService.update, () => controller.update(req, res, next)],
      [TimeEntryService.remove, () => controller.remove(req, res, next)],
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
