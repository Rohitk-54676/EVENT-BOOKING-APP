import Razorpay from "razorpay";
import crypto from "crypto";
import db from "../config/db.js";
import QRCode from "qrcode";
import { sendTicket } from "../utils/sendTicket.js";

// ✅ CREATE ORDER
export const createOrder = async (req, res) => {
    try {
        // 🔥 INIT INSIDE FUNCTION (FIX)
        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            throw new Error("Razorpay keys missing in env");
        }

        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });

        const userId = req.user.id;
        const { registrationId } = req.body;

        if (!registrationId) {
            return res.status(400).json({ message: "Registration ID required" });
        }

        // 🔹 Get registration
        const regRes = await db.query(
            `SELECT r.*, t.price 
       FROM registrations r
       JOIN event_tickets t ON r.ticket_id = t.id
       WHERE r.id = $1 AND r.user_id = $2`,
            [registrationId, userId]
        );

        if (regRes.rows.length === 0) {
            return res.status(404).json({ message: "Registration not found" });
        }

        const registration = regRes.rows[0];

        if (registration.payment_status === "paid") {
            return res.status(400).json({ message: "Already paid" });
        }

        const amount = registration.price * 100;

        // 🔹 Create order
        const order = await razorpay.orders.create({
            amount,
            currency: "INR",
            receipt: `receipt_${registrationId}`,
        });

        // 🔹 Save order ID
        await db.query(
            `UPDATE registrations 
       SET razorpay_order_id = $1 
       WHERE id = $2`,
            [order.id, registrationId]
        );

        res.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            key: process.env.RAZORPAY_KEY_ID,
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message || "Error creating order" });
    }
};


// ✅ VERIFY PAYMENT
export const verifyPayment = async (req, res) => {
    const client = await db.connect();

    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            registrationId
        } = req.body;

        // 🔴 BASIC VALIDATION
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !registrationId) {
            return res.status(400).json({ message: "Missing payment details" });
        }

        // 🔐 VERIFY SIGNATURE
        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ message: "Invalid payment signature" });
        }

        // 🔹 START TRANSACTION
        await client.query("BEGIN");

        // 🔒 LOCK REGISTRATION
        const regRes = await client.query(
            `SELECT * FROM registrations WHERE id = $1 FOR UPDATE`,
            [registrationId]
        );

        if (regRes.rows.length === 0) {
            throw new Error("Registration not found");
        }

        const registration = regRes.rows[0];

        // 🔴 ALREADY PAID CHECK
        if (registration.payment_status === "paid") {
            throw new Error("Already processed");
        }

        // ⏳ EXPIRY CHECK
        if (
            registration.expires_at &&
            new Date(registration.expires_at) < new Date()
        ) {
            throw new Error("Booking expired");
        }

        // 🔥 UPDATE STATUS
        await client.query(
            `UPDATE registrations 
             SET payment_status = 'paid',
                 status = 'active',
                 razorpay_payment_id = $1
             WHERE id = $2`,
            [razorpay_payment_id, registrationId]
        );

        // 🔹 FETCH REQUIRED DATA
        const eventRes = await client.query(
            "SELECT title, date, location FROM events WHERE id = $1",
            [registration.event_id]
        );

        const ticketRes = await client.query(
            "SELECT name FROM event_tickets WHERE id = $1",
            [registration.ticket_id]
        );

        const userRes = await client.query(
            "SELECT email FROM users WHERE id = $1",
            [registration.user_id]
        );

        const event = eventRes.rows[0];
        const ticket = ticketRes.rows[0];
        const userEmail = userRes.rows[0]?.email;

        // 🔴 FINAL VALIDATION (NO ROLLBACK HERE)
        if (!event || !ticket || !userEmail || !registration?.ticket_code) {
            throw new Error("Invalid booking data");
        }

        // ✅ COMMIT TRANSACTION
        await client.query("COMMIT");

        // ✅ SEND RESPONSE FAST
        res.json({
            message: "Payment verified & ticket confirmed",
        });

        // 🔥 BACKGROUND TASK (NON-BLOCKING)
        setImmediate(async () => {
            try {
                const qrImage = await QRCode.toDataURL(registration.ticket_code);

                await sendTicket({
                    email: userEmail,
                    eventName: event.title,
                    date: event.date,
                    location: event.location,
                    ticketName: ticket.name,
                    qrImage
                });



            } catch (err) {
                console.error("Background email error:", err.message);
            }
        });

    } catch (err) {
        try {
            await client.query("ROLLBACK");
        } catch (rollbackErr) {
            console.error("Rollback error:", rollbackErr.message);
        }

        console.error("Verify payment error:", err.message);

        res.status(500).json({
            message: err.message || "Verification failed"
        });

    } finally {
        client.release();
    }
};


