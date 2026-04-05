// controllers/contactController.js

import db from "../config/db.js";

/* ══════════════════════════════════════════
   POST /api/contact
══════════════════════════════════════════ */
export const createContactMessage = async (req, res) => {
  const { name, email, subject, category, message } = req.body;

  /* ── Validation ── */
  if (!name || name.trim().length < 2) {
    return res.status(400).json({ message: "Name is required (min 2 chars)" });
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ message: "Valid email is required" });
  }

  if (!subject || subject.trim().length < 3) {
    return res.status(400).json({ message: "Subject must be at least 3 characters" });
  }

  if (!message || message.trim().length < 10) {
    return res.status(400).json({ message: "Message must be at least 10 characters" });
  }

  try {
    /* ── Insert into DB (PostgreSQL) ── */
    await db.query(
      `INSERT INTO contact_messages 
       (name, email, subject, category, message, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        name.trim(),
        email.trim().toLowerCase(),
        subject.trim(),
        category || "general",
        message.trim(),
      ]
    );

    return res.status(200).json({
      message: "Message received. We'll get back to you soon.",
    });

  } catch (err) {
    console.error("CONTACT CONTROLLER ERROR:", err);
    return res.status(500).json({
      message: "Server error. Please try again later.",
    });
  }
};

export const getAllMessages = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM contact_messages ORDER BY created_at DESC`
    );

    return res.status(200).json(result.rows);

  } catch (err) {
    console.error("FETCH CONTACT ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
};