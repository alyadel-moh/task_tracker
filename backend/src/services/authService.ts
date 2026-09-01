import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { AuthRepository } from "../repositories/authRepository";
import { EmailService } from "../utils/emailService";
import { generateToken } from "../utils/jwt";

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
interface VerifyOtpDTO {
  email: string;
  otp: string;
  token: string;
}

interface VerifyEmailUpdateOtpDTO {
  userId: string;
  newEmail: string;
  otp: string;
  token: string;
}

const REGISTRATION_SECRET =
  process.env.JWT_SECRET || "registration_temp_secret";

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

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);

    const pendingPayload = {
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      photoUrl: photoUrl || null,
      otpHash: hashedOtp,
    };

    const verificationToken = jwt.sign(pendingPayload, REGISTRATION_SECRET, {
      expiresIn: "15m",
    });

    await EmailService.sendVerificationCode(normalizedEmail, name.trim(), otp);

    return {
      message: "Verification code sent to your email.",
      email: normalizedEmail,
      token: verificationToken,
    };
  }
  static async verifyOtp(dto: VerifyOtpDTO) {
    const { otp, token } = dto;
    if (!otp || !token) {
      throw { status: 400, message: "OTP code and token are required" };
    }

    let payload: any;
    try {
      payload = jwt.verify(token, REGISTRATION_SECRET);
    } catch (_err) {
      throw { status: 400, message: "Verification code expired or invalid" };
    }

    const isMatch = await bcrypt.compare(otp.trim(), payload.otpHash);
    if (!isMatch) {
      throw { status: 400, message: "Invalid 6-digit code. Please try again." };
    }

    const { name, email, password, photoUrl } = payload;
    const existingUser = await AuthRepository.getUserByEmail(email);
    if (existingUser) {
      throw { status: 409, message: "This email has already been registered." };
    }

    await AuthRepository.createUser({
      name,
      email,
      password,
      photoUrl,
      isEmailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpires: null,
    });

    return { message: "Account verified and created successfully!" };
  }

  static async resendOtp(dto: RegisterBodyDTO) {
    return this.register(dto);
  }

  static async login(email: string, password: string) {
    if (!email || !password) {
      throw { status: 400, message: "Email and password are required" };
    }
    const normalizedEmail = email.trim();
    const user = await AuthRepository.getUserByEmailAndPass(normalizedEmail);
    if (!user) {
      throw { status: 401, message: "Invalid email or password" };
    }
    const isMatch = await user.validPassword(password);
    if (!isMatch) {
      throw { status: 401, message: "Invalid email or password" };
    }
    if (!user.isEmailVerified) {
      throw {
        status: 403,
        message: "Please verify your email address before logging in.",
      };
    }
    return generateToken({
      id: user.id,
      email: user.email,
      isEmailVerified: user.isEmailVerified,
    });
  }

  static async update(id: string, dto: UpdateUserBodyDTO) {
    const user = await AuthRepository.findUserById(id!);
    if (!user) {
      throw { status: 404, message: "User not found" };
    }
    const { name, email, photoUrl } = dto;
    const updatedField: UpdateUserBodyDTO = {};
    let changedLabel: string = "";
    let emailVerificationToken: string | undefined;
    let pendingEmail: string | undefined;

    // 1. Update Name
    if (name !== undefined && user.name !== name.trim()) {
      const trimmedName = name.trim();
      if (!trimmedName) {
        throw { status: 400, message: "Name cannot be empty" };
      }
      user.name = trimmedName;
      updatedField.name = trimmedName;
      changedLabel = "Name";
    }

    if (photoUrl !== undefined && user.photoUrl !== photoUrl) {
      user.photoUrl = photoUrl;
      updatedField.photoUrl = photoUrl;
      changedLabel = "Photo URL";
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

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedOtp = await bcrypt.hash(otp, 10);

        emailVerificationToken = jwt.sign(
          { userId: user.id, newEmail: trimmedEmail, otpHash: hashedOtp },
          REGISTRATION_SECRET,
          { expiresIn: "15m" },
        );

        await EmailService.sendVerificationCode(trimmedEmail, user.name, otp);

        pendingEmail = trimmedEmail;
        changedLabel = "Email verification code sent";
      }
    }

    if (Object.keys(updatedField).length > 0) {
      await user.save();
    }

    return {
      updatedField,
      changedLabel,
      ...(emailVerificationToken && {
        emailVerificationToken,
        requiresEmailVerification: true,
        pendingEmail,
      }),
    };
  }
  static async verifyUpdatedEmailOtp(dto: VerifyEmailUpdateOtpDTO) {
    const { userId, newEmail, otp, token } = dto;
    if (!otp || !token || !newEmail || !userId) {
      throw {
        status: 400,
        message: "All verification parameters are required",
      };
    }

    let payload: any;
    try {
      payload = jwt.verify(token, REGISTRATION_SECRET);
    } catch (_err) {
      throw { status: 400, message: "Verification code expired or invalid" };
    }

    if (payload.userId !== userId || payload.newEmail !== newEmail.trim()) {
      throw { status: 400, message: "Verification token mismatch" };
    }

    const isMatch = await bcrypt.compare(otp.trim(), payload.otpHash);
    if (!isMatch) {
      throw { status: 400, message: "Invalid 6-digit code. Please try again." };
    }

    const user = await AuthRepository.findUserById(userId);
    if (!user) {
      throw { status: 404, message: "User not found" };
    }

    user.email = newEmail.trim();
    user.isEmailVerified = true;
    await user.save();

    return { message: "Email updated and verified successfully!" };
  }

  static async getUserById(userId: string) {
    const user = await AuthRepository.findUserById(userId);
    if (!user) {
      throw { status: 404, message: "User not found" };
    }
    return user;
  }

  static async ResetPassword(
    email: string,
    resetToken: string,
    newPassword: string,
    otp: string,
  ) {
    if (newPassword.length < 8) {
      throw {
        status: 400,
        message: "Password must be at least 8 characters long",
      };
    }
    const user = await AuthRepository.getUserByEmail(email.trim());
    if (!user) {
      throw { status: 400, message: "Invalid or expired reset session." };
    }

    let decoded: { id: string; email: string; otp: string };
    try {
      const secret =
        (process.env.JWT_SECRET || "registration_temp_secret") + user.password;
      decoded = jwt.verify(resetToken, secret) as {
        id: string;
        email: string;
        otp: string;
      };
    } catch (_err) {
      throw {
        status: 400,
        message: "Reset code has expired. Please request a new one.",
      };
    }

    if (decoded.otp !== otp.trim() || decoded.email !== user.email) {
      throw { status: 400, message: "Invalid 6-digit code. Please try again." };
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    user.isEmailVerified = true;
    await user.save();

    return { message: "Password reset successfully. Please log in." };
  }
  static async forgotPassword(email: string) {
    const user = await AuthRepository.getUserByEmail(email.trim());
    if (!user) {
      return {
        message: "a reset code has been sent.",
      };
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const secret = process.env.JWT_SECRET + user.password;
    const resetToken = jwt.sign(
      { id: user.id, email: user.email, otp },
      secret,
      {
        expiresIn: "15m",
      },
    );

    await EmailService.sendPasswordResetOtp(user.email, user.name, otp);
    return {
      message: "Reset code sent successfully",
      resetToken,
    };
  }
}
