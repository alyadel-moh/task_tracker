import { User } from "../models/index";

export class AuthRepository {
  static async createUser(data: {
    name: string;
    email: string;
    password: string;
    photoUrl?: string | null;
    isEmailVerified: boolean;
    emailVerificationToken?: string | null;
    emailVerificationExpires?: Date | null;
  }) {
    return await User.create(data);
  }
  static async getUserByEmailAndPass(email: string) {
    return await User.scope("withPassword").findOne({
      where: { email },
    });
  }

  static async findUserById(userId: string) {
    return await User.findByPk(userId);
  }
  static async getUserByEmail(email: string) {
    return await User.findOne({
      where: { email },
      attributes: ["id", "name", "email", "photoUrl"],
    });
  }
}
