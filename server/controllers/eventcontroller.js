import db from "../config/db.js"; // your pg connection
import ExcelJS from "exceljs";
import { v4 as uuidv4 } from "uuid";
import QRCode from "qrcode";
import { sendTicket } from "../utils/sendTicket.js";
// 🔹 CREATE EVENT (ADMIN ONLY)
export const createEvent = async (req, res) => {
  const client = await db.connect();

  try {
    const {
      title,
      description,
      date,
      location,
      image_url,
      tickets
    } = req.body;

    if (!title || !date || !tickets || tickets.length === 0) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admin can create events" });
    }

    await client.query("BEGIN");

    // 🔹 Insert event
    const eventResult = await client.query(
      `INSERT INTO events 
      (title, description, date, location, created_by, image_url) 
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [title, description, date, location, req.user.id, image_url || null]
    );

    const eventId = eventResult.rows[0].id;

    // 🔹 Insert tickets
    for (const t of tickets) {
      await client.query(
        `INSERT INTO event_tickets 
        (event_id, name, price, max_quantity, team_size)
        VALUES ($1,$2,$3,$4,$5)`,
        [
          eventId,
          t.name,
          t.price,
          t.max_quantity,
          t.team_size || 1
        ]
      );
    }

    await client.query("COMMIT");

    res.json({ message: "Event created successfully" });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
};


// 🔹 GET ALL EVENTS (PUBLIC)
export const getEvents = async (req, res) => {
  try {
    // 🔹 get user (if logged in)
    const userId = req.user?.id || null;

    // 🔹 get events + registration count
    const result = await db.query(`
      SELECT e.*,
             COUNT(r.id) AS registered_count
      FROM events e
      LEFT JOIN registrations r ON e.id = r.event_id
      GROUP BY e.id
      ORDER BY e.date ASC
    `);

    // 🔹 base mapping
    const events = result.rows.map(event => ({
      ...event,
      isFull: parseInt(event.registered_count) >= event.max_participants,
      isRegistered: false
    }));

    // 🔹 check if user registered
    if (userId) {
      const regRes = await db.query(
        "SELECT event_id FROM registrations WHERE user_id = $1",
        [userId]
      );

      const registeredIds = regRes.rows.map(r => r.event_id);

      events.forEach(event => {
        if (registeredIds.includes(event.id)) {
          event.isRegistered = true;
        }
      });
    }

    res.json(events);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


// 🔹 REGISTER FOR EVENT (TICKET + MEMBERS)
export const registerEvent = async (req, res) => {
  const client = await db.connect();

  try {
    const userId = req.user.id;
    const eventId = req.params.id;
    const { ticketId, members } = req.body;

    if (!ticketId) {
      return res.status(400).json({ message: "Ticket is required" });
    }

    if (!members || members.length === 0) {
      return res.status(400).json({ message: "Member details required" });
    }

    // 🔹 1. check ticket exists
    const ticketRes = await client.query(
      "SELECT * FROM event_tickets WHERE id = $1 AND event_id = $2",
      [ticketId, eventId]
    );

    if (ticketRes.rows.length === 0) {
      return res.status(404).json({ message: "Invalid ticket" });
    }

    const ticket = ticketRes.rows[0];

    // 🔹 2. check capacity
    const countRes = await client.query(
      "SELECT COUNT(*) FROM registrations WHERE ticket_id = $1",
      [ticketId]
    );

    if (parseInt(countRes.rows[0].count) >= ticket.max_quantity) {
      return res.status(400).json({ message: "Ticket is full" });
    }

    await client.query("BEGIN");
    // 🔹 3. insert registration
    const ticketCode = uuidv4();

    const regRes = await client.query(
      `INSERT INTO registrations (user_id, event_id, ticket_id, ticket_code)
   VALUES ($1, $2, $3, $4)
   RETURNING id, ticket_code`,
      [userId, eventId, ticketId, ticketCode]
    );

    const registrationId = regRes.rows[0].id;

    // 🔹 generate QR AFTER insert (clean flow)
    const savedTicketCode = regRes.rows[0].ticket_code;
    const qrImage = await QRCode.toDataURL(savedTicketCode);

    // 🔹 4. insert members
    for (const m of members) {
      await client.query(
        `INSERT INTO registration_members 
     (registration_id, name, reg_no, phone, email)
     VALUES ($1, $2, $3, $4, $5)`,
        [registrationId, m.name, m.reg_no, m.phone, m.email]
      );
    }

    await client.query("COMMIT");
    // 🔹 get event details
    const eventRes = await db.query(
      "SELECT title, date, location FROM events WHERE id=$1",
      [eventId]
    );

    // 🔹 get ticket details
    const ticketRess = await db.query(
      "SELECT name FROM event_tickets WHERE id=$1",
      [ticketId]
    );

    // 🔹 get user email
    const userRes = await db.query(
      "SELECT email FROM users WHERE id=$1",
      [userId]
    );

    const event = eventRes.rows[0];
    const tickett = ticketRess.rows[0];
    const userEmail = userRes.rows[0].email;

    // 🔥 send email
    setTimeout(() => {
      sendTicket({
        email: userEmail,
        eventName: event.title,
        date: event.date,
        location: event.location,
        ticketName: ticket.name,
        qrImage
      }).catch(err => console.error("Email error:", err));
    }, 1500);

    res.json({
      message: "Registration successful",
      ticketCode: savedTicketCode,
      qrImage
    });

  } catch (err) {
    await client.query("ROLLBACK");

    if (err.code === "23505") {
      return res.status(400).json({ message: "Already booked this ticket" });
    }

    console.error(err);
    res.status(500).json({ message: "Server error" });

  } finally {
    client.release();
  }
};
// 🔹 GET SINGLE EVENT (DETAIL PAGE)
export const getEventById = async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user?.id || null;

    const result = await db.query(`
      SELECT e.*, COUNT(r.id) AS registered_count
      FROM events e
      LEFT JOIN registrations r ON e.id = r.event_id
      WHERE e.id = $1
      GROUP BY e.id
    `, [eventId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Event not found" });
    }

    const event = result.rows[0];

    // 🔥 ADD THIS BLOCK (tickets fetch)
    const ticketsRes = await db.query(
      "SELECT * FROM event_tickets WHERE event_id = $1",
      [eventId]
    );

    const tickets = ticketsRes.rows;

    let userTickets = [];

    if (userId) {
      const reg = await db.query(
        "SELECT ticket_id FROM registrations WHERE user_id = $1 AND event_id = $2",
        [userId, eventId]
      );

      userTickets = reg.rows.map(r => r.ticket_id);
    }

    // 🔥 MODIFY RESPONSE
    res.json({
      ...event,
      tickets,
      userTickets // 🔥 IMPORTANT
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


// 🔹 GET ADMIN EVENTS
export const getAdminEvents = async (req, res) => {
  try {
    const adminId = req.user.id;

    const result = await db.query(
      "SELECT * FROM events WHERE created_by = $1 ORDER BY date DESC",
      [adminId]
    );

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};



// 🔹 GET EVENT REGISTRATIONS
export const getEventRegistrations = async (req, res) => {
  try {
    const eventId = req.params.id;

    const result = await db.query(`
      SELECT 
        t.name AS ticket_name,
        rm.name,
        rm.reg_no,
        rm.phone,
        rm.email
      FROM registrations r
      JOIN event_tickets t ON r.ticket_id = t.id
      JOIN registration_members rm ON rm.registration_id = r.id
      WHERE r.event_id = $1
      ORDER BY t.name
    `, [eventId]);

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


// / 🔹 EXPORT EVENT DATA
export const exportEventData = async (req, res) => {
  try {
    const eventId = req.params.id;

    const result = await db.query(`
      SELECT 
        e.title,
        t.name AS ticket_name,
        rm.name,
        rm.reg_no,
        rm.phone,
        rm.email
      FROM registrations r
      JOIN events e ON r.event_id = e.id
      JOIN event_tickets t ON r.ticket_id = t.id
      JOIN registration_members rm ON rm.registration_id = r.id
      WHERE e.id = $1
      ORDER BY t.name
    `, [eventId]);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Registrations");

    sheet.columns = [
      { header: "Event", key: "title", width: 20 },
      { header: "Ticket", key: "ticket_name", width: 20 },
      { header: "Name", key: "name", width: 20 },
      { header: "Reg No", key: "reg_no", width: 15 },
      { header: "Phone", key: "phone", width: 15 },
      { header: "Email", key: "email", width: 25 }
    ];

    result.rows.forEach(row => sheet.addRow(row));

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=event-data.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};



import generateOTP from "../utils/generateOTP.js";
import sendOTP from "../utils/sendEmail.js";

const otpStore = {}; // temporary (later move to DB/Redis)

// 🔹 SEND DELETE OTP
export const sendDeleteOTP = async (req, res) => {
  try {
    const adminId = req.user.id;
    const eventId = req.params.id;

    const otp = generateOTP();

    otpStore[adminId] = { otp, eventId };

    // 🔥 you already have sendEmail util
    await sendOTP(req.user.email, otp);

    res.json({ message: "OTP sent to email" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to send OTP" });
  }
};




// 🔹 VERIFY OTP & DELETE EVENT
export const deleteEventWithOTP = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { otp } = req.body;
    const eventId = req.params.id;

    const stored = otpStore[adminId];

    if (!stored || stored.otp !== otp || stored.eventId != eventId) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    await db.query("DELETE FROM events WHERE id = $1", [eventId]);

    delete otpStore[adminId];

    res.json({ message: "Event deleted successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Delete failed" });
  }
};




// 🔹 UPDATE EVENT
export const updateEvent = async (req, res) => {
  const client = await db.connect();

  try {
    const eventId = req.params.id;
    const {
      title,
      description,
      date,
      location,
      image_url,
      tickets
    } = req.body;

    await client.query("BEGIN");

    // 🔹 update event
    await client.query(
      `UPDATE events
       SET title=$1, description=$2, date=$3, location=$4, image_url=$5
       WHERE id=$6`,
      [title, description, date, location, image_url, eventId]
    );

    // 🔹 delete old tickets (safe for now)
    await client.query(
      "DELETE FROM event_tickets WHERE event_id=$1",
      [eventId]
    );

    // 🔹 insert new tickets
    for (const t of tickets) {
      await client.query(
        `INSERT INTO event_tickets (event_id, name, price, max_quantity, team_size)
         VALUES ($1,$2,$3,$4,$5)`,
        [eventId, t.name, t.price, t.max_quantity, t.team_size]
      );
    }

    await client.query("COMMIT");

    res.json({ message: "Event updated successfully" });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ message: "Update failed" });
  } finally {
    client.release();
  }
};


// 🔹 GET MY BOOKINGS
export const getMyBookings = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query(`
      SELECT 
        e.title,
        e.image_url,
        e.date,
        e.location,
        t.name AS ticket_name,
        r.ticket_code,
        r.status
      FROM registrations r
      JOIN events e ON r.event_id = e.id
      JOIN event_tickets t ON r.ticket_id = t.id
      WHERE r.user_id = $1
      ORDER BY e.date DESC
    `, [userId]);

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


// 🔹 VERIFY TICKET
export const verifyTicket = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Unauthorized" });
  }
  try {
    const { ticketCode } = req.body;

    if (!ticketCode) {
      return res.status(400).json({ message: "Ticket code required" });
    }

    const result = await db.query(
      `SELECT r.*, e.title, t.name AS ticket_name
       FROM registrations r
       JOIN events e ON r.event_id = e.id
       JOIN event_tickets t ON r.ticket_id = t.id
       WHERE r.ticket_code = $1`,
      [ticketCode]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Invalid ticket" });
    }

    const ticket = result.rows[0];

    // 🔴 Already used
    if (ticket.status === "used") {
      return res.status(400).json({ message: "Ticket already used" });
    }

    // 🔥 Mark as used
    await db.query(
      "UPDATE registrations SET status='used' WHERE ticket_code=$1",
      [ticketCode]
    );

    res.json({
      message: "Entry allowed",
      event: ticket.title,
      ticket: ticket.ticket_name
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Verification failed" });
  }
};