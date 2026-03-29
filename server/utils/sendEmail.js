import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "mr.darkman.only@gmail.com",
    pass: "cfabyjevflotaufy",
  },
});

const sendOTP = async (email, otp) => {
  await transporter.sendMail({
    from: "mr.darkman.only@gmail.com",
    to: email,
    subject: "OTP Verification",
    text: `Your OTP is ${otp}`,
  });
};

export default sendOTP;