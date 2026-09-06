import { beforeEach, describe, expect, it, vi } from "vitest";
import { TaskRepository } from "../taskReposiotry";
import { Task } from "../../models";
import { TaskAssignee } from "../../models/taskAssignee";

vi.mock("../../models", () => ({
  Task: {
    create: vi.fn(),
    findOne: vi.fn(),
    findAll: vi.fn(),
    findByPk: vi.fn(),
  },
  Status: {},
  ProjectMembers: {},
  User: {},
  TaskAssignee: { bulkCreate: vi.fn(), destroy: vi.fn(), findAll: vi.fn() },
}));
vi.mock("../../models/taskAssignee", () => ({
  TaskAssignee: { bulkCreate: vi.fn(), destroy: vi.fn(), findAll: vi.fn() },
  default: vi.fn(),
}));

describe("TaskRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(TaskAssignee, "bulkCreate").mockResolvedValue([] as never);
    vi.spyOn(TaskAssignee, "destroy").mockResolvedValue(0 as never);
    vi.spyOn(TaskAssignee, "findAll").mockResolvedValue([] as never);
  });

  // ---------------------------------------------------------------------------
  // create
  // ---------------------------------------------------------------------------
  it("creates a task and unique assignee records", async () => {
    const task = { id: "t1", projectId: "p1" };
    vi.mocked(Task.create).mockResolvedValue(task as never);
    await expect(
      TaskRepository.create(
        "p1",
        "Task",
        null,
        null,
        30,
        null,
        "MEDIUM" as never,
        "u1",
        ["u2", "u2", ""],
      ),
    ).resolves.toBe(task);
    expect(TaskAssignee.bulkCreate).toHaveBeenCalledWith(
      [{ taskId: "t1", projectId: "p1", userId: "u2" }],
      expect.objectContaining({ ignoreDuplicates: true }),
    );
  });

  it("does not create assignees when the list is empty", async () => {
    vi.mocked(Task.create).mockResolvedValue({
      id: "t1",
      projectId: "p1",
    } as never);
    await TaskRepository.create(
      "p1",
      "Task",
      null,
      null,
      null,
      null,
      "LOW" as never,
      "u1",
    );
    expect(TaskAssignee.bulkCreate).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // getById & getByIdwithStatus
  // ---------------------------------------------------------------------------
  it("queries task details and filtered task lists", async () => {
    vi.mocked(Task.findOne).mockResolvedValue(null);
    vi.mocked(Task.findAll).mockResolvedValue([] as never);
    await TaskRepository.getByIdwithStatus("t1", "p1");
    await TaskRepository.getById("t1", "p1");
    await TaskRepository.getAll("p1", "  bug ", ["s1"], ["HIGH"], true, "u1");
    expect(Task.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          projectId: "p1",
          priority: expect.anything(),
          dueDate: expect.anything(),
        }),
        include: expect.arrayContaining([
          expect.objectContaining({ as: "taskAssignments", required: true }),
        ]),
      }),
    );
  });

  // ---------------------------------------------------------------------------
  // getAll filter variations
  // ---------------------------------------------------------------------------
  it("handles empty filters without adding query conditions", async () => {
    vi.mocked(Task.findAll).mockResolvedValue([] as never);
    await TaskRepository.getAll("p1", "", [], [], false, "");
    await TaskRepository.getAll("p1", "", "s1", "HIGH", false, "");
    await TaskRepository.getAll("p1", "", "", "", false, "");
    expect(Task.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { projectId: "p1" },
        include: [
          expect.objectContaining({
            as: "status",
            required: false,
            where: undefined,
          }),
        ],
      }),
    );
  });

  it("handles string overdue filter and search term trimming", async () => {
    vi.mocked(Task.findAll).mockResolvedValue([] as never);
    await TaskRepository.getAll("p1", "feature", "s1", "LOW", "true", "u2");
    expect(Task.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          projectId: "p1",
          dueDate: expect.anything(),
        }),
      }),
    );
  });

  // ---------------------------------------------------------------------------
  // getTaskWithAccess
  // ---------------------------------------------------------------------------
  it("returns access flags for a creator, assignee, and project owner in getTaskWithAccess", async () => {
    // 1. Project Owner
    vi.mocked(Task.findByPk).mockResolvedValue({
      createdBy: "u1",
      projectMembers: [{ role: "OWNER" }],
      taskAssignments: [],
    } as never);
    await expect(
      TaskRepository.getTaskWithAccess("t1", "u1"),
    ).resolves.toMatchObject({
      isProjectMember: true,
      isTaskMember: true,
      isProjectOwner: true,
      isAuthorized: true,
    });

    // 2. Task Assignee via taskAssignments
    vi.mocked(Task.findByPk).mockResolvedValue({
      createdBy: "someone-else",
      projectMembers: [{ role: "MEMBER" }],
      taskAssignments: [{ userId: "u1" }],
    } as never);
    await expect(
      TaskRepository.getTaskWithAccess("t1", "u1"),
    ).resolves.toMatchObject({
      isProjectMember: true,
      isTaskMember: true,
      isProjectOwner: false,
      isAuthorized: true,
    });
  });

  // ---------------------------------------------------------------------------
  // getTaskWithAssigneesAndAccess (Covers lines 338-343)
  // ---------------------------------------------------------------------------
  it("returns access flags for assignee in getTaskWithAssigneesAndAccess", async () => {
    vi.mocked(Task.findOne).mockResolvedValue({
      createdBy: "u2",
      assignees: [{ id: "u1" }],
      projectMembers: [{ role: "MEMBER" }],
    } as never);
    await expect(
      TaskRepository.getTaskWithAssigneesAndAccess("t1", "p1", "u1"),
    ).resolves.toMatchObject({
      isProjectMember: true,
      isTaskMember: true,
      isProjectOwner: false,
      isAuthorized: true,
    });
  });

  it("covers line 339: returns access flags when user is creator in getTaskWithAssigneesAndAccess", async () => {
    vi.mocked(Task.findOne).mockResolvedValue({
      createdBy: "u1",
      assignees: [],
      projectMembers: [],
    } as never);
    await expect(
      TaskRepository.getTaskWithAssigneesAndAccess("t1", "p1", "u1"),
    ).resolves.toMatchObject({
      isProjectMember: false,
      isTaskMember: true,
      isProjectOwner: false,
      isAuthorized: true,
    });
  });

  it("covers line 340: returns access flags when user is owner in getTaskWithAssigneesAndAccess", async () => {
    vi.mocked(Task.findOne).mockResolvedValue({
      createdBy: "other-user",
      assignees: [{ id: "someone-else" }],
      projectMembers: [{ role: "OWNER" }],
    } as never);
    await expect(
      TaskRepository.getTaskWithAssigneesAndAccess("t1", "p1", "u1"),
    ).resolves.toMatchObject({
      isProjectMember: true,
      isTaskMember: false,
      isProjectOwner: true,
      isAuthorized: true,
    });
  });

  it("handles missing tasks and task access members in getTaskWithAccess and getTaskWithAssigneesAndAccess", async () => {
    vi.mocked(Task.findByPk).mockResolvedValue(null);
    vi.mocked(Task.findOne).mockResolvedValue(null);
    await expect(
      TaskRepository.getTaskWithAccess("t1", "u1"),
    ).resolves.toBeNull();
    await expect(
      TaskRepository.getTaskWithAssigneesAndAccess("t1", "p1", "u1"),
    ).resolves.toBeNull();

    vi.mocked(Task.findByPk).mockResolvedValue({
      createdBy: "u2",
      projectMembers: undefined,
      taskAssignments: undefined,
    } as never);
    vi.mocked(Task.findOne).mockResolvedValue({
      createdBy: "u2",
      assignees: undefined,
      projectMembers: undefined,
    } as never);
    await expect(
      TaskRepository.getTaskWithAccess("t1", "u1"),
    ).resolves.toMatchObject({
      isProjectMember: false,
      isTaskMember: false,
      isProjectOwner: false,
      isAuthorized: false,
    });
    await expect(
      TaskRepository.getTaskWithAssigneesAndAccess("t1", "p1", "u1"),
    ).resolves.toMatchObject({
      isProjectMember: false,
      isTaskMember: false,
      isProjectOwner: false,
      isAuthorized: false,
    });
  });

  // ---------------------------------------------------------------------------
  // updateAssignees
  // ---------------------------------------------------------------------------
  it("updates assignees by removing and adding the changed ids", async () => {
    vi.mocked(TaskAssignee.findAll).mockResolvedValue([
      { user: { id: "u3" } },
      { user: null },
    ] as never);
    await expect(
      TaskRepository.updateAssignees("t1", "p1", ["u2", "u3"], ["u1", "u3"]),
    ).resolves.toEqual([{ id: "u3" }]);
    expect(TaskAssignee.destroy).toHaveBeenCalled();
    expect(TaskAssignee.bulkCreate).toHaveBeenCalledWith(
      [{ taskId: "t1", projectId: "p1", userId: "u2" }],
      expect.anything(),
    );
  });

  it("keeps assignees unchanged when both lists match", async () => {
    vi.mocked(TaskAssignee.findAll).mockResolvedValue([
      { user: { id: "u1" } },
    ] as never);
    await expect(
      TaskRepository.updateAssignees("t1", "p1", ["u1"], ["u1"]),
    ).resolves.toEqual([{ id: "u1" }]);
    expect(TaskAssignee.destroy).not.toHaveBeenCalled();
    expect(TaskAssignee.bulkCreate).not.toHaveBeenCalled();
  });

  it("updates assignees when only removing users", async () => {
    vi.mocked(TaskAssignee.findAll).mockResolvedValue([] as never);
    await expect(
      TaskRepository.updateAssignees("t1", "p1", [], ["u1", "u2"]),
    ).resolves.toEqual([]);
    expect(TaskAssignee.destroy).toHaveBeenCalled();
    expect(TaskAssignee.bulkCreate).not.toHaveBeenCalled();
  });

  it("updates assignees when only adding users", async () => {
    vi.mocked(TaskAssignee.findAll).mockResolvedValue([
      { user: { id: "u1" } },
    ] as never);
    await expect(
      TaskRepository.updateAssignees("t1", "p1", ["u1"], []),
    ).resolves.toEqual([{ id: "u1" }]);
    expect(TaskAssignee.destroy).not.toHaveBeenCalled();
    expect(TaskAssignee.bulkCreate).toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // helper queries
  // ---------------------------------------------------------------------------
  it("gets assigned tasks and removes assigned users", async () => {
    vi.mocked(Task.findAll).mockResolvedValue([] as never);
    vi.mocked(TaskAssignee.destroy).mockResolvedValue(1);
    await TaskRepository.getTasksAssignedWithStatusId("p1", "s1");
    await TaskRepository.removeAssignedUserFromTask("p1", "u1");
    expect(TaskAssignee.destroy).toHaveBeenCalledWith({
      where: { projectId: "p1", userId: "u1" },
      transaction: undefined,
    });
  });
});
