import { beforeEach, describe, expect, it, vi } from "vitest";
import { TimeEntryRepository } from "../timeEntryRepository";
import { TimeEntry } from "../../models";

vi.mock("../../models", () => ({
  TimeEntry: {
    sum: vi.fn(),
    create: vi.fn(),
    findAll: vi.fn(),
    findOne: vi.fn(),
  },
  ProjectMembers: {},
  Task: {},
  TaskAssignee: {},
}));

describe("TimeEntryRepository", () => {
  beforeEach(() => vi.clearAllMocks());

  it("normalizes empty time sums to zero", async () => {
    vi.mocked(TimeEntry.sum).mockResolvedValue(null as never);
    await expect(TimeEntryRepository.sumloggedTime("t1")).resolves.toBe(0);
    vi.mocked(TimeEntry.sum).mockResolvedValue(45 as never);
    await expect(TimeEntryRepository.sumloggedTime("t1")).resolves.toBe(45);
    vi.mocked(TimeEntry.sum).mockResolvedValue(Number.NaN as never);
    await expect(TimeEntryRepository.sumloggedTime("t1")).resolves.toBe(0);
  });

  it("creates and queries time entries", async () => {
    vi.mocked(TimeEntry.create).mockResolvedValue({ id: "e1" } as never);
    vi.mocked(TimeEntry.findAll).mockResolvedValue([] as never);
    vi.mocked(TimeEntry.findOne).mockResolvedValue(null);
    const transaction = {} as never;

    await TimeEntryRepository.create(30, "2026-01-01", "", "t1", transaction);
    await TimeEntryRepository.getAll("t1");
    await TimeEntryRepository.getById("e1", "t1");

    expect(TimeEntry.create).toHaveBeenCalledWith(
      {
        taskId: "t1",
        durationMinutes: 30,
        entryDate: new Date("2026-01-01"),
        note: null,
      },
      { transaction },
    );
  });

  it("returns null or unauthorized access details", async () => {
    vi.mocked(TimeEntry.findOne).mockResolvedValue(null);
    await expect(
      TimeEntryRepository.getTimeEntrywithAccess("e1", "t1", "u1"),
    ).resolves.toBeNull();

    vi.mocked(TimeEntry.findOne).mockResolvedValue({ task: null } as never);
    await expect(
      TimeEntryRepository.getTimeEntrywithAccess("e1", "t1", "u1"),
    ).resolves.toMatchObject({ isAuthorized: false, task: null });

    vi.mocked(TimeEntry.findOne).mockResolvedValue({
      task: { createdBy: "u2" },
    } as never);
    await expect(
      TimeEntryRepository.getTimeEntrywithAccess("e1", "t1", "u1"),
    ).resolves.toMatchObject({
      isProjectMember: false,
      isTaskMember: false,
      isProjectOwner: false,
      isAuthorized: false,
    });
  });

  it("hits line 109: resolves authorized access details for owner, creator, and assignee", async () => {
    // 1. Authorized as project OWNER
    const ownerEntry: any = {
      id: "e1",
      durationMinutes: 60,
      task: {
        id: "t1",
        createdBy: "u-creator",
        projectMembers: [{ id: "pm1", role: "OWNER" }],
        taskAssignments: [],
      },
    };
    vi.mocked(TimeEntry.findOne).mockResolvedValue(ownerEntry);

    const ownerResult = await TimeEntryRepository.getTimeEntrywithAccess(
      "e1",
      "t1",
      "u1",
    );
    expect(ownerResult).toEqual({
      timeEntry: ownerEntry,
      task: ownerEntry.task,
      isProjectMember: true,
      isTaskMember: false,
      isProjectOwner: true,
      isAuthorized: true,
    });

    // 2. Authorized as task creator
    const creatorEntry: any = {
      id: "e2",
      durationMinutes: 45,
      task: {
        id: "t1",
        createdBy: "u1",
        projectMembers: [{ id: "pm2", role: "MEMBER" }],
        taskAssignments: [],
      },
    };
    vi.mocked(TimeEntry.findOne).mockResolvedValue(creatorEntry);

    const creatorResult = await TimeEntryRepository.getTimeEntrywithAccess(
      "e2",
      "t1",
      "u1",
    );
    expect(creatorResult).toEqual({
      timeEntry: creatorEntry,
      task: creatorEntry.task,
      isProjectMember: true,
      isTaskMember: true,
      isProjectOwner: false,
      isAuthorized: true,
    });

    // 3. Authorized as task assignee
    const assigneeEntry: any = {
      id: "e3",
      durationMinutes: 30,
      task: {
        id: "t1",
        createdBy: "someone-else",
        projectMembers: [{ id: "pm3", role: "MEMBER" }],
        taskAssignments: [{ userId: "u1" }],
      },
    };
    vi.mocked(TimeEntry.findOne).mockResolvedValue(assigneeEntry);

    const assigneeResult = await TimeEntryRepository.getTimeEntrywithAccess(
      "e3",
      "t1",
      "u1",
    );
    expect(assigneeResult).toEqual({
      timeEntry: assigneeEntry,
      task: assigneeEntry.task,
      isProjectMember: true,
      isTaskMember: true,
      isProjectOwner: false,
      isAuthorized: true,
    });
  });
});
