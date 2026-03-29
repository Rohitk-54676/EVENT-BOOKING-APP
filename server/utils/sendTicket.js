import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "mr.darkman.only@gmail.com",
    pass: "cfabyjevflotaufy",
  },
});

export const sendTicket = async ({
  email,
  eventName,
  date,
  location,
  ticketName,
  qrImage
}) => {

  const html = `
    <h2>🎟️ Booking Confirmed</h2>
    <p><strong>Event:</strong> ${eventName}</p>
    <p><strong>Date:</strong> ${new Date(date).toLocaleString()}</p>
    <p><strong>Location:</strong> ${location}</p>
    <p><strong>Ticket:</strong> ${ticketName}</p>

    <h3>Your QR Code:</h3>
    <img src="cid:qrcode" />

    <p>Please show this QR at entry.</p>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Your Event Ticket 🎫",
    html,

    // 🔥 THIS FIXES QR ISSUE
    attachments: [
      {
        filename: "qrcode.png",
        path: qrImage,
        cid: "qrcode"
      }
    ]
  });
};