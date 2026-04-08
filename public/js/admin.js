/* ══════════════════════════════════════════
   ADMIN.JS — All original logic preserved.
   Navbar init + logout added on top.
══════════════════════════════════════════ */

/* ── Navbar scroll ── */
document.addEventListener("DOMContentLoaded", () => {
  const navbar = document.getElementById("navbar");
  if (navbar) {
    window.addEventListener("scroll", () =>
      navbar.classList.toggle("scrolled", window.scrollY > 20)
    );
  }
});

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  window.location.href = "/pages/login.html";
}

/* ════════════════════════════════════════
   YOUR ORIGINAL CODE BELOW — UNCHANGED
════════════════════════════════════════ */

let editMode = false;
let editEventId = null;

const form             = document.getElementById("eventForm");
const msg              = document.getElementById("msg");
const ticketsContainer = document.getElementById("ticketsContainer");
const formTitle        = document.getElementById("formTitle");
const editBadge        = document.getElementById("editBadge");
const submitBtn        = document.getElementById("submitBtn");
const cancelEditBtn    = document.getElementById("cancelEditBtn");

function addTicket(data) {
  const div = document.createElement("div");
  div.classList.add("ticket-row");

  const id       = data ? data.id       : "";
  const name     = data ? data.name     : "";
  const price    = data ? data.price    : "";
  const max      = data ? data.max_quantity : "";
  const team     = data ? data.team_size : 1;
  const disabled = data ? true : false;

  div.innerHTML = `
    <input type="hidden" class="t-id" value="${id}" />
    <input type="text"   placeholder="Ticket Name" class="t-name"  value="${name}"  required />
    <input type="number" placeholder="Price (₹)"   class="t-price" value="${price}" required min="0" />
    <input type="number" placeholder="Max Seats"   class="t-max"   value="${max}"   required min="1" />
    <input type="number" placeholder="Team Size"   class="t-team"  value="${team}"  min="1" />
    <button type="button" class="remove-ticket-btn"
      ${disabled ? "disabled" : ""}
      onclick="this.parentElement.remove()">
      <i class="fas fa-trash"></i>
    </button>
  `;

  ticketsContainer.appendChild(div);
}

addTicket();

function cancelEdit() {
  editMode    = false;
  editEventId = null;
  form.reset();
  ticketsContainer.innerHTML = "";
  addTicket();
  formTitle.textContent       = "Create Event";
  editBadge.classList.add("hidden");
  submitBtn.innerHTML         = '<i class="fas fa-rocket"></i> Create Event';
  cancelEditBtn.classList.add("hidden");
  msg.textContent             = "";
  msg.className               = "form-msg";
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const token = localStorage.getItem("token");

  if (!token) {
    msg.textContent = "Not authorized";
    msg.className   = "form-msg error";
    return;
  }

  const ticketRows = document.querySelectorAll(".ticket-row");
  const tickets    = [];

  ticketRows.forEach(row => {
    const id    = row.querySelector(".t-id")?.value;
    const name  = row.querySelector(".t-name").value;
    const price = row.querySelector(".t-price").value;
    const max   = row.querySelector(".t-max").value;
    const team  = row.querySelector(".t-team").value || 1;

    if (name && price !== "" && max) {
      tickets.push({
        id:           id ? Number(id) : null,
        name,
        price:        Number(price),
        max_quantity: Number(max),
        team_size:    Number(team),
      });
    }
  });

  if (tickets.length === 0) {
    msg.textContent = "Add at least one ticket";
    msg.className   = "form-msg error";
    return;
  }

  const eventData = {
    title:       document.getElementById("title").value,
    description: document.getElementById("description").value,
    date:        document.getElementById("date").value,
    location:    document.getElementById("location").value,
    image_url:   document.getElementById("image").value,
    tickets,
  };

  submitBtn.disabled  = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving…';

  try {
    const url    = editMode
      ? `/api/events/${editEventId}`
      : `/api/events`;
    const method = editMode ? "PUT" : "POST";

    const res  = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(eventData),
    });

    const data = await res.json();

    if (!res.ok) {
      msg.textContent = data.message;
      msg.className   = "form-msg error";
      submitBtn.disabled  = false;
      submitBtn.innerHTML = editMode
        ? '<i class="fas fa-save"></i> Update Event'
        : '<i class="fas fa-rocket"></i> Create Event';
      return;
    }

    msg.textContent = editMode ? "✅ Event updated!" : "✅ Event created!";
    msg.className   = "form-msg success";

    cancelEdit();
    loadAdminEvents();

  } catch (err) {
    msg.textContent     = "Server error";
    msg.className       = "form-msg error";
    submitBtn.disabled  = false;
    submitBtn.innerHTML = '<i class="fas fa-rocket"></i> Create Event';
  }
});

