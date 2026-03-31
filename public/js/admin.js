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
    <input type="hidden" class="t-id" value="" />   <!-- 🔥 IMPORTANT -->

    <input type="text" placeholder="Ticket Name" class="t-name" required />
    <input type="number" placeholder="Price" class="t-price" required />
    <input type="number" placeholder="Max Seats" class="t-max" required />
    <input type="number" placeholder="Team Size" class="t-team" value="1" />

    <button type="button" onclick="this.parentElement.remove()">Remove</button>
    <br><br>
  `;

  ticketsContainer.appendChild(div);
}

// 🔹 Default row
addTicket();

// 🔹 SUBMIT FORM
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const token = localStorage.getItem("token");

  if (!token) {
    msg.innerText = "Not authorized";
    msg.style.color = "red";
    return;
  }

  const ticketRows = document.querySelectorAll(".ticket-row");
  const tickets = [];

  ticketRows.forEach(row => {
    const id = row.querySelector(".t-id")?.value;

    const name = row.querySelector(".t-name").value;
    const price = row.querySelector(".t-price").value;
    const max = row.querySelector(".t-max").value;
    const team = row.querySelector(".t-team").value || 1;

    if (name && price && max) {
      tickets.push({
        id: id ? Number(id) : null,   // 🔥 CRITICAL FIX
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

    msg.innerText = editMode ? "Event updated successfully" : "Event created successfully";
    msg.style.color = "green";

    form.reset();
    ticketsContainer.innerHTML = "";
    addTicket();

    editMode = false;
    editEventId = null;

    loadAdminEvents();

  } catch (err) {
    msg.innerText = "Server error";
    msg.style.color = "red";
  }
});

// 🔹 LOAD ADMIN EVENTS
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

      <button class="edit-btn" onclick="editEvent(${event.id})">Edit</button>
      <button class="delete-btn" onclick="startDelete(${event.id})">Delete</button>
      <button onclick="viewRegistrations(${event.id})">View Registrations</button>
      <button onclick="downloadExcel(${event.id})">Download Excel</button>

      <p class="status-text"></p>

      <div id="otp-${event.id}" style="display:none; margin-top:10px;">
        <input type="text" id="otpInput-${event.id}" placeholder="Enter OTP" />
        <button onclick="confirmDelete(${event.id})">Confirm</button>
        <button onclick="cancelDelete(${event.id})">Cancel</button>
      </div>

      <hr>
    `;

    const editBtn = div.querySelector(".edit-btn");
    const deleteBtn = div.querySelector(".delete-btn");
    const statusText = div.querySelector(".status-text");

    if (event.is_deleted) {
      editBtn.disabled = true;
      deleteBtn.disabled = true;

      statusText.innerText = "Event Deleted ❌";
      statusText.style.color = "red";
    }

    container.appendChild(div);
  });
}
loadAdminEvents();

// 🔹 EDIT EVENT
async function editEvent(id) {
  const token = localStorage.getItem("token");

  const res = await fetch(`http://localhost:5000/api/events/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const event = await res.json();

  editMode = true;
  editEventId = id;

  document.getElementById("title").value = event.title;
  document.getElementById("description").value = event.description;
  document.getElementById("date").value = event.date.split("T")[0];
  document.getElementById("location").value = event.location;
  document.getElementById("image").value = event.image_url || "";

  const container = document.getElementById("ticketsContainer");
  container.innerHTML = "";

  event.tickets.forEach(t => {
    const div = document.createElement("div");
    div.classList.add("ticket-row");

    div.innerHTML = `
      <input type="hidden" class="t-id" value="${t.id}" />

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

// 🔹 DELETE FLOW
async function startDelete(id) {
  const token = localStorage.getItem("token");

  await fetch(`http://localhost:5000/api/events/${id}/send-delete-otp`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }
  });

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

  if (res.ok) loadAdminEvents();
}

function cancelDelete(id) {
  document.getElementById(`otp-${id}`).style.display = "none";
}

// 🔹 NAVIGATION
function viewRegistrations(id) {
  window.location.href = `/public/pages/registrations.html?id=${id}`;
}

async function downloadExcel(id) {
  const token = localStorage.getItem("token");

  const res = await fetch(`http://localhost:5000/api/events/${id}/export`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `event-${id}.xlsx`;
  a.click();

  window.URL.revokeObjectURL(url);
}

function goScan() {
  window.location.href = "/public/pages/scan.html";
}