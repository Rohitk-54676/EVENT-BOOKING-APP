import bcrypt from "bcrypt";
import pool from "../config/db.js";
import generateOTP from "../utils/generateOTP.js";
import jwt from "jsonwebtoken";

/* ---------------- REGISTER ---------------- */

export const register = async (req, res) => {
  const { name, email, phone, password } = req.body;

  try {
    await pool.query(
      "DELETE FROM otp_verifications WHERE expiry_time < NOW()"
    );

    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        message: "User already exists",
        redirect: "login"
      });
    }

    await pool.query(
      "DELETE FROM otp_verifications WHERE email=$1",
      [email]
    );

    const otp = generateOTP();
    const hashedOTP = await bcrypt.hash(otp, 10);
    const hashedPassword = await bcrypt.hash(password, 10);
    const expiry = new Date(Date.now() + 5 * 60 * 1000);

    await pool.query(
      `INSERT INTO otp_verifications 
      (email, otp, expiry_time, name, phone, password, attempts) 
      VALUES ($1,$2,$3,$4,$5,$6,0)`,
      [email, hashedOTP, expiry, name, phone, hashedPassword]
    );

    // 🔥 IMPORTANT: send OTP to frontend instead of email
    res.json({
      message: "OTP generated",
      otp: otp
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ---------------- VERIFY OTP (REGISTER) ---------------- */

export const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: "Missing fields" });
  }

  try {
    await pool.query(
      "DELETE FROM otp_verifications WHERE expiry_time < NOW()"
    );

    const result = await pool.query(
      "SELECT * FROM otp_verifications WHERE email=$1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    const record = result.rows[0];

    if (record.attempts >= 3) {
      return res.status(400).json({ message: "Too many attempts" });
    }

    const isValid = await bcrypt.compare(otp, record.otp);

    if (!isValid) {
      await pool.query(
        "UPDATE otp_verifications SET attempts = attempts + 1 WHERE email=$1",
        [email]
      );
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (new Date() > record.expiry_time) {
      return res.status(400).json({ message: "OTP expired" });
    }

    await pool.query(
      "INSERT INTO users (name, email, phone, password, is_verified) VALUES ($1,$2,$3,$4,true)",
      [record.name, record.email, record.phone, record.password]
    );

    await pool.query(
      "DELETE FROM otp_verifications WHERE email=$1",
      [email]
    );

    res.json({ message: "User registered successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ---------------- LOGIN ---------------- */

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Missing credentials" });
  }

  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "User not found" });
    }

    const user = result.rows[0];

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      message: "Login successful",
      token,
      role: user.role
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ---------------- FORGOT PASSWORD ---------------- */

export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await pool.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    );

    if (user.rows.length === 0) {
      return res.status(400).json({ message: "User not found" });
    }

    await pool.query(
      "DELETE FROM otp_verifications WHERE email=$1",
      [email]
    );

    const otp = generateOTP();
    const hashedOTP = await bcrypt.hash(otp, 10);
    const expiry = new Date(Date.now() + 5 * 60 * 1000);

    await pool.query(
      `INSERT INTO otp_verifications 
      (email, otp, expiry_time, attempts) 
      VALUES ($1,$2,$3,0)`,
      [email, hashedOTP, expiry]
    );

    res.json({
      message: "OTP generated",
      otp: otp
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ---------------- RESET PASSWORD ---------------- */

export const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  try {
    const result = await pool.query(
      "SELECT * FROM otp_verifications WHERE email=$1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    const record = result.rows[0];

    if (record.attempts >= 3) {
      return res.status(400).json({ message: "Too many attempts" });
    }

    const isValid = await bcrypt.compare(otp, record.otp);

    if (!isValid) {
      await pool.query(
        "UPDATE otp_verifications SET attempts = attempts + 1 WHERE email=$1",
        [email]
      );
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (new Date() > record.expiry_time) {
      return res.status(400).json({ message: "OTP expired" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query(
      "UPDATE users SET password=$1 WHERE email=$2",
      [hashedPassword, email]
    );

    await pool.query(
      "DELETE FROM otp_verifications WHERE email=$1",
      [email]
    );

    res.json({ message: "Password reset successful" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ---------------- RESEND OTP ---------------- */

export const resendOTP = async (req, res) => {
  const { email } = req.body;

  try {
    const existing = await pool.query(
      "SELECT * FROM otp_verifications WHERE email=$1",
      [email]
    );

    if (existing.rows.length === 0) {
      return res.status(400).json({
        message: "Session expired. Please register again."
      });
    }

    const otp = generateOTP();
    const hashedOTP = await bcrypt.hash(otp, 10);
    const expiry = new Date(Date.now() + 5 * 60 * 1000);

    await pool.query(
      `UPDATE otp_verifications 
       SET otp=$1, expiry_time=$2, attempts=0 
       WHERE email=$3`,
      [hashedOTP, expiry, email]
    );

    res.json({
      message: "OTP regenerated",
      otp: otp
    });

  } catch (err) {
    console.error("RESEND OTP ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};