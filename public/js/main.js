const token = localStorage.getItem("token");
const navButtons = document.getElementById("navButtons");

// 🔹 Decode JWT
function getUser() {
  if (!token) return null;

  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

const user = getUser();

// 🔹 Navbar
function renderNavbar() {
  if (!user) {
    navButtons.innerHTML = `
    <button onclick="goBookings()">My Bookings</button>
      <button onclick="goLogin()">Login</button>
    `;
  } else {
    let buttons = `
      <button onclick="goBookings()">My Bookings</button>
    `;

    if (user.role === "admin") {
      buttons += `
        <button onclick="goAdmin()">Dashboard</button>
      `;
    }

    buttons += `
      <button onclick="logout()">Logout</button>
    `;

    navButtons.innerHTML = buttons;
  }
}

// 🔹 Navigation
function goLogin() {
  window.location.href = "/public/pages/login.html";
}

function goAdmin() {
  window.location.href = "/public/pages/admin.html";
}

function logout() {
  localStorage.removeItem("token");
  window.location.reload();
}

function goBookings() {
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "/public/pages/login.html";
  } else {
    window.location.href = "/public/pages/my-bookings.html";
  }
}

// 🔹 NEW: View Event
function viewEvent(id) {
  console.log("Redirecting to event:", id);
  window.location.href = `/public/pages/event.html?id=${id}`;
}

// 🔹 Load Events
async function loadEvents() {
  try {
    const options = {};

    if (token) {
      options.headers = {
        Authorization: `Bearer ${token}`
      };
    }

    const res = await fetch("http://localhost:5000/api/events", options);
    const events = await res.json();

    const container = document.getElementById("event-list");
    container.innerHTML = "";

    if (events.length === 0) {
      container.innerHTML = "<p>No events available</p>";
      return;
    }

    events.forEach(event => {
      const div = document.createElement("div");
      div.classList.add("event-card");

      const imageSrc =
        typeof event.image_url === "string" && event.image_url.trim() !== ""
          ? event.image_url
          : "https://via.placeholder.com/300";

      let buttonHTML = `
      <button class="view" onclick="viewEvent(${event.id})">
      View Details
      </button>
      `;

      div.innerHTML = `
        <img 
          src="${imageSrc}" 
          onerror="this.onerror=null; this.src='https://via.placeholder.com/300';"
        />
        <h3>${event.title}</h3>
        <p>${event.description.substring(0, 80)}...</p>
        <p>Date: ${new Date(event.date).toLocaleDateString()}</p>

        ${buttonHTML}

        <p class="msg" id="msg-${event.id}"></p>
      `;

      container.appendChild(div);
    });

  } catch (err) {
    console.error("Error loading events:", err);
    document.getElementById("event-list").innerHTML = "<p>Failed to load events</p>";
  }
}

// 🔹 Init
renderNavbar();
loadEvents();