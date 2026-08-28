import { User } from "../models/index";
import { generateToken } from "../utils/jwt";
import bcrypt from "bcryptjs";
import { AuthRepository } from "../repositories/authRepository";
interface RegisterBodyDTO {
  name: string;
  email: string;
  password: string;
  photoUrl?: string;
}
interface UpdateUserBodyDTO {
  name?: string;
  email?: string;
  photoUrl?: string;
}
export class AuthService {
  static async register(dto: RegisterBodyDTO) {
    const { name, email, password, photoUrl } = dto;
    if (!email || !password || !name) {
      throw { status: 400, message: "Name, email, and password are required" };
    }
    if (password.length < 8) {
      throw {
        status: 400,
        message: "Password must be at least 8 characters long",
      };
    }
    const normalizedEmail = email.trim();
    const existingUser = await AuthRepository.getUserByEmail(normalizedEmail);
    if (existingUser) {
      throw { status: 409, message: "Email is already registered" };
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    return await AuthRepository.createUser({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      photoUrl: photoUrl || null,
    });
  }
  static async login(email: string, password: string) {
    if (!email || !password) {
      throw { status: 400, message: "Email and password are required" };
    }
    const user = await AuthRepository.getUserByEmailAndPass(email.trim());
    if (!user) {
      throw { status: 401, message: "Invalid email or password" };
    }
    const isMatch = await user.validPassword(password);
    if (!isMatch) {
      throw { status: 401, message: "Invalid email or password" };
    }
    return generateToken({ id: user.id, email: user.email });
  }

  static async update(id: string, dto: UpdateUserBodyDTO) {
    const user = await AuthRepository.findUserById(id!);
    if (!user) {
      throw { status: 404, message: "User not found" };
    }
    const { name, email, photoUrl } = dto;
    const updatedField: UpdateUserBodyDTO = {};
    let changedLabel: string = "";
    if (name !== undefined && user.name !== name) {
      const trimmedName = name.trim();
      if (!trimmedName) {
        throw { status: 400, message: "Name cannot be empty" };
      }
      user.name = trimmedName;
      updatedField.name = trimmedName;
      changedLabel = "Name";
    }
    if (email !== undefined) {
      const trimmedEmail = email.trim();
      if (!trimmedEmail) {
        throw { status: 400, message: "Email cannot be empty" };
      }
      if (user.email !== trimmedEmail) {
        const existingUser = await AuthRepository.getUserByEmail(trimmedEmail);
        if (existingUser && existingUser.id !== user.id) {
          throw { status: 400, message: "Email is already in use" };
        }
        user.email = trimmedEmail;
        updatedField.email = trimmedEmail;
        changedLabel = "Email";
      }
    }
    if (photoUrl !== undefined && user.photoUrl !== photoUrl) {
      user.photoUrl = photoUrl;
      updatedField.photoUrl = photoUrl;
      changedLabel = "Photo URL";
    }
    if (Object.keys(updatedField).length !== 0) {
      await user.save();
    }
    return { updatedField, changedLabel };
  }
  static async getUserById(userId: string) {
    const user = await AuthRepository.findUserById(userId);
    if (!user) {
      throw { status: 404, message: "User not found" };
    }
    return user;
  }
}