export const deleteFailedRegistration = async (req, res) => {
    try {
        const { registrationId } = req.body;

        await db.query(
            "DELETE FROM registrations WHERE id = $1",
            [registrationId]
        );

        res.json({ message: "Deleted failed booking" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Delete failed" });
    }
};

// ✅ FREE BOOKING CONFIRM (price = 0, skip Razorpay entirely)
export const confirmFreeBooking = async (req, res) => {
    const client = await db.connect();
 
    try {
        const userId         = req.user.id;
        const { registrationId } = req.body;
 
        if (!registrationId) {
            return res.status(400).json({ message: "Registration ID required" });
        }
 
        // ── BEGIN TRANSACTION ──
        await client.query("BEGIN");
 
        // ── LOCK the registration row ──
        const regRes = await client.query(
            `SELECT r.*, t.price, t.name AS ticket_name,
                    e.title AS event_title, e.date AS event_date, e.location
             FROM registrations r
             JOIN event_tickets t ON r.ticket_id = t.id
             JOIN events        e ON r.event_id  = e.id
             WHERE r.id = $1 AND r.user_id = $2
             FOR UPDATE`,
            [registrationId, userId]
        );
 
        if (regRes.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ message: "Registration not found" });
        }
 
        const registration = regRes.rows[0];
 
        // ── Guard: ticket must actually be free ──
        if (parseFloat(registration.price) > 0) {
            await client.query("ROLLBACK");
            return res.status(400).json({
                message: "This ticket requires payment. Please use the payment flow."
            });
        }
 
        // ── Guard: already confirmed ──
        if (registration.payment_status === "paid") {
            await client.query("ROLLBACK");
            return res.status(400).json({ message: "Already confirmed" });
        }
 
        // ── Guard: booking expired ──
        if (
            registration.expires_at &&
            new Date(registration.expires_at) < new Date()
        ) {
            await client.query("ROLLBACK");
            return res.status(400).json({ message: "Booking expired. Please register again." });
        }
 
        // ── Mark as paid / active (mirrors verifyPayment exactly) ──
        await client.query(
            `UPDATE registrations
             SET payment_status      = 'paid',
                 status              = 'active',
                 razorpay_payment_id = $1
             WHERE id = $2`,
            [`FREE-${registrationId}-${Date.now()}`, registrationId]
        );
 
        // ── Fetch user email (same pattern as verifyPayment) ──
        const userRes = await client.query(
            "SELECT email FROM users WHERE id = $1",
            [userId]
        );
        const userEmail = userRes.rows[0]?.email;
 
        // ── Validate we have everything before committing ──
        if (!userEmail || !registration.ticket_code) {
            throw new Error("Invalid booking data — missing email or ticket code");
        }
 
        // ── COMMIT ──
        await client.query("COMMIT");
 
        // ── Send response immediately ──
        res.json({ message: "Booking confirmed! Check your email for the ticket." });
 
        // ── Background: generate QR & send ticket email (identical to verifyPayment) ──
        setImmediate(async () => {
            try {
                const qrImage = await QRCode.toDataURL(registration.ticket_code);
 
                await sendTicket({
                    email:      userEmail,
                    eventName:  registration.event_title,
                    date:       registration.event_date,
                    location:   registration.location,
                    ticketName: registration.ticket_name,
                    qrImage,
                });
 
 
            } catch (err) {
                console.error("Free booking email error:", err.message);
            }
        });
 
    } catch (err) {
        try { await client.query("ROLLBACK"); } catch (_) {}
 
        console.error("confirmFreeBooking error:", err.message);
        res.status(500).json({ message: err.message || "Booking failed" });
 
    } finally {
        client.release();
    }
};
 