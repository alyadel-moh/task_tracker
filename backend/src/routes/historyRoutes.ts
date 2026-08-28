import { Router, RequestHandler } from "express";
import { getTaskHistory } from "../controllers/taskHistoryController";
import { authenticate } from "../middleware/auth";

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /api/task-history/{taskId}:
 *   get:
 *     summary: Retrieve audit history for a specific task
 *     tags: [Task History]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The unique identifier of the task
 *     responses:
 *       200:
 *         description: Successfully retrieved task history
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
 *                   taskId:
 *                     type: string
 *                     format: uuid
 *                   actorId:
 *                     type: string
 *                     format: uuid
 *                   action:
 *                     type: string
 *                     example: TASK_UPDATED
 *                   changes:
 *                     type: object
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   actor:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       name:
 *                         type: string
 *                       email:
 *                         type: string
 *       401:
 *         description: Unauthorized - missing or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - user does not own the project
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Task not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/:taskId", getTaskHistory as unknown as RequestHandler);

export default router;
