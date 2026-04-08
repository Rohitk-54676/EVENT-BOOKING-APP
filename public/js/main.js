document.addEventListener("DOMContentLoaded", () => {

  /* ══════════════════════════════════════════
     GLOBALS
  ══════════════════════════════════════════ */
  const token          = localStorage.getItem("token");
  const userArea       = document.getElementById("userArea");
  const latestContainer= document.getElementById("latest-events");
  let eventsData       = [];

  /* ══════════════════════════════════════════
     DECODE JWT → user object
  ══════════════════════════════════════════ */
  function getUser() {
    if (!token) return null;
    try { return JSON.parse(atob(token.split(".")[1])); }
    catch { return null; }
  }
  const user = getUser();

  /* ══════════════════════════════════════════
     NAVBAR — scroll + hamburger
  ══════════════════════════════════════════ */
  const navbar    = document.getElementById("navbar");
  const hamburger = document.getElementById("hamburger");
  const mobileMenu= document.getElementById("mobileMenu");

  window.addEventListener("scroll", () => {
    navbar.classList.toggle("scrolled", window.scrollY > 30);
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

  /* ══════════════════════════════════════════
     USER AREA render (desktop + mobile)
  ══════════════════════════════════════════ */
  function renderUser() {
    if (!userArea) return;
    const mobileAuth = document.getElementById("mobileAuth");

    if (!user) {
      // Not logged in
      userArea.innerHTML = `
        <a href="/pages/login.html"    class="btn-nav">Login</a>
        <a href="/pages/register.html" class="btn-nav filled">Register</a>
      `;
      if (mobileAuth) mobileAuth.innerHTML = `
        <a href="/pages/login.html"    class="btn-nav" style="flex:1;text-align:center">Login</a>
        <a href="/pages/register.html" class="btn-nav filled" style="flex:1;text-align:center">Register</a>
      `;
    } else {
      // Logged in — avatar with dropdown
      userArea.innerHTML = `
        <div class="profile-wrapper">
          <div class="profile-icon" onclick="toggleDropdown()" title="${user.name || 'Profile'}">
            ${(user.name || "U")[0].toUpperCase()}
          </div>
          <div id="dropdown" class="dropdown">
            <div class="profile-info">
              <p><strong>${user.name || "User"}</strong></p>
              <p>${user.email || ""}</p>
            </div>
            <button onclick="goBookings()">🎟️ &nbsp;My Bookings</button>
            ${user.role === "admin" ? `<button onclick="goAdmin()">⚙️ &nbsp;Dashboard</button>` : ""}
            <button class="danger" onclick="logout()">🚪 &nbsp;Logout</button>
          </div>
        </div>
      `;
      if (mobileAuth) mobileAuth.innerHTML = `
        <button class="btn-nav" onclick="goBookings()" style="flex:1;text-align:center">My Bookings</button>
        <button class="btn-nav" onclick="logout()" style="flex:1;text-align:center">Logout</button>
      `;
    }
  }

  /* ══════════════════════════════════════════
     CLOSE DROPDOWN ON OUTSIDE CLICK
  ══════════════════════════════════════════ */
  document.addEventListener("click", (e) => {
    const dd = document.getElementById("dropdown");
    if (dd && !e.target.closest(".profile-wrapper")) {
      dd.style.display = "none";
    }
  });

  /* ══════════════════════════════════════════
     LOAD LATEST 4 EVENTS
  ══════════════════════════════════════════ */
  async function loadLatestEvents() {
    showSkeletons();

    try {
      const res    = await fetch("/api/events");
      const events = await res.json();

      eventsData = events;

      // Sort newest first, take top 4
      const latest = [...events]
        .sort((a, b) => new Date(b.date || b.start_date) - new Date(a.date || a.start_date))
        .slice(0, 4);

      if (!latestContainer) return;
      latestContainer.innerHTML = "";

      if (!latest.length) {
        latestContainer.innerHTML = `
          <div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--muted)">
            <div style="font-size:3rem;margin-bottom:16px">🎭</div>
            <h3 style="font-family:'Syne',sans-serif;margin-bottom:8px">No events yet</h3>
            <p>Check back soon!</p>
          </div>`;
        return;
      }

      latest.forEach((e, i) => {
        const card = buildCard(e, i);
        latestContainer.appendChild(card);
      });

    } catch (err) {
      console.error("EVENT LOAD ERROR:", err);
      if (latestContainer) latestContainer.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--muted)">
          <div style="font-size:2rem;margin-bottom:12px">⚠️</div>
          <p>Couldn't load events. Please try again later.</p>
        </div>`;
    }
  }

  /* ══════════════════════════════════════════
     BUILD EVENT CARD
  ══════════════════════════════════════════ */
  function buildCard(e, index) {
    const card = document.createElement("div");
    card.className = "event-card";
    card.style.animationDelay = `${index * 0.08}s`;

    const img   = e.image_url || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80";
    const desc  = e.description ? e.description.substring(0, 72) + "…" : "An unforgettable experience awaits.";
    const date  = formatDate(e.date || e.start_date);
    const price = formatPrice(e.price || e.ticket_price);
    const loc   = e.location || "Venue TBA";

    card.innerHTML = `
      <div class="card-img-wrap">
        <img src="${img}" alt="${e.title}" loading="lazy"
             onerror="this.src='https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80'" />
      </div>
      <div class="card-body">
        <div class="card-meta">
          <span class="card-date">
            <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            ${date}
          </span>
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

    // 3D tilt
    card.addEventListener("mousemove", onTilt);
    card.addEventListener("mouseleave", offTilt);

    return card;
  }

  /* ══════════════════════════════════════════
     3D TILT
  ══════════════════════════════════════════ */
  function onTilt(e) {
    const card = e.currentTarget;
    const r    = card.getBoundingClientRect();
    const x    = (e.clientX - r.left) / r.width  - 0.5;
    const y    = (e.clientY - r.top)  / r.height - 0.5;
    card.style.transform =
      `translateY(-12px) rotateX(${(-y * 7).toFixed(2)}deg) rotateY(${(x * 7).toFixed(2)}deg) scale(1.015)`;
  }

  function offTilt(e) { e.currentTarget.style.transform = ""; }

  /* ══════════════════════════════════════════
     SKELETON LOADER
  ══════════════════════════════════════════ */
  function showSkeletons() {
    if (!latestContainer) return;
    latestContainer.innerHTML = "";
    for (let i = 0; i < 4; i++) {
      const s = document.createElement("div");
      s.className = "event-card";
      s.innerHTML = `
        <div class="card-img-wrap sk-img skeleton"></div>
        <div class="card-body">
          <div class="skeleton sk-title"></div>
          <div class="skeleton sk-line"></div>
          <div class="skeleton sk-line sk-short"></div>
          <div class="card-footer" style="padding-top:13px;border-top:1px solid rgba(255,255,255,.07)">
            <div class="skeleton sk-price"></div>
            <div class="skeleton sk-btn"></div>
          </div>
        </div>`;
      latestContainer.appendChild(s);
    }
  }

  /* ══════════════════════════════════════════
     SEARCH (your original logic, improved UI)
  ══════════════════════════════════════════ */
  const searchInput  = document.getElementById("searchInput");
  const searchResults= document.getElementById("searchResults");

  if (searchInput && searchResults) {
    let debounce;
    searchInput.addEventListener("input", () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        const val = searchInput.value.toLowerCase().trim();

        if (!val) {
          searchResults.style.display = "none";
          searchResults.innerHTML = "";
          return;
        }

        const filtered = eventsData.filter(e =>
          e.title?.toLowerCase().includes(val) ||
          e.location?.toLowerCase().includes(val)
        );

        searchResults.innerHTML = "";

        if (!filtered.length) {
          searchResults.innerHTML = `<div style="color:var(--muted);font-style:italic;">No results found</div>`;
        } else {
          filtered.slice(0, 6).forEach(e => {
            const div = document.createElement("div");
            div.innerHTML = `
              <span>${e.title}</span>
              ${e.location ? `<span style="font-size:.72rem;color:var(--muted);margin-left:8px">📍 ${e.location}</span>` : ""}
            `;
            div.onclick = () => {
              searchResults.style.display = "none";
              viewEvent(e.id);
            };
            searchResults.appendChild(div);
          });
        }

        searchResults.style.display = "block";
      }, 220);
    });

    // Close on outside click
    document.addEventListener("click", (e) => {
      if (!searchInput.closest(".search-box").contains(e.target)) {
        searchResults.style.display = "none";
      }
    });

    // Close on Escape
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Escape") searchResults.style.display = "none";
    });
  }

  /* ══════════════════════════════════════════
     HERO CANVAS — star field
  ══════════════════════════════════════════ */
  function initHeroCanvas() {
    const canvas = document.getElementById("heroCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let W, H, stars;

    const resize = () => {
      W = canvas.width  = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
      stars = Array.from({ length: 90 }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.4 + 0.3,
        a: Math.random() * 0.5 + 0.1,
        vx: (Math.random() - 0.5) * 0.12,
        vy: (Math.random() - 0.5) * 0.12,
        pulse: Math.random() * Math.PI * 2,
        ps: Math.random() * 0.015 + 0.008,
        color: ["rgba(247,37,133,", "rgba(76,201,240,", "rgba(255,255,255,"][Math.floor(Math.random() * 3)],
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      stars.forEach(s => {
        s.pulse += s.ps;
        const alpha = s.a * (0.6 + 0.4 * Math.sin(s.pulse));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = s.color + alpha + ")";
        ctx.fill();
        s.x += s.vx; s.y += s.vy;
        if (s.x < 0) s.x = W;
        if (s.x > W) s.x = 0;
        if (s.y < 0) s.y = H;
        if (s.y > H) s.y = 0;
      });
      requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener("resize", resize);
  }

  /* ══════════════════════════════════════════
     STATS COUNTER ANIMATION
  ══════════════════════════════════════════ */
  function animateStats() {
    const items = document.querySelectorAll(".stat-num[data-target]");
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el     = entry.target;
        const target = parseInt(el.dataset.target);
        const suffix = target >= 1000 ? "+" : (el.dataset.suffix || "+");
        const duration = 1800;
        const start  = performance.now();

        const tick = (now) => {
          const progress = Math.min((now - start) / duration, 1);
          const eased    = 1 - Math.pow(1 - progress, 3); // ease-out cubic
          const value    = Math.round(eased * target);
          el.textContent = value >= 1000
            ? (value / 1000).toFixed(value % 1000 === 0 ? 0 : 1) + "K+"
            : value + suffix;
          if (progress < 1) requestAnimationFrame(tick);
        };

        requestAnimationFrame(tick);
        observer.unobserve(el);
      });
    }, { threshold: 0.5 });

    items.forEach(el => observer.observe(el));
  }

  /* ══════════════════════════════════════════
     SCROLL REVEAL
  ══════════════════════════════════════════ */
  function initScrollReveal() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.style.opacity = "1";
          e.target.style.transform = "translateY(0)";
          observer.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });

    document.querySelectorAll(".step-card, .feature-card, .testimonial-card").forEach(el => {
      el.style.opacity = "0";
      el.style.transform = "translateY(28px)";
      el.style.transition = "opacity .6s ease, transform .6s ease";
      observer.observe(el);
    });
  }

  /* ══════════════════════════════════════════
     NEWSLETTER
  ══════════════════════════════════════════ */
  window.subscribeNewsletter = () => {
    const emailEl = document.getElementById("newsletterEmail");
    if (!emailEl) return;
    const email = emailEl.value.trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast("Please enter a valid email address");
      return;
    }

    // TODO: hook to your backend
    showToast("🎉 You're in! Welcome to EventPulse.");
    emailEl.value = "";
  };

  /* ══════════════════════════════════════════
     TOAST
  ══════════════════════════════════════════ */
  let toastTimer;
  function showToast(msg) {
    const t = document.getElementById("toast");
    if (!t) return;
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2800);
  }

  /* ══════════════════════════════════════════
     SMOOTH SCROLL helper
  ══════════════════════════════════════════ */
  window.scrollTo = function(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  /* ══════════════════════════════════════════
     FORMAT HELPERS
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

  /* ══════════════════════════════════════════
     GLOBAL NAVIGATORS (your original functions)
  ══════════════════════════════════════════ */
  window.goLogin      = () => window.location.href = "/pages/login.html";
  window.goBookings   = () => window.location.href = "/pages/my-bookings.html";
  window.goAdmin      = () => window.location.href = "/pages/admin.html";
  window.goEventsPage = () => window.location.href = "/pages/list-events.html";
  window.viewEvent    = (id) => window.location.href = `/pages/event.html?id=${id}`;

  window.logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    location.reload();
  };

  window.toggleDropdown = () => {
    const d = document.getElementById("dropdown");
    if (!d) return;
    d.style.display = d.style.display === "block" ? "none" : "block";
  };

  /* ══════════════════════════════════════════
     BOOT
  ══════════════════════════════════════════ */
  renderUser();
  loadLatestEvents();
  initHeroCanvas();
  animateStats();
  initScrollReveal();
  initTicker();
  initCities();

  /* ══════════════════════════════════════════
     TICKER MARQUEE
  ══════════════════════════════════════════ */
  function initTicker() {
    const track = document.getElementById("tickerTrack");
    if (!track) return;
    const items = [
      "🎵 Music Festivals","🏟️ Sports Events","🍽️ Food & Drink",
      "💻 Tech Conferences","🎭 Comedy Shows","🎨 Art Exhibitions",
      "🎬 Film Screenings","🧘 Wellness Retreats","🎪 Live Performances",
      "🏋️ Fitness Events","📚 Book Fairs","🎮 Gaming Tournaments",
    ];
    const all = [...items, ...items];
    track.innerHTML = all.map(item =>
      `<span class="ticker-item"><span class="ticker-dot"></span>${item}</span>`
    ).join("");
  }

  /* ══════════════════════════════════════════
     CITY EXPLORER
  ══════════════════════════════════════════ */
  function initCities() {
    const grid = document.getElementById("citiesGrid");
    if (!grid) return;
    const cities = [
      { name:"Mumbai",    count:"120+ Events", color:"linear-gradient(135deg,#f72585,#7209b7)", emoji:"🌆" },
      { name:"Delhi",     count:"95+ Events",  color:"linear-gradient(135deg,#4361ee,#4cc9f0)", emoji:"🏛️" },
      { name:"Bangalore", count:"110+ Events", color:"linear-gradient(135deg,#7209b7,#3a0ca3)", emoji:"🌃" },
      { name:"Hyderabad", count:"60+ Events",  color:"linear-gradient(135deg,#f77f00,#d62828)", emoji:"🌉" },
      { name:"Chennai",   count:"45+ Events",  color:"linear-gradient(135deg,#4cc9f0,#4361ee)", emoji:"🏖️" },
      { name:"Kolkata",   count:"38+ Events",  color:"linear-gradient(135deg,#ffd60a,#f72585)", emoji:"🌁" },
    ];
    grid.innerHTML = cities.map((c, i) => `
      <div class="city-card" onclick="searchCity('${c.name}')" style="animation-delay:${i*0.06}s">
        <div class="city-bg" style="background:${c.color};"></div>
        <div class="city-overlay"></div>
        <div class="city-info">
          <div class="city-name">${c.emoji} ${c.name}</div>
          <div class="city-count">${c.count}</div>
        </div>
      </div>`).join("");
  }

  window.searchCity = (city) => {
    window.location.href = `/pages/list-events.html?city=${encodeURIComponent(city)}`;
  };

});