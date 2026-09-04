import { Router, RequestHandler } from "express";
import { getTaskHistory } from "../controllers/taskHistoryController";
import { authenticate } from "../middleware/auth";

const router = Router();
router.use(authenticate);

/**
 * @openapi
 * tags:
 *   name: Task History
 *   description: Audit logs, change tracking, and historical activity for tasks
 */

/**
 * @openapi
 * /api/tasks/history/{taskId}:
 *   get:
 *     summary: Retrieve audit history for a specific task
 *     description: Fetches a reverse-chronological log of all updates, status shifts, assignee assignments, and time-tracking events for a task. Requires project membership.
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
 *         description: The UUID of the task
 *         example: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
 *     responses:
 *       200:
 *         description: Task history entries retrieved successfully
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
 *                     example: "a3b8c9d0-1234-4567-89ab-cdef01234567"
 *                   eventType:
 *                     type: string
 *                     enum:
 *                       - TASK_CREATED
 *                       - FIELD_UPDATED
 *                       - STATUS_CHANGED
 *                       - ASSIGNEES_CHANGED
 *                       - TIME_ENTRY_CREATED
 *                       - TIME_ENTRY_UPDATED
 *                       - TIME_ENTRY_DELETED
 *                     example: "FIELD_UPDATED"
 *                   fieldChanged:
 *                     type: string
 *                     nullable: true
 *                     description: Name of the attribute modified (if applicable)
 *                     example: "priority"
 *                   oldValue:
 *                     type: string
 *                     nullable: true
 *                     description: Stringified prior state, formatted date, or JSON array of previous assignees
 *                     example: "LOW"
 *                   newValue:
 *                     type: string
 *                     nullable: true
 *                     description: Stringified updated state, formatted date, or JSON array of new assignees
 *                     example: "HIGH"
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2026-09-04T13:30:00.000Z"
 *                   actor:
 *                     type: object
 *                     nullable: true
 *                     description: User who triggered the event
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                         example: "c7f8a9e0-5678-4321-98ba-dcba09876543"
 *                       name:
 *                         type: string
 *                         example: "Aly Adel"
 *                       email:
 *                         type: string
 *                         format: email
 *                         example: "aly@example.com"
 *       401:
 *         description: Unauthorized - missing, invalid, or expired JWT bearer token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Task not found or user lacks access rights to the containing project
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *               example:
 *                 message: "Task not found or you do not have permission to access it"
 */
router.get("/:taskId", getTaskHistory as unknown as RequestHandler);

export default router;
