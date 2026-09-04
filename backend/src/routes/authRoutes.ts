import { Router } from "express";
import {
  register,
  login,
  me,
  logout,
  update,
  resendVerificationEmail,
  verifyOtp,
  verifyUpdatedEmailOtp,
  resetPassword,
  forgotPassword,
} from "../controllers/authController";
import { authenticate } from "../middleware/auth";

const router = Router();

/**
 * @openapi
 * tags:
 *   name: Auth
 *   description: Authentication, verification, and user session management
 */

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Register a new account and initiate email OTP verification
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Aly Adel
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: SuperSecret123!
 *               photoUrl:
 *                 type: string
 *                 nullable: true
 *                 example: https://example.com/avatar.jpg
 *     responses:
 *       200:
 *         description: OTP verification email dispatched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Verification code sent to your email.
 *                 email:
 *                   type: string
 *                   example: user@example.com
 *                 token:
 *                   type: string
 *                   description: 15-minute temporary JWT containing pending registration data
 *       400:
 *         description: Missing fields or password under 8 characters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Email already registered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/register", register);

/**
 * @openapi
 * /api/auth/verify-otp:
 *   post:
 *     summary: Verify 6-digit OTP code and create the user account
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [otp, token]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               otp:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 6
 *                 example: "123456"
 *               token:
 *                 type: string
 *                 description: Temporary registration token returned by register endpoint
 *     responses:
 *       200:
 *         description: Account successfully verified and persisted to database
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Account verified and created successfully!
 *       400:
 *         description: Invalid OTP, expired token, or missing parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Email was registered before OTP was completed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/verify-otp", verifyOtp);

/**
 * @openapi
 * /api/auth/resend-verification:
 *   post:
 *     summary: Resend OTP verification email with an updated temporary token
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Aly Adel
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: SuperSecret123!
 *               photoUrl:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       200:
 *         description: New verification OTP sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Verification code sent to your email.
 *                 email:
 *                   type: string
 *                   example: user@example.com
 *                 token:
 *                   type: string
 *       400:
 *         description: Invalid or missing parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Email already registered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/resend-verification", resendVerificationEmail);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Authenticate user and issue JWT
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: SuperSecret123!
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 token:
 *                   type: string
 *                   description: JWT bearer token
 *       400:
 *         description: Missing email or password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Account email is unverified
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/login", login);

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     summary: Get profile details of the authenticated user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *                   format: email
 *                 photoUrl:
 *                   type: string
 *                   nullable: true
 *                 isEmailVerified:
 *                   type: boolean
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Missing or invalid JWT
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User record not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/me", authenticate, me);

/**
 * @openapi
 * /api/auth/update:
 *   patch:
 *     summary: Update profile fields (name, photo, or request email change)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Aly Adel
 *               photoUrl:
 *                 type: string
 *                 nullable: true
 *                 example: https://example.com/avatar.png
 *               email:
 *                 type: string
 *                 format: email
 *                 description: If changing email, requires OTP verification before persistence
 *                 example: newemail@example.com
 *     responses:
 *       200:
 *         description: Profile updated or verification code sent for new email
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Email verification code sent
 *                 user:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     photoUrl:
 *                       type: string
 *                 requiresEmailVerification:
 *                   type: boolean
 *                   example: true
 *                 emailVerificationToken:
 *                   type: string
 *                 pendingEmail:
 *                   type: string
 *                   format: email
 *       400:
 *         description: Validation error or new email already in use
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch("/update", authenticate, update);

/**
 * @openapi
 * /api/auth/verify-updated-email:
 *   post:
 *     summary: Verify OTP sent to new email address during profile update
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [newEmail, otp, token]
 *             properties:
 *               newEmail:
 *                 type: string
 *                 format: email
 *                 example: newemail@example.com
 *               otp:
 *                 type: string
 *                 example: "654321"
 *               token:
 *                 type: string
 *                 description: Verification token received from the update request
 *     responses:
 *       200:
 *         description: Email successfully updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Email updated and verified successfully!
 *       400:
 *         description: Invalid OTP, token mismatch, or expired code
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/verify-updated-email", authenticate, verifyUpdatedEmailOtp);

/**
 * @openapi
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request a password reset OTP code
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Reset code dispatched or generic success acknowledged
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Reset code sent successfully
 *                 resetToken:
 *                   type: string
 *                   description: 15-minute temporary reset token (returned when email matches a user)
 *       400:
 *         description: Missing email field
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/forgot-password", forgotPassword);

/**
 * @openapi
 * /api/auth/reset-password:
 *   post:
 *     summary: Complete password reset using OTP code and reset token
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp, newPassword, resetToken]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               otp:
 *                 type: string
 *                 example: "123456"
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: NewStrongPassword456!
 *               resetToken:
 *                 type: string
 *                 description: Reset token received from forgot-password
 *     responses:
 *       200:
 *         description: Password successfully updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Password reset successfully. Please log in.
 *       400:
 *         description: Missing fields, password too short, invalid OTP, or expired token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/reset-password", resetPassword);

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     summary: Log out current user (stateless, client discards token)
 *     tags: [Auth]
 *     security: []
 *     responses:
 *       200:
 *         description: Logout acknowledged
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Logout successful
 */
router.post("/logout", logout);

export default router;
