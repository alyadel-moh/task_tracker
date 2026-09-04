import { Router, RequestHandler } from "express";
import {
  create,
  getAll,
  update,
  remove,
} from "../controllers/timeEntryController";
import { authenticate } from "../middleware/auth";

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * tags:
 *   name: Time Entries
 *   description: Task work logging, duration tracking, and overrun calculation
 */

/**
 * @openapi
 * /api/time-entries/{taskId}:
 *   post:
 *     summary: Log a new time entry on a task
 *     description: Creates a time entry, logs a TIME_ENTRY_CREATED audit record, and recalculates whether logged time exceeds the task's estimated time. Authorized for project OWNER, task creator, or assigned users.
 *     tags: [Time Entries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the task
 *         example: "e6f2122c-5b32-475a-bc82-d2f627793d56"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [durationMinutes, entryDate]
 *             properties:
 *               durationMinutes:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 1440
 *                 description: Logged duration in minutes (between 1 and 1440)
 *                 example: 45
 *               entryDate:
 *                 type: string
 *                 format: date-time
 *                 description: Valid ISO 8601 date string when work occurred
 *                 example: "2026-08-10T14:30:00.000Z"
 *               note:
 *                 type: string
 *                 nullable: true
 *                 description: Work description or notes
 *                 example: "Implemented backend endpoints and swagger docs"
 *     responses:
 *       201:
 *         description: Time entry logged successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Time entry created successfully!"
 *                 overrun:
 *                   type: boolean
 *                   description: True if total logged minutes exceed task estimatedTime
 *                   example: false
 *                 timeEntry:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       example: "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d"
 *                     taskId:
 *                       type: string
 *                       format: uuid
 *                     durationMinutes:
 *                       type: integer
 *                       example: 45
 *                     entryDate:
 *                       type: string
 *                       format: date-time
 *                     note:
 *                       type: string
 *                       nullable: true
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                 historyEntry:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     taskId:
 *                       type: string
 *                       format: uuid
 *                     actorId:
 *                       type: string
 *                       format: uuid
 *                     eventType:
 *                       type: string
 *                       example: "TIME_ENTRY_CREATED"
 *                     newValue:
 *                       type: string
 *                       example: "45 mins"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     actor:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         name:
 *                           type: string
 *                         email:
 *                           type: string
 *       400:
 *         description: Validation error - duration out of range or invalid ISO date
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalidDuration:
 *                 value: { message: "Duration must be an integer between 1 and 1440 minutes" }
 *               invalidDate:
 *                 value: { message: "Entry date is required" }
 *       401:
 *         description: Unauthorized - missing or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - caller is not project member, owner, creator, or assigned member
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *               example:
 *                 message: "Access denied: you are not the project owner and neither assigned to nor the creator of this task."
 *       404:
 *         description: Task not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *               example:
 *                 message: "Task not found"
 */
router.post("/:taskId", create as unknown as RequestHandler);

/**
 * @openapi
 * /api/time-entries/{taskId}:
 *   get:
 *     summary: Retrieve all logged time entries and total minutes for a task
 *     description: Returns all time entries ordered by entryDate DESC and createdAt DESC, alongside the aggregated total logged minutes. Requires active project membership.
 *     tags: [Time Entries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the task
 *         example: "e6f2122c-5b32-475a-bc82-d2f627793d56"
 *     responses:
 *       200:
 *         description: Time entries and aggregated minutes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalMinutes:
 *                   type: integer
 *                   example: 120
 *                   description: Total duration in minutes logged across all entries
 *                 timeEntries:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       durationMinutes:
 *                         type: integer
 *                         example: 60
 *                       entryDate:
 *                         type: string
 *                         format: date-time
 *                       note:
 *                         type: string
 *                         nullable: true
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized - missing or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - caller is not a member of the containing project
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *               example:
 *                 message: "You are not a member of this project"
 *       404:
 *         description: Task not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *               example:
 *                 message: "Task not found"
 */
router.get("/:taskId", getAll as unknown as RequestHandler);

/**
 * @openapi
 * /api/time-entries/{taskId}/{id}:
 *   patch:
 *     summary: Update an existing time entry
 *     description: Updates duration, entryDate, or note on a time log, writes TIME_ENTRY_UPDATED history, and recalculates overrun. Authorized for project OWNER, task creator, or assigned users.
 *     tags: [Time Entries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the parent task
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the time entry
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               durationMinutes:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 1440
 *                 example: 60
 *               entryDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-08-10T15:00:00.000Z"
 *               note:
 *                 type: string
 *                 nullable: true
 *                 example: "Updated note details"
 *     responses:
 *       200:
 *         description: Time entry updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Duration, Note updated successfully"
 *                 overrun:
 *                   type: boolean
 *                   description: Evaluated if duration changed and total minutes exceed task estimatedTime
 *                   example: false
 *                 timeEntry:
 *                   type: object
 *                   description: Key-value map of modified fields
 *                   properties:
 *                     durationMinutes:
 *                       type: integer
 *                     entryDate:
 *                       type: string
 *                       format: date-time
 *                     note:
 *                       type: string
 *                       nullable: true
 *                 historyEntries:
 *                   type: array
 *                   description: Audit entries for each modified field
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       taskId:
 *                         type: string
 *                         format: uuid
 *                       eventType:
 *                         type: string
 *                         example: "TIME_ENTRY_UPDATED"
 *                       fieldChanged:
 *                         type: string
 *                         example: "durationMinutes"
 *                       oldValue:
 *                         type: string
 *                         nullable: true
 *                       newValue:
 *                         type: string
 *                         nullable: true
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       actor:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           name:
 *                             type: string
 *                           email:
 *                             type: string
 *       400:
 *         description: Validation error - duration out of range (1-1440) or invalid ISO date
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalidDuration:
 *                 value: { message: "durationMinutes must be between 1 and 1440 minutes" }
 *               emptyDate:
 *                 value: { message: "Entry date cannot be empty" }
 *       401:
 *         description: Unauthorized - missing or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - caller is not authorized on this task
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *               example:
 *                 message: "Access denied: you are not the project owner and neither assigned to nor the creator of this task."
 *       404:
 *         description: Task or time entry not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *               example:
 *                 message: "Time entry not found"
 */
router.patch("/:taskId/:id", update as unknown as RequestHandler);

/**
 * @openapi
 * /api/time-entries/{taskId}/{id}:
 *   delete:
 *     summary: Delete a time entry
 *     description: Permanently removes a time entry and records a TIME_ENTRY_DELETED audit log with the duration removed. Authorized for project OWNER, task creator, or assigned users.
 *     tags: [Time Entries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the task
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the time entry to delete
 *     responses:
 *       200:
 *         description: Time entry deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "TimeEntry deleted successfully"
 *                 historyEntry:
 *                   type: object
 *                   description: Audit record generated for this deletion
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     taskId:
 *                       type: string
 *                       format: uuid
 *                     eventType:
 *                       type: string
 *                       example: "TIME_ENTRY_DELETED"
 *                     oldValue:
 *                       type: string
 *                       example: "45 mins"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     actor:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         name:
 *                           type: string
 *                         email:
 *                           type: string
 *       401:
 *         description: Unauthorized - missing or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - caller is not authorized on this task
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *               example:
 *                 message: "Access denied: you are not the project owner and neither assigned to nor the creator of this task."
 *       404:
 *         description: Task or time entry not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *               example:
 *                 message: "Time entry not found"
 */
router.delete("/:taskId/:id", remove as unknown as RequestHandler);

export default router;
