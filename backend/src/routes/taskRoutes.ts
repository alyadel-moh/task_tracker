import { Router, RequestHandler } from "express";
import {
  create,
  getAll,
  getById,
  update,
  remove,
} from "../controllers/taskController";
import { authenticate } from "../middleware/auth";

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * tags:
 *   name: Tasks
 *   description: Task tracking, assignments, filtering, and audit integration
 */

/**
 * @openapi
 * /api/tasks/{projectId}:
 *   post:
 *     summary: Create a new task within a project
 *     description: Creates a task in the project, links initial assignees, and automatically writes a TASK_CREATED audit log. Requires active project membership.
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The UUID of the project
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
 *                 example: Design Landing Page
 *               description:
 *                 type: string
 *                 nullable: true
 *                 example: Draft initial Figma wireframes for homepage
 *               statusId:
 *                 type: string
 *                 format: uuid
 *                 description: Project status UUID. If omitted, the default project status is used.
 *                 example: "3fa85f64-5717-4562-b3fc-2c963f66afa6"
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH]
 *                 default: MEDIUM
 *                 example: HIGH
 *               estimatedTime:
 *                 type: integer
 *                 nullable: true
 *                 minimum: 1
 *                 maximum: 525600
 *                 description: Estimated duration in minutes (1 to 525600)
 *                 example: 120
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *                 example: 2026-08-15T18:00:00.000Z
 *               assignees:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 description: Array of user IDs to assign. Each must be an active project member.
 *                 example: ["c7f8a9e0-5678-4321-98ba-dcba09876543"]
 *     responses:
 *       201:
 *         description: Task created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Task created successfully
 *                 newTask:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       example: "e6f2122c-5b32-475a-bc82-d2f627793d56"
 *                     name:
 *                       type: string
 *                       example: Design Landing Page
 *                     description:
 *                       type: string
 *                       nullable: true
 *                       example: Draft initial Figma wireframes for homepage
 *                     estimatedTime:
 *                       type: integer
 *                       nullable: true
 *                       example: 120
 *                     dueDate:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                       example: 2026-08-15T18:00:00.000Z
 *                     priority:
 *                       type: string
 *                       enum: [LOW, MEDIUM, HIGH]
 *                       example: HIGH
 *                     projectId:
 *                       type: string
 *                       format: uuid
 *                       example: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
 *                     statusId:
 *                       type: string
 *                       format: uuid
 *                       example: "3fa85f64-5717-4562-b3fc-2c963f66afa6"
 *                     createdBy:
 *                       type: string
 *                       format: uuid
 *                       example: "c7f8a9e0-5678-4321-98ba-dcba09876543"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Validation error - empty name, invalid date, invalid estimatedTime, or unassigned member
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missingName:
 *                 value: { message: "Task name is required" }
 *               invalidTime:
 *                 value: { message: "estimatedTime must be a positive number of minutes (minimum 1)" }
 *               invalidDate:
 *                 value: { message: "dueDate must be a valid ISO 8601 date string" }
 *               notProjectMember:
 *                 value: { message: "One or more assignees are not active members of this project" }
 *       401:
 *         description: Unauthorized - missing or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - caller is not a member of this project
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
 * /api/tasks/{projectId}:
 *   get:
 *     summary: Retrieve and filter tasks for a specific project
 *     description: Returns tasks filtered by query parameters and sorted reverse-chronologically by creation date. Requires active project membership.
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The UUID of the project
 *         example: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Case-insensitive substring search matching task name or description
 *       - in: query
 *         name: statusId
 *         style: form
 *         explode: true
 *         schema:
 *           oneOf:
 *             - type: string
 *               format: uuid
 *             - type: array
 *               items:
 *                 type: string
 *                 format: uuid
 *         description: Filter by status UUID(s)
 *       - in: query
 *         name: priority
 *         style: form
 *         explode: true
 *         schema:
 *           oneOf:
 *             - type: string
 *               enum: [LOW, MEDIUM, HIGH]
 *             - type: array
 *               items:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH]
 *         description: Filter by priority value(s)
 *       - in: query
 *         name: overdue
 *         schema:
 *           type: boolean
 *         description: When true, returns tasks whose dueDate is past and whose status is not DONE
 *       - in: query
 *         name: assigneeId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter tasks assigned to a specific user UUID
 *     responses:
 *       200:
 *         description: Filtered list of tasks
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
 *                   name:
 *                     type: string
 *                   description:
 *                     type: string
 *                     nullable: true
 *                   statusId:
 *                     type: string
 *                     format: uuid
 *                   priority:
 *                     type: string
 *                     enum: [LOW, MEDIUM, HIGH]
 *                   estimatedTime:
 *                     type: integer
 *                     nullable: true
 *                   dueDate:
 *                     type: string
 *                     format: date-time
 *                     nullable: true
 *                   projectId:
 *                     type: string
 *                     format: uuid
 *                   createdBy:
 *                     type: string
 *                     format: uuid
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   status:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         example: "TODO"
 *       401:
 *         description: Unauthorized - missing or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - caller is not a member of this project
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
 * /api/tasks/{projectId}/{id}:
 *   get:
 *     summary: Retrieve a single task by ID with relations
 *     description: Returns task details including status, assignees, and creator information. Requires active project membership.
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The UUID of the project
 *         example: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The UUID of the task
 *         example: "e6f2122c-5b32-475a-bc82-d2f627793d56"
 *     responses:
 *       200:
 *         description: Detailed task information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 name:
 *                   type: string
 *                 description:
 *                   type: string
 *                   nullable: true
 *                 statusId:
 *                   type: string
 *                   format: uuid
 *                 priority:
 *                   type: string
 *                   enum: [LOW, MEDIUM, HIGH]
 *                 estimatedTime:
 *                   type: integer
 *                   nullable: true
 *                 dueDate:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                 createdBy:
 *                   type: string
 *                   format: uuid
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                 status:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: "IN_PROGRESS"
 *                 assignees:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       name:
 *                         type: string
 *                       email:
 *                         type: string
 *                         format: email
 *                       photoUrl:
 *                         type: string
 *                         nullable: true
 *                 creator:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                       format: email
 *                     photoUrl:
 *                       type: string
 *                       nullable: true
 *       401:
 *         description: Unauthorized - missing or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - caller is not a member of this project
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *               example:
 *                 message: "You are not a member of this project"
 *       404:
 *         description: Task not found in this project
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *               example:
 *                 message: "Task not found"
 */
