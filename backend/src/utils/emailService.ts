import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  connectionTimeout: 10000,
});

export class EmailService {
  static async sendVerificationCode(to: string, name: string, otp: string) {
    try {
      const info = await transporter.sendMail({
        from: `"Task Tracker" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to,
        subject: `Your Verification Code: ${otp}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
            <h2>Hi ${name},</h2>
            <p>Please enter the 6-digit code below to verify your account:</p>
            <div style="background: #f3f4f6; padding: 16px; text-align: center; border-radius: 8px; font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #1e293b; margin: 20px 0;">
              ${otp}
            </div>
            <p style="color: #64748b; font-size: 14px;">This code expires in 15 minutes.</p>
          </div>
        `,
      });

      console.log(
        `📬 [OTP Email] Sent to ${to} | ID: ${info.messageId} | Response: ${info.response}`,
      );
      return info;
    } catch (error) {
      console.error(`❌ [OTP Email] Error sending to ${to}:`, error);
      throw error;
    }
  }

  static async sendTaskReminder(
    to: string,
    name: string,
    taskName: string,
    formattedDueDate: string,
  ) {
    try {
      const info = await transporter.sendMail({
        from: `"Task Tracker" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to,
        subject: `Reminder: Task "${taskName}" is due tomorrow`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; line-height: 1.5; color: #1e293b;">
            <h2 style="color: #2563eb; margin-top: 0;">Task Due Reminder</h2>
            <p>Hi <strong>${name || "there"}</strong>,</p>
            <p>Your task <strong>"${taskName}"</strong> is scheduled for completion on <strong>${formattedDueDate}</strong>.</p>
            <div style="background: #f8fafc; border-left: 4px solid #2563eb; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
              <p style="margin: 0; font-size: 15px;"><strong>Task:</strong> ${taskName}</p>
              <p style="margin: 4px 0 0; font-size: 14px; color: #64748b;"><strong>Due Date:</strong> ${formattedDueDate}</p>
            </div>
            <p style="font-size: 14px; color: #64748b;">Please check your project board to review or complete your task before the deadline.</p>
          </div>
        `,
      });

      console.log(
        `📬 [Task Reminder] Sent to ${to} | ID: ${info.messageId} | Response: ${info.response}`,
      );
      return info;
    } catch (error) {
      console.error(`❌ [Task Reminder] Error sending to ${to}:`, error);
      throw error;
    }
  }
  static async sendPasswordResetOtp(to: string, name: string, otp: string) {
    try {
      const info = await transporter.sendMail({
        from: `"Task Tracker" <${process.env.SMTP_USER}>`,
        to,
        subject: `Password Reset Request - Code: ${otp}`,
        text: `Hi ${name || "there"},\n\nYour password reset code is: ${otp}\n\nThis code will expire in 15 minutes. If you did not request this, please ignore this email.`,
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; line-height: 1.5; color: #1e293b;">
          <h2 style="color: #ef4444; margin-top: 0;">Password Reset Request</h2>
          <p>Hi <strong>${name || "there"}</strong>,</p>
          <p>We received a request to reset your password. Use the verification code below to proceed:</p>
          <div style="background: #f1f5f9; padding: 18px; text-align: center; border-radius: 8px; font-size: 30px; font-weight: bold; letter-spacing: 8px; color: #0f172a; margin: 24px 0;">
            ${otp}
          </div>
          <p style="font-size: 13px; color: #64748b;">This code expires in <strong>15 minutes</strong>.</p>
          <p style="font-size: 13px; color: #64748b;">If you didn't request this change, you can safely ignore this email.</p>
        </div>
      `,
      });

      console.log(
        `📬 [Password Reset] Sent OTP to ${to} | ID: ${info.messageId}`,
      );
      return info;
    } catch (error) {
      console.error(`❌ [Password Reset] Error sending email to ${to}:`, error);
      throw error;
    }
  }
}
