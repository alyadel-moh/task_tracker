import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/authService";
import { AuthRequest } from "../types/AuthRequest";
async function register(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void | Response> {
  try {
    await AuthService.register(req.body);
    res.status(201).json({ message: "User registered successfully" });
  } catch (err: any) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    next(err);
  }
}

async function login(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void | Response> {
  try {
    const { email, password } = req.body;
    const token = await AuthService.login(email, password);
    res.status(200).json({ message: "Login successful", token });
  } catch (err: any) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    next(err);
  }
}

async function update(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  try {
    const { updatedField, changedLabel } = await AuthService.update(
      req.user!.id as string,
      req.body,
    );
    return res.status(200).json({
      message: `${changedLabel || "User"} updated successfully`,
      user: updatedField,
    });
  } catch (err: any) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    next(err);
  }
}

async function me(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res
      .status(401)
      .json({ error: "Unauthorized", message: "User not authenticated" });
    return;
  }
  const user = await AuthService.getUserById(req.user.id as string);
  res.status(200).json(user);
}
async function logout(_req: Request, res: Response): Promise<void> {
  res.status(200).json({ message: "Logout successful" });
}

export { register, login, me, logout, update };
