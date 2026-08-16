import { Router, RequestHandler } from "express";
import {
  create,
  getAll,
  update,
  remove,
} from "../controllers/columnController";
import { authenticate } from "../middleware/auth";

const router = Router();

router.use(authenticate);
/**
 * @openapi
 * /api/projects/columns/{projectId}:
 *   get:
 *     summary: Retrieve all columns for a specific project
 *     tags: [Columns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique ID of the project
 *     responses:
 *       200:
 *         description: List of project columns ordered by position
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Column'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Project not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/:projectId", getAll as unknown as RequestHandler);

/**
 * @openapi
 * /api/projects/columns/{projectId}:
 *   post:
 *     summary: Create a new custom column at the end of the board
 *     tags: [Columns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique ID of the project
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
 *                 example: QA Testing
 *     responses:
 *       201:
 *         description: Column created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Column created successfully
 *                 column:
 *                   $ref: '#/components/schemas/Column'
 *       400:
 *         description: Column name is required or empty
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
 *         description: Project not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/:projectId", create as unknown as RequestHandler);

/**
 * @openapi
 * /api/projects/columns/{projectId}/{columnId}:
 *   patch:
 *     summary: Update column title or reorder its position
 *     tags: [Columns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique ID of the project
 *       - in: path
 *         name: columnId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique ID of the column to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: In Review (QA)
 *               position:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       200:
 *         description: Column updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Column updated successfully
 *                 column:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     position:
 *                       type: integer
 *       400:
 *         description: Column name cannot be empty
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
 *         description: Column not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch("/:projectId/:columnId", update as unknown as RequestHandler);

/**
 * @openapi
 * /api/projects/columns/{projectId}/{columnId}:
 *   delete:
 *     summary: Delete a custom column and reorder remaining columns
 *     tags: [Columns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique ID of the project
 *       - in: path
 *         name: columnId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique ID of the column to delete
 *     responses:
 *       200:
 *         description: Column deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Column deleted successfully
 *       400:
 *         description: Default columns cannot be deleted
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
 *         description: Column not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete("/:projectId/:columnId", remove as unknown as RequestHandler);
