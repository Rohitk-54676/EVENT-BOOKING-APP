import db from "../config/db.js"; // your pg connection

// 🔹 CREATE EVENT (ADMIN ONLY)
export const createEvent = async (req, res) => {
  try {
    const { title, description, date, location, price, maxParticipants, image_url } = req.body;

    // basic validation
    if (!title || !date || !maxParticipants) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // role check
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admin can create events" });
    }

    const result = await db.query(
      `INSERT INTO events 
      (title, description, date, location, price, max_participants, created_by, image_url) 
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [title, description, date, location, price || 0, maxParticipants, req.user.id, image_url || null]
    );

    res.json({ message: "Event created", event: result.rows[0] });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
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


// 🔹 REGISTER FOR EVENT
export const registerEvent = async (req, res) => {
  try {
    const userId = req.user.id;
    const eventId = req.params.id;

    // 1. check event exists
    const event = await db.query("SELECT * FROM events WHERE id = $1", [eventId]);
    if (event.rows.length === 0) {
      return res.status(404).json({ message: "Event not found" });
    }

    // 2. check capacity
    const count = await db.query(
      "SELECT COUNT(*) FROM registrations WHERE event_id = $1",
      [eventId]
    );

    if (parseInt(count.rows[0].count) >= event.rows[0].max_participants) {
      return res.status(400).json({ message: "Event is full" });
    }

    // 3. insert (unique constraint handles duplicate)
    await db.query(
      "INSERT INTO registrations (user_id, event_id) VALUES ($1, $2)",
      [userId, eventId]
    );

    res.json({ message: "Registration successful" });

  } catch (err) {
    if (err.code === "23505") {
      return res.status(400).json({ message: "Already registered" });
    }

    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};