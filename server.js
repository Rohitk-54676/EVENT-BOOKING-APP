import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// Routes
import authRoutes from "./routes/authRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import contactRoute from "./routes/contactRoute.js";

// Middleware
import { authMiddleware } from "./middleware/authMiddleware.js";

// Utils
import cron from "node-cron";
import { cleanupExpiredBookings } from "./utils/cleanupExpired.js";

const app = express();

/* ===================== PATH FIX ===================== */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ===================== MIDDLEWARE ===================== */
app.use(cors({
  origin: "*", // later restrict in production
}));

app.use(express.json());

/* ===================== STATIC FILES ===================== */
app.use(express.static(path.join(__dirname, "public")));

/* ===================== API ROUTES ===================== */
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/contact", contactRoute);

/* ===================== CRON JOB ===================== */
cron.schedule("* * * * *", async () => {
  try {
    await cleanupExpiredBookings();
  } catch (err) {
    console.error("Cron error:", err);
  }
});

/* ===================== MAIN ROUTES ===================== */

// Homepage
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/pages/index.html"));
});

// Protected route (test)
app.get("/api/protected", authMiddleware, (req, res) => {
  res.json({
    message: "You are authorized",
    user: req.user
  });
});

/* ===================== SERVER START ===================== */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});