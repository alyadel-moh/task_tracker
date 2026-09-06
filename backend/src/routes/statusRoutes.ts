import { Router, RequestHandler } from "express";
import {
  create,
  getAll,
  update,
  remove,
} from "../controllers/statusController";
import { authenticate } from "../middleware/auth";

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * tags:
 *   name: Statuses
 *   description: Project board column and status workflow management
 */

/**
 * @openapi
 * /api/projects/statuses/{projectId}:
 *   get:
 *     summary: Retrieve all statuses for a specific project
 *     description: Returns all default and custom status columns in a project sorted ascending by board position. Requires project membership.
 *     tags: [Statuses]
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
 *         example: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
 *     responses:
 *       200:
 *         description: Ordered list of project statuses
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
 *                     example: "3fa85f64-5717-4562-b3fc-2c963f66afa6"
 *                   name:
 *                     type: string
 *                     example: "IN_PROGRESS"
 *                   position:
 *                     type: integer
 *                     example: 1
 *                   isDefault:
 *                     type: boolean
 *                     example: true
 *       401:
 *         description: Unauthorized - missing or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - caller is not a member of the project
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *               example:
 *                 message: "You are not a member of this project"
 */
router.get("/:projectId", getAll as unknown as RequestHandler);

/**
 * @openapi
 * /api/projects/statuses/{projectId}:
 *   post:
 *     summary: Create a new custom status column
 *     description: Appends a new custom status at the highest position of the project board. Requires project membership.
 *     tags: [Statuses]
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
 *         example: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
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
 *                 example: "QA Testing"
 *     responses:
 *       201:
 *         description: Status created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Status created successfully"
 *                 newStatus:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       example: "4ba95f64-5717-4562-b3fc-2c963f66afa7"
 *                     name:
 *                       type: string
 *                       example: "QA Testing"
 *                     position:
 *                       type: integer
 *                       example: 3
 *                     isDefault:
 *                       type: boolean
 *                       example: false
 *                     projectId:
 *                       type: string
 *                       format: uuid
 *                       example: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Status name is missing or empty
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *               example:
 *                 message: "Status name cannot be empty"
 *       401:
 *         description: Unauthorized - missing or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - caller is not a member of the project
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *               example:
 *                 message: "You are not a member of this project"
 */
router.post("/:projectId", create as unknown as RequestHandler);

/**
 * @openapi
 * /api/projects/statuses/{projectId}/{id}:
 *   patch:
 *     summary: Update status title or reorder board position
 *     description: Renames a status or shifts its board index order across siblings. Default system statuses cannot be renamed. Requires project membership.
 *     tags: [Statuses]
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
 *         example: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the status to update
 *         example: "3fa85f64-5717-4562-b3fc-2c963f66afa6"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Ready for Review"
 *               position:
 *                 type: integer
 *                 minimum: 0
 *                 example: 2
 *     responses:
 *       200:
 *         description: Status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   type: string
 *                   example: "Status updated successfully"
 *                 newStatus:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: "Ready for Review"
 *                     position:
 *                       type: integer
 *                       example: 2
 *       400:
 *         description: Validation error or attempting to rename a default status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *               examples:
 *                 emptyName:
 *                   value: { message: "Status name cannot be empty" }
 *                 defaultStatus:
 *                   value: { message: "Cannot update default status" }
 *       401:
 *         description: Unauthorized - missing or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - caller is not a member of the project
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *               example:
 *                 message: "You are not a member of this project"
 *       404:
 *         description: Status not found in project
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *               example:
 *                 message: "Status not found"
 */
router.patch("/:projectId/:id", update as unknown as RequestHandler);

/**
 * @openapi
 * /api/projects/statuses/{projectId}/{id}:
 *   delete:
 *     summary: Delete a custom status
 *     description: Deletes a non-default status with zero assigned tasks and re-indexes the remaining statuses. Requires project membership.
 *     tags: [Statuses]
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
 *         example: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the status to delete
 *         example: "4ba95f64-5717-4562-b3fc-2c963f66afa7"
 *     responses:
 *       200:
 *         description: Status deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Status deleted successfully"
 *       400:
 *         description: Cannot delete default statuses or statuses holding active tasks
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *               examples:
 *                 defaultStatus:
 *                   value: { message: "Cannot delete default status" }
 *                 hasTasks:
 *                   value: { message: "Cannot delete status with assigned tasks" }
 *       401:
 *         description: Unauthorized - missing or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - caller is not a member of the project
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *               example:
 *                 message: "You are not a member of this project"
 *       404:
 *         description: Status not found in project
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *               example:
 *                 message: "Status not found"
 */
router.delete("/:projectId/:id", remove as unknown as RequestHandler);

export default router;
