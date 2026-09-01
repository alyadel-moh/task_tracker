import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/authService";
async function register(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void | Response> {
  try {
    const result = await AuthService.register(req.body);
    return res.status(200).json(result);
  } catch (err: any) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    next(err);
  }
}
async function verifyOtp(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  try {
    const result = await AuthService.verifyOtp(req.body);
    return res.status(200).json(result);
  } catch (err: any) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    return next(err);
  }
}
async function resendVerificationEmail(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  try {
    const result = await AuthService.resendOtp(req.body);
    return res.status(200).json(result);
  } catch (err: any) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    return next(err);
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
    const result = await AuthService.update(req.user!.id as string, req.body);

    return res.status(200).json({
      message: `${result.changedLabel || "User"} updated successfully`,
      user: result.updatedField,
      ...(result.requiresEmailVerification && {
        requiresEmailVerification: result.requiresEmailVerification,
        emailVerificationToken: result.emailVerificationToken,
        pendingEmail: result.pendingEmail,
      }),
    });
  } catch (err: any) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    return next(err);
  }
}
async function verifyUpdatedEmailOtp(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  try {
    const result = await AuthService.verifyUpdatedEmailOtp({
      userId: req.user!.id as string,
      newEmail: req.body.newEmail,
      otp: req.body.otp,
      token: req.body.token,
    });
    return res.status(200).json(result);
  } catch (err: any) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    return next(err);
  }
}

async function me(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ error: "Unauthorized", message: "User not authenticated" });
    }
    const user = await AuthService.getUserById(req.user.id as string);
    return res.status(200).json(user);
  } catch (err: any) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    return next(err);
  }
}
async function logout(_req: Request, res: Response): Promise<void> {
  res.status(200).json({ message: "Logout successful" });
}

async function forgotPassword(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    const result = await AuthService.forgotPassword(email);
    return res.status(200).json(result);
  } catch (err: any) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    return next(err);
  }
}
async function resetPassword(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  try {
    const { email, otp, newPassword, resetToken } = req.body;

    if (!email || !otp || !newPassword || !resetToken) {
      return res
        .status(400)
        .json({ message: "All fields and reset token are required." });
    }
    const result = await AuthService.ResetPassword(
      email,
      resetToken,
      newPassword,
      otp,
    );
    return res.status(200).json(result);
  } catch (err: any) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    return next(err);
  }
}
export {
  register,
  login,
  me,
  logout,
  update,
  resendVerificationEmail,
  verifyOtp,
  verifyUpdatedEmailOtp,
  forgotPassword,
  resetPassword,
};
