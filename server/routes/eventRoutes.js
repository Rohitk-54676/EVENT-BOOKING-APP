import express from "express";
import {
  createEvent,
  getEvents,
  registerEvent,
  getEventById,
  getAdminEvents,
  getEventRegistrations,
  exportEventData,
  sendDeleteOTP,
  deleteEventWithOTP,
  updateEvent,
  getMyBookings,
  verifyTicket
} from "../controllers/eventcontroller.js";

import { authMiddleware, optionalAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

// 🔹 PUBLIC
router.get("/", optionalAuth, getEvents);

// 🔹 SPECIFIC ROUTES FIRST (VERY IMPORTANT)
router.post("/verify-ticket", authMiddleware, verifyTicket);
router.get("/my-bookings", authMiddleware, getMyBookings);
router.get("/admin/events", authMiddleware, getAdminEvents);

// 🔹 PARAM ROUTES (with :id but more specific)
router.get("/:id/registrations", authMiddleware, getEventRegistrations);
router.get("/:id/export", authMiddleware, exportEventData);
router.post("/:id/send-delete-otp", authMiddleware, sendDeleteOTP);
router.post("/:id/delete", authMiddleware, deleteEventWithOTP);
router.put("/:id", authMiddleware, updateEvent);
router.post("/:id/register", authMiddleware, registerEvent);

// 🔹 GENERIC PARAM ROUTE (MUST BE LAST)
router.get("/:id", optionalAuth, getEventById);

// 🔹 CREATE EVENT
router.post("/", authMiddleware, createEvent);

export default router;