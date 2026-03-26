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

// 🔹 Render Navbar
function renderNavbar() {
  if (!user) {
    navButtons.innerHTML = `
      <button onclick="goLogin()">Login</button>
    `;
  } else if (user.role === "admin") {
    navButtons.innerHTML = `
      <button onclick="goAdmin()">Dashboard</button>
      <button onclick="logout()">Logout</button>
    `;
  } else {
    navButtons.innerHTML = `
      <button onclick="logout()">Logout</button>
    `;
  }
}

// 🔹 Navigation functions (IMPORTANT FIX HERE)
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

// 🔹 Run
renderNavbar();


async function loadEvents() {
  try {
    const token = localStorage.getItem("token");

    // 🔹 Request options
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

    // 🔹 Empty state
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

      let buttonHTML = "";

      if (event.isRegistered) {
        buttonHTML = `<button class="registered" disabled>Registered</button>`;
      }
      else if (event.isFull) {
        buttonHTML = `<button class="full" disabled>Full</button>`;
      }
      else {
        buttonHTML = `<button class="register" onclick="register(${event.id}, this)">Register</button>`;
      }

      div.innerHTML = `
    <img 
      src="${imageSrc}" 
      onerror="this.onerror=null; this.src='https://via.placeholder.com/300';"
    />
    <h3>${event.title}</h3>
    <p>${event.description}</p>
    <p>Date: ${new Date(event.date).toLocaleDateString()}</p>

    ${buttonHTML}

    <p class="msg" id="msg-${event.id}"></p>
  `;

      container.appendChild(div);
    });

  } catch (err) {
    console.error("Error loading events:", err);

    const container = document.getElementById("event-list");
    container.innerHTML = "<p>Failed to load events</p>";
  }
}

// 🔹 Run
loadEvents();

async function register(eventId, btn) {
  const token = localStorage.getItem("token");
  const msgEl = document.getElementById(`msg-${eventId}`);

  msgEl.innerText = "";

  if (!token) {
    msgEl.innerText = "Please login first";
    msgEl.style.color = "red";
    return;
  }

  try {
    const res = await fetch(`http://localhost:5000/api/events/${eventId}/register`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();

    if (!res.ok) {
      // 🔥 Important: DO NOT show "Already registered" message
      if (data.message === "Already registered") {
        btn.innerText = "Registered";
        btn.disabled = true;
        btn.className = "registered";
        return;
      }

      msgEl.innerText = data.message;
      msgEl.style.color = "red";
      return;
    }

    // ✅ Success
    btn.innerText = "Registered";
    btn.disabled = true;
    btn.className = "registered";

    msgEl.innerText = "Successfully registered";
    msgEl.style.color = "green";

  } catch (err) {
    msgEl.innerText = "Something went wrong";
    msgEl.style.color = "red";
  }
}