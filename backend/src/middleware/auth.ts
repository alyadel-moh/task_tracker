import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import { User } from "../models";
import { AuthRequest } from "../types/AuthRequest";

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ error: "Unauthorized", message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verifyToken(token) as { id: string; email?: string };

    // Fetch only the necessary user attributes
    const user = await User.findByPk(decoded.id, {
      attributes: ["id", "name", "email"],
    });

    if (!user) {
      return res
        .status(401)
        .json({ error: "Unauthorized", message: "User not found" });
    }

    (req as AuthRequest).user = user;
    next();
  } catch {
    return res
      .status(401)
      .json({ error: "Unauthorized", message: "Invalid or expired token" });
  }
}

export default authenticate;
