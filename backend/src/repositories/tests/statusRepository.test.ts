import { beforeEach, describe, expect, it, vi } from "vitest";
import { StatusRepository } from "../statusRepository";
import { Status } from "../../models";

vi.mock("../../models", () => ({
  Status: {
    findOne: vi.fn(),
    create: vi.fn(),
    bulkCreate: vi.fn(),
    findAll: vi.fn(),
    decrement: vi.fn(),
  },
}));

describe("StatusRepository", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates and fetches statuses", async () => {
    vi.mocked(Status.create).mockResolvedValue({ id: "s1" } as never);
    vi.mocked(Status.findOne).mockResolvedValue(null);
    vi.mocked(Status.findAll).mockResolvedValue([] as never);
    await StatusRepository.create("p1", "  Todo ", 1);
    await StatusRepository.getByIdAndProjectId("s1", "p1");
    await StatusRepository.getMaximumPositionStatus("p1");
    await StatusRepository.getAll("p1");
    await StatusRepository.getDefaultStatusForProject("p1");
    expect(Status.create).toHaveBeenCalledWith(
      { name: "Todo", position: 1, projectId: "p1", isDefault: false },
      { transaction: undefined },
    );
    expect(Status.findAll).toHaveBeenCalledTimes(1);
  });

  it("filters status ids and returns early for an empty list", async () => {
    vi.mocked(Status.findAll).mockResolvedValue([] as never);
    await expect(
      StatusRepository.getStatusesinProject("p1", [null, undefined, ""]),
    ).resolves.toEqual([]);
    await StatusRepository.getStatusesinProject("p1", ["s1", null]);
    expect(Status.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ projectId: "p1" }),
      }),
    );
  });

  it("bulk creates and decrements positions", async () => {
    vi.mocked(Status.bulkCreate).mockResolvedValue([] as never);
    vi.mocked(Status.decrement).mockResolvedValue([1] as never);
    await StatusRepository.bulkCreateDefaultStatuses([], {} as never);
    await StatusRepository.decrementPositionsAfterDeletion("p1", 2);
    expect(Status.decrement).toHaveBeenCalledWith(
      "position",
      expect.objectContaining({
        by: 1,
        where: expect.objectContaining({ projectId: "p1" }),
      }),
    );
  });
});
