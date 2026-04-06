const token = localStorage.getItem("token");

/* ══════════════════════════════════════════
   SVG ICONS
══════════════════════════════════════════ */
const icons = {
  calendar: `<svg class="icon icon-calendar" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
  location: `<svg class="icon icon-location" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
  ticket:   `<svg class="icon icon-ticket" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9a3 3 0 013-3h14a3 3 0 013 3"/><path d="M2 15a3 3 0 003 3h14a3 3 0 003-3"/><path d="M2 9a3 3 0 003 3h14a3 3 0 003-3"/><path d="M2 15a3 3 0 013-3h14a3 3 0 013 3"/></svg>`,
  qr:       `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="8" height="8" rx="1"/><rect x="14" y="2" width="8" height="8" rx="1"/><rect x="2" y="14" width="8" height="8" rx="1"/><path d="M14 14h2v2h-2z"/><path d="M20 14h2v2h-2z"/><path d="M14 20h2v2h-2z"/><path d="M20 20h2v2h-2z"/><path d="M17 17h2v2h-2z"/></svg>`,
  rotate:   `<svg style="width:13px;height:13px;stroke:currentColor;fill:none;stroke-width:2" viewBox="0 0 24 24"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/></svg>`,
};

const statusLabels = { active:"Active", used:"Used", cancelled:"Cancelled" };

let allBookings = [];
let activeFilter = "all";

/* ══════════════════════════════════════════
   NAVBAR
══════════════════════════════════════════ */
function initNavbar() {
  const navbar    = document.getElementById("navbar");
  const hamburger = document.getElementById("hamburger");
  const mobileMenu= document.getElementById("mobileMenu");

  window.addEventListener("scroll", () => {
    navbar.classList.toggle("scrolled", window.scrollY > 20);
  });

  if (hamburger) {
    hamburger.addEventListener("click", () => {
      hamburger.classList.toggle("open");
      mobileMenu.classList.toggle("open");
    });
    document.addEventListener("click", (e) => {
      if (!navbar.contains(e.target) && !mobileMenu.contains(e.target)) {
        hamburger.classList.remove("open");
        mobileMenu.classList.remove("open");
      }
    });
  }
}

/* ══════════════════════════════════════════
   USER AREA
══════════════════════════════════════════ */
function initUserArea() {
  const area       = document.getElementById("userArea");
  const mobileAuth = document.getElementById("mobileAuth");

  if (!token) {
    area.innerHTML = `
      <a href="/pages/login.html"    class="btn-nav">Login</a>
      <a href="/pages/register.html" class="btn-nav filled">Register</a>
    `;
    if (mobileAuth) mobileAuth.innerHTML = `
      <a href="/pages/login.html"    class="btn-nav" style="flex:1;text-align:center">Login</a>
      <a href="/pages/register.html" class="btn-nav filled" style="flex:1;text-align:center">Register</a>
    `;
    return;
  }

  let user = null;
  try { user = JSON.parse(atob(token.split(".")[1])); } catch {}

  area.innerHTML = `
    <span style="font-size:.84rem;color:var(--muted-lt)">Hi, ${user?.name?.split(" ")[0] || "there"} 👋</span>
    <button class="btn-nav" onclick="logout()">Logout</button>
  `;
  if (mobileAuth) mobileAuth.innerHTML = `
    <button class="btn-nav" onclick="logout()" style="flex:1;text-align:center">Logout</button>
  `;
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  window.location.href = "/pages/login.html";
}

/* ══════════════════════════════════════════
   FILTER TABS
══════════════════════════════════════════ */
function initFilters() {
  document.getElementById("filterRow").addEventListener("click", (e) => {
    const tab = e.target.closest(".ftab");
    if (!tab) return;
    document.querySelectorAll(".ftab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    activeFilter = tab.dataset.filter;
    renderGrid(activeFilter === "all"
      ? allBookings
      : allBookings.filter(b => b.status === activeFilter));
  });
}

/* ══════════════════════════════════════════
   STATS
══════════════════════════════════════════ */
function updateStats(bookings) {
  const statsEl = document.getElementById("bookingStats");
  if (!statsEl) return;

  statsEl.style.display = "grid";
  document.getElementById("filterRow").style.display = "flex";

  document.getElementById("statTotal").textContent     = bookings.length;
  document.getElementById("statActive").textContent    = bookings.filter(b => b.status === "active").length;
  document.getElementById("statUsed").textContent      = bookings.filter(b => b.status === "used").length;
  document.getElementById("statCancelled").textContent = bookings.filter(b => b.status === "cancelled").length;
}

/* ══════════════════════════════════════════
   FORMAT DATE  (your original)
══════════════════════════════════════════ */
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    weekday:"short", month:"short", day:"numeric", year:"numeric"
  });
}

