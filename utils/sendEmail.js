import nodemailer from "nodemailer";
import "dotenv/config";

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendOTP = async (email, otp) => {
  try {
    await transporter.sendMail({
      from: `"Event App" <mr.darkman.only@gmail.com>`,
      to: email, // ✅ REAL USER EMAIL (not test)
      subject: "OTP Verification",
      text: `Your OTP is ${otp}`,
    });

    console.log("OTP email sent to:", email);

  } catch (err) {
    console.error("Email Error:", err);
  }
};

export default sendOTP;