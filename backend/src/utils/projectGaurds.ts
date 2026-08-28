import { ProjectMembers } from "../models";

export async function isOwner(
  userId: string,
  projectId: string,
): Promise<boolean> {
  const project = await ProjectMembers.findOne({
    where: {
      projectId,
      userId,
      membershipStatus: "ACTIVE",
      role: "OWNER",
    },
  });
  return !!project;
}

export async function isMember(userId: string, projectId: string) {
  return await ProjectMembers.findOne({
    where: {
      projectId,
      userId,
      membershipStatus: "ACTIVE",
    },
  });
}
