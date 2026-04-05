const container  = document.getElementById("all-events");
const countBadge = document.getElementById("eventCount");
const searchInput= document.getElementById("searchInput");

const API_URL = "http://localhost:5000/api/events";

let allEvents = [];

/* ══════════════════════════════════════════
   BOOT
══════════════════════════════════════════ */
document.addEventListener("DOMContentLoaded", () => {
  initNavbar();
  initUserArea();
  initSearch();
  loadAllEvents();
});

/* ══════════════════════════════════════════
   NAVBAR — scroll + hamburger
══════════════════════════════════════════ */
function initNavbar() {
  const navbar    = document.getElementById("navbar");
  const hamburger = document.getElementById("hamburger");
  const mobileMenu= document.getElementById("mobileMenu");

  // Scroll shadow
  window.addEventListener("scroll", () => {
    navbar.classList.toggle("scrolled", window.scrollY > 20);
  });

  // Toggle mobile menu
  hamburger.addEventListener("click", () => {
    hamburger.classList.toggle("open");
    mobileMenu.classList.toggle("open");
  });

  // Close on outside click
  document.addEventListener("click", (e) => {
    if (!navbar.contains(e.target) && !mobileMenu.contains(e.target)) {
      hamburger.classList.remove("open");
      mobileMenu.classList.remove("open");
    }
  });
}

/* ══════════════════════════════════════════
   USER AREA — desktop + mobile
══════════════════════════════════════════ */
function initUserArea() {
  const area       = document.getElementById("userArea");
  const mobileAuth = document.getElementById("mobileAuth");
  const token      = localStorage.getItem("token");

  if (token) {
    area.innerHTML = `
      <span class="user-name">Hi there 👋</span>
      <button class="btn-nav" onclick="logout()">Logout</button>
    `;
    mobileAuth.innerHTML = `<button class="btn-nav" onclick="logout()" style="width:100%">Logout</button>`;
  } else {
    area.innerHTML = `
      <a href="/public/pages/login.html"    class="btn-nav">Login</a>
      <a href="/public/pages/register.html" class="btn-nav filled">Register</a>
    `;
    mobileAuth.innerHTML = `
      <a href="/public/pages/login.html"    class="btn-nav" style="flex:1;text-align:center">Login</a>
      <a href="/public/pages/register.html" class="btn-nav filled" style="flex:1;text-align:center">Register</a>
    `;
  }
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  window.location.href = "/public/pages/login.html";
}

/* ══════════════════════════════════════════
   SEARCH
══════════════════════════════════════════ */
function initSearch() {
  let timer;
  searchInput.addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(applySearch, 280);
  });
  searchInput.addEventListener("keydown", e => {
    if (e.key === "Enter") applySearch();
  });
}

function applySearch() {
  const q = searchInput.value.trim().toLowerCase();

  if (!q) {
    renderEvents(allEvents);
    return;
  }

  const results = allEvents.filter(e =>
    e.title?.toLowerCase().includes(q)       ||
    e.description?.toLowerCase().includes(q) ||
    e.location?.toLowerCase().includes(q)
  );

  renderEvents(results);
}

/* ══════════════════════════════════════════
   LOAD FROM SERVER
══════════════════════════════════════════ */
async function loadAllEvents() {
  showSkeletons(6);

  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error("Server error");

    allEvents = await res.json();
    renderEvents(allEvents);

  } catch (err) {
    console.error(err);
    container.innerHTML = "";
    showEmpty("Couldn't load events", "Please check your connection and try again.");
    countBadge.textContent = "0 events";
  }
}

/* ══════════════════════════════════════════
   RENDER
══════════════════════════════════════════ */
function renderEvents(events) {
  container.innerHTML = "";
  countBadge.textContent = `${events.length} event${events.length !== 1 ? "s" : ""}`;

  if (!events.length) {
    showEmpty("No events found", "Try a different search term.");
    return;
  }

  events.forEach((e, i) => container.appendChild(buildCard(e, i)));
}

