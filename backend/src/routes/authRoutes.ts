import { Router, RequestHandler } from "express";
import { register, login, me, logout } from "../controllers/authcontroller";
import { authenticate } from "../middleware/auth";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authenticate, me as unknown as RequestHandler);
router.post("/logout", authenticate, logout);

export default router;
