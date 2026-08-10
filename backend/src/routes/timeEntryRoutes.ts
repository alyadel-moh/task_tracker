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
 * /api/time-entries/create/{taskId}:
 *   post:
 *     summary: Create a new time entry for a task
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
 *         description: The unique ID of the task
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
 *                 example: 45
 *                 description: Logged duration in minutes
 *               entryDate:
 *                 type: string
 *                 format: date
 *                 example: "2026-08-10"
 *                 description: Date the work was performed (YYYY-MM-DD)
 *               note:
 *                 type: string
 *                 nullable: true
 *                 example: Implemented backend endpoints and swagger docs
 *     responses:
 *       201:
 *         description: Time entry created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Time entry created successfully
 *                 timeEntry:
 *                   $ref: '#/components/schemas/TimeEntry'
 *       400:
 *         description: Invalid duration, missing date, or invalid input parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - missing or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - user does not own the project associated with this task
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
router.post("/create/:taskId", create as unknown as RequestHandler);

/**
 * @openapi
 * /api/time-entries/{taskId}:
 *   get:
 *     summary: Retrieve all time entries logged for a specific task
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
 *         description: The unique ID of the task
 *     responses:
 *       200:
 *         description: List of time entries and total logged duration
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalMinutes:
 *                   type: integer
 *                   example: 120
 *                   description: Sum of all logged minutes for this task
 *                 timeEntries:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TimeEntry'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - user does not own the project associated with this task
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
router.get("/:taskId", getAll as unknown as RequestHandler);

/**
 * @openapi
 * /api/time-entries/update/{taskId}/{id}:
 *   patch:
 *     summary: Update an existing time entry
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
 *         description: The unique ID of the task
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The unique ID of the time entry
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
 *                 example: 60
 *               entryDate:
 *                 type: string
 *                 format: date
 *                 example: "2026-08-10"
 *               note:
 *                 type: string
 *                 nullable: true
 *                 example: Updated note details
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
 *                   example: Time entry updated successfully
 *                 timeEntry:
 *                   $ref: '#/components/schemas/TimeEntry'
 *       400:
 *         description: Invalid input or invalid date format
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
 *         description: Forbidden - user does not own the project
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Task or time entry not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch("/update/:taskId/:id", update as unknown as RequestHandler);

/**
 * @openapi
 * /api/time-entries/delete/{taskId}/{id}:
 *   delete:
 *     summary: Delete a time entry
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
 *         description: The unique ID of the task
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The unique ID of the time entry to delete
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
 *                   example: Time entry deleted successfully
 *       401:
 *         description: Unauthorized
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
 *         description: Task or time entry not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete("/delete/:taskId/:id", remove as unknown as RequestHandler);

export default router;
