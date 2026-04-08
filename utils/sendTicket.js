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

export const sendTicket = async ({
  email,
  eventName,
  date,
  location,
  ticketName,
  qrImage,
}) => {
  try {
    const base64Data = qrImage.replace(/^data:image\/png;base64,/, "");

    const html = `
      <h2>🎟️ Booking Confirmed</h2>
      <p><strong>Event:</strong> ${eventName}</p>
      <p><strong>Date:</strong> ${new Date(date).toLocaleString()}</p>
      <p><strong>Location:</strong> ${location}</p>
      <p><strong>Ticket:</strong> ${ticketName}</p>

      <h3>Your QR Code:</h3>
      <img src="cid:qrcode" style="width:200px;height:200px;" />

      <p>Please show this QR at entry.</p>
    `;

    await transporter.sendMail({
      from: `"Event App" <mr.darkman.only@gmail.com>`,
      to: email, // ✅ REAL USER
      subject: "Your Event Ticket 🎫",
      html,
      attachments: [
        {
          filename: "qrcode.png",
          content: base64Data,
          encoding: "base64",
          cid: "qrcode", // 🔥 THIS is key
        },
      ],
    });

    console.log("Ticket email sent to:", email);

  } catch (err) {
    console.error("Ticket Email Error:", err);
  }
};