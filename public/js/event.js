const token = localStorage.getItem("token");

const params  = new URLSearchParams(window.location.search);
const eventId = params.get("id");

let selectedTicket = null;

const loadingEl = document.getElementById("loading");
const errorEl   = document.getElementById("error");
const contentEl = document.getElementById("eventContent");
const footerEl  = document.getElementById("pageFooter");

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
   LOAD EVENT  (your original logic intact)
══════════════════════════════════════════ */
async function loadEvent() {
  try {
    const options = {};
    if (token) options.headers = { Authorization: `Bearer ${token}` };

    const res = await fetch(`/api/events/${eventId}`, options);

    if (!res.ok) {
      loadingEl.style.display = "none";
      errorEl.style.display   = "flex";
      return;
    }

    const event = await res.json();

    /* ── Hero ── */
    document.getElementById("title").innerText = event.title;

    const heroImg = document.getElementById("heroImage");
    heroImg.src = event.image_url || "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200";
    heroImg.alt = event.title;

    const dateStr = new Date(event.date).toLocaleDateString("en-US", {
      weekday:"long", year:"numeric", month:"long", day:"numeric"
    });

    document.getElementById("heroDate").innerText     = dateStr;
    document.getElementById("heroLocation").innerText = event.location || "TBA";

    /* Seats chip */
    const seats = event.available_seats ?? event.total_seats ?? null;
    if (seats !== null) {
      const seatsChip  = document.getElementById("seatsChip");
      const heroSeats  = document.getElementById("heroSeats");
      const seatsInfo  = document.getElementById("seatsInfo");
      const seatsValue = document.getElementById("seatsValue");

      seatsChip.style.display  = "inline-flex";
      seatsInfo.style.display  = "flex";
      heroSeats.innerText  = `${seats} seat${seats !== 1 ? "s" : ""} left`;
      seatsValue.innerText = `${seats} available`;

      if (seats <= 10) seatsChip.classList.add("low");
    }

    /* Category badge */
    if (event.category) {
      document.getElementById("heroBadgeRow").innerHTML =
        `<span class="hero-badge">${event.category}</span>`;
    }

    /* ── Details ── */
    document.getElementById("description").innerText =
      event.description || "No description provided.";
    document.getElementById("date").innerText     = dateStr;
    document.getElementById("location").innerText = event.location || "To be announced";

    /* ── Tickets ── */
    const container = document.getElementById("ticketsContainer");
    container.innerHTML = "";

    event.tickets.forEach((ticket, index) => {
      const isBooked = event.userTickets?.map(Number).includes(ticket.id);

      const div = document.createElement("label");
      div.className = `ticket-option${isBooked ? " disabled" : ""}`;
      div.style.animationDelay = `${index * 0.08}s`;

      div.innerHTML = `
        <input type="radio" name="ticket" value="${ticket.id}" ${isBooked ? "disabled" : ""}>
        <div class="ticket-radio"></div>
        <div class="ticket-info">
          <div class="ticket-name">${ticket.name}</div>
          <div class="ticket-meta">Team size: ${ticket.team_size} ${ticket.team_size > 1 ? "members" : "person"}</div>
          ${isBooked ? '<div class="ticket-booked-badge">✓ Already Booked</div>' : ""}
        </div>
        <div class="ticket-price">₹${ticket.price.toLocaleString()}</div>
      `;

      if (!isBooked) {
        div.addEventListener("click", () => {
          document.querySelectorAll(".ticket-option").forEach(el => el.classList.remove("selected"));
          div.classList.add("selected");
          selectedTicket = ticket.id;
          clearMsg();
        });
      }

      container.appendChild(div);
    });

    /* ── Show content ── */
    loadingEl.style.display  = "none";
    contentEl.style.display  = "block";
    if (footerEl) footerEl.style.display = "block";

    /* ── Continue button ── */
    document.getElementById("continueBtn").onclick = handleContinue;

    /* ── Page title ── */
    document.title = `${event.title} — EventPulse`;

  } catch (err) {
    console.error(err);
    loadingEl.style.display = "none";
    errorEl.style.display   = "flex";
  }
}

/* ══════════════════════════════════════════
   CONTINUE → PAYMENT  (your original logic)
══════════════════════════════════════════ */
function handleContinue() {
  if (!selectedTicket) {
    showMsg("Please select a ticket first", "error");
    return;
  }

  if (!token) {
    showMsg("Login required — redirecting…", "error");
    setTimeout(() => { window.location.href = "/pages/login.html"; }, 1500);
    return;
  }

  window.location.href = `/pages/payment.html?id=${eventId}&ticket=${selectedTicket}`;
}

/* ══════════════════════════════════════════
   SHARE
══════════════════════════════════════════ */
function shareEvent(platform) {
  const url   = encodeURIComponent(window.location.href);
  const title = encodeURIComponent(document.getElementById("title")?.innerText || "Check out this event on EventPulse!");

  const links = {
    whatsapp: `https://wa.me/?text=${title}%20${url}`,
    twitter:  `https://twitter.com/intent/tweet?text=${title}&url=${url}`,
  };

  if (links[platform]) window.open(links[platform], "_blank", "noopener");
}

function copyLink() {
  navigator.clipboard.writeText(window.location.href).then(() => {
    showMsg("Link copied to clipboard! 🎉", "success");
    setTimeout(clearMsg, 2500);
  }).catch(() => {
    showMsg("Could not copy link", "error");
  });
}

/* ══════════════════════════════════════════
   HELPERS  (your original functions)
══════════════════════════════════════════ */
function showMsg(text, type) {
  const msg    = document.getElementById("msg");
  msg.innerText  = text;
  msg.className  = `msg-text ${type}`;
}

function clearMsg() {
  const msg    = document.getElementById("msg");
  msg.innerText  = "";
  msg.className  = "msg-text";
}

/* ══════════════════════════════════════════
   BOOT
══════════════════════════════════════════ */
document.addEventListener("DOMContentLoaded", () => {
  initNavbar();
  initUserArea();
  loadEvent();
});