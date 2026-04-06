import db from "../config/db.js";

export const cleanupExpiredBookings = async () => {
  try {
    const result = await db.query(`
      DELETE FROM registrations
      WHERE payment_status = 'pending'
      AND expires_at < NOW()
    `);

    // 🔥 ONLY LOG WHEN SOMETHING WAS DELETED
    if (result.rowCount > 0) {
      console.log(`🧹 Cleaned ${result.rowCount} expired bookings`);
    }

  } catch (err) {
    console.error("Cleanup error:", err);
  }
};