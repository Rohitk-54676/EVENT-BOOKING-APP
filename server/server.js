import dotenv from "dotenv";
dotenv.config();
import cors from "cors";
import express from "express";
import authRoutes from "./routes/authRoutes.js";
import { authMiddleware } from "./middleware/authMiddleware.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import contactRoute from "./routes/contactRoute.js";
const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/contact", contactRoute);
app.use("/api/payment", paymentRoutes);
import eventRoutes from "./routes/eventRoutes.js";
app.use("/api/events", eventRoutes);

import cron from "node-cron";
import { cleanupExpiredBookings } from "./utils/cleanupExpired.js";
cron.schedule("* * * * *", async () => {
  try {
    await cleanupExpiredBookings();
  } catch (err) {
    console.error("Cron error:", err);
  }
});

app.get("/", (req, res) => {
  res.send("Server working");
});
app.get("/api/protected", authMiddleware, (req, res) => {
  res.json({
    message: "You are authorized",
    user: req.user
  });
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});