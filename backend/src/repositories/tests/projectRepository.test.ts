import { describe, expect, it, vi } from "vitest";
import { ProjectRepository } from "../projectRepository";
import { Project } from "../../models";

vi.mock("../../models", () => ({
  Project: { create: vi.fn(), findByPk: vi.fn() },
  ProjectMembers: {},
}));

describe("ProjectRepository", () => {
  it("creates a project with an optional transaction", async () => {
    const data = { name: "Work", description: null, userId: "u1" };
    const transaction = {} as never;
    vi.mocked(Project.create).mockResolvedValue({ id: "p1" } as never);
    await ProjectRepository.create(data, transaction);
    expect(Project.create).toHaveBeenCalledWith(data, { transaction });
  });

  it("loads a project with active member access", async () => {
    vi.mocked(Project.findByPk).mockResolvedValue({ id: "p1" } as never);
    await ProjectRepository.getProjectWithMember("p1", "u1");
    expect(Project.findByPk).toHaveBeenCalledWith(
      "p1",
      expect.objectContaining({
        include: [
          expect.objectContaining({
            as: "members",
            where: { userId: "u1", membershipStatus: "ACTIVE" },
            required: false,
          }),
        ],
      }),
    );
  });
});
