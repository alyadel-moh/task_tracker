import { Response, NextFunction } from "express";
import { AuthRequest } from "../types/AuthRequest";
import { ProjectMemberService } from "../services/projectMemberService";

export async function getAll(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  try {
    const projectId = req.params.projectId;
    const members = await ProjectMemberService.getAll(projectId, req.user.id);
    return res.status(200).json(members);
  } catch (err: any) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    next(err);
  }
}

export async function updateRole(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  try {
    const { role } = req.body;
    const { id, projectId } = req.params;
    const members = await ProjectMemberService.updateRole(
      id,
      projectId,
      req.user.id,
      role,
    );
    return res.status(200).json(members);
  } catch (err: any) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    next(err);
  }
}
export async function removeMember(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  try {
    const { id, projectId } = req.params;
    await ProjectMemberService.removeMember(id, projectId, req.user.id);
    return res.status(200).json({ message: "Member removed successfully" });
  } catch (err: any) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    next(err);
  }
}
export async function addMember(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  try {
    const { projectId } = req.params;
    const { email, role } = req.body;
    const { projectMember, user } = await ProjectMemberService.addMember(
      projectId,
      email,
      req.user.id,
      role,
    );
    return res.status(201).json({
      message: "Invitation sent successfully!",
      projectMember: {
        id: projectMember.id,
        userId: projectMember.userId,
        projectId: projectMember.projectId,
        role: projectMember.role,
        membershipStatus: projectMember.membershipStatus,
        createdAt: projectMember.createdAt,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      },
    });
  } catch (err: any) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    next(err);
  }
}
export async function leaveProject(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  try {
    const { projectId } = req.params;
    await ProjectMemberService.leaveProject(projectId, req.user.id);
    return res.status(200).json({ message: "Successfully left the project!" });
  } catch (err: any) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    next(err);
  }
}

export async function cancelInvitation(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  try {
    const { id, projectId } = req.params;
    await ProjectMemberService.cancelInvitation(req.user.id, projectId, id!);
    return res
      .status(200)
      .json({ message: "Invitation canceled successfully!" });
  } catch (err: any) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    next(err);
  }
}
export async function acceptInvitation(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  try {
    const membership = await ProjectMemberService.acceptInvitation(
      req.params.projectId,
      req.user.id,
    );
    return res.status(200).json({
      message: "Invitation accepted successfully!",
      assignedprojectMembership: membership,
    });
  } catch (err: any) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    next(err);
  }
}

export async function declineInvitation(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  try {
    await ProjectMemberService.declineInvitation(
      req.params.projectId,
      req.user.id,
    );
    return res
      .status(200)
      .json({ message: "Invitation declined successfully!" });
  } catch (err: any) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    next(err);
  }
}

export async function getAssignedProjects(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  try {
    const userId = req.user.id;
    const assignedProjects =
      await ProjectMemberService.getAssignedProjects(userId);
    return res.status(200).json(assignedProjects);
  } catch (err: any) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    next(err);
  }
}

export async function getPendingInvitations(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  try {
    const userId = req.user.id;
    const pendingInvitations =
      await ProjectMemberService.getPendingInvitations(userId);
    return res.status(200).json(pendingInvitations);
  } catch (err: any) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    next(err);
  }
}

export async function getActiveMembers(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  try {
    const activeMembers = await ProjectMemberService.getActiveMembers(
      req.params.projectId,
      req.user.id,
    );
    return res.status(200).json(activeMembers);
  } catch (err: any) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    next(err);
  }
}