async function loadAdminEvents() {
  const token     = localStorage.getItem("token");
  const container = document.getElementById("adminEvents");
  const badge     = document.getElementById("eventsCountBadge");

  container.innerHTML = `
    <div class="state-box" style="grid-column:1/-1">
      <div class="state-spinner"></div>
      <p>Loading events…</p>
    </div>`;

  try {
    const res    = await fetch("/api/events/admin/events", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const events = await res.json();
    container.innerHTML = "";

    if (badge) badge.textContent = `${events.length} event${events.length !== 1 ? "s" : ""}`;

    if (events.length === 0) {
      container.innerHTML = `
        <div class="state-box" style="grid-column:1/-1">
          <div class="state-icon">📅</div>
          <h3>No Events Yet</h3>
          <p>Create your first event above!</p>
        </div>`;
      return;
    }

    events.forEach((event, i) => {
      const div = document.createElement("div");
      div.classList.add("admin-card");
      if (event.is_deleted) div.classList.add("deleted");
      div.style.animationDelay = `${i * 0.07}s`;
      div.style.position = "relative";

      const imgSrc = event.image_url ||
        "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400";

      div.innerHTML = `
        <div class="card-image-wrapper">
          <img src="${imgSrc}" class="card-image" alt="${event.title}"
               onerror="this.src='https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400'" />
          <div class="card-image-overlay"></div>
        </div>
        <div class="card-body">
          <h3>${event.title}</h3>
          <div class="card-meta">
            <span><i class="fas fa-calendar"></i>${new Date(event.date).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</span>
            <span><i class="fas fa-map-marker-alt"></i>${event.location || "TBD"}</span>
          </div>
          <span class="card-status ${event.is_deleted ? "deleted-status" : "active"}">
            ${event.is_deleted ? "❌ Deleted" : "✅ Active"}
          </span>
          <div class="card-actions">
            <button class="btn-edit" onclick="editEvent(${event.id})" ${event.is_deleted ? "disabled" : ""}>
              <i class="fas fa-pen"></i> Edit
            </button>
            <button class="btn-delete" onclick="startDelete(${event.id})" ${event.is_deleted ? "disabled" : ""}>
              <i class="fas fa-trash"></i> Delete
            </button>
            <button class="btn-view" onclick="viewRegistrations(${event.id})">
              <i class="fas fa-users"></i> Registrations
            </button>
            <button class="btn-download" onclick="downloadExcel(${event.id})">
              <i class="fas fa-file-excel"></i> Export
            </button>
          </div>
          <div id="otp-${event.id}" class="otp-section" style="display:none;">
            <input type="text" id="otpInput-${event.id}" placeholder="Enter OTP" />
            <button class="otp-confirm" onclick="confirmDelete(${event.id})">Confirm</button>
            <button class="otp-cancel"  onclick="cancelDelete(${event.id})">Cancel</button>
          </div>
        </div>
      `;

      container.appendChild(div);
    });

  } catch (err) {
    container.innerHTML = `
      <div class="state-box" style="grid-column:1/-1">
        <div class="state-icon">⚠️</div>
        <h3>Error Loading Events</h3>
        <p>${err.message}</p>
      </div>`;
  }
}

loadAdminEvents();

async function editEvent(id) {
  const token = localStorage.getItem("token");
  const res   = await fetch(`/api/events/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const event = await res.json();

  editMode    = true;
  editEventId = id;

  document.getElementById("title").value       = event.title;
  document.getElementById("description").value = event.description;
  document.getElementById("date").value        = event.date.split("T")[0];
  document.getElementById("location").value    = event.location;
  document.getElementById("image").value       = event.image_url || "";

  ticketsContainer.innerHTML = "";
  event.tickets.forEach(t => addTicket(t));

  formTitle.textContent       = "Edit Event";
  editBadge.classList.remove("hidden");
  submitBtn.innerHTML         = '<i class="fas fa-save"></i> Update Event';
  cancelEditBtn.classList.remove("hidden");

  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function startDelete(id) {
  const token = localStorage.getItem("token");

  const res = await fetch(`/api/events/${id}/send-delete-otp`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();

  if (!res.ok) {
    return alert(data.message || "Failed to send OTP");
  }

  // 🔥 SEND EMAIL USING EMAILJS
  try {
    await emailjs.send(
      "service_2qmrv2n",
      "template_21nmnv6", // ⚠️ same OTP template
      {
        to_email: data.email,
        otp: data.otp,
      }
    );
  } catch (err) {
    console.error("Delete OTP email failed:", err);
    alert("OTP generated but email failed");
    return;
  }

  // show input UI
  document.getElementById(`otp-${id}`).style.display = "flex";
}

async function confirmDelete(id) {
  const token = localStorage.getItem("token");
  const otp   = document.getElementById(`otpInput-${id}`).value;

  const res  = await fetch(`/api/events/${id}/delete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ otp }),
  });

  const data = await res.json();
  alert(data.message);
  if (res.ok) loadAdminEvents();
}

function cancelDelete(id) {
  document.getElementById(`otp-${id}`).style.display = "none";
}

function viewRegistrations(id) {
  window.location.href = `/pages/registrations.html?id=${id}`;
}

async function downloadExcel(id) {
  const token = localStorage.getItem("token");
  const res   = await fetch(`/api/events/${id}/export`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const blob = await res.blob();
  const url  = window.URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `event-${id}.xlsx`;
  a.click();
  window.URL.revokeObjectURL(url);
}

function goScan() {
  window.location.href = "/pages/scan.html";
}