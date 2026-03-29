const token = localStorage.getItem("token");

async function loadBookings() {
  const container = document.getElementById("booking-list");

  if (!token) {
    container.innerHTML = "<p>Please login</p>";
    return;
  }

  try {
    const res = await fetch("http://localhost:5000/api/events/my-bookings", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();

    if (data.length === 0) {
      container.innerHTML = "<p>No bookings yet</p>";
      return;
    }

    container.innerHTML = "";

    data.forEach(b => {
      const div = document.createElement("div");
      div.classList.add("ticket-card");

      // 🔥 generate QR (frontend for now)
      const statusColor = {
        active: "green",
        used: "orange",
        cancelled: "red"
      };

      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${b.ticket_code}`;

      div.innerHTML = `
  <img src="${b.image_url}" width="200"/>
  <h3>${b.title}</h3>
  <p>${new Date(b.date).toLocaleDateString()}</p>
  <p>${b.location}</p>

  <p><b>Ticket:</b> ${b.ticket_name}</p>

  <p style="color:${statusColor[b.status]}">
    Status: ${b.status}
  </p>

  <img src="${qrUrl}" />

  <hr>
`;

      container.appendChild(div);
    });

  } catch (err) {
    container.innerHTML = "<p>Error loading bookings</p>";
  }
}

loadBookings();