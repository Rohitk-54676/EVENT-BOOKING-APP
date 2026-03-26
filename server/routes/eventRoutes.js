import express from "express";
import { createEvent, getEvents, registerEvent } from "../controllers/eventcontroller.js";
import { authMiddleware, optionalAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

// public + optional user detection
router.get("/", optionalAuth, getEvents);

// admin
router.post("/", authMiddleware, createEvent);

// user
router.post("/:id/register", authMiddleware, registerEvent);

export default router;