import express from "express";
import {getAllMessages,createContactMessage } from "../controllers/contactController.js";

const router = express.Router();
router.post("/", createContactMessage);
router.get("/", getAllMessages);

export default router;