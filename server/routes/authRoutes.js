import express from "express";
import { register, verifyOTP ,login ,forgotPassword,resetPassword,resendOTP} from "../controllers/authController.js";
import { otpLimiter, loginLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

router.post("/register",otpLimiter, register);
router.post("/verify-otp", verifyOTP);
router.post("/login", loginLimiter,login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/resend-otp",otpLimiter, resendOTP);
export default router;