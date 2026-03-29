let editMode = false;
let editEventId = null;
const form = document.getElementById("eventForm");
const msg = document.getElementById("msg");
const ticketsContainer = document.getElementById("ticketsContainer");

// 🔹 Add Ticket Row
function addTicket() {
  const div = document.createElement("div");
  div.classList.add("ticket-row");

  div.innerHTML = `
    <input type="text" placeholder="Ticket Name (Gold / Team)" class="t-name" required />
    <input type="number" placeholder="Price" class="t-price" required />
    <input type="number" placeholder="Max Seats" class="t-max" required />
    <input type="number" placeholder="Team Size (1 for normal)" class="t-team" value="1" />
    <button type="button" onclick="this.parentElement.remove()">Remove</button>
    <br><br>
  `;

  ticketsContainer.appendChild(div);
}

// 🔹 Add one default ticket on load
addTicket();

// 🔹 Submit
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const token = localStorage.getItem("token");

  if (!token) {
    msg.innerText = "Not authorized";
    msg.style.color = "red";
    return;
  }

  // 🔹 Collect tickets
  const ticketRows = document.querySelectorAll(".ticket-row");

  const tickets = [];

  ticketRows.forEach(row => {
    const name = row.querySelector(".t-name").value;
    const price = row.querySelector(".t-price").value;
    const max = row.querySelector(".t-max").value;
    const team = row.querySelector(".t-team").value || 1;

    if (name && price && max) {
      tickets.push({
        name,
        price: Number(price),
        max_quantity: Number(max),
        team_size: Number(team)
      });
    }
  });

  if (tickets.length === 0) {
    msg.innerText = "Add at least one ticket";
    msg.style.color = "red";
    return;
  }

  const eventData = {
    title: document.getElementById("title").value,
    description: document.getElementById("description").value,
    date: document.getElementById("date").value,
    location: document.getElementById("location").value,
    image_url: document.getElementById("image").value,
    tickets
  };

  try {
    const url = editMode
      ? `http://localhost:5000/api/events/${editEventId}`
      : `http://localhost:5000/api/events`;

    const method = editMode ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(eventData)
    });

    const data = await res.json();

    if (!res.ok) {
      msg.innerText = data.message;
      msg.style.color = "red";
      return;
    }

    msg.innerText = "Event created successfully";
    msg.style.color = "green";

    form.reset();
    ticketsContainer.innerHTML = "";
    addTicket();

  } catch (err) {
    msg.innerText = "Server error";
    msg.style.color = "red";
  }
});


async function loadAdminEvents() {
  const token = localStorage.getItem("token");

  const res = await fetch("http://localhost:5000/api/events/admin/events", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const events = await res.json();

  const container = document.getElementById("adminEvents");
  container.innerHTML = "";

  events.forEach(event => {
    const div = document.createElement("div");
    div.classList.add("admin-card");

    div.innerHTML = `
  <img src="${event.image_url || 'https://via.placeholder.com/200'}" width="200"/>

  <h3>${event.title}</h3>
  <p>${new Date(event.date).toLocaleDateString()}</p>

  <button onclick="editEvent(${event.id})">Edit</button>
  <button onclick="startDelete(${event.id})">Delete</button>
  <button onclick="viewRegistrations(${event.id})">View Registrations</button>
  <button onclick="downloadExcel(${event.id})">Download Excel</button>

  <!-- 🔥 OTP BOX (per card) -->
  <div id="otp-${event.id}" style="display:none; margin-top:10px;">
    <input type="text" id="otpInput-${event.id}" placeholder="Enter OTP" />
    <button onclick="confirmDelete(${event.id})">Confirm</button>
    <button onclick="cancelDelete(${event.id})">Cancel</button>
  </div>

  <hr>
`;

    container.appendChild(div);
  });
}
loadAdminEvents();




async function editEvent(id) {
  const token = localStorage.getItem("token");

  const res = await fetch(`http://localhost:5000/api/events/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const event = await res.json();

  // 🔹 switch mode
  editMode = true;
  editEventId = id;

  // 🔹 fill form
  document.getElementById("title").value = event.title;
  document.getElementById("description").value = event.description;
  document.getElementById("date").value = event.date.split("T")[0];
  document.getElementById("location").value = event.location;
  document.getElementById("image").value = event.image_url || "";

  // 🔹 load tickets
  const container = document.getElementById("ticketsContainer");
  container.innerHTML = "";

  event.tickets.forEach(t => {
    const div = document.createElement("div");
    div.classList.add("ticket-row");

    div.innerHTML = `
      <input type="text" class="t-name" value="${t.name}" />
      <input type="number" class="t-price" value="${t.price}" />
      <input type="number" class="t-max" value="${t.max_quantity}" />
      <input type="number" class="t-team" value="${t.team_size}" />
      <button type="button" disabled style="opacity:0.5;">Cannot Remove</button>
      <br><br>
    `;

    container.appendChild(div);
  });

  window.scrollTo(0, 0);
}







async function startDelete(id) {
  const token = localStorage.getItem("token");

  await fetch(`http://localhost:5000/api/events/${id}/send-delete-otp`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  // show OTP input only for this event
  document.getElementById(`otp-${id}`).style.display = "block";
}

async function confirmDelete(id) {
  const token = localStorage.getItem("token");
  const otp = document.getElementById(`otpInput-${id}`).value;

  const res = await fetch(`http://localhost:5000/api/events/${id}/delete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ otp })
  });

  const data = await res.json();

  alert(data.message);

  if (res.ok) {
    loadAdminEvents();
  }
}

function cancelDelete(id) {
  document.getElementById(`otp-${id}`).style.display = "none";
  document.getElementById(`otpInput-${id}`).value = "";
}

function viewRegistrations(id) {
  window.location.href = `/public/pages/registrations.html?id=${id}`;
}

async function downloadExcel(id) {
  const token = localStorage.getItem("token");

  try {
    const res = await fetch(`http://localhost:5000/api/events/${id}/export`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) {
      alert("Download failed");
      return;
    }

    const blob = await res.blob();

    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `event-${id}.xlsx`;
    document.body.appendChild(a);
    a.click();

    a.remove();
    window.URL.revokeObjectURL(url);

  } catch (err) {
    console.error(err);
    alert("Error downloading file");
  }
}

function goScan() {
  window.location.href = "/public/pages/scan.html";
}