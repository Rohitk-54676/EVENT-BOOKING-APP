import bcrypt from "bcrypt";
import pool from "../config/db.js";
import generateOTP from "../utils/generateOTP.js";
import sendOTP from "../utils/sendEmail.js";
import jwt from "jsonwebtoken";

export const register = async (req, res) => {
  await pool.query(
    "DELETE FROM otp_verifications WHERE expiry_time < NOW()"
  );
  const { email } = req.body;

  try {
    // 🔴 CHECK IF USER EXISTS
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

    const otp = generateOTP();
    const expiry = new Date(Date.now() + 5 * 60 * 1000);

    await pool.query(
      "INSERT INTO otp_verifications (email, otp, expiry_time) VALUES ($1,$2,$3)",
      [email, otp, expiry]
    );

    await sendOTP(email, otp);

    res.json({ message: "OTP sent successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


//for creating user 



export const verifyOTP = async (req, res) => {
  await pool.query(
    "DELETE FROM otp_verifications WHERE expiry_time < NOW()"
  );
  const { name, email, phone, password, otp } = req.body;

  try {
    const result = await pool.query(
      "SELECT * FROM otp_verifications WHERE email=$1 AND otp=$2",
      [email, otp]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    const record = result.rows[0];

    if (new Date() > record.expiry_time) {
      return res.status(400).json({ message: "OTP expired" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      "INSERT INTO users (name, email, phone, password, is_verified) VALUES ($1,$2,$3,$4,true)",
      [name, email, phone, hashedPassword]
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



//login page 

export const login = async (req, res) => {
  const { email, password } = req.body;

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
      { id: user.id, email: user.email, role: user.role },
      "secret123",
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



////forget password 

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

    const otp = generateOTP();
    const expiry = new Date(Date.now() + 5 * 60 * 1000);

    await pool.query(
      "INSERT INTO otp_verifications (email, otp, expiry_time) VALUES ($1,$2,$3)",
      [email, otp, expiry]
    );

    await sendOTP(email, otp);

    res.json({ message: "OTP sent for password reset" });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};



//reset pass

export const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  try {
    const result = await pool.query(
      "SELECT * FROM otp_verifications WHERE email=$1 AND otp=$2",
      [email, otp]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    const record = result.rows[0];

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