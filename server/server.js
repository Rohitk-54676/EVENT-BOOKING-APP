import cors from "cors";
import express from "express";
import authRoutes from "./routes/authRoutes.js";
import { authMiddleware } from "./middleware/authMiddleware.js";
import dotenv from "dotenv";
dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);

import eventRoutes from "./routes/eventRoutes.js";
app.use("/api/events", eventRoutes);


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