router.get("/:projectId/:id", getById as unknown as RequestHandler);

/**
 * @openapi
 * /api/tasks/{projectId}/{id}:
 *   patch:
 *     summary: Update an existing task
 *     description: Updates specified fields, handles assignee differential synchronization, creates change audit history entries, and checks for logged time overrun. Authorized exclusively for project OWNER, task creator, or assigned users.
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The UUID of the project
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The UUID of the task
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Updated Task Name
 *               description:
 *                 type: string
 *                 nullable: true
 *                 example: Updated description
 *               statusId:
 *                 type: string
 *                 format: uuid
 *                 example: "3fa85f64-5717-4562-b3fc-2c963f66afa6"
 *               estimatedTime:
 *                 type: integer
 *                 nullable: true
 *                 minimum: 1
 *                 maximum: 525600
 *                 example: 90
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *                 example: 2026-08-20T12:00:00.000Z
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH]
 *                 example: HIGH
 *               assigneeIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 description: Full replacement array of assignee user IDs
 *                 example: ["c7f8a9e0-5678-4321-98ba-dcba09876543"]
 *     responses:
 *       200:
 *         description: Task updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Task name, Priority updated successfully"
 *                 overrun:
 *                   type: boolean
 *                   description: True if logged time entries exceed estimatedTime
 *                   example: false
 *                 task:
 *                   type: object
 *                   description: Key-value map of modified attributes
 *                   properties:
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                       nullable: true
 *                     statusId:
 *                       type: string
 *                       format: uuid
 *                     statusName:
 *                       type: string
 *                     estimatedTime:
 *                       type: integer
 *                       nullable: true
 *                     dueDate:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                     priority:
 *                       type: string
 *                       enum: [LOW, MEDIUM, HIGH]
 *                     assignees:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           name:
 *                             type: string
 *                           email:
 *                             type: string
 *                             format: email
 *                           photoUrl:
 *                             type: string
 *                             nullable: true
 *                 historyEntries:
 *                   type: array
 *                   description: Audit entries created for each changed attribute
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       taskId:
 *                         type: string
 *                         format: uuid
 *                       actorId:
 *                         type: string
 *                         format: uuid
 *                       eventType:
 *                         type: string
 *                         example: "FIELD_UPDATED"
 *                       fieldChanged:
 *                         type: string
 *                         example: "priority"
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
 *         description: Validation error on input fields, invalid status, or invalid assignee IDs
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               emptyName:
 *                 value: { message: "Task name cannot be empty" }
 *               invalidStatus:
 *                 value: { message: "Invalid statusId for this project" }
 *               invalidAssignees:
 *                 value: { message: "One or more assignees are not active members of this project" }
 *       401:
 *         description: Unauthorized - missing or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - caller is not project owner, task creator, or an assigned member
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *               example:
 *                 message: "Access denied: you are not the project owner and neither assigned to nor the creator of this task."
 *       404:
 *         description: Task not found in this project
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *               example:
 *                 message: "Task not found"
 */
router.patch("/:projectId/:id", update as unknown as RequestHandler);

/**
 * @openapi
 * /api/tasks/{projectId}/{id}:
 *   delete:
 *     summary: Delete a task
 *     description: Permanently deletes a task and removes its relations. Authorized strictly for project OWNER, task creator, or assigned users.
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The UUID of the project
 *         example: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The UUID of the task to delete
 *         example: "e6f2122c-5b32-475a-bc82-d2f627793d56"
 *     responses:
 *       200:
 *         description: Task deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Task deleted successfully
 *       401:
 *         description: Unauthorized - missing or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - caller lacks authorization to delete this task
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *               example:
 *                 message: "Access denied: you are not the project owner and neither assigned to nor the creator of this task."
 *       404:
 *         description: Task not found in this project
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *               example:
 *                 message: "Task not found"
 */
router.delete("/:projectId/:id", remove as unknown as RequestHandler);

export default router;
