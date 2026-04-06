/* ══════════════════════════════════════════
   REGISTRATIONS.JS — All original logic
   preserved. Navbar + logout added.
══════════════════════════════════════════ */

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

const token   = localStorage.getItem("token");
const params  = new URLSearchParams(window.location.search);
const eventId = params.get("id");

let allData = [];

async function loadData() {
  const loadingState = document.getElementById("loadingState");
  const errorState   = document.getElementById("errorState");
  const emptyState   = document.getElementById("emptyState");
  const regTable     = document.getElementById("regTable");
  const statsBar     = document.getElementById("statsBar");

  loadingState.classList.remove("hidden");
  errorState.classList.add("hidden");
  emptyState.classList.add("hidden");
  regTable.classList.add("hidden");
  statsBar.style.display = "none";

  try {
    const res = await fetch(
      `/api/events/${eventId}/registrations`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!res.ok) throw new Error("Failed to fetch registrations");

    const data = await res.json();
    allData = data;

    loadingState.classList.add("hidden");

    if (!data || data.length === 0) {
      emptyState.classList.remove("hidden");
      return;
    }

    document.getElementById("totalCount").textContent = data.length;
    const uniqueTickets = new Set(data.map(r => r.ticket_name)).size;
    document.getElementById("ticketCount").textContent = uniqueTickets;

    statsBar.style.display = "grid";

    document.getElementById("eventSubtitle").textContent =
      `${data.length} registration${data.length !== 1 ? "s" : ""} found`;

    renderTable(data);

  } catch (err) {
    console.error("Load error:", err);
    loadingState.classList.add("hidden");
    errorState.classList.remove("hidden");
    document.getElementById("errorMsg").textContent =
      err.message || "Failed to load data";
  }
}

function renderTable(data) {
  const tbody    = document.getElementById("data");
  const regTable = document.getElementById("regTable");
  const emptyState = document.getElementById("emptyState");

  tbody.innerHTML = "";

  if (!data || data.length === 0) {
    regTable.classList.add("hidden");
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");

  data.forEach((row, index) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td data-label="#"><span class="sno">${index + 1}</span></td>
      <td data-label="Ticket"><span class="ticket-badge">${row.ticket_name}</span></td>
      <td data-label="Name"><span class="member-name">${row.name}</span></td>
      <td data-label="Reg No"><span class="member-reg">${row.reg_no}</span></td>
      <td data-label="Phone"><span class="member-contact">${row.phone}</span></td>
      <td data-label="Email"><span class="member-contact">${row.email}</span></td>
    `;

    tr.style.animation = `fadeUp 0.4s ease-out ${index * 0.03}s both`;
    tbody.appendChild(tr);
  });

  regTable.classList.remove("hidden");
}

/* ── Search filter ── */
document.getElementById("searchInput").addEventListener("input", function () {
  const query      = this.value.toLowerCase().trim();
  const emptyState = document.getElementById("emptyState");

  if (!query) {
    renderTable(allData);
    return;
  }

  const filtered = allData.filter(row =>
    row.name.toLowerCase().includes(query)        ||
    row.reg_no.toLowerCase().includes(query)      ||
    row.email.toLowerCase().includes(query)       ||
    row.phone.includes(query)                     ||
    row.ticket_name.toLowerCase().includes(query)
  );

  if (filtered.length === 0) {
    document.getElementById("data").innerHTML = "";
    document.getElementById("regTable").classList.add("hidden");
    emptyState.classList.remove("hidden");
    emptyState.querySelector("p").textContent = "No matching results";
  } else {
    emptyState.classList.add("hidden");
    renderTable(filtered);
  }
});

/* ── Export Excel (reuse from admin.js) ── */
async function downloadExcel() {
  const res  = await fetch(`/api/events/${eventId}/export`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const blob = await res.blob();
  const url  = window.URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `registrations-event-${eventId}.xlsx`;
  a.click();
  window.URL.revokeObjectURL(url);
}

loadData();