/* ══════════════════════════════════════════
   BUILD TICKET CARD  (your original logic, restyled)
══════════════════════════════════════════ */
function createTicketCard(b, index) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(b.ticket_code)}`;

  const card = document.createElement("div");
  card.classList.add("ticket-perspective");
  card.style.animationDelay = `${index * 80}ms`;
  card.dataset.status = b.status;

  card.innerHTML = `
    <div class="ticket-inner">

      <!-- ── FRONT ── -->
      <div class="ticket-face ticket-front">
        <div class="ticket-image-wrapper">
          <img
            src="${b.image_url || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80"}"
            alt="${b.title}"
            onerror="this.src='https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80'"
          />
          <div class="ticket-image-overlay"></div>
          <span class="status-badge status-${b.status}">${statusLabels[b.status] || b.status}</span>
        </div>

        <div class="ticket-tear"></div>

        <div class="ticket-content">
          <h3>${b.title}</h3>
          <div class="ticket-detail">${icons.calendar}<span>${formatDate(b.date)}</span></div>
          <div class="ticket-detail">${icons.location}<span>${b.location || "Venue TBA"}</span></div>
          <div class="ticket-detail">${icons.ticket}<span>${b.ticket_name || "General"}</span></div>
          <div class="ticket-flip-hint">${icons.qr}<span>Tap to view QR code &nbsp;${icons.rotate}</span></div>
        </div>
      </div>

      <!-- ── BACK ── -->
      <div class="ticket-face ticket-back">
        <p class="back-title">${b.title}</p>
        <div class="qr-wrapper">
          <img src="${qrUrl}" alt="QR Code" loading="lazy" />
        </div>
        <p class="ticket-code-text">${b.ticket_code}</p>
        <p class="flip-hint">${icons.rotate}&nbsp; Tap to flip back</p>
      </div>

    </div>
  `;

  // Flip on click — your original logic
  card.addEventListener("click", () => {
    card.querySelector(".ticket-inner").classList.toggle("flipped");
  });

  return card;
}

/* ══════════════════════════════════════════
   RENDER GRID
══════════════════════════════════════════ */
function renderGrid(bookings) {
  const container = document.getElementById("booking-list");
  container.innerHTML = "";

  if (!bookings.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🎫</div>
        <h2>No tickets found</h2>
        <p>No bookings match this filter</p>
      </div>`;
    return;
  }

  const grid = document.createElement("div");
  grid.classList.add("ticket-grid");
  bookings.forEach((b, i) => grid.appendChild(createTicketCard(b, i)));
  container.appendChild(grid);
}

/* ══════════════════════════════════════════
   LOAD BOOKINGS  (your original API call)
══════════════════════════════════════════ */
async function loadBookings() {
  const container = document.getElementById("booking-list");

  if (!token) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔐</div>
        <h2>Please Log In</h2>
        <p>Sign in to view your event tickets</p>
        <a href="/pages/login.html" class="btn-empty">Login Now</a>
      </div>`;
    return;
  }

  container.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      <p>Loading your tickets…</p>
    </div>`;

  try {
    const res = await fetch("/api/events/my-bookings", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🎫</div>
          <h2>No Bookings Yet</h2>
          <p>You haven't booked any events. Go discover something amazing!</p>
          <a href="/pages/list-events.html" class="btn-empty">Browse Events</a>
        </div>`;
      return;
    }

    allBookings = data;
    updateStats(data);
    renderGrid(data);

  } catch (err) {
    console.error(err);
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <h2>Something went wrong</h2>
        <p>Could not connect to the server. Please try again.</p>
      </div>`;
  }
}

/* ══════════════════════════════════════════
   BOOT
══════════════════════════════════════════ */
document.addEventListener("DOMContentLoaded", () => {
  initNavbar();
  initUserArea();
  initFilters();
  loadBookings();
});