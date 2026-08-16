import { Request, Response, NextFunction } from "express";
import { User } from "../models/index.js";
import { generateToken } from "../utils/jwt.js";
import bcrypt from "bcryptjs";

interface RegisterBody {
  name: string;
  email: string;
  password: string;
}

interface LoginBody {
  email: string;
  password: string;
}

async function register(
  req: Request<{}, {}, RegisterBody>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { name, email, password } = req.body;

    // 1. Validate inputs before hashing
    if (!email || !password || !name) {
      res.status(400).json({
        error: "Bad Request",
        message: "Name, email, and password are required",
      });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({
        error: "Bad Request",
        message: "Password must be at least 8 characters long",
      });
      return;
    }

    // 2. Hash password and persist
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await User.create({ name, email, password: hashedPassword });
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    next(error);
  }
}

async function login(
  req: Request<{}, {}, LoginBody>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        error: "Bad Request",
        message: "Email and password are required",
      });
      return;
    }

    // Scope override ensures 'password' property is loaded onto the instance
    const user = await User.scope("withPassword").findOne({ where: { email } });

    if (!user) {
      res
        .status(401)
        .json({ error: "Unauthorized", message: "Invalid email or password" });
      return;
    }

    const matches = await user.validPassword(password);

    if (!matches) {
      res
        .status(401)
        .json({ error: "Unauthorized", message: "Invalid email or password" });
      return;
    }

    const token = generateToken({ id: user.id, email: user.email });
    res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    next(error);
  }
}

async function me(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res
      .status(401)
      .json({ error: "Unauthorized", message: "User not authenticated" });
    return;
  }
  const { id, name, email } = req.user;
  res.status(200).json({ id, name, email });
}

async function logout(_req: Request, res: Response): Promise<void> {
  res.status(200).json({ message: "Logout successful" });
}

export { register, login, me, logout };
