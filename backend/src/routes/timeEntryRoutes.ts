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

router.post("/create/:taskId", create as unknown as RequestHandler);
router.get("/:taskId", getAll as unknown as RequestHandler);
router.patch("/update/:taskId/:id", update as unknown as RequestHandler);
router.delete("/delete/:taskId/:id", remove as unknown as RequestHandler);

export default router;
