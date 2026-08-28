import { Router, RequestHandler } from "express";
import { authenticate } from "../middleware/auth";
import {
  addMember,
  updateRole,
  removeMember,
  getAll,
  leaveProject,
  cancelInvitation,
  getAssignedProjects,
  getPendingInvitations,
  declineInvitation,
  acceptInvitation,
} from "../controllers/projectMembersController";

const router = Router({ mergeParams: true });

router.use(authenticate);

router.get("/:projectId/members", getAll as unknown as RequestHandler);
router.post("/:projectId/members", addMember as unknown as RequestHandler);
router.patch(
  "/:projectId/members/:id",
  updateRole as unknown as RequestHandler,
);
router.delete(
  "/:projectId/members/:id",
  removeMember as unknown as RequestHandler,
);
router.delete("/:projectId/leave", leaveProject as unknown as RequestHandler);
router.delete(
  "/:projectId/invitations/:id",
  cancelInvitation as unknown as RequestHandler,
);
router.get("/assigned", getAssignedProjects as unknown as RequestHandler);
router.get("/pending", getPendingInvitations as unknown as RequestHandler);
router.patch(
  "/invitations/:projectId/accept",
  acceptInvitation as unknown as RequestHandler,
);
router.delete(
  "/invitations/:projectId/decline",
  declineInvitation as unknown as RequestHandler,
);

export default router;
