import { Router, RequestHandler } from "express";
import { getTaskHistory } from "../controllers/taskHistoryController";
import { authenticate } from "../middleware/auth";

const router = Router();
router.use(authenticate);
router.get("/:taskId", getTaskHistory as unknown as RequestHandler);
export default router;
