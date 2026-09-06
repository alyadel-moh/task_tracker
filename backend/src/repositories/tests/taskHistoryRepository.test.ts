import { beforeEach, describe, expect, it, vi } from "vitest";
import { TaskHistoryRepository } from "../taskHistoryRepository";
import { TaskHistory } from "../../models";

vi.mock("../../models", () => ({
  TaskHistory: { findOne: vi.fn(), findAll: vi.fn(), create: vi.fn() },
  User: {},
}));

describe("TaskHistoryRepository", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns null without a history id", async () => {
    await expect(
      TaskHistoryRepository.fetchHistoryWithActor(),
    ).resolves.toBeNull();
    expect(TaskHistory.findOne).not.toHaveBeenCalled();
  });

  it("fetches and logs history", async () => {
    vi.mocked(TaskHistory.findOne).mockResolvedValue({ id: "h1" } as never);
    vi.mocked(TaskHistory.findAll).mockResolvedValue([] as never);
    vi.mocked(TaskHistory.create).mockResolvedValue({ id: "h1" } as never);
    await TaskHistoryRepository.fetchHistoryWithActor("h1");
    await TaskHistoryRepository.fetchTaskHistory("t1");
    const input = {
      taskId: "t1",
      actorId: "u1",
      eventType: "UPDATED",
      fieldChanged: "name",
      oldValue: "A",
      newValue: "B",
    };
    await TaskHistoryRepository.logTaskHistory(input);
    expect(TaskHistory.create).toHaveBeenCalledWith(input, {
      transaction: undefined,
    });
  });
});
