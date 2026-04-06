import express from "express";
import { createOrder,verifyPayment,deleteFailedRegistration,confirmFreeBooking } from "../controllers/paymentController.js";
import {authMiddleware} from "../middleware/authMiddleware.js";
import { bookingLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

router.post("/create-order",bookingLimiter, authMiddleware, createOrder);
router.post("/verify",bookingLimiter, authMiddleware, verifyPayment);
router.post("/delete", authMiddleware, deleteFailedRegistration);
router.post("/free-booking", authMiddleware, confirmFreeBooking);

export default router;