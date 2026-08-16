import { Router, RequestHandler } from "express";
import {
  create,
  getAll,
  update,
  remove,
} from "../controllers/projectController";
import { authenticate } from "../middleware/auth";

const router = Router();

router.use(authenticate);

router.post("/create", create as unknown as RequestHandler);
router.get("/", getAll as unknown as RequestHandler);
router.patch("/update/:id", update as unknown as RequestHandler);
router.delete("/delete/:id", remove as unknown as RequestHandler);

export default router;
