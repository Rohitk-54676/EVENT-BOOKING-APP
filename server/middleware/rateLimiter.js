import rateLimit from "express-rate-limit";

// 🔴 OTP LIMIT (very strict)
export const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 3,
  message: { message: "Too many OTP requests. Try again later." }
});

// 🔴 LOGIN LIMIT
export const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  message: { message: "Too many login attempts. Try later." }
});

// 🟡 BOOKING LIMIT
export const bookingLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  message: { message: "Too many booking attempts. Try later." }
});