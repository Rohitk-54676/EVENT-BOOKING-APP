document.addEventListener("DOMContentLoaded", () => {

  /* ── Navbar ── */
  const navbar    = document.getElementById("navbar");
  const hamburger = document.getElementById("hamburger");
  const mobileMenu= document.getElementById("mobileMenu");

  window.addEventListener("scroll", () => navbar.classList.toggle("scrolled", window.scrollY > 20));

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

  /* ── User area ── */
  const token      = localStorage.getItem("token");
  const area       = document.getElementById("userArea");
  const mobileAuth = document.getElementById("mobileAuth");

  if (!token) {
    area.innerHTML = `
      <a href="/pages/login.html"    class="btn-nav">Login</a>
      <a href="/pages/register.html" class="btn-nav filled">Register</a>`;
    mobileAuth.innerHTML = `
      <a href="/pages/login.html"    class="btn-nav" style="flex:1;text-align:center">Login</a>
      <a href="/pages/register.html" class="btn-nav filled" style="flex:1;text-align:center">Register</a>`;
  } else {
    let user = null;
    try { user = JSON.parse(atob(token.split(".")[1])); } catch {}
    area.innerHTML = `
      <span style="font-size:.84rem;color:var(--muted-lt)">Hi, ${user?.name?.split(" ")[0] || "there"} 👋</span>
      <button class="btn-nav" onclick="localStorage.removeItem('token');location.reload()">Logout</button>`;
    mobileAuth.innerHTML = `
      <button class="btn-nav" onclick="localStorage.removeItem('token');location.reload()" style="flex:1;text-align:center">Logout</button>`;
  }

  /* ── Scroll reveal ── */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        setTimeout(() => e.target.classList.add("visible"), i * 80);
        revealObserver.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll(".reveal").forEach(el => revealObserver.observe(el));

  /* ── Stats counter ── */
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el     = entry.target;
      const target = parseInt(el.dataset.target);
      const dur    = 1800;
      const start  = performance.now();

      const tick = (now) => {
        const p = Math.min((now - start) / dur, 1);
        const v = Math.round((1 - Math.pow(1 - p, 3)) * target);
        el.textContent = v >= 1000
          ? (v / 1000).toFixed(v % 1000 === 0 ? 0 : 1) + "K"
          : v;
        if (p < 1) requestAnimationFrame(tick);
      };

      requestAnimationFrame(tick);
      counterObserver.unobserve(el);
    });
  }, { threshold: 0.5 });

  document.querySelectorAll(".stat-num[data-target]").forEach(el => counterObserver.observe(el));
});