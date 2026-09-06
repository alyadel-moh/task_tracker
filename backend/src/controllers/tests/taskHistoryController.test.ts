import { beforeEach, describe, expect, it, vi } from "vitest";
import { getTaskHistory } from "../taskHistoryController";
import { TaskHistoryService } from "../../services/taskHistoryService";
vi.mock("../../services/taskHistoryService", () => ({
  TaskHistoryService: { getTaskHistory: vi.fn() },
}));
describe("taskHistoryController", () => {
  beforeEach(() => vi.clearAllMocks());
  it("returns history and maps both error paths", async () => {
    const req: any = { user: { id: "u1" }, params: { taskId: "t1" } };
    const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();
    vi.mocked(TaskHistoryService.getTaskHistory).mockResolvedValue([
      { id: "h1" },
    ] as never);
    await getTaskHistory(req, res, next);
    expect(res.json).toHaveBeenCalledWith([{ id: "h1" }]);
    vi.mocked(TaskHistoryService.getTaskHistory).mockRejectedValueOnce({
      status: 404,
      message: "missing",
    });
    await getTaskHistory(req, res, next);
    vi.mocked(TaskHistoryService.getTaskHistory).mockRejectedValueOnce(
      new Error("boom"),
    );
    await getTaskHistory(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
