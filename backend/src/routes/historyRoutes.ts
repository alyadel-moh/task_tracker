import { Router, RequestHandler } from "express";
import { getTaskHistory } from "../controllers/taskHistoryController";
import { authenticate } from "../middleware/auth";

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /api/task_history/{taskId}:
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
 *                   eventType:
 *                     type: string
 *                     example: FIELD_UPDATED
 *                   fieldChanged:
 *                     type: string
 *                     nullable: true
 *                     example: title
 *                   oldValue:
 *                     type: string
 *                     nullable: true
 *                     example: Old Task Name
 *                   newValue:
 *                     type: string
 *                     nullable: true
 *                     example: New Task Name
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
 *         description: Task not found or you do not have permission to access it
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
