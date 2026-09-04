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

/**
 * @openapi
 * tags:
 *   name: Project Members
 *   description: Membership management, team invitations, and role assignments
 */

/**
 * @openapi
 * /api/projects/assigned:
 *   get:
 *     summary: Retrieve all active projects assigned to the current user
 *     tags: [Project Members]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of assigned projects with the user's role
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     format: uuid
 *                     example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *                   role:
 *                     type: string
 *                     enum: [OWNER, MEMBER]
 *                     example: "OWNER"
 *                   project:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                         example: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
 *                       name:
 *                         type: string
 *                         example: "Task Tracker App"
 *                       description:
 *                         type: string
 *                         nullable: true
 *                         example: "Full-stack project tracker"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/assigned", getAssignedProjects as unknown as RequestHandler);

/**
 * @openapi
 * /api/projects/pending:
 *   get:
 *     summary: Retrieve all pending project invitations for the current user
 *     tags: [Project Members]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending invitations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     format: uuid
 *                     example: "b2c3d4e5-f6a7-8901-bcde-f12345678901"
 *                   role:
 *                     type: string
 *                     enum: [OWNER, MEMBER]
 *                     example: "MEMBER"
 *                   project:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                         example: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
 *                       name:
 *                         type: string
 *                         example: "Task Tracker App"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/pending", getPendingInvitations as unknown as RequestHandler);

/**
 * @openapi
 * /api/projects/invitations/{projectId}/accept:
 *   patch:
 *     summary: Accept a pending project invitation
 *     tags: [Project Members]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the project invitation to accept
 *         example: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
 *     responses:
 *       200:
 *         description: Invitation accepted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invitation accepted successfully!"
 *                 assignedprojectMembership:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     role:
 *                       type: string
 *                       enum: [OWNER, MEMBER]
 *                     project:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         name:
 *                           type: string
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: No pending invitation found for this project
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch(
  "/invitations/:projectId/accept",
  acceptInvitation as unknown as RequestHandler,
);

/**
 * @openapi
 * /api/projects/invitations/{projectId}/decline:
 *   delete:
 *     summary: Decline a pending project invitation
 *     tags: [Project Members]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the project invitation to decline
 *         example: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
 *     responses:
 *       200:
 *         description: Invitation declined successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invitation declined successfully!"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: No pending invitation found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete(
  "/invitations/:projectId/decline",
  declineInvitation as unknown as RequestHandler,
);

/**
 * @openapi
 * /api/projects/{projectId}/members:
 *   get:
 *     summary: List all members of a project
 *     description: Returns all members and their roles. Requires active project membership.
 *     tags: [Project Members]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique UUID of the project
 *         example: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
 *     responses:
 *       200:
 *         description: List of project members retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     format: uuid
 *                   userId:
 *                     type: string
 *                     format: uuid
 *                   role:
 *                     type: string
 *                     enum: [OWNER, MEMBER]
 *                     example: "MEMBER"
 *                   membershipStatus:
 *                     type: string
 *                     enum: [PENDING, ACTIVE]
 *                     example: "ACTIVE"
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   user:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       name:
 *                         type: string
 *                         example: "Aly Adel"
 *                       email:
 *                         type: string
 *                         format: email
 *                         example: "aly@example.com"
 *                       photoUrl:
 *                         type: string
 *                         nullable: true
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - User is not a member of this project
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/:projectId/members", getAll as unknown as RequestHandler);

/**
 * @openapi
 * /api/projects/{projectId}/members:
 *   post:
 *     summary: Invite or add a new member to a project
 *     description: Dispatches an invitation or binds a member directly. Restricted to project OWNER.
 *     tags: [Project Members]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique UUID of the project
 *         example: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, role]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "newmember@example.com"
 *               role:
 *                 type: string
 *                 enum: [OWNER, MEMBER]
 *                 example: "MEMBER"
 *     responses:
 *       201:
 *         description: Invitation sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invitation sent successfully!"
 *                 projectMember:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     userId:
 *                       type: string
 *                       format: uuid
 *                     projectId:
 *                       type: string
 *                       format: uuid
 *                     role:
 *                       type: string
 *                       enum: [OWNER, MEMBER]
 *                     membershipStatus:
 *                       type: string
 *                       enum: [PENDING, ACTIVE]
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         name:
 *                           type: string
 *                         email:
 *                           type: string
 *                           format: email
 *       400:
 *         description: Bad Request - User is already a member or invalid role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - Only project owners can invite members
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Target user not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/:projectId/members", addMember as unknown as RequestHandler);

/**
 * @openapi
 * /api/projects/{projectId}/members/{id}:
 *   patch:
 *     summary: Update a member's role
 *     description: Changes the role of a project member (MEMBER <-> OWNER). Prevents demoting the last remaining owner. Restricted to project OWNER.
 *     tags: [Project Members]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the project
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the ProjectMembers membership record
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [OWNER, MEMBER]
 *                 example: "OWNER"
 *     responses:
 *       200:
 *         description: Role updated successfully
 *       400:
 *         description: Invalid role or cannot demote the only remaining owner
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - Only project owners can modify roles
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Project member not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch(
  "/:projectId/members/:id",
  updateRole as unknown as RequestHandler,
);

/**
 * @openapi
 * /api/projects/{projectId}/members/{id}:
 *   delete:
 *     summary: Remove a member from a project
 *     description: Removes a member and unassigns them from all project tasks. Cannot remove the only remaining project owner. Restricted to project OWNER.
 *     tags: [Project Members]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the project
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the ProjectMembers membership record to remove
 *     responses:
 *       200:
 *         description: Member removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Member removed successfully"
 *       400:
 *         description: Cannot remove the only remaining project owner
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - Only project owners can remove members
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Project member not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete(
  "/:projectId/members/:id",
  removeMember as unknown as RequestHandler,
);

/**
 * @openapi
 * /api/projects/{projectId}/leave:
 *   delete:
 *     summary: Leave a project
 *     description: Current user relinquishes membership and is unassigned from all tasks. Fails if the caller is the sole remaining project owner.
 *     tags: [Project Members]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the project to leave
 *     responses:
 *       200:
 *         description: Left project successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Successfully left the project!"
 *       400:
 *         description: Cannot leave as the only remaining owner
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User is not an active member of this project
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete("/:projectId/leave", leaveProject as unknown as RequestHandler);

/**
 * @openapi
 * /api/projects/{projectId}/invitations/{id}:
 *   delete:
 *     summary: Cancel a pending project invitation
 *     description: Revokes an unanswered invitation. Restricted to project OWNER.
 *     tags: [Project Members]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the project
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the pending ProjectMembers invitation record
 *     responses:
 *       200:
 *         description: Invitation canceled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invitation canceled successfully!"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - Only project owners can cancel invitations
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Pending invitation not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete(
  "/:projectId/invitations/:id",
  cancelInvitation as unknown as RequestHandler,
);

export default router;