/* ══════════════════════════════════════════
   BUILD CARD
══════════════════════════════════════════ */
function buildCard(e, index) {
  const card = document.createElement("div");
  card.className = "event-card";
  card.style.animationDelay = `${Math.min(index * 0.05, 0.5)}s`;

  const img   = e.image_url || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80";
  const desc  = e.description ? e.description.substring(0, 75) + "…" : "An unforgettable experience awaits.";
  const date  = formatDate(e.date || e.start_date);
  const price = formatPrice(e.price || e.ticket_price);
  const loc   = e.location || "Venue TBA";
  const seats = e.available_seats ?? e.total_seats ?? null;
  const low   = seats !== null && seats <= 10;
  const wished= isWishlisted(e.id);

  card.innerHTML = `
    <div class="card-img-wrap">
      <img
        src="${img}"
        alt="${e.title}"
        loading="lazy"
        onerror="this.src='https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80'"
      />
      <button class="btn-wish ${wished ? "active" : ""}"
              onclick="toggleWishlist(event, ${e.id}, this)"
              aria-label="Save">
        <svg viewBox="0 0 24 24">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      </button>
    </div>

    <div class="card-body">
      <div class="card-meta">
        <span class="card-date">
          <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          ${date}
        </span>
        ${seats !== null ? `
          <span class="card-seats ${low ? "seats-low" : ""}">
            <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
            ${low ? "⚡ " : ""}${seats} left
          </span>` : ""}
      </div>

      <h3 class="card-title">${e.title}</h3>
      <p class="card-desc">${desc}</p>

      <div class="card-location">
        <svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        ${loc}
      </div>

      <div class="card-footer">
        <div class="card-price">
          <span class="price-label">Price</span>
          <span class="price-value ${price === "Free" ? "free" : ""}">View Details</span>
        </div>
        <button class="btn-view" onclick="viewEvent(${e.id})">View Details</button>
      </div>
    </div>
  `;

  // 3D mouse-tilt
  card.addEventListener("mousemove", onTilt);
  card.addEventListener("mouseleave", offTilt);

  return card;
}

/* ══════════════════════════════════════════
   3D TILT
══════════════════════════════════════════ */
function onTilt(e) {
  const card  = e.currentTarget;
  const rect  = card.getBoundingClientRect();
  const x     = (e.clientX - rect.left) / rect.width  - 0.5;
  const y     = (e.clientY - rect.top)  / rect.height - 0.5;
  card.style.transform =
    `translateY(-12px) rotateX(${(-y * 7).toFixed(2)}deg) rotateY(${(x * 7).toFixed(2)}deg) scale(1.015)`;
}

function offTilt(e) { e.currentTarget.style.transform = ""; }

/* ══════════════════════════════════════════
   WISHLIST
══════════════════════════════════════════ */
function getWishlist()     { return JSON.parse(localStorage.getItem("wishlist") || "[]"); }
function isWishlisted(id)  { return getWishlist().includes(String(id)); }

function toggleWishlist(e, id, btn) {
  e.stopPropagation();
  const list = getWishlist();
  const sid  = String(id);
  const idx  = list.indexOf(sid);

  if (idx === -1) {
    list.push(sid);
    btn.classList.add("active");
    showToast("Saved to wishlist ❤️");
  } else {
    list.splice(idx, 1);
    btn.classList.remove("active");
    showToast("Removed from wishlist");
  }

  localStorage.setItem("wishlist", JSON.stringify(list));
}

/* ══════════════════════════════════════════
   SKELETON
══════════════════════════════════════════ */
function showSkeletons(n) {
  container.innerHTML = "";
  countBadge.textContent = "Loading…";
  for (let i = 0; i < n; i++) {
    const s = document.createElement("div");
    s.className = "event-card";
    s.innerHTML = `
      <div class="card-img-wrap sk-img skeleton"></div>
      <div class="card-body">
        <div class="skeleton sk-title"></div>
        <div class="skeleton sk-line"></div>
        <div class="skeleton sk-line sk-short"></div>
        <div class="card-footer" style="padding-top:13px;border-top:1px solid rgba(255,255,255,0.07)">
          <div class="skeleton sk-price"></div>
          <div class="skeleton sk-btn"></div>
        </div>
      </div>`;
    container.appendChild(s);
  }
}

/* ══════════════════════════════════════════
   EMPTY STATE
══════════════════════════════════════════ */
function showEmpty(title, sub) {
  container.innerHTML = `
    <div class="empty-state">
      <span class="empty-icon">🎭</span>
      <h3>${title}</h3>
      <p>${sub}</p>
    </div>`;
}

/* ══════════════════════════════════════════
   TOAST
══════════════════════════════════════════ */
let toastTimer;
function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
}

/* ══════════════════════════════════════════
   NAVIGATE
══════════════════════════════════════════ */
function viewEvent(id) {
  window.location.href = `/public/pages/event.html?id=${id}`;
}

/* ══════════════════════════════════════════
   HELPERS
══════════════════════════════════════════ */
function formatDate(str) {
  if (!str) return "Date TBA";
  try {
    return new Date(str).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric"
    });
  } catch { return "Date TBA"; }
}

function formatPrice(p) {
  if (!p || p === 0 || p === "0") return "Free";
  const n = parseFloat(p);
  return isNaN(n) ? String(p) : "₹" + n.toLocaleString("en-IN");
}