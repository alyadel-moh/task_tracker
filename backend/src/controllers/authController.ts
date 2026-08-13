import { Request, Response, NextFunction } from "express";
import { User } from "../models/index";
import { generateToken } from "../utils/jwt";
import bcrypt from "bcryptjs";

interface RegisterBody {
  name: string;
  email: string;
  password: string;
  photoUrl?: string | null;
}
interface UpdateUserBody {
  name?: string;
  email?: string;
  photoUrl?: string | null;
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
    const { name, email, password, photoUrl } = req.body;

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

    await User.create({ name, email, password: hashedPassword, photoUrl });
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
async function update(
  req: Request<{}, {}, UpdateUserBody>,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  try {
    const { name, email, photoUrl } = req.body;

    const user = await User.findOne({
      where: { id: req.user?.id },
    });

    if (!user) {
      return res
        .status(404)
        .json({ error: "Not Found", message: "User not found" });
    }

    const updatedField: UpdateUserBody = {};
    const changedLabels: string[] = [];

    if (name !== undefined && user.name !== name) {
      const trimmedName = name.trim();
      if (!trimmedName) {
        return res.status(400).json({
          error: "BadRequest",
          message: "User name cannot be empty",
        });
      }
      user.name = trimmedName;
      updatedField.name = trimmedName;
      changedLabels.push("Name");
    }
    if (email !== undefined && user.email !== email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(409).json({
          error: "Conflict",
          message: "Email is already in use by another account",
        });
      }
      user.email = email;
      updatedField.email = email;
      changedLabels.push("Email");
    }
    if (photoUrl !== undefined && user.photoUrl !== photoUrl) {
      user.photoUrl = photoUrl;
      updatedField.photoUrl = photoUrl;
      changedLabels.push("Photo URL");
    }

    if (changedLabels.length > 0) {
      await user.save();
    }

    return res.status(200).json({
      status: "success",
      message: `${changedLabels.join(", ") || "User"} updated successfully`,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        photoUrl: user.photoUrl,
      },
    });
  } catch (err) {
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
  const { id, name, email, photoUrl } = req.user;
  res.status(200).json({ id, name, email, photoUrl });
}

async function logout(_req: Request, res: Response): Promise<void> {
  res.status(200).json({ message: "Logout successful" });
}

export { register, login, me, logout, update };
