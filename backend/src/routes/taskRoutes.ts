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

// Cast handlers to `RequestHandler` via `unknown` to resolve AuthRequest type mismatch
router.post("/create/:projectId", create as unknown as RequestHandler);
router.get("/:projectId", getAll as unknown as RequestHandler);
router.get("/:projectId/:id", getById as unknown as RequestHandler);
router.patch("/update/:projectId/:id", update as unknown as RequestHandler);
router.delete("/delete/:projectId/:id", remove as unknown as RequestHandler);

export default router;
