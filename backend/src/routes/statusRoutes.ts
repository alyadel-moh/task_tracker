import { Router, RequestHandler } from "express";
import { create, update, remove } from "../controllers/projectController";
import { authenticate } from "../middleware/auth";

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * tags:
 *   name: Projects
 *   description: Workspace project creation, configuration, and management
 */

/**
 * @openapi
 * /api/projects:
 *   post:
 *     summary: Create a new project with default statuses and owner membership
 *     description: Initializes a new project, automatically generates default board statuses (TODO, IN_PROGRESS, DONE), and binds the calling user as the project OWNER.
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Mobile App Redesign
 *               description:
 *                 type: string
 *                 nullable: true
 *                 example: Client facing dashboard updates
 *     responses:
 *       201:
 *         description: Project created successfully with owner membership assigned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Project created successfully
 *                 assignedProjectMembership:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       description: Membership assignment ID
 *                       example: "f47ac10b-58cc-4372-a567-0e02b2c3d479"
 *                     role:
 *                       type: string
 *                       example: OWNER
 *                     project:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                           example: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
 *                         name:
 *                           type: string
 *                           example: Mobile App Redesign
 *                         description:
 *                           type: string
 *                           nullable: true
 *                           example: Client facing dashboard updates
 *                         userId:
 *                           type: string
 *                           format: uuid
 *                           example: "c7f8a9e0-5678-4321-98ba-dcba09876543"
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                         updatedAt:
 *                           type: string
 *                           format: date-time
 *       400:
 *         description: Validation error - project name missing or empty
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: Project name is required
 *       401:
 *         description: Unauthorized - missing, invalid, or expired JWT bearer token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/", create as unknown as RequestHandler);

/**
 * @openapi
 * /api/projects/{id}:
 *   patch:
 *     summary: Update project name or description
 *     description: Modifies an existing project's metadata. Strictly restricted to active members with the OWNER role.
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *             properties:
 *               name:
 *                 type: string
 *                 example: Updated Project Title
 *               description:
 *                 type: string
 *                 nullable: true
 *                 example: Updated project description
 *     responses:
 *       200:
 *         description: Project updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Name updated successfully
 *                 project:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: Updated Project Title
 *                     description:
 *                       type: string
 *                       nullable: true
 *                       example: Updated project description
 *       400:
 *         description: Bad request - project name cannot be empty
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: Project name cannot be empty
 *       401:
 *         description: Unauthorized - missing or invalid JWT bearer token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - caller is not an active OWNER of the project
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: Access denied. Only project owners can edit project details.
 *       404:
 *         description: Project not found or user is not an active member
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: Project not found
 */
router.patch("/:id", update as unknown as RequestHandler);

/**
 * @openapi
 * /api/projects/{id}:
 *   delete:
 *     summary: Delete a project and its associations
 *     description: Permanently removes a project, cascading through its default statuses and tasks. Restricted strictly to the project OWNER.
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique UUID of the project to delete
 *         example: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
 *     responses:
 *       200:
 *         description: Project deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Project deleted successfully
 *       401:
 *         description: Unauthorized - missing or invalid JWT bearer token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - caller is not an active OWNER of the project
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: Access denied. Only project owners delete a project.
 *       404:
 *         description: Project not found or user is not an active member
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: Project not found
 */
router.delete("/:id", remove as unknown as RequestHandler);

export default router;
