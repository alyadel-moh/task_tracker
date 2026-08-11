import { describe, it, expect, vi, beforeEach } from "vitest";
import { getTaskHistory } from "../taskHistoryController";
import { Task, TaskHistory } from "../../models";

vi.mock("../../models", () => ({
  Task: { findOne: vi.fn() },
  TaskHistory: { findAll: vi.fn() },
  Project: {},
  User: {},
}));

describe("Task History Controller", () => {
  let req: any;
  let res: any;
  let next: any;

  beforeEach(() => {
    vi.clearAllMocks();
    req = { user: { id: "user-123" }, params: { taskId: "task-123" } };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    next = vi.fn();
  });

  it("returns 404 if task is not owned by user", async () => {
    vi.mocked(Task.findOne).mockResolvedValue(null);

    await getTaskHistory(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: "Not Found",
      message: "Task not found or you do not have permission to access it",
    });
  });

  it("fetches audit history logs and returns 200", async () => {
    const mockLogs = [
      {
        id: "h1",
        fieldChanged: "status",
        oldValue: "TODO",
        newValue: "IN_PROGRESS",
      },
    ];

    vi.mocked(Task.findOne).mockResolvedValue({ id: "task-123" } as never);
    vi.mocked(TaskHistory.findAll).mockResolvedValue(mockLogs as never);

    await getTaskHistory(req, res, next);

    expect(TaskHistory.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { taskId: "task-123" },
        order: [["createdAt", "DESC"]],
      }),
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockLogs);
  });
});
